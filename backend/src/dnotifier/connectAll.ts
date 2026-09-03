// dnotifier/connectAll.ts
import { httpNotifier } from "./httpClient.js";
import { wsNotifier, wsReady } from "./wsClient.js";

export async function connectAll() {
  await httpNotifier.connect(); // http resolves only after real auth completes (confirmed from source)
  console.log("[http] isConnected:", httpNotifier.isConnected, "aiEnabled:", httpNotifier.aiEnabled);

  await wsNotifier.connect();
  await wsReady; // wait for the actual 102 handshake-ack, not just socket-open
  console.log("[ws] isConnected:", wsNotifier.isConnected, "messageSizeLimit:", wsNotifier.messageSizeLimit);
}