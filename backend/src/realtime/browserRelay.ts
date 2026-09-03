// realtime/browserRelay.ts
import type { WebSocket as WsSocket } from "ws";

// Session -> set of connected browser sockets. Plain pass-through registry;
// this does NOT replace or duplicate DNotifier orchestration — it only bridges
// the last hop to an anonymous browser tab that has no appId/secret.
const sessionSockets = new Map<string, Set<WsSocket>>();

export function registerBrowserSocket(sessionId: string, socket: WsSocket): void {
  if (!sessionSockets.has(sessionId)) {
    sessionSockets.set(sessionId, new Set());
  }
  sessionSockets.get(sessionId)!.add(socket);

  socket.on("close", () => {
    const set = sessionSockets.get(sessionId);
    if (!set) return;
    set.delete(socket);
    if (set.size === 0) sessionSockets.delete(sessionId);
  });
}

export function forwardToSession(sessionId: string, data: unknown): void {
  const sockets = sessionSockets.get(sessionId);
  if (!sockets || sockets.size === 0) return; // no tab listening — drop silently, matches DNotifier's own "receiver must be connected" semantics

  const json = JSON.stringify(data);
  for (const socket of sockets) {
    if (socket.readyState === socket.OPEN) {
      socket.send(json);
    }
  }
}