"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { log } from "@/lib/engine";
import { say } from "@/lib/tone";
import { eur } from "@/lib/format";
import { Bar, Chips, KateMsg, Panel, Primary, UserMsg } from "../ui";
import type { FlowProps } from "./types";

export function GoalsFlow({ onDone }: FlowProps) {
  const { persona, segment, learn, update, toast } = useStore();
  const existing = learn.goals[0];
  const [name, setName] = useState(learn.flags.sabbatical ? "Sabbatical" : segment === "young" ? "Ibiza with friends" : "Family holiday");
  const [target, setTarget] = useState(learn.flags.sabbatical ? 12000 : 1600);
  const [weeks, setWeeks] = useState(learn.flags.sabbatical ? 52 : 12);
  const [members, setMembers] = useState<string[]>(segment === "young" ? persona.contacts.map((c) => c.name) : []);
  const [nudged, setNudged] = useState(false);

  function create() {
    const clean = name.trim().replace(/[^\p{L}\p{N} &'!-]/gu, "").slice(0, 40) || "My goal";
    const t = Math.max(50, Math.min(100000, Math.round(target)));
    const w = Math.max(1, Math.min(260, Math.round(weeks)));
    const goal = { id: `g-${Date.now()}`, name: clean, target: t, saved: Math.round(t * 0.4), weeksLeft: w, members: ["Me", ...members] };
    update((l) => log({ ...l, goals: [goal] }, `Goal created: ${clean} (${eur(t)} in ${w} weeks, ${goal.members.length} people)`));
    onDone();
  }

  if (existing) {
    const pct = Math.round((existing.saved / existing.target) * 100);
    const perWeek = Math.ceil((existing.target - existing.saved) / Math.max(1, existing.weeksLeft) / existing.members.length);
    return (
      <>
        <KateMsg>
          <p>
            {say(segment, {
              young: `${existing.name} is at ${pct}% 🎯 That's ${eur(perWeek)} per person per week to make it.`,
              all: `${existing.name}: ${pct}% saved. To reach it in time, that's ${eur(perWeek)} per person per week.`,
            })}
          </p>
        </KateMsg>
        <Panel className="space-y-3">
          <div className="flex justify-between text-sm">
            <span>{existing.name}</span>
            <span className="tabular-nums text-muted">
              {eur(existing.saved)} / {eur(existing.target)}
            </span>
          </div>
          <Bar value={existing.saved} max={existing.target} tone="ok" />
          <div className="flex flex-wrap gap-1.5">
            {existing.members.map((m, i) => (
              <span key={m} className={`rounded-full px-2.5 py-1 text-xs ${i === 2 ? "bg-warn/20 text-warn" : "bg-surface-2"}`}>
                {m} {i === 2 ? "· not this month" : "✓"}
              </span>
            ))}
          </div>
        </Panel>
        {!nudged && existing.members.length > 2 && (
          <Chips
            options={[{ label: `Nudge ${existing.members[2]}`, value: "n" }]}
            onPick={() => {
              setNudged(true);
              toast(`Friendly reminder sent to ${existing.members[2]}.`);
              onDone();
            }}
          />
        )}
        {nudged && <UserMsg>Nudge {existing.members[2]}</UserMsg>}
      </>
    );
  }

  return (
    <>
      <KateMsg>
        <p>
          {say(segment, {
            young: "Let's make a shared pot 🏝️ Pick an amount and a deadline, and invite the squad.",
            all: "Set an amount and a deadline. You can invite others to contribute and I'll track progress for everyone.",
          })}
        </p>
      </KateMsg>
      <Panel className="space-y-3">
        <label className="block text-xs text-muted">
          Goal
          <input value={name} maxLength={40} onChange={(e) => setName(e.target.value)} className="mt-1 w-full rounded-lg bg-surface-2 px-3 py-2 text-sm text-ink outline-none focus:ring-1 focus:ring-kbc" />
        </label>
        <div className="flex gap-3">
          <label className="block flex-1 text-xs text-muted">
            Amount (€)
            <input
              inputMode="numeric"
              value={target}
              onChange={(e) => setTarget(Number(e.target.value.replace(/[^\d]/g, "")) || 0)}
              className="mt-1 w-full rounded-lg bg-surface-2 px-3 py-2 text-sm text-ink tabular-nums outline-none focus:ring-1 focus:ring-kbc"
            />
          </label>
          <label className="block flex-1 text-xs text-muted">
            Weeks
            <input
              inputMode="numeric"
              value={weeks}
              onChange={(e) => setWeeks(Number(e.target.value.replace(/[^\d]/g, "")) || 0)}
              className="mt-1 w-full rounded-lg bg-surface-2 px-3 py-2 text-sm text-ink tabular-nums outline-none focus:ring-1 focus:ring-kbc"
            />
          </label>
        </div>
        <div>
          <div className="mb-1 text-xs text-muted">Invite</div>
          <div className="flex flex-wrap gap-1.5">
            {persona.contacts.map((c) => {
              const on = members.includes(c.name);
              return (
                <button
                  key={c.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setMembers((m) => (on ? m.filter((x) => x !== c.name) : [...m, c.name]))}
                  className={`rounded-full px-3 py-1 text-xs ${on ? "bg-kbc text-black" : "bg-surface-2 text-muted"}`}
                >
                  {c.name}
                </button>
              );
            })}
          </div>
        </div>
        <Primary onClick={create}>Create goal</Primary>
      </Panel>
    </>
  );
}
