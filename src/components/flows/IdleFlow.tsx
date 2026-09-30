"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { log } from "@/lib/engine";
import { idleSurplus } from "@/lib/moments";
import { say, TONE } from "@/lib/tone";
import { eur } from "@/lib/format";
import { Chips, KateMsg, UserMsg } from "../ui";
import type { FlowProps } from "./types";

// Idle cash: same trigger, different product framing per segment + Glass Box flags.

export function IdleFlow({ onDone }: FlowProps) {
  const { persona, segment, learn, update } = useStore();
  const surplus = idleSurplus(persona);
  const [pick, setPick] = useState<{ value: string; label: string } | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const needsConfirm = TONE[segment].confirmTwice;

  if (surplus < 500) {
    return (
      <KateMsg>
        <p>
          {say(segment, {
            young: "Right now there's no spare cash above your buffer, and that's totally fine 🙂 I'll tell you when there is.",
            all: "At the moment there is no money sitting above a healthy buffer. I'll let you know when there is.",
          })}
        </p>
      </KateMsg>
    );
  }

  const options = optionsFor(segment, surplus, !!learn.flags.houseGoal, !!learn.flags.renovation);

  function choose(value: string, label: string) {
    setPick({ value, label });
    if (!needsConfirm) finish(label);
  }
  function finish(label: string) {
    setConfirmed(true);
    update((l) => log({ ...l, completed: [...new Set([...l.completed, "idle" as const])] }, `Idle cash: chose "${label}"`));
    onDone();
  }

  return (
    <>
      <KateMsg>
        <p>
          {say(segment, {
            young: `${eur(surplus)} is just sitting there 💸 Want it to work for you?`,
            steady: learn.flags.houseGoal
              ? `You have ${eur(surplus)} above your buffer. Since you're saving for a home, I'd keep it safe and accessible.`
              : `You've kept ${eur(surplus)} above a healthy buffer (1.5× monthly spending) for 2 months. Here are three options:`,
            home: learn.flags.renovation
              ? `You have ${eur(surplus)} above your household buffer. With the kitchen renovation coming, I'd keep most of it close at hand.`
              : `You have ${eur(surplus)} above your household buffer. Here's how you could put it to work without touching your mortgage safety net:`,
            senior: `You have ${eur(surplus)} more than you usually need each month. Here are calm options. Nothing happens without your approval.`,
          })}
        </p>
      </KateMsg>
      {!pick && <Chips options={options} onPick={choose} />}
      {pick && <UserMsg>{pick.label}</UserMsg>}
      {pick && needsConfirm && !confirmed && (
        <>
          <KateMsg>
            <p>Just to be sure: {pick.label.toLowerCase()}. Shall I go ahead?</p>
          </KateMsg>
          <Chips
            options={[
              { label: "Yes, go ahead", value: "y" },
              { label: "No, leave it", value: "n" },
            ]}
            onPick={(v) => (v === "y" ? finish(pick.label) : setPick(null))}
          />
        </>
      )}
      {confirmed && (
        <KateMsg>
          <p>
            {pick?.value === "advisor"
              ? "An advisor will call you this week at a time that suits you."
              : say(segment, { young: "Done ✅ Your money's got a job now.", all: "Done. It's set up, and you can change it anytime in Save & invest." })}
          </p>
        </KateMsg>
      )}
    </>
  );
}

function optionsFor(seg: string, s: number, house: boolean, reno: boolean) {
  const part = Math.round(s / 2 / 50) * 50;
  switch (seg) {
    case "young":
      return [
        { label: `Move ${eur(part)} to savings`, value: "save" },
        { label: "Start a €25/month investing plan", value: "invest" },
      ];
    case "steady":
      return house
        ? [
            { label: `Park ${eur(s)} in a deposit savings account`, value: "save" },
            { label: "Show me how much I can borrow", value: "mortgage" },
          ]
        : [
            { label: `Move ${eur(part)} to savings`, value: "save" },
            { label: "Start a €150/month investment plan", value: "invest" },
            { label: "Talk to an advisor", value: "advisor" },
          ];
    case "home":
      return reno
        ? [
            { label: `Keep ${eur(s)} as renovation reserve`, value: "reserve" },
            { label: "Check a renovation loan instead", value: "loan" },
          ]
        : [
            { label: `Top up buffer savings with ${eur(part)}`, value: "save" },
            { label: "Simulate an early mortgage repayment", value: "repay" },
            { label: "Start a €200/month investment plan", value: "invest" },
          ];
    default:
      return [
        { label: `Move ${eur(part)} to my savings account`, value: "save" },
        { label: "I'd like to talk to someone", value: "advisor" },
      ];
  }
}
