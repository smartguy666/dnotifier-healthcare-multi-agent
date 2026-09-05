// lib/api.ts
const API_HOST = process.env.NEXT_PUBLIC_BACKEND_API_URL ?? "http://localhost:3001";

export interface ReceptionistApiResult {
  reply: string;
  appointment: { doctor: string; time: string } | null;
  executionId?: string;
}

export async function sendMessage(sessionId: string, message: string): Promise<ReceptionistApiResult> {
  const res = await fetch(`${API_HOST}/api/message`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId, message }),
  });
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
}

export async function simulatePatient(sessionId: string): Promise<ReceptionistApiResult & { sessionId: string }> {
  const res = await fetch(`${API_HOST}/api/simulate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId }),
  });
  if (!res.ok) throw new Error(`Simulate request failed: ${res.status}`);
  return res.json();
}