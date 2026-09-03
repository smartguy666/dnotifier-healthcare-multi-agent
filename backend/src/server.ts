// server.ts
import express from "express";
import cors from "cors";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import { connectAll } from "./dnotifier/connectAll.js";
import { connectMongo } from "./db/connectMongo.js";
import { messageRouter } from "./api/routes/message.js";
import { simulateRouter } from "./api/routes/simulate.js";
import { registerBrowserSocket } from "./realtime/browserRelay.js";
import "./dnotifier/workflow.js";

const app = express();
app.use(cors());
app.use(express.json());
app.use(messageRouter);
app.use(simulateRouter);

const httpServer = createServer(app);
const browserWss = new WebSocketServer({ server: httpServer, path: "/realtime" });

browserWss.on("connection", (socket, req) => {
  const url = new URL(req.url ?? "", "http://localhost");
  const sessionId = url.searchParams.get("sessionId");
  if (!sessionId) {
    socket.close(4000, "sessionId query param is required");
    return;
  }
  console.log(`[browser-relay] tab connected for session ${sessionId}`);
  registerBrowserSocket(sessionId, socket);
});

const PORT = process.env.PORT ?? 3001;

async function main() {
  await connectAll();
  await connectMongo();
  httpServer.listen(PORT, () => console.log(`[server] listening on :${PORT}`));
}

main().catch((err) => {
  console.error("[server] failed to start:", err);
  process.exit(1);
});