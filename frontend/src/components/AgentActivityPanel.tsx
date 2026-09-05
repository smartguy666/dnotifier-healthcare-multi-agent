"use client";

import type { ActivityPayload, AgentName, AgentStatus } from "../types/activityPayloads";

interface AgentActivityPanelProps {
  messages: ActivityPayload[];
  isConnected: boolean;
}

const AGENT_LABELS: Record<AgentName, string> = {
  "receptionist-agent": "Receptionist",
  "appointment-agent": "Appointment Agent",
  "notification-agent": "Notification Agent",
  "triage-agent": "Triage Agent",
  "symptoms-agent": "Symptoms Agent",
  "medical-knowledge-agent": "Medical Knowledge",
};

const ACTIVE_AGENTS: AgentName[] = ["receptionist-agent", "appointment-agent", "notification-agent"];

function latestStatusByAgent(messages: ActivityPayload[]): Partial<Record<AgentName, AgentStatus>> {
  const result: Partial<Record<AgentName, AgentStatus>> = {};
  for (const m of messages) {
    if (m.type === "agent.status") result[m.agent] = m.status;
  }
  return result;
}

export function AgentActivityPanel({ messages, isConnected }: AgentActivityPanelProps) {
  const statuses = latestStatusByAgent(messages);

  return (
    <div className="flex flex-col h-full bg-white text-slate-900 rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-800">Agent Activity</h2>
        <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${isConnected ? "text-emerald-600" : "text-slate-400"}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? "bg-emerald-500" : "bg-slate-300"}`} />
          {isConnected ? "live" : "disconnected"}
        </span>
      </div>

      <div className="px-4 py-3 space-y-2 border-b border-slate-100">
        {ACTIVE_AGENTS.map((agent) => {
          const status = statuses[agent];
          return (
            <div key={agent} className="flex items-center justify-between text-sm">
              <span className="text-slate-600">{AGENT_LABELS[agent]}</span>
              <span
                className={
                  status === "completed"
                    ? "text-emerald-600 font-medium"
                    : status === "failed"
                    ? "text-red-500 font-medium"
                    : status === "started"
                    ? "text-amber-500 font-medium"
                    : "text-slate-300"
                }
              >
                {status === "completed" ? "✓" : status === "failed" ? "✗" : status === "started" ? "…" : "·"}
              </span>
            </div>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 min-h-30 max-h-[40vh] md:max-h-none">
        <h3 className="text-xs font-medium text-slate-400 mb-2 sticky top-0 bg-white">Event Stream</h3>
        <div className="space-y-1.5 font-mono text-[11px] text-slate-500">
          {messages.length === 0 && <p className="text-slate-300">No activity yet.</p>}
          {messages.map((m, i) => (
            <div key={i}>
              {m.type === "workflow.stage" && <span className="text-slate-700 font-medium">{m.stage}</span>}
              {m.type === "agent.status" && (
                <span>
                  {m.agent} <span className="text-slate-300">→</span>{" "}
                  <span className={m.status === "failed" ? "text-red-500" : "text-slate-700"}>{m.status}</span>
                </span>
              )}
              {m.type === "notification" && <span className="text-sky-600">notification sent</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}