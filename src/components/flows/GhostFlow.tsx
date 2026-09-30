"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { log } from "@/lib/engine";
import { say } from "@/lib/tone";
import { eur, eur2 } from "@/lib/format";
import { KateMsg, Panel, Primary } from "../ui";
import type { FlowProps } from "./types";

type Choice = "keep" | "cancel" | "dismiss";

export function GhostFlow({ onDone }: FlowProps) {
  const { persona, segment, learn, update } = useStore();
  const subs = persona.subscriptions;
  const [choices, setChoices] = useState<Record<string, Choice>>(() => ({ ...learn.ghost }));
  const [done, setDone] = useState(false);
  const yearly = subs.reduce((a, s) => a + s.monthly * 12, 0);
  const saved = subs.filter((s) => choices[s.id] === "cancel").reduce((a, s) => a + s.monthly * 12, 0);

  function finish() {
    setDone(true);
    update((l) => log({ ...l, ghost: { ...l.ghost, ...choices } }, `Subscriptions reviewed: ${eur(saved)}/year marked to cancel`));
    onDone();
  }

  return (
    <>
      <KateMsg>
        <p>
          {say(segment, {
            young: `You've got ${subs.length} subs = ${eur(yearly)}/year 👻 Some look a bit… ghosty. Keep or cancel?`,
            adult: `I found ${subs.length} recurring payments, ${eur(yearly)} per year in total. Here's why some stand out:`,
            senior: `You pay for ${subs.length} regular services, ${eur(yearly)} per year together. Let's go through them one by one.`,
          })}
        </p>
      </KateMsg>
      <Panel className="space-y-3">
        {subs.map((s) => (
          <div key={s.id} className="border-b border-line pb-3 last:border-0 last:pb-0">
            <div className="flex justify-between text-sm">
              <span className="font-medium">{s.name}</span>
              <span className="tabular-nums text-muted">
                {eur2(s.monthly)}/mo · {eur(s.monthly * 12)}/yr
              </span>
            </div>
            <div className="mt-0.5 text-xs text-warn">{s.signal}</div>
            <div className="mt-2 flex gap-1.5">
              {(["keep", "cancel", "dismiss"] as Choice[]).map((c) => (
                <button
                  key={c}
                  type="button"
                  disabled={done}
                  aria-pressed={choices[s.id] === c}
                  onClick={() => setChoices((x) => ({ ...x, [s.id]: c }))}
                  className={`rounded-full px-3 py-1 text-xs capitalize transition ${
                    choices[s.id] === c ? (c === "cancel" ? "bg-alert text-white" : "bg-kbc text-black") : "bg-surface-2 text-muted"
                  }`}
                >
                  {c === "dismiss" ? "Not mine to judge" : c === "cancel" ? "Help me cancel" : "Keep"}
                </button>
              ))}
            </div>
          </div>
        ))}
        {!done && (
          <div className="flex items-center justify-between pt-1">
            <span className="text-sm text-muted">Potential saving: <b className="text-ok">{eur(saved)}/yr</b></span>
            <Primary onClick={finish} disabled={Object.keys(choices).length === 0}>
              Done
            </Primary>
          </div>
        )}
      </Panel>
      {done && (
        <KateMsg>
          <p>
            {saved > 0
              ? say(segment, {
                  young: `Nice, that's ${eur(saved)} a year back in your pocket 🙌 I've put the cancel links in your inbox.`,
                  all: `That saves ${eur(saved)} per year. I've prepared the cancellation steps for each one in your messages.`,
                })
              : "All kept. I'll only flag them again if a price changes."}
          </p>
        </KateMsg>
      )}
    </>
  );
}
