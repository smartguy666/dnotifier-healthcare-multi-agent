// app/page.tsx
"use client";

import { useMemo, useState } from "react";
import { ChatPanel } from "../components/ChatPanel";
import { AgentActivityPanel } from "../components/AgentActivityPanel";
import { useDNotifierRealtime } from "../hooks/useDNotifierRealtime";
import { sendMessage, simulatePatient } from "../lib/api";

interface AssistantMessage {
  role: "assistant";
  text: string;
  time: string;
}

function summarize(result: Awaited<ReturnType<typeof sendMessage>>["result"]): string {
  const { triage, appointments, notification } = result;
  const lines = [
    `Triage: ${triage.urgency} urgency (${triage.symptoms.join(", ")}).`,
    triage.requiresMedicalReview ? "This warrants clinician review." : "No clinician review required.",
  ];
  if (appointments.appointments.length > 0) {
    const first = appointments.appointments[0];
    lines.push(`Earliest available: ${first.doctor} at ${first.time}.`);
  }
  if (notification) lines.push(notification.message);
  return lines.join(" ");
}

export default function Page() {
  const sessionId = useMemo(() => `session_${crypto.randomUUID()}`, []);
  const { messages, isConnected } = useDNotifierRealtime(sessionId);
  const [assistantMessages, setAssistantMessages] = useState<AssistantMessage[]>([]);
  const [simulating, setSimulating] = useState(false);

  const appendAssistantReply = (result: Awaited<ReturnType<typeof sendMessage>>["result"]) => {
    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setAssistantMessages((prev) => [...prev, { role: "assistant", text: summarize(result), time: now }]);
  };

  const handleSend = async (text: string) => {
    const res = await sendMessage(sessionId, text);
    appendAssistantReply(res.result);
  };

  const handleSimulate = async () => {
    if (simulating) return;
    setSimulating(true);
    try {
      const res = await simulatePatient(sessionId);
      appendAssistantReply(res.result);
    } catch (err) {
      console.error("[page] simulate failed:", err);
    } finally {
      setSimulating(false);
    }
  };

  return (
    <main className="h-screen bg-neutral-900 p-4 grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-4">
      <div className="flex flex-col gap-3 min-h-0">
        <button
          onClick={handleSimulate}
          disabled={simulating}
          className="self-start px-4 py-2 rounded-md bg-sky-500 text-white text-sm font-medium disabled:opacity-40"
        >
          {simulating ? "Simulating…" : "Simulate Patient"}
        </button>
        <div className="flex-1 min-h-0">
          <ChatPanel sessionId={sessionId} onSend={handleSend} extraMessages={assistantMessages} />
        </div>
      </div>
      <AgentActivityPanel messages={messages} isConnected={isConnected} />
    </main>
  );
}