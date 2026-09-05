// dnotifier/connectAll.ts
import { httpNotifier } from "./httpClient.js";
import { wsNotifier, wsReady } from "./wsClient.js";

export async function connectAll() {
  await httpNotifier.connect(); 
  console.log("[http] isConnected:", httpNotifier.isConnected, "aiEnabled:", httpNotifier.aiEnabled);

  await wsNotifier.connect();
  await wsReady; 
  console.log("[ws] isConnected:", wsNotifier.isConnected, "messageSizeLimit:", wsNotifier.messageSizeLimit);
}