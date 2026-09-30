"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { applyFeedback, log, pushOn } from "@/lib/engine";
import { MOMENT_BY_ID } from "@/lib/moments";
import { say } from "@/lib/tone";
import type { Feedback, MomentId } from "@/lib/types";
import { Chips, KateMsg, UserMsg } from "./ui";

// The explicit feedback loop, visible on screen. Pushes ask "was this useful?";
// features opened from the products ribbon offer to turn their push on.

export function FeedbackPrompt({ moment, source }: { moment: MomentId; source: "push" | "ribbon" | "kate" }) {
  const { segment, learn, update, toast } = useStore();
  const [stage, setStage] = useState<"ask" | "why" | "done">("ask");
  const [picked, setPicked] = useState<string[]>([]);
  const [result, setResult] = useState("");
  const name = MOMENT_BY_ID[moment].name;

  function give(f: Feedback, label: string) {
    setPicked((p) => [...p, label]);
    const { message } = applyFeedback(learn, moment, f);
    update((l) => applyFeedback(l, moment, f).next);
    setResult(message);
    toast(message);
    setStage("done");
  }

  if (source !== "push") {
    if (pushOn(moment, segment, learn)) return null;
    return (
      <>
        <KateMsg>
          <p>
            {say(segment, {
              young: `Want me to ping you next time for "${name}"? 🔔`,
              all: `Would you like me to notify you proactively about "${name}" in the future?`,
            })}
          </p>
        </KateMsg>
        {stage === "ask" ? (
          <Chips
            options={[
              { label: "Yes, notify me", value: "y" },
              { label: "No thanks", value: "n" },
            ]}
            onPick={(v, l) => {
              setPicked([l]);
              setStage("done");
              if (v === "y") {
                update((x) => log({ ...x, pushOverride: { ...x.pushOverride, [moment]: true } }, `${name}: push turned ON by customer`));
                toast(`"${name}" pushes turned on for you.`);
              }
            }}
          />
        ) : (
          <UserMsg>{picked[0]}</UserMsg>
        )}
      </>
    );
  }

  return (
    <div className="space-y-3 border-t border-dashed border-line pt-4">
      <KateMsg>
        <p className="text-muted">
          {say(segment, {
            young: "Btw, was this notification useful? Your answer changes what I send you 🙏",
            all: "Was this notification useful? Your answer changes what I send you next.",
            senior: "One small question: was this message useful to you? Your answer helps me send you only what matters.",
          })}
        </p>
      </KateMsg>
      {stage === "ask" && (
        <Chips
          options={[
            { label: "👍 Useful", value: "up" },
            { label: "👎 Not useful", value: "down" },
          ]}
          onPick={(v, l) => {
            if (v === "up") give("useful", l);
            else {
              setPicked([l]);
              setStage("why");
            }
          }}
        />
      )}
      {stage === "why" && (
        <>
          <UserMsg>{picked[0]}</UserMsg>
          <KateMsg>
            <p>{say(segment, { young: "Got it. What was off?", all: "Thanks. What was wrong with it?" })}</p>
          </KateMsg>
          <Chips
            options={[
              { label: "Not relevant to me", value: "not_relevant" },
              { label: "Too often", value: "too_often" },
              { label: "Wrong moment", value: "wrong_moment" },
              { label: "Just not useful", value: "not_useful" },
            ]}
            onPick={(v, l) => give(v as Feedback, l)}
          />
        </>
      )}
      {stage === "done" && (
        <>
          {picked.map((p, i) => (
            <UserMsg key={i}>{p}</UserMsg>
          ))}
          {result && (
            <KateMsg>
              <p>{result.replace(/^Kate learned: /, say(segment, { young: "Noted 🧠 ", all: "Thank you. " }))}</p>
            </KateMsg>
          )}
        </>
      )}
    </div>
  );
}
