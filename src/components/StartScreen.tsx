"use client";

import { useState } from "react";
import { Bell, ChevronUp, ChevronDown, House, Newspaper, PiggyBank, Plus, Search, Settings, Signpost, Star, Wallet, X, Sparkles } from "lucide-react";
import { useStore } from "@/lib/store";
import { rank, applyFeedback } from "@/lib/engine";
import { MOMENT_BY_ID } from "@/lib/moments";
import { eur2 } from "@/lib/format";
import type { CardView, Feedback, MomentId } from "@/lib/types";
import { KateAvatar } from "./ui";

export const TODAY_TIPS = [
  { id: "energy", text: "High energy prices? With these tips you keep the warmth inside your home, and the winter outside." },
  { id: "income", text: "Want to know more about your income or expenses? Ask Kate in KBC Mobile." },
];

export function Header({ title, onKate, onBell, badge }: { title?: string; onKate: () => void; onBell: () => void; badge: number }) {
  return (
    <div className="flex items-center gap-3">
      <button type="button" aria-label="Settings" className="rounded-full border border-line bg-surface p-3.5">
        <Settings size={20} />
      </button>
      {title ? (
        <h1 className="flex-1 text-3xl font-bold">{title}</h1>
      ) : (
        <button
          type="button"
          onClick={onKate}
          className="flex min-w-0 flex-1 items-center gap-2 rounded-full border border-line bg-surface py-3 pl-4 pr-3 text-left"
        >
          <Search size={18} className="shrink-0 text-muted" />
          <span className="flex-1 truncate text-muted">How can I help…</span>
          <span className="inline-flex items-center gap-1.5 font-bold">
            <KateAvatar size={18} /> Kate
          </span>
        </button>
      )}
      <button type="button" onClick={onBell} aria-label={`Notifications (${badge})`} className="relative rounded-full border border-line bg-surface p-3.5">
        <Bell size={20} />
        {badge > 0 && <span className="absolute right-2.5 top-2.5 h-3 w-3 rounded-full bg-alert" />}
      </button>
      {title && (
        <button type="button" onClick={onKate} aria-label="Open Kate" className="rounded-full border border-line bg-surface p-2.5">
          <KateAvatar size={26} />
        </button>
      )}
    </div>
  );
}

const RIBBON_MOMENTS: MomentId[] = ["split", "payday", "goals", "ghost", "glassbox"];

export function StartScreen({ openKate, openGeneric, openBell }: { openKate: (m?: MomentId, source?: "push" | "ribbon") => void; openGeneric: (text: string) => void; openBell: () => void }) {
  const { persona, learn, mode } = useStore();
  const [showTx, setShowTx] = useState(true);
  const cards = mode === "coach" ? rank(persona, learn) : [];

  return (
    <div className="space-y-6">
      <Header onKate={() => openKate()} onBell={openBell} badge={mode === "coach" ? cards.length : 1} />

      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
        <span className="shrink-0 rounded-full bg-white p-3 text-black">
          <Wallet size={20} />
        </span>
        {[
          { label: "MyNWS", icon: Newspaper },
          { label: "MyHome", icon: House },
          { label: "MyMobility", icon: Signpost },
        ].map((p) => (
          <span key={p.label} className="inline-flex shrink-0 items-center gap-2 rounded-full border border-line bg-surface px-4 py-2.5 text-[15px]">
            <p.icon size={18} className="text-muted" /> {p.label}
          </span>
        ))}
        {mode === "coach" &&
          RIBBON_MOMENTS.map((id) => {
            const m = MOMENT_BY_ID[id];
            return (
              <button
                key={id}
                type="button"
                onClick={() => openKate(id, "ribbon")}
                className="inline-flex shrink-0 items-center gap-2 rounded-full border border-kbc/60 bg-kbc/10 px-4 py-2.5 text-[15px] text-kbc-soft"
              >
                <m.icon size={18} /> {m.short}
              </button>
            );
          })}
      </div>

      <div className="@3xl:grid @3xl:grid-cols-[1fr_1.1fr] @3xl:gap-8">
        <div className="space-y-4">
          <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4">
            <AccountCard label="Current account" value={persona.accounts.current} icon={<Wallet size={44} strokeWidth={1.5} />} active />
            <AccountCard label="Savings account" value={persona.accounts.savings} icon={<PiggyBank size={44} strokeWidth={1.5} />} />
            <div className="flex shrink-0 flex-col gap-3">
              <span className="inline-flex items-center gap-2 rounded-2xl bg-surface px-4 py-4 text-sm">
                <Star size={18} /> Edit
              </span>
              <span className="inline-flex items-center gap-2 rounded-2xl bg-surface px-4 py-4 text-sm">
                <Plus size={18} className="text-ok" /> New
              </span>
            </div>
          </div>

          {showTx && (
            <ul className="space-y-3 px-1">
              {persona.tx.slice(0, 4).map((t) => (
                <li key={t.id} className="flex items-center gap-4 text-[15px]">
                  <span className="w-12 text-sm text-muted">{t.date}</span>
                  <span className="flex-1 truncate uppercase">{t.label}</span>
                  <span className={`tabular-nums ${t.amount > 0 ? "text-ok" : ""}`}>{eur2(t.amount)}</span>
                </li>
              ))}
            </ul>
          )}
          <button type="button" onClick={() => setShowTx((s) => !s)} className="inline-flex items-center gap-2 px-1 text-sm font-semibold text-kbc">
            {showTx ? <ChevronUp size={16} /> : <ChevronDown size={16} />} {showTx ? "Hide payments" : "Show payments"}
          </button>
        </div>

        <section className="mt-6 space-y-3 @3xl:mt-0">
          <div className="flex items-baseline justify-between">
            <h2 className="text-2xl">For you</h2>
            <span className="text-sm font-semibold text-kbc">All messages</span>
          </div>

          {mode === "today" &&
            TODAY_TIPS.map((t) => (
              <button key={t.id} type="button" onClick={() => openGeneric(t.text)} className="flex w-full gap-4 rounded-2xl bg-surface p-4 text-left">
                <KateAvatar size={40} />
                <div>
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <KateAvatar size={16} /> Kate tip
                  </div>
                  <p className="mt-1 text-[15px] leading-relaxed">{t.text}</p>
                </div>
              </button>
            ))}

          {mode === "coach" && cards.length === 0 && (
            <div className="rounded-2xl bg-surface p-5 text-sm text-muted">You&apos;re all caught up. Kate will reach out when something matters.</div>
          )}
          {mode === "coach" && cards.map((c) => <MomentCard key={c.moment} card={c} onOpen={() => openKate(c.moment, "push")} />)}
        </section>
      </div>
    </div>
  );
}

function AccountCard({ label, value, icon, active }: { label: string; value: number; icon: React.ReactNode; active?: boolean }) {
  return (
    <div className="w-44 shrink-0 overflow-hidden rounded-2xl bg-surface">
      <div className="tile-pattern flex h-28 items-center justify-center text-black">{icon}</div>
      <div className="p-3">
        <div className="text-[15px]">{label}</div>
        <div className="mt-1 text-lg font-semibold tabular-nums">{eur2(value)}</div>
        {active && <div className="mt-2 h-1 rounded-full bg-kbc" />}
      </div>
    </div>
  );
}

function MomentCard({ card, onOpen }: { card: CardView; onOpen: () => void }) {
  const { learn, update, toast } = useStore();
  const [reasons, setReasons] = useState(false);
  const m = MOMENT_BY_ID[card.moment];

  function dismiss(f: Feedback) {
    const { message } = applyFeedback(learn, card.moment, f);
    update((l) => applyFeedback(l, card.moment, f).next);
    toast(message);
    setReasons(false);
  }

  return (
    <div className="rise relative rounded-2xl bg-surface p-4">
      <button type="button" onClick={onOpen} className="flex w-full gap-4 pr-6 text-left">
        <span className="mt-1 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-kbc/15 text-kbc-soft">
          <m.icon size={20} />
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-sm font-semibold">
            <KateAvatar size={16} /> Kate
            {card.badge && <span className="rounded-full bg-kbc/20 px-2 py-0.5 text-[11px] font-medium text-kbc-soft">{card.badge}</span>}
          </div>
          <div className="mt-1 font-semibold">{card.title}</div>
          <p className="mt-0.5 text-[15px] leading-relaxed text-ink/85">{card.body}</p>
        </div>
      </button>
      <button type="button" aria-label="Dismiss" onClick={() => setReasons((r) => !r)} className="absolute right-3 top-3 rounded-full bg-surface-2 p-1 text-muted">
        <X size={14} />
      </button>
      {reasons && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-line pt-3">
          <Sparkles size={14} className="text-kbc-soft" />
          <span className="mr-1 text-xs text-muted">Why hide this?</span>
          {(
            [
              ["not_relevant", "Not relevant"],
              ["too_often", "Too often"],
              ["wrong_moment", "Later"],
            ] as [Feedback, string][]
          ).map(([f, l]) => (
            <button key={f} type="button" onClick={() => dismiss(f)} className="rounded-full border border-line px-3 py-1 text-xs">
              {l}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
