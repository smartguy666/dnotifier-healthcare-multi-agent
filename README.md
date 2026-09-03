# DNotifier Healthcare Multi-Agent

A developer-focused reference implementation — **not a real medical product.**

This example demonstrates how **DNotifier** can be used as the event-driven orchestration and realtime communication layer between autonomous AI agents.
```
Patient
↓
Triage Agent
↓
Symptoms Agent
Medical Knowledge Agent
Appointment Agent
Notification Agent
```

## What this repo proves about DNotifier

| Capability | Demonstrated by |
|---|---|
| Agent orchestration | Triage → parallel specialized agents via `DNotifier.Workflow` |
| Agent communication | `ctx.runAgent` / `ctx.runAgents` — agents never call each other directly |
| Pub/Sub | Multiple agents consuming triage output; Notification Agent consuming triage + appointment results |
| Realtime | Live agent activity streamed to the browser over DNotifier's realtime transport |
| Memory/context | `ctx.state` shared across a run; `sessionId` scoping throughout |
| Notifications | Real in-app notification delivery via `wsNotifier.send()` |

## Architectural decision

This is positioned as an **AI Healthcare Multi-Agent Coordination Demo**, not an "AI doctor." Agents triage, structure symptoms, retrieve reference information, and find appointment options — they never diagnose, prescribe, or replace a clinician.

## Architecture
```
Patient
│
▼
Triage Agent
│
├──────────────┬──────────────┬──────────────┐
▼ ▼ ▼ ▼
Symptoms Medical Appointment Notification
Agent Knowledge Agent Agent
│ │ │ │
└──────────────┴──────────────┴──────────────┘
│
▼
Patient Response
```

DNotifier's `Workflow` is the orchestration layer: `entry()` runs Triage sequentially, then fans out to Symptoms / Medical Knowledge / Appointment agents in parallel via `ctx.runAgents`, then conditionally invokes the Notification Agent — all through real `DNotifier.defineAgent` / `registerAgents` primitives, never direct function calls between agents.

## Tech stack

| Layer | Choice |
|---|---|
| Frontend | Next.js + TypeScript |
| Backend | Node.js + TypeScript + Express |
| Orchestration & Realtime | DNotifier (`@dnotifier-realtime/dnotifier`) |
| AI | via DNotifier's `ctx.sendAI` (OpenAI-backed) |
| Persistence | MongoDB Atlas (conversations + execution logs) |

## Project structure
```
healthcare-multi-agent/
├── backend/
│ ├── src/
│ │ ├── dnotifier/ # DNotifier clients, Workflow, activity broadcaster
│ │ ├── agents/ # triage, symptoms, medical-knowledge, appointment, notification
│ │ ├── data/ # mock knowledge base + appointment availability
│ │ ├── db/ # Mongoose models + repositories
│ │ ├── realtime/ # browser WebSocket relay (session-scoped)
│ │ └── api/routes/ # /api/message, /api/simulate
│ └── package.json
├── frontend/
│ └── src/
│ ├── app/ # chat + activity screen
│ ├── components/ # ChatPanel, AgentActivityPanel
│ ├── hooks/ # useDNotifierRealtime
│ └── types/ # local type copies (see note below)
├── packages/shared/ # source-of-truth types for the backend
└── medical-knowledge/ # mock KB (fever, cough, respiratory, emergency-guidelines)
```

> **Note:** `frontend/src/types` holds local copies of `packages/shared/types` (Next.js 15's `experimental.externalDir` doesn't reliably support this cross-folder import pattern). Keep them in sync manually if shared types change.

## Event / activity model

Realtime activity pushed to the browser over DNotifier, relayed per-session:
```
workflow.stage: received
→ agent.status: triage-agent (started → completed)
workflow.stage: triaged
→ agent.status: symptoms-agent, medical-knowledge-agent, appointment-agent (parallel)
workflow.stage: fanned-out
→ agent.status: notification-agent (started → completed)
workflow.stage: notified
workflow.stage: completed
```

Every agent carries a **decision-support only** framing — structured extraction and retrieval, never diagnosis.

## Why a browser relay layer exists

The browser never holds DNotifier's `appId`/`secret` (they can't safely ship in a public bundle). The backend is the only thing that talks to DNotifier directly; a thin, plain WebSocket relay (`realtime/browserRelay.ts`) forwards session-scoped activity messages to the browser. **This relay does not replace DNotifier orchestration** — it only bridges the last hop to an anonymous, secret-less browser tab.

## Running locally

**Backend**
```bash
cd backend
npm install
# set DNOTIFIER_APP_ID, DNOTIFIER_SECRET, DNOTIFIER_ORCHESTRATOR_USER_ID, MONGODB_URI in .env
npm run dev
```

**Frontend**
```bash
cd frontend
npm install
# set NEXT_PUBLIC_BACKEND_API_URL, NEXT_PUBLIC_BACKEND_WS_URL in .env.local
npm run dev
```

Open `http://localhost:3000`, type a symptom description (or click **Simulate Patient**), and watch the Agent Activity panel and Event Stream update live as DNotifier orchestrates the five agents in real time.

## Extending this demo

| Advanced capability | Extension |
|---|---|
| Agent memory | Patient conversation history (partially in place via MongoDB) |
| RAG | Swap the mock JSON knowledge base for `ctx.search` / `ctx.addDocument` |
| Multi-model routing | Route `ctx.sendAI` calls across providers |
| Observability | Already enabled (`observability: true`) — extend the dashboard views |
| Human-in-the-loop | Add clinician approval before notification send |
| Distributed agents | Run the Notification Agent as a separate process via `{ receiverId }` + `workflow.listen(notifier)` |
| Workflow recovery | Retry failed agent steps using `resumeWorkflowContext` |
| Audit trail | Already logged via `executionlogs` — extend with a dashboard UI |

## Disclaimer

This is a **decision-support demo**, not a diagnostic tool. It does not diagnose, prescribe, or replace professional medical care. Always consult a qualified clinician for medical concerns.