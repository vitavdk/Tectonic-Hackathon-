import type { LucideIcon } from "lucide-react";
import { Eye, Ghost, PiggyBank, Receipt, ShieldCheck, Target, ThumbsUp, CalendarClock } from "lucide-react";
import { say } from "./tone";
import { eur } from "./format";
import type { Learn, MomentId, Persona, Segment } from "./types";

// Every moment is a plug-in: one config object with a trigger, default push
// settings per segment, and tone-aware card copy. Adding a new moment for
// 2.3M customers = adding one entry here. No new screens, no new pipeline.

export interface Trigger {
  title: string;
  body: string;
  urgency: number; // 0..1, added to base priority
  badge?: string;
}

export interface MomentDef {
  id: MomentId;
  name: string;
  short: string;
  icon: LucideIcon;
  blurb: string;
  basePriority: number;
  defaults: Record<Segment, boolean>;
  signals: string;
  trigger: (p: Persona, l: Learn, seg: Segment) => Trigger | null;
}

export function idleSurplus(p: Persona) {
  return Math.max(0, Math.round((p.accounts.current - p.monthlySpend * 1.5) / 50) * 50);
}

export function ghostOpen(p: Persona, l: Learn) {
  return p.subscriptions.filter((s) => !l.ghost[s.id]);
}

export function regretCandidates(p: Persona, l: Learn) {
  return p.tx.filter((t) => ["delivery", "shopping", "restaurant"].includes(t.category) && t.amount < 0 && !l.regret[t.id]);
}

export const MOMENTS: MomentDef[] = [
  {
    id: "split",
    name: "Split the bill",
    short: "Split",
    icon: Receipt,
    blurb: "Big restaurant bill? Snap the receipt and send payment requests.",
    basePriority: 0.6,
    defaults: { young: true, steady: false, home: false, senior: false },
    signals: "Restaurant payment > €60 followed by repayments from friends",
    trigger: (p, l, seg) => {
      const bill = p.tx.find((t) => t.category === "restaurant" && t.amount < -60);
      if (!bill || l.completed.includes("split")) return null;
      return {
        title: say(seg, { young: "Big night out? 🍕", adult: "Split last night's dinner?", senior: "Share the cost of your meal?" }),
        body: say(seg, {
          young: `${eur(-bill.amount)} at ${titleCase(bill.label)}. Snap the receipt and I'll split it with your friends.`,
          adult: `${eur(-bill.amount)} at ${titleCase(bill.label)}. Upload the receipt and send payment requests in one go.`,
          senior: `You paid ${eur(-bill.amount)} at ${titleCase(bill.label)}. I can help you ask others for their share.`,
        }),
        urgency: 0.35,
        badge: "Just now",
      };
    },
  },
  {
    id: "idle",
    name: "Idle cash",
    short: "Idle cash",
    icon: PiggyBank,
    blurb: "Money sitting still above your buffer? Give it a job.",
    basePriority: 0.45,
    defaults: { young: false, steady: true, home: true, senior: false },
    signals: "Current account balance > 1.5× monthly spending for 60+ days",
    trigger: (p, l, seg) => {
      const s = idleSurplus(p);
      if (s < 500 || l.completed.includes("idle")) return null;
      const house = l.flags.houseGoal;
      return {
        title: say(seg, { young: "Spare cash alert 💸", steady: "Your money is sitting still", home: "Room to strengthen your buffer", senior: "Money you are not using" }),
        body: say(seg, {
          young: `${eur(s)} is just chilling on your account. Want it to earn something?`,
          steady: house
            ? `${eur(s)} above your buffer. Park it safely towards your future deposit?`
            : `${eur(s)} above a healthy buffer for 2 months. Savings or a small investment plan?`,
          home: `${eur(s)} above your household buffer. Keep it for the home, or put part of it to work?`,
          senior: `You have ${eur(s)} more than you usually need. There is no rush. Shall I show calm options?`,
        }),
        urgency: 0.15,
      };
    },
  },
  {
    id: "ghost",
    name: "Ghost subscriptions",
    short: "Subscriptions",
    icon: Ghost,
    blurb: "Find subscriptions you forgot about and what they cost per year.",
    basePriority: 0.5,
    defaults: { young: true, steady: true, home: true, senior: true },
    signals: "Recurring card payments, price changes, duplicates, trials turned paid",
    trigger: (p, l, seg) => {
      const open = ghostOpen(p, l);
      if (open.length === 0) return null;
      const yearly = open.reduce((a, s) => a + s.monthly * 12, 0);
      return {
        title: say(seg, { young: "👻 Ghost subscriptions spotted", adult: `${open.length} subscriptions to review`, senior: "Your regular payments" }),
        body: say(seg, {
          young: `${open.length} subs cost you ${eur(yearly)} a year. Still using all of them?`,
          adult: `Together ${eur(yearly)} per year. A few look unused or doubled.`,
          senior: `You pay ${eur(yearly)} per year for ${open.length} services. Shall we look at them together?`,
        }),
        urgency: 0.1,
      };
    },
  },
  {
    id: "goals",
    name: "Collaborative goals",
    short: "Goals",
    icon: Target,
    blurb: "Save together: set an amount and deadline, invite people, track progress.",
    basePriority: 0.4,
    defaults: { young: true, steady: false, home: false, senior: false },
    signals: "Labelled savings transfers, frequent money exchanges within a group",
    trigger: (p, l, seg) => {
      const g = l.goals[0];
      if (g) {
        const pct = Math.round((g.saved / g.target) * 100);
        return {
          title: say(seg, { young: `${g.name}: ${pct}% there 🎯`, all: `${g.name}: ${pct}% saved` }),
          body: say(seg, {
            young: `${eur(g.saved)} of ${eur(g.target)}, ${g.weeksLeft} weeks to go. ${g.members.length > 1 ? "Nudge the group?" : "Keep it up!"}`,
            all: `${eur(g.saved)} of ${eur(g.target)} with ${g.weeksLeft} weeks left.`,
          }),
          urgency: 0.2,
          badge: "Goal",
        };
      }
      if (l.flags.sabbatical) {
        return { title: "Plan your sabbatical", body: "Set an amount and a date. I'll tell you what to save per month.", urgency: 0.25 };
      }
      return {
        title: say(seg, { young: "Saving for something with friends? 🏝️", all: "Save towards something together" }),
        body: say(seg, { young: "Make a shared pot, set a deadline, and I'll keep everyone on track.", all: "Create a shared goal and invite others to contribute." }),
        urgency: 0.05,
      };
    },
  },
  {
    id: "regret",
    name: "Regret scoring",
    short: "Worth it?",
    icon: ThumbsUp,
    blurb: "Rate recent spending: was it worth it? Kate learns your real priorities.",
    basePriority: 0.35,
    defaults: { young: true, steady: false, home: false, senior: false },
    signals: "Discretionary payments in the last 7 days",
    trigger: (p, l, seg) => {
      const regrets = Object.values(l.regret).filter((v) => v === "regret").length;
      const cands = regretCandidates(p, l);
      if (regrets >= 2) {
        return {
          title: say(seg, { young: "Friday heads-up 🛵", all: "A heads-up before the weekend" }),
          body: say(seg, {
            young: `You said ${regrets} recent buys weren't worth it. Want a gentle ping before you order tonight?`,
            all: `You rated ${regrets} payments as not worth it. Want a reminder before similar spending?`,
          }),
          urgency: 0.3,
          badge: "Learned",
        };
      }
      if (cands.length === 0) return null;
      return {
        title: say(seg, { young: "Quick one: worth it? 🤔", all: "Was it worth it?" }),
        body: say(seg, {
          young: `${cands.length} recent buys. Tap 👍 or 👎, takes 10 seconds.`,
          all: `Rate ${cands.length} recent payments so I learn what matters to you.`,
        }),
        urgency: 0.1,
      };
    },
  },
  {
    id: "payday",
    name: "Payday allocator",
    short: "Payday",
    icon: CalendarClock,
    blurb: "When income lands, give every euro a job. Weekly check-ins included.",
    basePriority: 0.55,
    defaults: { young: false, steady: true, home: true, senior: false },
    signals: "Salary credit detected, employer or amount change",
    trigger: (p, l, seg) => {
      if (l.incomeChanged) {
        return {
          title: "Your income changed",
          body: say(seg, { adult: "New salary detected. Want me to rebalance your buckets?", all: "Your income changed. Shall I update your plan?" }),
          urgency: 0.45,
          badge: "New",
        };
      }
      if (l.buckets) {
        return {
          title: say(seg, { young: "Week 2 check-in 📊", all: "Week 2 check-in" }),
          body: say(seg, { all: "Groceries on track, Fun & eating out at 78%. Tap for your weekly overview." }),
          urgency: 0.15,
        };
      }
      return {
        title: say(seg, { young: "Money in! 💰", adult: "Salary received: plan your month", senior: "Your income has arrived" }),
        body: say(seg, {
          young: `${eur(p.income.amount)} just landed. Split it into buckets before it disappears?`,
          adult: `${eur(p.income.amount)} from ${p.income.source}. Give every euro a job in 30 seconds.`,
          senior: `${eur(p.income.amount)} has arrived. Would you like a simple plan for this month?`,
        }),
        urgency: 0.3,
      };
    },
  },
  {
    id: "guardian",
    name: "Quiet Guardian",
    short: "Guardian",
    icon: ShieldCheck,
    blurb: "Early warnings before money trouble or fraud: buffer, gambling, missing income, scams.",
    basePriority: 0.7,
    // Review improvement: on for students too (gambling & low-buffer risk).
    defaults: { young: true, steady: true, home: true, senior: true },
    signals: "Betting trend, spending creep, missing salary, new payee + urgency (scam)",
    trigger: (p, l, seg) => {
      if (l.completed.includes("guardian")) return null;
      switch (p.id) {
        case "lotte":
          return {
            title: say(seg, { all: "Can we talk about betting? 💬" }),
            body: "Betting went €15 → €80 → €120 over 3 weeks. No judgement, just want to check in.",
            urgency: 0.2,
          };
        case "tom":
          return {
            title: "Spending creep",
            body: "You spent 28% more than usual three months in a row. Want a quick look at why?",
            urgency: 0.05,
          };
        case "sofie":
          return {
            title: "Your salary hasn't arrived",
            body: "UZ Health Campus usually pays on the 25th. It's the 30th. Is everything okay?",
            urgency: 0.35,
            badge: "Important",
          };
        case "marc":
          return {
            title: "Payment on hold: please check",
            body: "A €2,400 transfer to a new account called 'KBC Secure Account' is waiting. KBC never asks you to move money.",
            urgency: 0.6,
            badge: "Protected",
          };
      }
    },
  },
  {
    id: "glassbox",
    name: "Glass Box Profile",
    short: "What KBC thinks",
    icon: Eye,
    blurb: "See what KBC thinks it knows about you, and correct it.",
    basePriority: 0.3,
    defaults: { young: true, steady: true, home: true, senior: true },
    signals: "All of the above, made visible and correctable",
    trigger: (p, l, seg) => {
      const open = p.beliefs.filter((b) => !l.beliefs[b.id]);
      if (open.length === 0) return null;
      return {
        title: say(seg, { young: "Is this you? 👀", all: "Is this still right?", senior: "Please check what we know" }),
        body: say(seg, {
          young: `"${open[0].statement}" Tap to confirm or fix it.`,
          all: `We think: "${open[0].statement}" You decide if it's right.`,
          senior: `We think: "${open[0].statement}" Tell us if this is right.`,
        }),
        urgency: 0.05,
      };
    },
  },
];

export const MOMENT_BY_ID = Object.fromEntries(MOMENTS.map((m) => [m.id, m])) as Record<MomentId, MomentDef>;

function titleCase(s: string) {
  return s
    .toLowerCase()
    .split(" ")
    .map((w) => (w.length > 2 ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}
