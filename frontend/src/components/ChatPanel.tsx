// components/ChatPanel.tsx
"use client";

import { useState } from "react";

interface ChatMessage {
  role: "patient" | "assistant";
  text: string;
  time: string;
}

interface ChatPanelProps {
  sessionId: string;
  onSend: (message: string) => Promise<void>;
  extraMessages: ChatMessage[]; // assistant summary appended once the workflow completes
}

export function ChatPanel({ sessionId, onSend, extraMessages }: ChatPanelProps) {
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [sending, setSending] = useState(false);

    const submit = async () => {
    const text = input.trim();
    if (!text || sending) return;

    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setHistory((prev) => [...prev, { role: "patient", text, time: now }]);
    setInput("");
    setSending(true);

    try {
      await onSend(text);
    } catch (err) {
      console.error("[ChatPanel] send failed:", err);
      setHistory((prev) => [
        ...prev,
        { role: "assistant", text: "Something went wrong — please try again.", time: now },
      ]);
    } finally {
      setSending(false);
    }
  };

  const allMessages = [...history, ...extraMessages];

  return (
    <div className="flex flex-col h-full bg-neutral-950 text-neutral-100 rounded-lg border border-neutral-800">
      <div className="px-4 py-3 border-b border-neutral-800">
        <h1 className="text-base font-medium">AI Healthcare Assistant</h1>
        <p className="text-xs text-neutral-500 mt-0.5">Decision support demo — not a diagnosis</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {allMessages.length === 0 && (
          <p className="text-sm text-neutral-500">Describe what you're experiencing to start.</p>
        )}
        {allMessages.map((m, i) => (
          <div key={i} className={m.role === "patient" ? "text-right" : "text-left"}>
            <div
              className={
                m.role === "patient"
                  ? "inline-block max-w-[80%] rounded-lg bg-neutral-100 text-neutral-900 px-3 py-2 text-sm text-left"
                  : "inline-block max-w-[80%] rounded-lg bg-neutral-900 border border-neutral-800 px-3 py-2 text-sm"
              }
            >
              {m.text}
            </div>
            <div className="text-[11px] text-neutral-600 mt-1">{m.time}</div>
          </div>
        ))}
        {sending && <p className="text-sm text-neutral-500">Analyzing your symptoms…</p>}
      </div>

      <div className="p-3 border-t border-neutral-800 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="I've had a fever and cough for three days..."
          className="flex-1 bg-neutral-900 border border-neutral-800 rounded-md px-3 py-2 text-sm outline-none focus:border-neutral-600"
        />
        <button
          onClick={submit}
          disabled={sending}
          className="px-4 py-2 rounded-md bg-neutral-100 text-neutral-900 text-sm font-medium disabled:opacity-40"
        >
          Send
        </button>
      </div>
    </div>
  );
}