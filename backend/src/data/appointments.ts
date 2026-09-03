// data/appointments.ts
import type { AppointmentOption } from "../../../packages/shared/types/domain.js";
interface DoctorSlots {
  doctor: string;
  slots: string[];
}

const availability: DoctorSlots[] = [
  { doctor: "Dr. Ahmed", slots: ["10:00", "11:30", "14:00"] },
  { doctor: "Dr. Sara", slots: ["09:30", "13:00", "16:30"] },
];

export function getAvailableAppointments(): AppointmentOption[] {
  return availability.flatMap(({ doctor, slots }) =>
    slots.map((time) => ({ doctor, time }))
  );
}

export function bookSlot(doctor: string, time: string): boolean {
  const entry = availability.find((d) => d.doctor === doctor);
  if (!entry) return false;
  const idx = entry.slots.indexOf(time);
  if (idx === -1) return false;
  entry.slots.splice(idx, 1);
  return true;
}