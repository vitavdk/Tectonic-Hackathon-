import type { Learn, Persona, Segment } from "./types";

// Layer 1 (WHO): rule-based segmenter on mocked bank signals.
// Segments are only the cold-start default. Customer feedback (Glass Box etc.)
// can override them: the "segment of one".

export function inferSegment(p: Persona, l?: Learn): { segment: Segment; reasons: string[]; overridden: boolean } {
  if (l?.segmentOverride) {
    return {
      segment: l.segmentOverride,
      reasons: ["Customer corrected their profile in Glass Box"],
      overridden: true,
    };
  }
  if (p.age >= 65 || p.income.type === "pension") {
    return {
      segment: "senior",
      reasons: [`Age band 65+ (${p.age})`, "Monthly pension credit", "Few online payments"],
      overridden: false,
    };
  }
  if (p.hasMortgage) {
    return {
      segment: "home",
      reasons: ["Monthly mortgage instalment", `Stable salary (${p.income.source})`, "Higher buffer"],
      overridden: false,
    };
  }
  if (p.age < 26 || p.income.type === "allowance") {
    return {
      segment: "young",
      reasons: [`Age ${p.age}`, "Allowance + irregular small income", "Restaurant, delivery & streaming pattern"],
      overridden: false,
    };
  }
  return {
    segment: "steady",
    reasons: [`Stable salary from ${p.income.source}`, "Healthy buffer", "No mortgage signal"],
    overridden: false,
  };
}
