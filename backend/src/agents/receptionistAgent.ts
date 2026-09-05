// agents/receptionistAgent.ts
import { DNotifier } from "@dnotifier-realtime/dnotifier";
import { broadcastActivity } from "../dnotifier/activityBroadcaster.js";
import { getState, saveState } from "../db/repositories/conversationStateRepository.js";
import type { AppointmentOption } from "../../../packages/shared/types/domain.js";

interface ReceptionistInput {
  sessionId: string;
  message: string;
}

interface ReceptionistModelOutput {
  reply: string;
  mode: "idle" | "symptom_intake" | "booking" | "faq";
  collected: {
    symptoms?: string[];
    duration?: string;
    severity?: string;
    name?: string;
    contact?: string;
    preferredDoctor?: string;
    preferredTime?: string;
  };
  readyToBook: boolean;
  escalate: boolean;
}

function parseModelOutput(raw: unknown): ReceptionistModelOutput | null {
  const content = (raw as any)?.data?.content ?? (raw as any)?.content ?? raw;
  const text = typeof content === "string" ? content : JSON.stringify(content);

  // Models sometimes wrap JSON in markdown fences despite instructions — strip defensively.
  const cleaned = text.replace(/```json\s*|\s*```/g, "").trim();

  try {
    return JSON.parse(cleaned) as ReceptionistModelOutput;
  } catch {
    return null;
  }
}

const SYSTEM_PROMPT = `You are a warm, professional clinic receptionist for a healthcare decision-support demo.

Your job:
- Answer clinic/FAQ questions using the knowledge base.
- If the patient describes symptoms, ask follow-up questions ONE AT A TIME until you know: what symptoms, how long, and how severe. Do NOT diagnose or suggest treatment.
- If the patient wants an appointment, collect (one at a time, naturally, not as a form): their name, a contact method, preferred doctor (if any), and preferred date/time. Do not invent availability — that is checked separately.
- Never fabricate clinic facts; rely on the knowledge base for clinic info (hours, doctors, services, policies).
- Keep replies short and conversational, like a real receptionist texting back.

You MUST respond with ONLY a JSON object, no other text, no markdown fences, in exactly this shape:
{
  "reply": "the natural-language message to show the patient",
  "mode": "idle" | "symptom_intake" | "booking" | "faq",
  "collected": { "symptoms": [], "duration": "", "severity": "", "name": "", "contact": "", "preferredDoctor": "", "preferredTime": "" },
  "readyToBook": false,
  "escalate": false
}

Rules:
- "collected" must include everything gathered so far across the whole conversation (merge with what you're given), not just this turn.
- Set "readyToBook": true only once name, contact, and a preferred doctor/time are all known.
- Set "escalate": true only if symptoms sound urgent (e.g. severe difficulty breathing, chest pain) and clinician review should happen promptly.
- Only fill fields you actually know; leave others as empty string or empty array.`;

export const receptionistAgent = DNotifier.defineAgent({
  name: "receptionist-agent",
  async run(ctx) {
    const input = ctx.input as ReceptionistInput;
    const { sessionId, message } = input;

    await broadcastActivity(sessionId, {
      type: "agent.status",
      agent: "receptionist-agent" as any, // new agent name — extend AgentName union in shared types next
      status: "started",
      timestamp: Date.now(),
    });

    const priorState = await getState(sessionId);

    const aiResponse = await ctx.sendAI({
      message: {
        useKnowledgeBase: true,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `Conversation state so far: ${JSON.stringify(priorState.collected)}. Current mode: ${priorState.mode}. Patient's latest message: "${message}"`,
          },
        ],
      },
      saveHistory: true,
      sessionId,
      label: "Receptionist turn",
    });

    const parsed = parseModelOutput(aiResponse);

    if (!parsed) {
      // Model didn't return valid JSON — fail safe with a generic reply rather than crashing the turn.
      await broadcastActivity(sessionId, {
        type: "agent.status",
        agent: "receptionist-agent" as any,
        status: "failed",
        timestamp: Date.now(),
      });
      return {
        reply: "Sorry, could you repeat that? I didn't quite catch it.",
        appointment: null,
      };
    }

        let confirmedAppointment: { doctor: string; time: string } | null = null;

    if (parsed.mode === "booking" && parsed.readyToBook && !priorState.confirmedAppointment) {
      const { appointments } = (await ctx.runAgent("appointment-agent", {
        input: { urgency: "moderate", symptoms: parsed.collected.symptoms ?? [] },
      })) as { appointments: AppointmentOption[] };

      const wanted = parsed.collected.preferredDoctor?.toLowerCase();
      const match =
        appointments.find((a) => a.doctor.toLowerCase().includes(wanted ?? "")) ?? appointments[0];

      if (match) {
        confirmedAppointment = match;
        parsed.reply += ` I've booked you with ${match.doctor} at ${match.time}.`;
      } else {
        parsed.reply += " Unfortunately no slots are available right now — I'll flag this for the clinic to follow up.";
      }
    } else if (priorState.confirmedAppointment) {
      // Already booked earlier in this conversation — don't re-trigger tools,
      // just let the model's conversational reply stand as-is.
      confirmedAppointment = priorState.confirmedAppointment as { doctor: string; time: string };
    }

    if (parsed.escalate || (confirmedAppointment && !priorState.confirmedAppointment)) {
      await ctx.runAgent("notification-agent", {
        input: {
          sessionId,
          triage: {
            urgency: parsed.escalate ? "high" : "moderate",
            symptoms: parsed.collected.symptoms ?? [],
            requiresMedicalReview: parsed.escalate,
          },
          appointments: { appointments: confirmedAppointment ? [confirmedAppointment] : [] },
        },
      });
    }

    await saveState(sessionId, {
      mode: parsed.mode,
      collected: parsed.collected,
      confirmedAppointment,
    });

    await ctx.recordStep({
      label: "Receptionist turn",
      input: { message },
      output: parsed,
      status: "ok",
      type: "custom",
    });

    await broadcastActivity(sessionId, {
      type: "agent.status",
      agent: "receptionist-agent" as any,
      status: "completed",
      data: parsed as any,
      timestamp: Date.now(),
    });

    return { reply: parsed.reply, appointment: confirmedAppointment };
  },
});