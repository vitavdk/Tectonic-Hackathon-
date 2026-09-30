"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Mic, Phone, SendHorizontal, X } from "lucide-react";
import { useStore } from "@/lib/store";
import { MOMENTS, MOMENT_BY_ID } from "@/lib/moments";
import { say } from "@/lib/tone";
import type { MomentId } from "@/lib/types";
import { Chips, KateMsg, UserMsg } from "./ui";
import { FeedbackPrompt } from "./FeedbackPrompt";
import { SplitFlow } from "./flows/SplitFlow";
import { PaydayFlow } from "./flows/PaydayFlow";
import { IdleFlow } from "./flows/IdleFlow";
import { GhostFlow } from "./flows/GhostFlow";
import { GoalsFlow } from "./flows/GoalsFlow";
import { RegretFlow } from "./flows/RegretFlow";
import { GuardianFlow } from "./flows/GuardianFlow";
import { GlassBoxFlow } from "./flows/GlassBoxFlow";
import type { FlowProps } from "./flows/types";

const FLOWS: Record<MomentId, (p: FlowProps) => React.ReactNode> = {
  split: SplitFlow,
  payday: PaydayFlow,
  idle: IdleFlow,
  ghost: GhostFlow,
  goals: GoalsFlow,
  regret: RegretFlow,
  guardian: GuardianFlow,
  glassbox: GlassBoxFlow,
};

// Scripted intent router for typed questions (no LLM in this version).
const KEYWORDS: [RegExp, MomentId][] = [
  [/split|bill|receipt|restaurant|dinner|tikkie|share/i, "split"],
  [/salary|payday|budget|bucket|plan|income|pension/i, "payday"],
  [/subscri|netflix|spotify|recurring|abonnement/i, "ghost"],
  [/goal|trip|holiday|save together|pot|sabbatical/i, "goals"],
  [/regret|worth|impulse/i, "regret"],
  [/scam|fraud|safe|betting|gambl|worried|stress|salary.*late/i, "guardian"],
  [/profile|know about me|data|privacy|glass/i, "glassbox"],
  [/idle|spare|invest|surplus|savings account/i, "idle"],
];

export type ChatSource = "push" | "ribbon" | "kate";

export interface ChatRequest {
  moment?: MomentId;
  source: ChatSource;
  generic?: string; // "today" mode: generic tip text
  nonce: number;
}

export function KateChat({ req, onClose }: { req: ChatRequest; onClose: () => void }) {
  const { persona, segment, mode, learn } = useStore();
  const [threads, setThreads] = useState<{ moment: MomentId; source: ChatSource; done: boolean; key: number; asked?: string }[]>(
    () => (req.moment ? [{ moment: req.moment, source: req.source, done: false, key: req.nonce }] : []),
  );
  const [showMenu, setShowMenu] = useState(false);
  const [typed, setTyped] = useState<{ q: string; a: string }[]>([]);
  const [input, setInput] = useState("");
  const scroller = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);

  // keep the newest message in view
  useEffect(() => {
    const el = content.current;
    if (!el) return;
    const ro = new ResizeObserver(() => scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  function start(m: MomentId, asked?: string) {
    setShowMenu(false);
    setThreads((t) => [...t, { moment: m, source: "kate", done: false, key: Date.now(), asked }]);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const q = input.trim().slice(0, 200);
    if (!q) return;
    setInput("");
    const hit = mode === "coach" ? KEYWORDS.find(([re]) => re.test(q)) : undefined;
    if (hit) start(hit[1], q);
    else
      setTyped((t) => [
        ...t,
        {
          q,
          a:
            mode === "coach"
              ? "I'm a scripted demo, so I can't answer free questions yet. Try: split a bill, plan my salary, subscriptions, a savings goal, or what KBC knows about me."
              : "I can help with balances, transfers and cards. For other questions, call KBC Live.",
        },
      ]);
  }

  const greeting = say(segment, {
    young: `Hey ${persona.name} 👋 I'm Kate. What's up?`,
    all: `Hello ${persona.name}. I'm Kate, how can I help you?`,
    senior: `Good afternoon ${persona.name}. I'm Kate. How can I help you today?`,
  });

  return (
    <div className="flex h-full flex-col bg-bg">
      <header className="flex items-center justify-between px-4 pb-2 pt-4">
        <button type="button" onClick={onClose} aria-label="Back" className="rounded-full border border-line bg-surface p-3 text-kbc">
          <ArrowLeft size={20} />
        </button>
        <div className="text-lg font-semibold">Kate</div>
        <button type="button" onClick={onClose} aria-label="Close" className="rounded-full border border-line bg-surface p-3 text-kbc">
          <X size={20} />
        </button>
      </header>

      <div ref={scroller} className="no-scrollbar flex-1 overflow-y-auto px-4 pb-4">
        <div ref={content} className="space-y-4">
          <div className="pt-2 text-center">
            <div className="text-sm font-medium">Today</div>
            <div className="text-xs text-muted">Ask Kate, your AI assistant</div>
          </div>

          {req.generic ? (
            <>
              <KateMsg>
                <p>{req.generic}</p>
              </KateMsg>
              <KateMsg>
                <p className="text-muted">
                  Here are some general tips that apply to everyone: lower the thermostat by 1°C, close curtains at night, and bleed your radiators.
                </p>
              </KateMsg>
            </>
          ) : (
            threads.length === 0 && (
              <KateMsg>
                <p>{greeting}</p>
              </KateMsg>
            )
          )}

          {threads.map((t, i) => {
            const Flow = FLOWS[t.moment];
            return (
              <div key={t.key} className={`space-y-4 ${i > 0 ? "border-t border-line pt-4" : ""}`}>
                {t.asked && <UserMsg>{t.asked}</UserMsg>}
                {t.source !== "push" && !t.asked && i > 0 && <UserMsg>{MOMENT_BY_ID[t.moment].name}</UserMsg>}
                <Flow onDone={() => setThreads((all) => all.map((x) => (x.key === t.key ? { ...x, done: true } : x)))} />
                {t.done && mode === "coach" && <FeedbackPrompt moment={t.moment} source={t.source} />}
              </div>
            );
          })}

          {typed.map((t, i) => (
            <div key={i} className="space-y-4">
              <UserMsg>{t.q}</UserMsg>
              <KateMsg>
                <p>{t.a}</p>
              </KateMsg>
            </div>
          ))}

          {showMenu && (
            <>
              <UserMsg>What can you do?</UserMsg>
              <KateMsg>
                <p>{say(segment, { young: "Loads 😎 Pick one:", all: "Here is what I can help you with:" })}</p>
              </KateMsg>
              <Chips options={MOMENTS.map((m) => ({ label: m.name, value: m.id }))} onPick={(v) => start(v as MomentId)} />
            </>
          )}
        </div>
      </div>

      <div className="space-y-3 px-4 pb-5 pt-2">
        <div className="no-scrollbar flex gap-2 overflow-x-auto">
          <button type="button" className="inline-flex shrink-0 items-center gap-2 rounded-full border border-kbc px-4 py-2 text-sm font-medium text-kbc-soft">
            <Phone size={15} /> Call KBC Live
          </button>
          {mode === "coach" && (
            <button
              type="button"
              onClick={() => setShowMenu(true)}
              className="shrink-0 rounded-full border border-kbc px-4 py-2 text-sm font-medium text-kbc-soft"
            >
              What can you do?
            </button>
          )}
          {learn.flags.prefersHuman && (
            <span className="shrink-0 self-center text-xs text-muted">A person is always one tap away.</span>
          )}
        </div>
        <form onSubmit={submit} className="flex items-center gap-2 rounded-full border border-line bg-surface py-1.5 pl-5 pr-1.5">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            maxLength={200}
            placeholder="Type your question here"
            aria-label="Message Kate"
            className="min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted"
          />
          <button type="submit" aria-label={input ? "Send" : "Voice (not in demo)"} className="rounded-full bg-kbc p-3 text-black">
            {input ? <SendHorizontal size={20} /> : <Mic size={20} />}
          </button>
        </form>
      </div>
    </div>
  );
}
