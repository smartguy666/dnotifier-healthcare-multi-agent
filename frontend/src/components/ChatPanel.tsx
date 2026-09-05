"use client";

import { useState } from "react";

interface ChatMessage {
  role: "patient" | "assistant";
  text: string;
  time: string;
}

interface ChatPanelProps {
  messages: ChatMessage[];
  onSend: (message: string) => Promise<void>;
  sending: boolean;
}

export function ChatPanel({ messages, onSend, sending }: ChatPanelProps) {
  const [input, setInput] = useState("");

  const submit = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setInput("");
    await onSend(text);
  };

  return (
    <div className="flex flex-col h-full bg-white text-slate-900 rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/60">
        <h1 className="text-sm sm:text-base font-semibold text-slate-800">AI Healthcare Assistant</h1>
        <p className="text-xs text-slate-500 mt-0.5">Decision support demo — not a diagnosis</p>
      </div>

      <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-3 space-y-3">
        {messages.length === 0 && (
          <p className="text-sm text-slate-400">Describe what you're experiencing to start.</p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={m.role === "patient" ? "text-right" : "text-left"}>
            <div
              className={
                m.role === "patient"
                  ? "inline-block max-w-[85%] sm:max-w-[75%] rounded-2xl rounded-tr-sm bg-teal-600 text-white px-3.5 py-2 text-sm text-left shadow-sm"
                  : "inline-block max-w-[85%] sm:max-w-[75%] rounded-2xl rounded-tl-sm bg-slate-100 text-slate-800 px-3.5 py-2 text-sm border border-slate-200"
              }
            >
              {m.text}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">{m.time}</div>
          </div>
        ))}
        {sending && (
          <div className="text-left">
            <div className="inline-flex items-center gap-1 rounded-2xl rounded-tl-sm bg-slate-100 border border-slate-200 px-3.5 py-2">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:-0.3s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:-0.15s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" />
            </div>
          </div>
        )}
      </div>

      <div className="p-2.5 sm:p-3 border-t border-slate-100 bg-white flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="I've had a fever and cough for three days..."
          className="flex-1 min-w-0 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
        />
        <button
          onClick={submit}
          disabled={sending}
          className="shrink-0 px-4 py-2 rounded-lg bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 transition-colors disabled:opacity-40 disabled:hover:bg-teal-600"
        >
          Send
        </button>
      </div>
    </div>
  );
}