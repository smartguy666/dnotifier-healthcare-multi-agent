// db/seedKnowledgeBase.ts
import { httpNotifier } from "../dnotifier/httpClient.js";

const documents = [
  {
    recordId: "clinic-hours",
    type: "clinic-info",
    content:
      "The clinic is open Monday to Saturday, 9:00 AM to 6:00 PM. Closed on Sundays and public holidays.",
  },
  {
    recordId: "clinic-location",
    type: "clinic-info",
    content:
      "The clinic is located at 123 Health Street, Bahawalpur. Parking is available at the rear entrance.",
  },
  {
    recordId: "clinic-doctors",
    type: "clinic-info",
    content:
      "Dr. Ahmed specializes in general medicine and respiratory conditions. Dr. Sara specializes in family medicine and pediatric care. Both see walk-in and scheduled patients.",
  },
  {
    recordId: "clinic-services",
    type: "clinic-info",
    content:
      "Services offered: general consultations, respiratory illness triage, follow-up appointments, and referrals for specialist care. The clinic does not perform surgery or emergency trauma care — for emergencies, patients should go to the nearest hospital emergency room.",
  },
  {
    recordId: "faq-appointment-cancel",
    type: "faq",
    content:
      "To cancel or reschedule an appointment, patients should contact the clinic at least 2 hours in advance. Late cancellations may affect availability for other patients.",
  },
  {
    recordId: "faq-walk-in",
    type: "faq",
    content:
      "Walk-in patients are accepted but scheduled appointments are given priority. Wait times for walk-ins vary depending on the day.",
  },
  {
    recordId: "faq-insurance",
    type: "faq",
    content:
      "The clinic accepts major local insurance providers. Patients should bring their insurance card and a valid ID to their appointment.",
  },
];

async function seed() {
  await httpNotifier.connect();

  for (const doc of documents) {
    const result = await httpNotifier.addDocument({
      senderId: "svc-healthcare-orchestrator",
      recordId: doc.recordId,
      content: doc.content,
      type: doc.type,
    });
    console.log(`[seed] added "${doc.recordId}":`, result);
  }

  console.log("[seed] done");
  process.exit(0);
}

seed().catch((err) => {
  console.error("[seed] failed:", err);
  process.exit(1);
});