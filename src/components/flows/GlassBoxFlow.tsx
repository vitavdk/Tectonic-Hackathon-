"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { bumpWeights, log } from "@/lib/engine";
import { say, TONE } from "@/lib/tone";
import type { BeliefOption } from "@/lib/types";
import { Bar, KateMsg, Panel, UserMsg } from "../ui";
import type { FlowProps } from "./types";

// Glass Box Profile: KBC shows what it infers, with the signals behind it.
// Customer answers are the strongest signal we have: they update flags,
// moment weights and can even move the customer to another segment.

export function GlassBoxFlow({ onDone }: FlowProps) {
  const { persona, segment, learn, update, toast } = useStore();
  const [replies, setReplies] = useState<{ belief: string; option: BeliefOption }[]>([]);

  function answer(beliefId: string, statement: string, o: BeliefOption) {
    setReplies((r) => [...r, { belief: beliefId, option: o }]);
    update((l) => {
      let n = { ...l, beliefs: { ...l.beliefs, [beliefId]: o.kind } };
      if (o.effect?.weights) n = bumpWeights(n, o.effect.weights);
      if (o.effect?.flags) n = { ...n, flags: { ...n.flags, ...o.effect.flags } };
      if (o.effect?.segmentOverride) n = { ...n, segmentOverride: o.effect.segmentOverride };
      return log(n, `Glass Box: "${statement}" → ${o.kind}${o.effect?.segmentOverride ? ` (segment → ${TONE[o.effect.segmentOverride].label})` : ""}`);
    });
    if (o.effect?.segmentOverride) toast(`Profile updated: now treated as "${TONE[o.effect.segmentOverride].label}". Pushes and tone changed.`);
    const remaining = persona.beliefs.filter((b) => !learn.beliefs[b.id] && b.id !== beliefId);
    if (remaining.length === 0) onDone();
  }

  return (
    <>
      <KateMsg>
        <p>
          {say(segment, {
            young: "Here's what KBC thinks about you, and why 👀 You're the boss: confirm or fix anything.",
            all: "This is what KBC believes about your situation, and the signals behind it. Confirm or correct anything. Your answers matter more than our guesses.",
            senior: "This is what we believe about your situation, and why. Please tell us if something is not right. Nothing changes without your say.",
          })}
        </p>
      </KateMsg>
      {persona.beliefs.map((b) => {
        const answered = learn.beliefs[b.id];
        const reply = replies.find((r) => r.belief === b.id);
        return (
          <div key={b.id} className="space-y-3">
            <Panel className="space-y-2">
              <div className="text-sm font-medium">&ldquo;{b.statement}&rdquo;</div>
              <div className="flex items-center gap-2 text-xs text-muted">
                <span className="w-24">Confidence {Math.round((answered ? 1 : b.confidence) * 100)}%</span>
                <div className="flex-1">
                  <Bar value={answered ? 1 : b.confidence} max={1} tone={answered === "confirm" ? "ok" : answered ? "warn" : "kbc"} />
                </div>
              </div>
              <details className="text-xs text-muted">
                <summary className="cursor-pointer text-kbc-soft">Why we think this</summary>
                <ul className="mt-1 list-disc pl-5">
                  {b.signals.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              </details>
              {answered ? (
                <div className="text-xs text-ok">
                  {answered === "confirm" ? "Confirmed by you" : answered === "correct" ? "Corrected by you" : "Marked not relevant: not used"}
                </div>
              ) : (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {b.options.map((o) => (
                    <button
                      key={o.label}
                      type="button"
                      onClick={() => answer(b.id, b.statement, o)}
                      className="rounded-full border border-kbc px-3 py-1 text-xs text-kbc-soft hover:bg-kbc/15"
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              )}
            </Panel>
            {reply && (
              <>
                <UserMsg>{reply.option.label}</UserMsg>
                <KateMsg>
                  <p>{reply.option.kateReply}</p>
                </KateMsg>
              </>
            )}
          </div>
        );
      })}
    </>
  );
}
