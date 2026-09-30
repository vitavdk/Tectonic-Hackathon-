"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { log } from "@/lib/engine";
import { Chips, KateMsg, Panel, UserMsg, Bar } from "../ui";
import type { FlowProps } from "./types";

// Quiet Guardian: early, gentle outreach before a problem becomes a crisis.
// Script per signal type; tone follows the persona's segment.

interface Node {
  kate: string;
  panel?: React.ReactNode;
  options?: { label: string; value: string; next: string }[];
  end?: boolean;
}

export function GuardianFlow({ onDone }: FlowProps) {
  const { persona, learn, update, toast } = useStore();
  const script = SCRIPTS[persona.id](!!learn.flags.prefersHuman);
  const [path, setPath] = useState<{ node: string; picked?: string }[]>([{ node: "start" }]);

  function pick(i: number, value: string, label: string) {
    const node = script[path[i].node];
    const opt = node.options?.find((o) => o.value === value);
    if (!opt) return;
    const next = [...path.slice(0, i), { ...path[i], picked: label }, { node: opt.next }];
    setPath(next);
    if (value === "call") toast("Connecting you to KBC Live… (demo)");
    if (value === "limit") toast("Weekly betting limit of €20 set on your card (demo).");
    if (value === "block") toast("Payment blocked and payee reported. (demo)");
    if (script[opt.next]?.end) {
      update((l) => log({ ...l, completed: [...new Set([...l.completed, "guardian" as const])] }, `Quiet Guardian: ${label}`));
      onDone();
    }
  }

  return (
    <>
      {path.map((step, i) => {
        const node = script[step.node];
        return (
          <div key={i} className="space-y-3">
            <KateMsg>
              <p>{node.kate}</p>
            </KateMsg>
            {node.panel}
            {step.picked ? (
              <UserMsg>{step.picked}</UserMsg>
            ) : (
              node.options && <Chips options={node.options.map((o) => ({ label: o.label, value: o.value }))} onPick={(v, l) => pick(i, v, l)} />
            )}
          </div>
        );
      })}
    </>
  );
}

const callOpt = { label: "📞 Call KBC Live", value: "call", next: "called" };

const SCRIPTS: Record<string, (prefersHuman: boolean) => Record<string, Node>> = {
  lotte: () => ({
    start: {
      kate: "Hey Lotte, quick check-in 💬 Your betting went from €15 to €80 to €120 over the last 3 weeks. Totally your call, I just want you to feel in control.",
      panel: (
        <Panel className="space-y-2 text-sm">
          {[
            ["Week 37", 15],
            ["Week 38", 80],
            ["Week 39", 120],
          ].map(([w, v]) => (
            <div key={w} className="flex items-center gap-3">
              <span className="w-16 text-muted">{w}</span>
              <div className="flex-1">
                <Bar value={Number(v)} max={120} tone={Number(v) > 60 ? "warn" : "kbc"} />
              </div>
              <span className="w-12 text-right tabular-nums">€{v}</span>
            </div>
          ))}
        </Panel>
      ),
      options: [
        { label: "Set a €20/week limit", value: "limit", next: "limit" },
        { label: "Block betting sites on my card", value: "blockbet", next: "blocked" },
        { label: "Talk to someone", value: "talk", next: "talk" },
        { label: "All good, I've got it", value: "ok", next: "ok" },
      ],
    },
    limit: { kate: "Done ✅ €20 a week max. You can change it anytime, and I'll only ping you if you hit it.", end: true },
    blocked: { kate: "Betting payments on your card are now blocked for 30 days. Undoing it takes a 48h cooldown, so future-you gets a say too 💙", end: true },
    talk: {
      kate: "Good call. You can chat anonymously and for free with a gambling support line, or talk to a KBC coach about money stress. Want me to connect you?",
      options: [
        { label: "Show support options", value: "support", next: "support" },
        callOpt,
      ],
    },
    support: { kate: "I've added the support contacts to your messages. No one at KBC sees whether you use them.", end: true },
    ok: { kate: "Fair enough 👍 I'll check in again only if it keeps climbing.", end: true },
    called: { kate: "Connecting you now. A real person will pick up.", end: true },
  }),

  tom: () => ({
    start: {
      kate: "Tom, your spending has been 28% above your usual level for three months. Mostly eating out and online shopping. Nothing alarming yet, but it adds up to about €1,600 a year.",
      options: [
        { label: "Show me where it goes", value: "show", next: "show" },
        { label: "Set up a payday plan", value: "plan", next: "plan" },
        { label: "It's intentional", value: "ok", next: "ok" },
      ],
    },
    show: {
      kate: "Eating out +€140/month, online shopping +€95/month, transport stable. Want me to flag it when a category runs 20% over?",
      options: [
        { label: "Yes, flag it", value: "flag", next: "flag" },
        { label: "No thanks", value: "no", next: "ok" },
      ],
    },
    flag: { kate: "Done. You'll get one alert per category, max once a week.", end: true },
    plan: { kate: "Good idea. Open Payday allocator from KBC products and we'll set buckets for next month's salary.", end: true },
    ok: { kate: "Understood. I'll stop flagging this unless it changes a lot.", end: true },
    called: { kate: "Connecting you with KBC Live now.", end: true },
  }),

  sofie: () => ({
    start: {
      kate: "Sofie, your salary from UZ Health Campus usually arrives on the 25th. It's the 30th and nothing has come in yet. Your mortgage instalment of €1,180 is due on the 5th.",
      options: [
        { label: "It's just late", value: "late", next: "late" },
        { label: "I changed jobs", value: "job", next: "job" },
        { label: "I lost my job", value: "lost", next: "lost" },
      ],
    },
    late: {
      kate: "Thanks. Your buffer covers the mortgage comfortably, so nothing to worry about. I'll tell you as soon as it arrives.",
      end: true,
    },
    job: {
      kate: "Congratulations on the new job. I'll watch for the first salary from your new employer and then suggest an updated payday plan.",
      end: true,
    },
    lost: {
      kate: "I'm sorry to hear that. You're not alone in this. Your savings cover about 6 months of fixed costs. You can also ask for a temporary mortgage payment pause. Shall I set up a call with an advisor?",
      options: [
        { label: "Yes, schedule a call", value: "advisor", next: "advisor" },
        callOpt,
      ],
    },
    advisor: { kate: "An advisor will call you tomorrow between 9 and 11. You don't need to prepare anything.", end: true },
    called: { kate: "Connecting you with KBC Live now.", end: true },
  }),

  marc: (prefersHuman) => ({
    start: {
      kate: "Good afternoon Marc. I have paused a transfer of €2,400 to a new account called 'KBC Secure Account'. Please take a moment. Did someone call or message you and ask you to move your money to keep it safe?",
      panel: (
        <Panel className="border-warn/50 text-sm">
          <div className="font-semibold text-warn">Payment on hold</div>
          <div className="mt-1 text-muted">€2,400.00 → BE72 9979 5440 2516 · first time · marked urgent</div>
          <div className="mt-2">KBC will <b>never</b> ask you to move money to a &lsquo;safe&rsquo; account.</div>
        </Panel>
      ),
      options: [
        { label: "Yes, someone called me", value: "yes", next: "scam" },
        { label: "No, I know this person", value: "no", next: "confirm1" },
        ...(prefersHuman ? [callOpt] : []),
      ],
    },
    scam: {
      kate: "Thank you for telling me. This is very likely a scam. Please do not call them back. I will cancel this payment now, and a KBC colleague will phone you today.",
      options: [
        { label: "Cancel the payment", value: "block", next: "blocked" },
        callOpt,
      ],
    },
    blocked: { kate: "The payment is cancelled and your money is safe. A colleague will call you on your known number. Never share your card reader codes.", end: true },
    confirm1: {
      kate: "Alright. To be safe, please confirm: you personally know who owns this account, and nobody is telling you to do this in a hurry?",
      options: [
        { label: "Yes, I'm sure", value: "sure", next: "confirm2" },
        { label: "Actually, I'm not sure", value: "notsure", next: "scam" },
      ],
    },
    confirm2: {
      kate: "Thank you. One last check: this is €2,400, more than you usually send. Shall I release it?",
      options: [
        { label: "Yes, release it", value: "release", next: "released" },
        { label: "No, keep it on hold", value: "hold", next: "held" },
      ],
    },
    released: { kate: "The payment has been released. I'll keep an eye out for anything unusual.", end: true },
    held: { kate: "The payment stays on hold. You can release it later, or talk to someone first.", end: true },
    called: { kate: "Connecting you with a KBC colleague now. Please stay on the line.", end: true },
  }),
};
