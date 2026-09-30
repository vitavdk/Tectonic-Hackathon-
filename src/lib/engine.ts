import { MOMENTS, MOMENT_BY_ID } from "./moments";
import { inferSegment } from "./segment";
import { clamp } from "./format";
import type { CardView, Feedback, Learn, MomentId, Persona, Segment } from "./types";

// Layer 3 (LEARN): explicit feedback turns into per-moment weights.
// Ranker = base priority + trigger urgency + learned weight.
// A moment whose weight drops to MUTE_AT or below stops being pushed.

export const MUTE_AT = -1;
export const MAX_CARDS = 5;

export function emptyLearn(): Learn {
  return {
    weights: {},
    pushOverride: {},
    snoozed: {},
    beliefs: {},
    flags: {},
    regret: {},
    billRules: {},
    ghost: {},
    goals: [],
    completed: [],
    log: [],
  };
}

export type PushStatus = "showing" | "muted" | "off" | "quiet" | "snoozed";

export function pushOn(m: MomentId, seg: Segment, l: Learn): boolean {
  return l.pushOverride[m] ?? MOMENT_BY_ID[m].defaults[seg];
}

export function momentStatus(p: Persona, l: Learn, m: MomentId): PushStatus {
  const { segment } = inferSegment(p, l);
  if (!pushOn(m, segment, l)) return "off";
  if ((l.weights[m] ?? 0) <= MUTE_AT) return "muted";
  if (l.snoozed[m]) return "snoozed";
  if (!MOMENT_BY_ID[m].trigger(p, l, segment)) return "quiet";
  return "showing";
}

export function rank(p: Persona, l: Learn): CardView[] {
  const { segment } = inferSegment(p, l);
  const cards: CardView[] = [];
  for (const m of MOMENTS) {
    if (!pushOn(m.id, segment, l)) continue;
    const w = l.weights[m.id] ?? 0;
    if (w <= MUTE_AT || l.snoozed[m.id]) continue;
    const t = m.trigger(p, l, segment);
    if (!t) continue;
    cards.push({ moment: m.id, title: t.title, body: t.body, badge: t.badge, score: m.basePriority + t.urgency + w });
  }
  return cards.sort((a, b) => b.score - a.score).slice(0, MAX_CARDS);
}

const FEEDBACK_DELTA: Record<Feedback, number> = {
  useful: 0.4,
  not_useful: -0.6,
  not_relevant: -1.2,
  too_often: -0.4,
  wrong_moment: -0.2,
};

const FEEDBACK_TEXT: Record<Feedback, string> = {
  useful: "found it useful → shown higher",
  not_useful: "not useful → shown lower",
  not_relevant: "not relevant → stopped",
  too_often: "too often → shown less",
  wrong_moment: "wrong moment → snoozed until later",
};

export function applyFeedback(l: Learn, m: MomentId, f: Feedback): { next: Learn; message: string } {
  const before = l.weights[m] ?? 0;
  const w = clamp(before + FEEDBACK_DELTA[f], -1.5, 1.5);
  const next: Learn = {
    ...l,
    weights: { ...l.weights, [m]: Math.round(w * 100) / 100 },
    snoozed: f === "wrong_moment" ? { ...l.snoozed, [m]: true } : l.snoozed,
  };
  const muted = w <= MUTE_AT;
  const name = MOMENT_BY_ID[m].name;
  const message = muted
    ? `Kate learned: no more "${name}" pushes. You can still open it from KBC products.`
    : `Kate learned: "${name}" ${FEEDBACK_TEXT[f]}.`;
  return { next: log(next, `${name}: ${FEEDBACK_TEXT[f]} (weight ${fmtW(before)} → ${fmtW(w)})`), message };
}

export function log(l: Learn, text: string): Learn {
  return { ...l, log: [{ at: Date.now(), text }, ...l.log].slice(0, 30) };
}

export function bumpWeights(l: Learn, deltas: Partial<Record<MomentId, number>>): Learn {
  const weights = { ...l.weights };
  for (const [k, d] of Object.entries(deltas) as [MomentId, number][]) {
    weights[k] = Math.round(clamp((weights[k] ?? 0) + d, -1.5, 1.5) * 100) / 100;
  }
  return { ...l, weights };
}

function fmtW(n: number) {
  return (n >= 0 ? "+" : "") + n.toFixed(1);
}
