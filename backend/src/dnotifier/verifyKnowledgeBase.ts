// dnotifier/verifyKnowledgeBase.ts
import { httpNotifier } from "./httpClient.js";

async function verify() {
  await httpNotifier.connect();

  const response = await httpNotifier.sendAI({
    senderId: "svc-healthcare-orchestrator",
    message: {
      useKnowledgeBase: true,
      messages: [
        {
          role: "system",
          content: "You are a clinic receptionist. Answer using the knowledge base only.",
        },
        { role: "user", content: "What are the clinic's opening hours, and which doctor handles respiratory issues?" },
      ],
    },
    saveHistory: false,
    label: "KB verification test",
  } as any); 
  console.log("[verify] RAW response:", JSON.stringify(response, null, 2));
}

verify().catch((err) => {
  console.error("[verify] failed:", err);
  process.exit(1);
});