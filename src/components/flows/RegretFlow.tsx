"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { bumpWeights, log } from "@/lib/engine";
import { regretCandidates } from "@/lib/moments";
import { say } from "@/lib/tone";
import { eur2 } from "@/lib/format";
import { Chips, KateMsg, UserMsg } from "../ui";
import type { FlowProps } from "./types";

type Rating = "worth" | "meh" | "regret";
const LABEL: Record<Rating, string> = { worth: "👍 Worth it", meh: "😐 Meh", regret: "👎 Not worth it" };

export function RegretFlow({ onDone }: FlowProps) {
  const { persona, segment, learn, update } = useStore();
  // Freeze the list when the flow opens so answers don't reshuffle it.
  const [queue] = useState(() => regretCandidates(persona, learn).slice(0, 3));
  const [answers, setAnswers] = useState<Rating[]>([]);
  const done = queue.length > 0 && answers.length === queue.length;

  function rate(r: Rating) {
    const tx = queue[answers.length];
    const next = [...answers, r];
    setAnswers(next);
    update((l) => log({ ...l, regret: { ...l.regret, [tx.id]: r } }, `Regret score: ${tx.label} → ${r}`));
    if (next.length === queue.length) {
      const regrets = next.filter((x) => x === "regret").length;
      update((l) => bumpWeights(l, { regret: regrets >= 2 ? 0.3 : -0.2 }));
      onDone();
    }
  }

  if (queue.length === 0) {
    const regrets = Object.values(learn.regret).filter((v) => v === "regret").length;
    return (
      <KateMsg>
        <p>
          {regrets >= 2
            ? say(segment, {
                young: `You told me ${regrets} buys weren't worth it, mostly food delivery 🛵 I'll ping you on Friday evenings before you order. Deal?`,
                all: `You rated ${regrets} payments as not worth it. I'll give you a heads-up before similar spending.`,
              })
            : say(segment, { young: "Nothing new to rate right now 🙌", all: "Nothing new to rate at the moment." })}
        </p>
      </KateMsg>
    );
  }

  const regrets = answers.filter((x) => x === "regret").length;

  return (
    <>
      <KateMsg>
        <p>
          {say(segment, {
            young: `${queue.length} quick ones. No judgement, just honest vibes 😄`,
            all: `${queue.length} recent payments. Were they worth it? Your answers shape what I suggest.`,
          })}
        </p>
      </KateMsg>
      {queue.map((tx, i) =>
        i <= answers.length ? (
          <div key={tx.id} className="space-y-3">
            <KateMsg>
              <p>
                <b>{tx.label}</b> · {eur2(-tx.amount)} on {tx.date}
              </p>
            </KateMsg>
            {answers[i] ? (
              <UserMsg>{LABEL[answers[i]]}</UserMsg>
            ) : (
              <Chips options={(Object.keys(LABEL) as Rating[]).map((r) => ({ label: LABEL[r], value: r }))} onPick={(v) => rate(v as Rating)} />
            )}
          </div>
        ) : null,
      )}
      {done && (
        <KateMsg>
          <p>
            {regrets >= 2
              ? say(segment, {
                  young: "Noted 📝 Looks like delivery is your regret zone. From now on I'll send a chill heads-up on Friday nights instead of generic tips.",
                  all: "Noted. Delivery and impulse buys are where you feel regret. I'll time my reminders for those moments and skip the rest.",
                })
              : say(segment, {
                  young: "Love that you enjoyed it 💙 I'll stop asking about this kind of spending.",
                  all: "Good to hear. I'll ask less often about this kind of spending.",
                })}
          </p>
        </KateMsg>
      )}
    </>
  );
}
