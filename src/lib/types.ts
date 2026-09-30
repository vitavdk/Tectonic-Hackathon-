// Core domain types for the Moment Coach prototype.
// Everything is mocked: no real bank data, no real payments.

export type Segment = "young" | "steady" | "home" | "senior";

export type PersonaId = "lotte" | "tom" | "sofie" | "marc";

export type MomentId =
  | "split"
  | "idle"
  | "ghost"
  | "goals"
  | "regret"
  | "payday"
  | "guardian"
  | "glassbox";

export type Tab = "start" | "mykbc" | "invest" | "offer";

export type Mode = "today" | "coach";

export interface Tx {
  id: string;
  date: string; // display date, e.g. "29/09"
  label: string;
  amount: number; // negative = outgoing
  category:
    | "restaurant"
    | "delivery"
    | "groceries"
    | "subscription"
    | "salary"
    | "allowance"
    | "pension"
    | "transfer"
    | "shopping"
    | "betting"
    | "mortgage"
    | "utilities"
    | "transport"
    | "school"
    | "diy"
    | "other";
}

export interface Contact {
  id: string;
  name: string;
  iban: string; // fake but checksum-valid Belgian IBANs
}

export interface Subscription {
  id: string;
  name: string;
  monthly: number;
  signal: string; // why Kate flags it
}

export interface BeliefOption {
  label: string;
  kind: "confirm" | "correct" | "irrelevant";
  effect?: {
    weights?: Partial<Record<MomentId, number>>;
    segmentOverride?: Segment;
    flags?: Record<string, boolean>;
  };
  kateReply: string;
}

export interface Belief {
  id: string;
  statement: string;
  confidence: number; // 0..1
  signals: string[];
  options: BeliefOption[];
}

export interface Bucket {
  id: string;
  name: string;
  amount: number;
}

export interface Persona {
  id: PersonaId;
  name: string;
  fullName: string;
  age: number;
  city: string;
  tagline: string;
  accounts: { current: number; savings: number };
  income: { type: "salary" | "allowance" | "pension"; amount: number; source: string; day: number };
  hasMortgage: boolean;
  monthlySpend: number;
  tx: Tx[];
  contacts: Contact[];
  subscriptions: Subscription[];
  beliefs: Belief[];
  defaultBuckets: Bucket[];
}

export type Feedback = "useful" | "not_useful" | "not_relevant" | "too_often" | "wrong_moment";

export interface LogEntry {
  at: number;
  text: string;
}

export interface Goal {
  id: string;
  name: string;
  target: number;
  saved: number;
  weeksLeft: number;
  members: string[];
}

export interface Learn {
  weights: Partial<Record<MomentId, number>>;
  pushOverride: Partial<Record<MomentId, boolean>>;
  snoozed: Partial<Record<MomentId, boolean>>;
  beliefs: Record<string, "confirm" | "correct" | "irrelevant">;
  segmentOverride?: Segment;
  flags: Record<string, boolean>;
  regret: Record<string, "worth" | "meh" | "regret">;
  billRules: Record<string, string>;
  ghost: Record<string, "keep" | "cancel" | "dismiss">;
  goals: Goal[];
  buckets?: Bucket[];
  incomeChanged?: boolean;
  completed: MomentId[];
  log: LogEntry[];
}

export interface CardView {
  moment: MomentId;
  title: string;
  body: string;
  score: number;
  badge?: string;
}
