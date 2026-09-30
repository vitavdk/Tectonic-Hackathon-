"use client";

import { useState } from "react";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { log } from "@/lib/engine";
import { say } from "@/lib/tone";
import { eur } from "@/lib/format";
import type { Bucket } from "@/lib/types";
import { Bar, Chips, KateMsg, Panel, Primary, UserMsg } from "../ui";
import type { FlowProps } from "./types";

// DEEP FLOW 2: salary lands → budget window with buckets (+ custom) → weekly
// overview → unsure bill: "which bucket?" (Kate learns a rule) → income change
// → Kate proposes a reallocation.

const RAISE = 250;
// Mocked "spent so far" ratios for the weekly overview, by bucket position.
const SPENT = [1, 0.46, 0.52, 0.78, 0, 0.1, 0.3, 0.2];

export function PaydayFlow({ onDone }: FlowProps) {
  const { persona, segment, learn, update, toast } = useStore();
  const income = persona.income.amount + (learn.incomeChanged || learn.flags.raised ? RAISE : 0);
  const [buckets, setBuckets] = useState<Bucket[]>(() => learn.buckets ?? persona.defaultBuckets);
  const [step, setStep] = useState(learn.incomeChanged ? 5 : learn.buckets ? 2 : 0);
  // sections before the starting step are skipped, later ones stay visible as chat history
  const [startedAt] = useState(step);
  const [answers, setAnswers] = useState<string[]>([]);
  const [newName, setNewName] = useState("");
  const unsure = persona.tx.find((t) => t.label.startsWith("PAYPAL"));
  const rule = unsure ? learn.billRules[unsure.label] : undefined;

  const allocated = buckets.reduce((a, b) => a + b.amount, 0);
  const left = income - allocated;

  function change(id: string, delta: number) {
    setBuckets((bs) => bs.map((b) => (b.id === id ? { ...b, amount: Math.max(0, Math.min(income, b.amount + delta)) } : b)));
  }
  function setAmount(id: string, v: string) {
    const n = Math.max(0, Math.min(income, Math.round(Number(v.replace(/[^\d]/g, "")) || 0)));
    setBuckets((bs) => bs.map((b) => (b.id === id ? { ...b, amount: n } : b)));
  }
  function addBucket() {
    const name = newName.trim().replace(/[^\p{L}\p{N} &'-]/gu, "").slice(0, 24);
    if (!name || buckets.length >= 10) return;
    setBuckets((bs) => [...bs, { id: `c-${Date.now()}`, name, amount: 0 }]);
    setNewName("");
  }
  function save() {
    update((l) => log({ ...l, buckets }, `Payday plan saved: ${buckets.length} buckets for ${eur(income)}`));
    setStep(2);
  }
  function pickBucket(bucketName: string) {
    if (!unsure) return;
    setAnswers((a) => [...a, bucketName]);
    update((l) => log({ ...l, billRules: { ...l.billRules, [unsure.label]: bucketName } }, `Learned rule: "${unsure.label}" → ${bucketName}`));
    setStep(4);
  }
  function simulateChange() {
    update((l) => log({ ...l, incomeChanged: true }, `Income change detected: +${eur(RAISE)} (new employer)`));
    setStep(5);
  }
  function acceptRealloc() {
    const next = realloc(buckets);
    setBuckets(next);
    update((l) => log({ ...l, buckets: next, incomeChanged: false, flags: { ...l.flags, raised: true } }, "Buckets rebalanced after income change"));
    toast("Plan updated for your new income.");
    setStep(6);
    onDone();
  }

  return (
    <>
      <KateMsg>
        <p>
          {say(segment, {
            young: `Money in! 💰 ${eur(persona.income.amount)} just landed. Let's give every euro a job before it vanishes.`,
            adult: `Your ${persona.income.type === "salary" ? "salary" : "income"} of ${eur(persona.income.amount)} from ${persona.income.source} arrived. Want to plan the month in 30 seconds?`,
            senior: `Your ${persona.income.type} of ${eur(persona.income.amount)} has arrived. Would you like a simple plan for this month? There is no rush.`,
          })}
        </p>
      </KateMsg>

      {step === 0 && (
        <Chips
          options={[
            { label: "Plan my month", value: "go" },
            { label: "Not now", value: "no" },
          ]}
          onPick={(v) => (v === "go" ? setStep(1) : onDone())}
        />
      )}

      {step >= 1 && (
        <>
          {startedAt === 0 && <UserMsg>Plan my month</UserMsg>}
          <Panel className="space-y-3">
            <div className="flex items-baseline justify-between">
              <div className="text-sm text-muted">Budget window</div>
              <div className={`text-sm tabular-nums ${left < 0 ? "text-alert" : left === 0 ? "text-ok" : "text-muted"}`}>
                {left === 0 ? "Every euro has a job ✓" : left > 0 ? `${eur(left)} left to assign` : `${eur(-left)} over`}
              </div>
            </div>
            <Bar value={allocated} max={income} tone={left < 0 ? "alert" : "kbc"} />
            {buckets.map((b, i) => (
              <div key={b.id} className="flex items-center gap-2">
                <div className="min-w-0 flex-1 truncate text-sm">{b.name}</div>
                {step === 1 ? (
                  <>
                    <button type="button" aria-label={`Less for ${b.name}`} onClick={() => change(b.id, -50)} className="rounded-full bg-surface-2 p-1.5">
                      <Minus size={14} />
                    </button>
                    <input
                      inputMode="numeric"
                      aria-label={`${b.name} amount`}
                      value={b.amount}
                      onChange={(e) => setAmount(b.id, e.target.value)}
                      className="w-20 rounded-lg bg-surface-2 px-2 py-1 text-right text-sm tabular-nums outline-none focus:ring-1 focus:ring-kbc"
                    />
                    <button type="button" aria-label={`More for ${b.name}`} onClick={() => change(b.id, 50)} className="rounded-full bg-surface-2 p-1.5">
                      <Plus size={14} />
                    </button>
                    {b.id.startsWith("c-") && (
                      <button type="button" aria-label={`Remove ${b.name}`} onClick={() => setBuckets((bs) => bs.filter((x) => x.id !== b.id))} className="p-1 text-muted">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </>
                ) : (
                  <div className="w-40">
                    <div className="mb-1 flex justify-between text-xs text-muted tabular-nums">
                      <span>{eur(Math.round(b.amount * (SPENT[i] ?? 0.3)))}</span>
                      <span>{eur(b.amount)}</span>
                    </div>
                    <Bar value={b.amount * (SPENT[i] ?? 0.3)} max={b.amount} tone={(SPENT[i] ?? 0) > 0.75 && (SPENT[i] ?? 0) < 1 ? "warn" : "kbc"} />
                  </div>
                )}
              </div>
            ))}
            {step === 1 && (
              <>
                <div className="flex gap-2 border-t border-line pt-3">
                  <input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    maxLength={24}
                    placeholder="Add a bucket, e.g. Holiday"
                    className="min-w-0 flex-1 rounded-lg bg-surface-2 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-kbc"
                  />
                  <button type="button" onClick={addBucket} className="rounded-lg bg-surface-2 px-3 text-sm text-kbc-soft">
                    Add
                  </button>
                </div>
                <Primary onClick={save} disabled={left < 0}>
                  Save my plan
                </Primary>
              </>
            )}
          </Panel>
        </>
      )}

      {step >= 2 && startedAt <= 2 && (
        <KateMsg>
          <p>
            {say(segment, {
              young: "Week 1 recap 📊 Going out is already at 78%, go easy this weekend 😉",
              all: "Here is your weekly overview. Fixed costs are paid, groceries on track, and Fun & eating out is at 78%.",
            })}
          </p>
        </KateMsg>
      )}

      {step === 2 && unsure && !rule && (
        <>
          <KateMsg>
            <p>
              {say(segment, {
                young: `One thing: ${eur(-unsure.amount)} to "${unsure.label}". Which bucket is that? I'll remember 🧠`,
                all: `I wasn't sure about ${eur(-unsure.amount)} to "${unsure.label}". Which bucket does it belong to? I'll remember for next time.`,
              })}
            </p>
          </KateMsg>
          <Chips options={buckets.map((b) => ({ label: b.name, value: b.name }))} onPick={(v) => pickBucket(v)} />
        </>
      )}
      {step === 2 && (!unsure || rule) && (
        <KateMsg>
          <p className="text-muted">
            {rule ? `Filed "${unsure?.label}" under ${rule}, as you taught me.` : "All payments are categorised."}
          </p>
          <div>
            <Primary onClick={() => setStep(4)}>Continue</Primary>
          </div>
        </KateMsg>
      )}

      {step >= 4 && (
        <>
          {answers[0] && <UserMsg>{answers[0]}</UserMsg>}
          {answers[0] && (
            <KateMsg>
              <p>Got it. Payments like &ldquo;{unsure?.label}&rdquo; go to {answers[0]} from now on.</p>
            </KateMsg>
          )}
          {step === 4 && <Panel>
            <p className="mb-3 text-xs text-muted">Demo control: simulate a salary change (e.g. new employer).</p>
            <Primary onClick={simulateChange}>Simulate new salary +{eur(RAISE)}</Primary>
          </Panel>}
        </>
      )}

      {step >= 5 && (
        <>
          <KateMsg>
            <p>
              {say(segment, {
                young: `Whoa, your income went up by ${eur(RAISE)} 🎉 Want me to split the extra?`,
                all: `Your income changed: +${eur(RAISE)} per month. I suggest putting ${eur(150)} extra into Savings and ${eur(100)} into ${bucketFor(buckets)}. Shall I rebalance?`,
              })}
            </p>
          </KateMsg>
          {step === 5 && (
            <Chips
              options={[
                { label: "Yes, rebalance", value: "yes" },
                { label: "I'll do it myself", value: "self" },
              ]}
              onPick={(v) => {
                if (v === "yes") acceptRealloc();
                else {
                  update((l) => ({ ...l, incomeChanged: false, flags: { ...l.flags, raised: true } }));
                  setStep(1);
                }
              }}
            />
          )}
          {step === 6 && (
            <KateMsg>
              <p>Done. Your plan now covers {eur(income)} and every euro has a job.</p>
            </KateMsg>
          )}
        </>
      )}
    </>
  );
}

function bucketFor(bs: Bucket[]) {
  return (bs.find((b) => /fun|going out/i.test(b.name)) ?? bs.find((b) => b.id !== "save") ?? bs[0]).name;
}

function realloc(bs: Bucket[]): Bucket[] {
  const target = bucketFor(bs);
  const hasSave = bs.some((b) => b.id === "save");
  const out = bs.map((b) =>
    b.id === "save" ? { ...b, amount: b.amount + 150 } : b.name === target ? { ...b, amount: b.amount + (hasSave ? 100 : RAISE) } : b,
  );
  return out;
}
