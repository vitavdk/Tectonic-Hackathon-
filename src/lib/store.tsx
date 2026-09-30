"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { PERSONAS, PERSONA_ORDER } from "./personas";
import { emptyLearn, log } from "./engine";
import { inferSegment } from "./segment";
import { MOMENTS } from "./moments";
import type { Learn, Mode, Persona, PersonaId, Segment } from "./types";

// Client-only state. Learning data lives in memory and is mirrored to
// localStorage (per browser) so a refresh during the demo keeps what Kate learned.
// Anything read back from storage is validated and whitelisted before use.

const STORAGE_KEY = "moment-coach:v1";
const MOMENT_IDS = new Set<string>(MOMENTS.map((m) => m.id));
const SEGMENTS = new Set<string>(["young", "steady", "home", "senior"]);

interface Toast {
  id: number;
  text: string;
}

interface Store {
  personaId: PersonaId;
  persona: Persona;
  learn: Learn;
  segment: Segment;
  segmentReasons: string[];
  segmentOverridden: boolean;
  mode: Mode;
  toasts: Toast[];
  setPersona: (id: PersonaId) => void;
  setMode: (m: Mode) => void;
  update: (fn: (l: Learn) => Learn) => void;
  note: (text: string) => void;
  toast: (text: string) => void;
  resetPersona: () => void;
}

const Ctx = createContext<Store | null>(null);

type Persisted = { personaId: PersonaId; mode: Mode; learn: Record<PersonaId, Learn> };

function freshAll(): Record<PersonaId, Learn> {
  return Object.fromEntries(PERSONA_ORDER.map((id) => [id, emptyLearn()])) as Record<PersonaId, Learn>;
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);

function pickRecord<T>(raw: unknown, keyOk: (k: string) => boolean, valOk: (v: unknown) => v is T): Record<string, T> {
  const out: Record<string, T> = {};
  if (!isObj(raw)) return out;
  for (const [k, v] of Object.entries(raw).slice(0, 100)) {
    if (k.length <= 64 && keyOk(k) && valOk(v)) out[k] = v;
  }
  return out;
}

const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
const isBool = (v: unknown): v is boolean => typeof v === "boolean";
const oneOf =
  <T extends string>(...opts: T[]) =>
  (v: unknown): v is T =>
    typeof v === "string" && (opts as string[]).includes(v);
const safeStr = (v: unknown, max = 80): string => (typeof v === "string" ? v.slice(0, max) : "");
const anyKey = () => true;

function sanitizeLearn(raw: unknown): Learn {
  const base = emptyLearn();
  if (!isObj(raw)) return base;
  const inMoment = (k: string) => MOMENT_IDS.has(k);
  return {
    weights: pickRecord(raw.weights, inMoment, isNum),
    pushOverride: pickRecord(raw.pushOverride, inMoment, isBool),
    snoozed: pickRecord(raw.snoozed, inMoment, isBool),
    beliefs: pickRecord(raw.beliefs, anyKey, oneOf("confirm", "correct", "irrelevant")),
    segmentOverride: typeof raw.segmentOverride === "string" && SEGMENTS.has(raw.segmentOverride) ? (raw.segmentOverride as Segment) : undefined,
    flags: pickRecord(raw.flags, anyKey, isBool),
    regret: pickRecord(raw.regret, anyKey, oneOf("worth", "meh", "regret")),
    billRules: pickRecord(raw.billRules, anyKey, (v): v is string => typeof v === "string" && v.length <= 40),
    ghost: pickRecord(raw.ghost, anyKey, oneOf("keep", "cancel", "dismiss")),
    goals: Array.isArray(raw.goals)
      ? raw.goals.filter(isObj).slice(0, 5).map((g) => ({
          id: safeStr(g.id, 40),
          name: safeStr(g.name, 40),
          target: isNum(g.target) ? g.target : 0,
          saved: isNum(g.saved) ? g.saved : 0,
          weeksLeft: isNum(g.weeksLeft) ? g.weeksLeft : 0,
          members: Array.isArray(g.members) ? g.members.slice(0, 10).map((m) => safeStr(m, 40)) : [],
        }))
      : [],
    buckets: Array.isArray(raw.buckets)
      ? raw.buckets.filter(isObj).slice(0, 12).map((b) => ({ id: safeStr(b.id, 40), name: safeStr(b.name, 30), amount: isNum(b.amount) ? b.amount : 0 }))
      : undefined,
    incomeChanged: raw.incomeChanged === true,
    completed: Array.isArray(raw.completed) ? raw.completed.filter((m): m is Learn["completed"][number] => typeof m === "string" && MOMENT_IDS.has(m)) : [],
    log: Array.isArray(raw.log)
      ? raw.log.filter(isObj).slice(0, 30).map((e) => ({ at: isNum(e.at) ? e.at : 0, text: safeStr(e.text, 200) }))
      : [],
  };
}

function load(): Persisted | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw || raw.length > 200_000) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isObj(parsed)) return null;
    const personaId = PERSONA_ORDER.includes(parsed.personaId as PersonaId) ? (parsed.personaId as PersonaId) : "lotte";
    const mode: Mode = parsed.mode === "today" ? "today" : "coach";
    const learn = freshAll();
    if (isObj(parsed.learn)) for (const id of PERSONA_ORDER) learn[id] = sanitizeLearn(parsed.learn[id]);
    return { personaId, mode, learn };
  } catch {
    return null;
  }
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<Persisted>({ personaId: "lotte", mode: "coach", learn: freshAll() });
  const [toasts, setToasts] = useState<Toast[]>([]);
  const loaded = useRef(false);
  const toastId = useRef(0);

  useEffect(() => {
    const saved = load();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from storage once after mount
    if (saved) setState(saved);
    loaded.current = true;
  }, []);

  useEffect(() => {
    if (!loaded.current) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* storage unavailable: demo keeps working in memory */
    }
  }, [state]);

  const toast = useCallback((text: string) => {
    const id = ++toastId.current;
    setToasts((t) => [...t, { id, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
  }, []);

  const update = useCallback((fn: (l: Learn) => Learn) => {
    setState((s) => ({ ...s, learn: { ...s.learn, [s.personaId]: fn(s.learn[s.personaId]) } }));
  }, []);

  const note = useCallback((text: string) => update((l) => log(l, text)), [update]);

  const value = useMemo<Store>(() => {
    const persona = PERSONAS[state.personaId];
    const learn = state.learn[state.personaId];
    const seg = inferSegment(persona, learn);
    return {
      personaId: state.personaId,
      persona,
      learn,
      segment: seg.segment,
      segmentReasons: seg.reasons,
      segmentOverridden: seg.overridden,
      mode: state.mode,
      toasts,
      setPersona: (id) => {
        setToasts([]);
        setState((s) => ({ ...s, personaId: id }));
      },
      setMode: (m) => setState((s) => ({ ...s, mode: m })),
      update,
      note,
      toast,
      resetPersona: () => setState((s) => ({ ...s, learn: { ...s.learn, [s.personaId]: emptyLearn() } })),
    };
  }, [state, toasts, update, note, toast]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error("useStore outside StoreProvider");
  return s;
}
