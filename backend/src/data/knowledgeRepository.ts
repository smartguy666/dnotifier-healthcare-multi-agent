// data/knowledgeRepository.ts
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import type { KnowledgeResult } from "../../../packages/shared/types/domain.js";

interface KnowledgeEntry {
  symptom: string;
  information: string[];
  requiresClinicianReview: boolean;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const KNOWLEDGE_DIR = join(__dirname, "../../../medical-knowledge");

const FILES = ["fever.json", "cough.json", "respiratory.json", "emergency-guidelines.json"];

function loadEntries(): KnowledgeEntry[] {
  return FILES.map((file) => {
    const raw = readFileSync(join(KNOWLEDGE_DIR, file), "utf-8");
    return JSON.parse(raw) as KnowledgeEntry;
  });
}

const entries = loadEntries();

export function lookup(symptoms: string[]): KnowledgeResult {
  const matched = entries.filter((entry) =>
    symptoms.some((s) => s.toLowerCase().includes(entry.symptom.toLowerCase()))
  );

  if (matched.length === 0) {
    return { information: [], requiresClinicianReview: false };
  }

  return {
    information: matched.flatMap((entry) => entry.information),
    requiresClinicianReview: matched.some((entry) => entry.requiresClinicianReview),
  };
}