// components/AgentActivityPanel.tsx
"use client";

import type { ActivityPayload, AgentName, AgentStatus } from "../types/activityPayloads";


interface AgentActivityPanelProps {
  messages: ActivityPayload[];
  isConnected: boolean;
}

const AGENT_LABELS: Record<AgentName, string> = {
  "triage-agent": "Triage Agent",
  "symptoms-agent": "Symptoms Agent",
  "medical-knowledge-agent": "Medical Knowledge",
  "appointment-agent": "Appointment Agent",
  "notification-agent": "Notification Agent",
};

const STATUS_MARK: Record<AgentStatus, string> = {
  started: "…",
  completed: "✓",
  failed: "✗",
};

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
    <div className="flex flex-col h-full bg-neutral-950 text-neutral-100 rounded-lg border border-neutral-800">
      <div className="px-4 py-3 border-b border-neutral-800 flex items-center justify-between">
        <h2 className="text-sm font-medium">Agent Activity</h2>
        <span className={`text-xs ${isConnected ? "text-emerald-400" : "text-neutral-600"}`}>
          {isConnected ? "live" : "disconnected"}
        </span>
      </div>

      <div className="px-4 py-3 space-y-2 border-b border-neutral-800">
        {(Object.keys(AGENT_LABELS) as AgentName[]).map((agent) => {
          const status = statuses[agent];
          return (
            <div key={agent} className="flex items-center justify-between text-sm">
              <span className="text-neutral-300">{AGENT_LABELS[agent]}</span>
              <span
                className={
                  status === "completed"
                    ? "text-emerald-400"
                    : status === "failed"
                    ? "text-red-400"
                    : status === "started"
                    ? "text-amber-400"
                    : "text-neutral-700"
                }
              >
                {status ? STATUS_MARK[status] : "·"}
              </span>
            </div>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3">
        <h3 className="text-xs text-neutral-500 mb-2">Event Stream</h3>
        <div className="space-y-1 font-mono text-[11px] text-neutral-400">
          {messages.map((m, i) => (
            <div key={i}>
              {m.type === "workflow.stage" && <span className="text-neutral-200">{m.stage}</span>}
              {m.type === "agent.status" && (
                <span>
                  {m.agent} <span className="text-neutral-600">→</span>{" "}
                  <span className={m.status === "failed" ? "text-red-400" : "text-neutral-200"}>{m.status}</span>
                </span>
              )}
              {m.type === "notification" && <span className="text-sky-400">notification sent</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}