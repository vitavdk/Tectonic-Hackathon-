import type { Segment } from "./types";

// Kate speaks differently per segment. Every piece of Kate copy goes through `say`,
// so the same moment reads casual for a student and calm and plain for a senior.

export interface Variants {
  young?: string;
  steady?: string;
  home?: string;
  senior?: string;
  /** fallback for steady + home */
  adult?: string;
  /** final fallback */
  all?: string;
}

export function say(seg: Segment, v: Variants): string {
  const pick =
    v[seg] ??
    (seg === "steady" || seg === "home" ? v.adult : undefined) ??
    v.all ??
    v.adult ??
    v.young ??
    "";
  return pick;
}

export const TONE: Record<
  Segment,
  { label: string; voice: string; emoji: boolean; confirmTwice: boolean }
> = {
  young: {
    label: "Student / young adult",
    voice: "Casual, short, upbeat. Light emoji OK.",
    emoji: true,
    confirmTwice: false,
  },
  steady: {
    label: "Steady earner",
    voice: "Clear, practical, peer-professional. Concrete amounts.",
    emoji: false,
    confirmTwice: false,
  },
  home: {
    label: "Homeowner",
    voice: "Practical, slightly formal. Frames money around home and buffer.",
    emoji: false,
    confirmTwice: false,
  },
  senior: {
    label: "Senior",
    voice: "Calm, plain language, patient. No slang. Extra confirmations.",
    emoji: false,
    confirmTwice: true,
  },
};
