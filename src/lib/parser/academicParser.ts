// src/lib/parser/academicParser.ts
/**
 * Parses academic timetable from:
 *  - Plain text (copy-paste)
 *  - PDF (via pdf-parse)
 *  - Image (via Tesseract.js OCR)
 */

import type { AcademicPeriod } from "@/types";

const DAYS = ["monday","tuesday","wednesday","thursday","friday","saturday","sunday"];
const TIME_REGEX = /(\d{1,2})[:\.](\d{2})\s*(am|pm)?/gi;

export async function parseFromText(text: string): Promise<AcademicPeriod[]> {
  const periods: AcademicPeriod[] = [];
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

  let currentDay = "Monday";

  for (const line of lines) {
    const lower = line.toLowerCase();

    // Detect day header
    const foundDay = DAYS.find((d) => lower.startsWith(d));
    if (foundDay) {
      currentDay = foundDay.charAt(0).toUpperCase() + foundDay.slice(1);
      continue;
    }

    // Try to extract time range + subject
    // Formats: "9:30 - 10:20  Compiler Design  Prof. Raj  Room 101"
    //          "09:30-10:20 | Mathematics"
    const timeMatch = [...line.matchAll(/(\d{1,2})[:\.](\d{2})\s*(am|pm)?\s*[-–to]+\s*(\d{1,2})[:\.](\d{2})\s*(am|pm)?/gi)];

    if (timeMatch.length > 0) {
      const m = timeMatch[0];
      const start = normalizeTime(m[1], m[2], m[3]);
      const end = normalizeTime(m[4], m[5], m[6] || m[3]);

      // Everything after the time range is subject + optional teacher
      const rest = line.slice(m.index! + m[0].length).replace(/[|\-–]/g, " ").trim();
      const parts = rest.split(/\s{2,}|(?<=\w)\s+(?=Prof\.|Dr\.|Mr\.|Ms\.)/i);
      const subject = parts[0]?.trim() || "Unknown Subject";
      const teacher = parts[1]?.trim();
      const room = parts.find((p) => /room|hall|lab/i.test(p))?.trim();

      periods.push({ day: currentDay, startTime: start, endTime: end, subject, teacher, room });
    }
  }

  return periods;
}

export async function parseFromPDF(buffer: Buffer): Promise<AcademicPeriod[]> {
  const pdfParse = (await import("pdf-parse")).default;
  const data = await pdfParse(buffer);
  return parseFromText(data.text);
}

export async function parseFromImage(buffer: Buffer): Promise<AcademicPeriod[]> {
  const Tesseract = await import("tesseract.js");
  const worker = await Tesseract.createWorker("eng");
  const { data: { text } } = await worker.recognize(buffer);
  await worker.terminate();
  return parseFromText(text);
}

function normalizeTime(hour: string, minute: string, ampm?: string): string {
  let h = parseInt(hour, 10);
  const m = minute.padStart(2, "0");
  if (ampm) {
    if (ampm.toLowerCase() === "pm" && h < 12) h += 12;
    if (ampm.toLowerCase() === "am" && h === 12) h = 0;
  } else if (h < 7) {
    h += 12; // assume PM for ambiguous times like 1:00 → 13:00
  }
  return `${String(h).padStart(2, "0")}:${m}`;
}

export function getCurrentPeriod(
  periods: AcademicPeriod[],
  now: Date
): { current: AcademicPeriod | null; next: AcademicPeriod | null } {
  const day = now.toLocaleDateString("en-US", { weekday: "long" });
  const todayPeriods = periods
    .filter((p) => p.day === day)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const nowMins = now.getHours() * 60 + now.getMinutes();
  const toMins = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };

  let current: AcademicPeriod | null = null;
  let next: AcademicPeriod | null = null;

  for (let i = 0; i < todayPeriods.length; i++) {
    const p = todayPeriods[i];
    const s = toMins(p.startTime);
    const e = toMins(p.endTime);

    if (nowMins >= s && nowMins < e) {
      current = p;
      next = todayPeriods[i + 1] ?? null;
      break;
    } else if (nowMins < s && !next) {
      next = p;
    }
  }

  return { current, next };
}
