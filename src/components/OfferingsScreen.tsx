"use client";

import { CreditCard, Landmark, Leaf, PiggyBank, Signpost, House, Umbrella, Wallet, MoreHorizontal, Plus, Briefcase } from "lucide-react";
import { useStore } from "@/lib/store";
import { MOMENTS } from "@/lib/moments";
import { momentStatus } from "@/lib/engine";
import type { MomentId } from "@/lib/types";
import { Header } from "./StartScreen";

const STATUS_LABEL = {
  showing: { text: "Push on", cls: "bg-ok/20 text-ok" },
  quiet: { text: "Push on · nothing now", cls: "bg-surface-2 text-muted" },
  snoozed: { text: "Snoozed", cls: "bg-warn/20 text-warn" },
  muted: { text: "Muted by you", cls: "bg-alert/20 text-alert" },
  off: { text: "Push off · tap to use", cls: "bg-surface-2 text-muted" },
} as const;

export function OfferingsScreen({ openKate, openBell, badge }: { openKate: (m?: MomentId, source?: "ribbon") => void; openBell: () => void; badge: number }) {
  const { persona, learn, mode } = useStore();

  return (
    <div className="space-y-7">
      <Header title="Offerings" onKate={() => openKate()} onBell={openBell} badge={badge} />

      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-2xl">Your favourites</h2>
          <MoreHorizontal className="text-muted" />
        </div>
        <div className="mt-4 flex items-center gap-8 pl-2">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-surface-2 text-xs text-muted">Fav</span>
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-ok text-black">
            <Plus size={18} />
          </span>
        </div>
      </section>

      <div className="flex items-center overflow-hidden rounded-2xl bg-[#1d2a36]">
        <div className="flex-1 space-y-4 p-5">
          <p className="text-lg leading-snug">Your own business? It starts with a business account.</p>
          <span className="inline-block rounded-full bg-kbc px-5 py-2 font-medium text-black">Open your account</span>
        </div>
        <div className="flex h-40 w-32 items-center justify-center bg-gradient-to-br from-kbc-deep to-kbc/40 sm:w-48">
          <Briefcase size={48} strokeWidth={1.3} />
        </div>
      </div>

      <section>
        <h2 className="text-2xl">KBC products</h2>
        <div className="no-scrollbar -mx-4 mt-4 flex gap-3 overflow-x-auto px-4">
          {[
            ["Accounts", Wallet],
            ["Payment methods", CreditCard],
            ["Savings & investing", PiggyBank],
            ["Loans", Landmark],
            ["Insurance", Umbrella],
          ].map(([label, Icon]) => {
            const I = Icon as typeof Wallet;
            return (
              <div key={label as string} className="flex h-32 w-32 shrink-0 flex-col items-center justify-center gap-3 rounded-2xl bg-surface text-center">
                <I size={40} strokeWidth={1.4} className="text-kbc" />
                <span className="px-2 text-sm leading-tight">{label as string}</span>
              </div>
            );
          })}
        </div>
      </section>

      {mode === "coach" && (
        <section>
          <div className="flex items-baseline justify-between">
            <h2 className="text-2xl">Moments by Kate</h2>
            <span className="rounded-full bg-kbc/20 px-2 py-0.5 text-xs text-kbc-soft">New</span>
          </div>
          <p className="mt-1 text-sm text-muted">Every Moment is available to everyone. Pushes depend on your profile and your feedback.</p>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {MOMENTS.map((m) => {
              const st = STATUS_LABEL[momentStatus(persona, learn, m.id)];
              return (
                <button key={m.id} type="button" onClick={() => openKate(m.id, "ribbon")} className="flex flex-col items-start gap-2 rounded-2xl bg-surface p-4 text-left transition hover:bg-surface-2">
                  <m.icon size={28} strokeWidth={1.6} className="text-kbc" />
                  <span className="font-medium leading-tight">{m.name}</span>
                  <span className="text-xs leading-snug text-muted">{m.blurb}</span>
                  <span className={`mt-auto rounded-full px-2 py-0.5 text-[11px] ${st.cls}`}>{st.text}</span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      <section>
        <div className="flex items-baseline justify-between">
          <h2 className="text-2xl">Themes</h2>
          <span className="text-sm font-semibold text-kbc">Show all</span>
        </div>
        <div className="no-scrollbar -mx-4 mt-4 flex gap-3 overflow-x-auto px-4">
          {[
            ["MyMobility", Signpost, "from-[#1d4e9e] to-[#4f86d6]"],
            ["MyHome", House, "from-[#0f6fc0] to-[#2aa4e6]"],
            ["Greener together", Leaf, "from-[#1e9b4b] to-[#3cc46b]"],
            ["Peace of mind", Umbrella, "from-[#c79a00] to-[#f2c230]"],
          ].map(([label, Icon, grad]) => {
            const I = Icon as typeof Wallet;
            return (
              <div key={label as string} className="flex h-36 w-32 shrink-0 flex-col items-center justify-center gap-3 rounded-2xl bg-surface">
                <span className={`inline-flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${grad as string}`}>
                  <I size={28} className="text-white" />
                </span>
                <span className="px-2 text-center text-sm">{label as string}</span>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
