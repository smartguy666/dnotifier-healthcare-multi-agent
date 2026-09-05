"use client";

import { useMemo, useState } from "react";
import { ChatPanel } from "../components/ChatPanel";
import { AgentActivityPanel } from "../components/AgentActivityPanel";
import { useDNotifierRealtime } from "../hooks/useDNotifierRealtime";
import { sendMessage, simulatePatient } from "../lib/api";

interface ChatMessage {
  role: "patient" | "assistant";
  text: string;
  time: string;
}

export default function Page() {
  const sessionId = useMemo(() => `session_${crypto.randomUUID()}`, []);
  const { messages, isConnected } = useDNotifierRealtime(sessionId);
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [sending, setSending] = useState(false);
  const [simulating, setSimulating] = useState(false);

  const now = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const handleSend = async (text: string) => {
    setChat((prev) => [...prev, { role: "patient", text, time: now() }]);
    setSending(true);
    try {
      const res = await sendMessage(sessionId, text);
      setChat((prev) => [...prev, { role: "assistant", text: res.reply, time: now() }]);
    } catch (err) {
      console.error("[page] send failed:", err);
      setChat((prev) => [...prev, { role: "assistant", text: "Something went wrong — please try again.", time: now() }]);
    } finally {
      setSending(false);
    }
  };

  const handleSimulate = async () => {
    if (simulating) return;
    setSimulating(true);
    try {
      const res = await simulatePatient(sessionId);
      setChat((prev) => [...prev, { role: "assistant", text: res.reply, time: now() }]);
    } catch (err) {
      console.error("[page] simulate failed:", err);
    } finally {
      setSimulating(false);
    }
  };

    return (
    <main className="h-[100dvh] bg-slate-50 p-3 sm:p-4 flex flex-col gap-3 md:grid md:grid-cols-[2fr_1fr] md:gap-4 md:h-screen overflow-hidden">
      <div className="flex flex-col gap-3 h-[60%] md:h-auto min-h-0">
        <button
          onClick={handleSimulate}
          disabled={simulating}
          className="self-start px-4 py-2 rounded-lg bg-teal-600 text-white text-sm font-medium shadow-sm hover:bg-teal-700 transition-colors disabled:opacity-40 shrink-0"
        >
          {simulating ? "Simulating…" : "Simulate Patient"}
        </button>
        <div className="flex-1 min-h-0">
          <ChatPanel messages={chat} onSend={handleSend} sending={sending} />
        </div>
      </div>
      <div className="h-[40%] md:h-auto min-h-0">
        <AgentActivityPanel messages={messages} isConnected={isConnected} />
      </div>
    </main>
  );
}