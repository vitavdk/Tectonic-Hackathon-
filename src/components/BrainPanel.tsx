"use client";

import { Brain, RotateCcw } from "lucide-react";
import { useStore } from "@/lib/store";
import { MOMENTS } from "@/lib/moments";
import { momentStatus, MUTE_AT, pushOn } from "@/lib/engine";
import { TONE } from "@/lib/tone";

// "Segment of one" view for judges: shows the three personalization layers live.

const STATUS_CLS = {
  showing: "text-ok",
  quiet: "text-muted",
  snoozed: "text-warn",
  muted: "text-alert",
  off: "text-muted",
} as const;

export function BrainPanel() {
  const { persona, learn, segment, segmentReasons, segmentOverridden, update, resetPersona } = useStore();
  const tone = TONE[segment];

  return (
    <div className="space-y-5 text-sm">
      <div className="flex items-center gap-2">
        <Brain size={18} className="text-kbc-soft" />
        <h2 className="font-semibold">What Kate knows about {persona.name}</h2>
      </div>

      <section className="rounded-xl bg-surface p-3">
        <div className="text-[11px] uppercase tracking-wider text-muted">1 · Who (segment default)</div>
        <div className="mt-1 font-semibold">
          {tone.label} {segmentOverridden && <span className="ml-1 rounded bg-warn/20 px-1.5 text-[11px] text-warn">corrected by customer</span>}
        </div>
        <ul className="mt-1 list-disc pl-4 text-xs text-muted">
          {segmentReasons.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl bg-surface p-3">
        <div className="text-[11px] uppercase tracking-wider text-muted">2 · How (Kate&apos;s voice)</div>
        <div className="mt-1">{tone.voice}</div>
        {tone.confirmTwice && <div className="mt-1 text-xs text-warn">Extra confirmation before money moves.</div>}
      </section>

      <section className="rounded-xl bg-surface p-3">
        <div className="text-[11px] uppercase tracking-wider text-muted">3 · Learn (weights from feedback)</div>
        <div className="mt-2 space-y-2">
          {MOMENTS.map((m) => {
            const w = learn.weights[m.id] ?? 0;
            const st = momentStatus(persona, learn, m.id);
            const on = pushOn(m.id, segment, learn);
            return (
              <div key={m.id}>
                <div className="flex items-center justify-between text-xs">
                  <span className="truncate">
                    {m.name}
                    {learn.pushOverride[m.id] !== undefined && <span className="ml-1 text-kbc-soft">(set by customer)</span>}
                  </span>
                  <span className={`${STATUS_CLS[st]} shrink-0`}>
                    {on ? st : "push off"}
                    {st === "snoozed" && (
                      <button
                        type="button"
                        className="ml-1 underline"
                        onClick={() => update((l) => ({ ...l, snoozed: { ...l.snoozed, [m.id]: false } }))}
                      >
                        wake
                      </button>
                    )}
                  </span>
                </div>
                {/* diverging bar: centre = neutral, left = learned down, right = learned up */}
                <div className="relative mt-1 h-1.5 rounded-full bg-surface-2">
                  <div className="absolute left-1/2 top-[-2px] h-2.5 w-px bg-muted/60" />
                  <div
                    className={`absolute top-0 h-full rounded-full transition-all duration-500 ${w >= 0 ? "bg-ok" : w <= MUTE_AT ? "bg-alert" : "bg-warn"}`}
                    style={w >= 0 ? { left: "50%", width: `${(w / 1.5) * 50}%` } : { right: "50%", width: `${(-w / 1.5) * 50}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-2 flex justify-between text-[10px] text-muted">
          <span>← shown less / muted</span>
          <span>shown more →</span>
        </div>
      </section>

      <section className="rounded-xl bg-surface p-3">
        <div className="text-[11px] uppercase tracking-wider text-muted">Learning log</div>
        {learn.log.length === 0 ? (
          <p className="mt-1 text-xs text-muted">Nothing learned yet. Give feedback on a For you card.</p>
        ) : (
          <ul className="mt-1 space-y-1 text-xs">
            {learn.log.slice(0, 8).map((e, i) => (
              <li key={`${e.at}-${i}`} className="rise text-ink/85">
                • {e.text}
              </li>
            ))}
          </ul>
        )}
      </section>

      <button type="button" onClick={resetPersona} className="inline-flex items-center gap-2 text-xs text-muted hover:text-ink">
        <RotateCcw size={14} /> Reset what Kate learned about {persona.name}
      </button>
    </div>
  );
}
