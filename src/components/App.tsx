"use client";

import { useState } from "react";
import { Brain, Layers, List, PiggyBank, Wallet, X } from "lucide-react";
import { useStore } from "@/lib/store";
import { PERSONAS, PERSONA_ORDER } from "@/lib/personas";
import { rank } from "@/lib/engine";
import { MOMENT_BY_ID } from "@/lib/moments";
import { TONE } from "@/lib/tone";
import { inferSegment } from "@/lib/segment";
import type { MomentId, Tab } from "@/lib/types";
import { StartScreen, Header } from "./StartScreen";
import { OfferingsScreen } from "./OfferingsScreen";
import { KateChat, type ChatRequest } from "./KateChat";
import { BrainPanel } from "./BrainPanel";

export function App() {
  const { persona, personaId, setPersona, mode, setMode, learn, toasts } = useStore();
  const [tab, setTab] = useState<Tab>("start");
  const [chat, setChat] = useState<ChatRequest | null>(null);
  const [brainOpen, setBrainOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const cards = mode === "coach" ? rank(persona, learn) : [];

  const openKate = (moment?: MomentId, source: "push" | "ribbon" = "ribbon") => {
    setBellOpen(false);
    setChat({ moment, source: moment ? source : "kate", nonce: Date.now() });
  };
  const openGeneric = (text: string) => setChat({ source: "push", generic: text, nonce: Date.now() });

  function switchPersona(id: typeof personaId) {
    setPersona(id);
    setChat(null);
    setBellOpen(false);
  }

  return (
    <div className="flex min-h-dvh flex-col">
      {/* Demo controls: not part of the product, for judges and the demo video */}
      <div className="sticky top-0 z-40 border-b border-line bg-[#0a0c0d]/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-center gap-2 px-3 py-2 text-xs">
          <span className="hidden font-semibold uppercase tracking-wider text-muted sm:inline">Demo</span>
          <label className="sr-only" htmlFor="persona">
            Persona
          </label>
          <select
            id="persona"
            value={personaId}
            onChange={(e) => switchPersona(e.target.value as typeof personaId)}
            className="rounded-full border border-line bg-surface px-3 py-1.5 sm:hidden"
          >
            {PERSONA_ORDER.map((id) => (
              <option key={id} value={id}>
                {PERSONAS[id].name}, {PERSONAS[id].age}
              </option>
            ))}
          </select>
          <div className="hidden gap-1 sm:flex">
            {PERSONA_ORDER.map((id) => {
              const p = PERSONAS[id];
              const active = id === personaId;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => switchPersona(id)}
                  className={`rounded-full px-3 py-1.5 transition ${active ? "bg-kbc text-black" : "bg-surface text-ink/80 hover:bg-surface-2"}`}
                  title={p.tagline}
                >
                  {p.name}, {p.age} · <span className={active ? "" : "text-muted"}>{segLabel(id)}</span>
                </button>
              );
            })}
          </div>
          <div className="ml-auto flex items-center gap-1 rounded-full bg-surface p-0.5">
            {(["today", "coach"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setMode(m);
                  setChat(null);
                }}
                className={`rounded-full px-3 py-1.5 ${mode === m ? "bg-white text-black" : "text-muted"}`}
              >
                {m === "today" ? "Today's app" : "Moment Coach"}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setBrainOpen((b) => !b)}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 ${brainOpen ? "bg-kbc/20 text-kbc-soft" : "bg-surface"}`}
          >
            <Brain size={14} /> <span className="hidden sm:inline">Kate&apos;s brain</span>
          </button>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-[1500px] flex-1">
        {brainOpen && (
          <aside className="fixed inset-x-0 bottom-0 top-[49px] z-30 overflow-y-auto border-r border-line bg-[#0a0c0d] p-4 lg:static lg:w-[340px] lg:shrink-0">
            <button type="button" onClick={() => setBrainOpen(false)} aria-label="Close panel" className="float-right rounded-full bg-surface p-1.5 lg:hidden">
              <X size={16} />
            </button>
            <BrainPanel />
          </aside>
        )}

        <main className={`relative min-w-0 flex-1 flex-col px-4 pb-4 pt-5 sm:px-6 ${chat ? "hidden lg:flex" : "flex"}`}>
          <div className="@container mx-auto w-full max-w-[980px]">
            {tab === "start" && <StartScreen openKate={openKate} openGeneric={openGeneric} openBell={() => setBellOpen((b) => !b)} />}
            {tab === "offer" && <OfferingsScreen openKate={(m) => openKate(m, "ribbon")} openBell={() => setBellOpen((b) => !b)} badge={cards.length} />}
            {(tab === "mykbc" || tab === "invest") && (
              <div className="space-y-6">
                <Header title={tab === "mykbc" ? "My KBC" : "Investing"} onKate={() => openKate()} onBell={() => setBellOpen((b) => !b)} badge={cards.length} />
                <p className="rounded-2xl bg-surface p-5 text-sm text-muted">Not part of this prototype. Try Start or Offerings.</p>
              </div>
            )}
          </div>

          {bellOpen && (
            <div className="absolute right-4 top-20 z-20 w-[min(360px,calc(100%-2rem))] rounded-2xl border border-line bg-surface p-3 shadow-2xl sm:right-6">
              <div className="mb-2 px-1 text-sm font-semibold">Notifications</div>
              {mode === "today" ? (
                <p className="px-1 pb-2 text-sm text-muted">Your statement for September is ready.</p>
              ) : cards.length === 0 ? (
                <p className="px-1 pb-2 text-sm text-muted">Nothing new.</p>
              ) : (
                cards.map((c) => {
                  const M = MOMENT_BY_ID[c.moment].icon;
                  return (
                    <button key={c.moment} type="button" onClick={() => openKate(c.moment, "push")} className="flex w-full gap-3 rounded-xl p-2 text-left hover:bg-surface-2">
                      <M size={18} className="mt-0.5 shrink-0 text-kbc-soft" />
                      <span>
                        <span className="block text-sm font-medium">{c.title}</span>
                        <span className="line-clamp-2 block text-xs text-muted">{c.body}</span>
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          )}

          <nav className="sticky bottom-4 z-20 mx-auto mt-auto flex w-full max-w-[420px] justify-between rounded-full border border-line bg-surface/95 p-1.5 shadow-2xl backdrop-blur">
            {(
              [
                ["start", "Start", Wallet],
                ["mykbc", "My KBC", List],
                ["invest", "Investing", PiggyBank],
                ["offer", "Offerings", Layers],
              ] as const
            ).map(([id, label, Icon]) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setTab(id);
                  setBellOpen(false);
                }}
                className={`flex flex-1 flex-col items-center gap-0.5 rounded-full py-2 text-xs font-medium ${tab === id ? "bg-surface-2" : "text-ink/80"}`}
              >
                <Icon size={22} strokeWidth={1.6} />
                {label}
              </button>
            ))}
          </nav>
        </main>

        {chat && (
          <aside className="fixed inset-0 z-50 lg:sticky lg:top-[49px] lg:z-10 lg:h-[calc(100dvh-49px)] lg:w-[440px] lg:shrink-0 lg:border-l lg:border-line">
            <KateChat key={chat.nonce} req={chat} onClose={() => setChat(null)} />
          </aside>
        )}
      </div>

      <div aria-live="polite" className="pointer-events-none fixed left-1/2 top-14 z-[60] flex w-[min(420px,calc(100%-1.5rem))] -translate-x-1/2 flex-col gap-2">
        {toasts.map((t) => (
          <div key={t.id} className="rise rounded-xl border border-kbc/40 bg-[#10263a] px-3 py-2 text-[13px] shadow-xl">
            🧠 {t.text}
          </div>
        ))}
      </div>
    </div>
  );
}

function segLabel(id: keyof typeof PERSONAS) {
  return TONE[inferSegment(PERSONAS[id]).segment].label;
}
