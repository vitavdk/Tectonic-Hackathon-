import type { Persona, PersonaId } from "./types";

// Four fully fictional demo customers. Names, IBANs and transactions are invented.
// IBANs are checksum-valid test numbers that do not belong to real accounts.

export const PERSONAS: Record<PersonaId, Persona> = {
  lotte: {
    id: "lotte",
    name: "Lotte",
    fullName: "Lotte Janssens",
    age: 22,
    city: "Ghent",
    tagline: "Master's student with a weekend job",
    accounts: { current: 412.3, savings: 1150 },
    income: { type: "allowance", amount: 650, source: "Parents + student job", day: 1 },
    hasMortgage: false,
    monthlySpend: 780,
    tx: [
      { id: "l1", date: "29/09", label: "PIZZERIA DA MARIO GENT", amount: -128.4, category: "restaurant" },
      { id: "l2", date: "28/09", label: "Deliveroo", amount: -23.9, category: "delivery" },
      { id: "l3", date: "27/09", label: "BETZONE ONLINE", amount: -40, category: "betting" },
      { id: "l4", date: "26/09", label: "Zalando", amount: -64.99, category: "shopping" },
      { id: "l5", date: "25/09", label: "Spotify", amount: -11.99, category: "subscription" },
      { id: "l6", date: "25/09", label: "Uber Eats", amount: -19.5, category: "delivery" },
      { id: "l7", date: "20/09", label: "BETZONE ONLINE", amount: -80, category: "betting" },
      { id: "l8", date: "15/09", label: "Student job - Café Kouter", amount: 240, category: "allowance" },
    ],
    contacts: [
      { id: "emma", name: "Emma", iban: "BE42594285957554" },
      { id: "noah", name: "Noah", iban: "BE80379574228877" },
      { id: "sara", name: "Sara", iban: "BE76330159569195" },
    ],
    subscriptions: [
      { id: "spotify", name: "Spotify", monthly: 11.99, signal: "Price went up from €10.99 in August" },
      { id: "netflix", name: "Netflix", monthly: 13.49, signal: "You also pay for Disney+: two video services" },
      { id: "disney", name: "Disney+", monthly: 9.99, signal: "Free trial turned paid 2 months ago" },
      { id: "fitapp", name: "FitCoach Pro app", monthly: 7.99, signal: "Paid for 5 months, no other fitness spend" },
    ],
    beliefs: [
      {
        id: "l-student",
        statement: "You're a student living on an allowance and a weekend job.",
        confidence: 0.86,
        signals: ["Monthly transfer from parents", "Small irregular wage from Café Kouter", "Age 22"],
        options: [
          { label: "That's right", kind: "confirm", kateReply: "Great, I'll keep things simple and student-friendly 🙌" },
          {
            label: "I just started my first job",
            kind: "correct",
            effect: { segmentOverride: "steady", weights: { payday: 0.6 } },
            kateReply:
              "Congrats on the new job! 🎉 I'll switch to payday planning and a more grown-up money mix. Check the For you tab.",
          },
        ],
      },
      {
        id: "l-trip",
        statement: "You seem to be saving up for a trip with friends.",
        confidence: 0.64,
        signals: ["Savings transfers labelled 'Ibiza'", "Friends Emma, Noah, Sara pay you back often"],
        options: [
          {
            label: "Yes!",
            kind: "confirm",
            effect: { weights: { goals: 0.5 } },
            kateReply: "Nice! I'll push a shared goal so the whole group can chip in 🏝️",
          },
          {
            label: "No, not really",
            kind: "correct",
            effect: { weights: { goals: -1 } },
            kateReply: "Got it. I'll stop suggesting group goals for now.",
          },
        ],
      },
      {
        id: "l-eatout",
        statement: "You often eat out in groups and pay for everyone.",
        confidence: 0.78,
        signals: ["4 restaurant bills over €80 this quarter", "Transfers back from friends afterwards"],
        options: [
          { label: "Guilty 😅", kind: "confirm", effect: { weights: { split: 0.4 } }, kateReply: "Then I'll offer to split the bill right after dinner." },
          { label: "Not relevant", kind: "irrelevant", effect: { weights: { split: -0.6 } }, kateReply: "Okay, fewer split-the-bill nudges from me." },
        ],
      },
    ],
    defaultBuckets: [
      { id: "rent", name: "Rent (kot)", amount: 380 },
      { id: "food", name: "Groceries", amount: 150 },
      { id: "fun", name: "Going out", amount: 80 },
      { id: "save", name: "Savings", amount: 40 },
    ],
  },

  tom: {
    id: "tom",
    name: "Tom",
    fullName: "Tom Maes",
    age: 31,
    city: "Mechelen",
    tagline: "IT consultant, rents an apartment",
    accounts: { current: 6240.55, savings: 8900 },
    income: { type: "salary", amount: 2850, source: "Acme Digital NV", day: 25 },
    hasMortgage: false,
    monthlySpend: 1950,
    tx: [
      { id: "t1", date: "29/09", label: "Colruyt Mechelen", amount: -86.4, category: "groceries" },
      { id: "t2", date: "28/09", label: "Brasserie Den Grooten Wolsack", amount: -142.6, category: "restaurant" },
      { id: "t3", date: "26/09", label: "PAYPAL *HX8392", amount: -42, category: "other" },
      { id: "t4", date: "25/09", label: "Salary Acme Digital NV", amount: 2850, category: "salary" },
      { id: "t5", date: "24/09", label: "Rent - Immo Dijle", amount: -950, category: "other" },
      { id: "t6", date: "22/09", label: "Basic-Fit", amount: -29.99, category: "subscription" },
      { id: "t7", date: "20/09", label: "NMBS/SNCB", amount: -63, category: "transport" },
    ],
    contacts: [
      { id: "jonas", name: "Jonas", iban: "BE18317941989365" },
      { id: "ines", name: "Ines", iban: "BE36116104264881" },
    ],
    subscriptions: [
      { id: "gym", name: "Basic-Fit", monthly: 29.99, signal: "No payments near a gym since June" },
      { id: "netflix", name: "Netflix", monthly: 17.99, signal: "Premium plan, one other video service" },
      { id: "prime", name: "Amazon Prime", monthly: 5.99, signal: "No Amazon orders in 4 months" },
      { id: "cloud", name: "CloudDrive 2 TB", monthly: 9.99, signal: "Two cloud storage plans" },
      { id: "cloud2", name: "PhotoVault 200 GB", monthly: 2.99, signal: "Overlaps with CloudDrive" },
    ],
    beliefs: [
      {
        id: "t-house",
        statement: "You might be saving to buy a home.",
        confidence: 0.58,
        signals: ["Savings grew 6 months in a row", "Rent rose twice in 2 years", "Age 31, stable salary"],
        options: [
          {
            label: "Yes, that's the plan",
            kind: "confirm",
            effect: { flags: { houseGoal: true }, weights: { idle: 0.4 } },
            kateReply: "Then I'll frame spare cash around your future deposit and keep it safe rather than risky.",
          },
          {
            label: "No, I'm saving for a sabbatical",
            kind: "correct",
            effect: { flags: { houseGoal: false, sabbatical: true }, weights: { goals: 0.8 } },
            kateReply: "A sabbatical, nice. I'll suggest a dedicated goal and a timeline instead of mortgage stuff.",
          },
        ],
      },
      {
        id: "t-single",
        statement: "You manage your money on your own (no shared household account).",
        confidence: 0.81,
        signals: ["No joint account", "Rent paid alone"],
        options: [
          { label: "Correct", kind: "confirm", kateReply: "Thanks, noted." },
          { label: "I share costs with my partner", kind: "correct", effect: { weights: { split: 0.6 } }, kateReply: "Good to know. I'll offer easy cost-splitting with your partner." },
        ],
      },
    ],
    defaultBuckets: [
      { id: "rent", name: "Rent", amount: 950 },
      { id: "food", name: "Groceries", amount: 380 },
      { id: "move", name: "Transport", amount: 150 },
      { id: "fun", name: "Fun & eating out", amount: 350 },
      { id: "save", name: "Savings", amount: 600 },
      { id: "buffer", name: "Buffer", amount: 420 },
    ],
  },

  sofie: {
    id: "sofie",
    name: "Sofie",
    fullName: "Sofie Peeters",
    age: 42,
    city: "Leuven",
    tagline: "Nurse, two kids, recently moved house",
    accounts: { current: 9870.2, savings: 21400 },
    income: { type: "salary", amount: 3900, source: "UZ Health Campus", day: 25 },
    hasMortgage: true,
    monthlySpend: 3350,
    tx: [
      { id: "s1", date: "29/09", label: "Brico Leuven", amount: -312.45, category: "diy" },
      { id: "s2", date: "28/09", label: "Delhaize Kessel-Lo", amount: -164.2, category: "groceries" },
      { id: "s3", date: "27/09", label: "Sint-Pieterscollege - school trip", amount: -95, category: "school" },
      { id: "s4", date: "26/09", label: "Mortgage instalment", amount: -1180, category: "mortgage" },
      { id: "s5", date: "24/09", label: "Engie", amount: -214, category: "utilities" },
      { id: "s6", date: "22/09", label: "PAYPAL *HX8392", amount: -42, category: "other" },
      { id: "s7", date: "25/08", label: "Salary UZ Health Campus", amount: 3900, category: "salary" },
    ],
    contacts: [
      { id: "pieter", name: "Pieter", iban: "BE17715746133821" },
      { id: "an", name: "An", iban: "BE69130002676778" },
    ],
    subscriptions: [
      { id: "streamz", name: "Streamz", monthly: 14.95, signal: "Price increase in September" },
      { id: "netflix", name: "Netflix", monthly: 17.99, signal: "Two video services in the household" },
      { id: "kidsapp", name: "Kids Learning+", monthly: 8.99, signal: "Free trial converted 3 weeks ago" },
      { id: "magazine", name: "Home & Deco magazine", monthly: 6.5, signal: "Renews yearly in October" },
    ],
    beliefs: [
      {
        id: "s-reno",
        statement: "You're renovating or planning to renovate your home.",
        confidence: 0.74,
        signals: ["DIY store spending tripled since moving", "Recent notary + moving costs"],
        options: [
          {
            label: "Yes, the kitchen is next",
            kind: "confirm",
            effect: { flags: { renovation: true }, weights: { idle: 0.5 } },
            kateReply: "Good to know. I'll keep your renovation budget in mind before suggesting any investment.",
          },
          { label: "No, just small jobs", kind: "correct", effect: { flags: { renovation: false } }, kateReply: "Understood, I won't assume a big renovation." },
        ],
      },
      {
        id: "s-kids",
        statement: "You have two school-age children.",
        confidence: 0.9,
        signals: ["Regular school payments", "Child benefit (Groeipakket) credits"],
        options: [
          { label: "Correct", kind: "confirm", kateReply: "Thank you. I'll plan around school costs in September." },
          { label: "Don't use this", kind: "irrelevant", kateReply: "Understood. I won't use family information for suggestions." },
        ],
      },
    ],
    defaultBuckets: [
      { id: "mortgage", name: "Mortgage", amount: 1180 },
      { id: "food", name: "Groceries", amount: 700 },
      { id: "kids", name: "Kids & school", amount: 350 },
      { id: "home", name: "Home & energy", amount: 450 },
      { id: "save", name: "Savings", amount: 600 },
      { id: "buffer", name: "Buffer", amount: 620 },
    ],
  },

  marc: {
    id: "marc",
    name: "Marc",
    fullName: "Marc De Smet",
    age: 71,
    city: "Bruges",
    tagline: "Retired teacher, lives alone",
    accounts: { current: 4120.75, savings: 38600 },
    income: { type: "pension", amount: 1980, source: "Federal Pension Service", day: 1 },
    hasMortgage: false,
    monthlySpend: 1650,
    tx: [
      { id: "m1", date: "30/09", label: "Pending: 'KBC SECURE ACCOUNT' BE72 9979 5440 2516", amount: -2400, category: "transfer" },
      { id: "m2", date: "28/09", label: "Pharmacy Zand", amount: -23.6, category: "other" },
      { id: "m3", date: "27/09", label: "Carrefour Market Brugge", amount: -58.3, category: "groceries" },
      { id: "m4", date: "25/09", label: "Fluvius", amount: -96, category: "utilities" },
      { id: "m5", date: "01/09", label: "Pension - Federal Pension Service", amount: 1980, category: "pension" },
    ],
    contacts: [
      { id: "els", name: "Els (daughter)", iban: "BE17715746133821" },
      { id: "koen", name: "Koen", iban: "BE69130002676778" },
    ],
    subscriptions: [
      { id: "newspaper", name: "Daily newspaper", monthly: 32.5, signal: "Price rose 12% this year" },
      { id: "tvextra", name: "TV extra sports pack", monthly: 14, signal: "Added in May, one-time event ended" },
      { id: "antivirus", name: "PC Protect Plus", monthly: 6.99, signal: "Sold by phone, often unnecessary" },
    ],
    beliefs: [
      {
        id: "m-human",
        statement: "You prefer to speak with a person for important decisions.",
        confidence: 0.7,
        signals: ["Visits the branch regularly", "Calls KBC Live more than using chat"],
        options: [
          {
            label: "Yes, I do",
            kind: "confirm",
            effect: { flags: { prefersHuman: true } },
            kateReply: "Thank you. I will always offer to connect you with a person.",
          },
          { label: "No, the app is fine", kind: "correct", effect: { flags: { prefersHuman: false } }, kateReply: "Thank you. I will keep things in the app unless you ask." },
        ],
      },
      {
        id: "m-online",
        statement: "You rarely make large online payments.",
        confidence: 0.88,
        signals: ["No online payment above €300 in 2 years"],
        options: [
          {
            label: "That's right",
            kind: "confirm",
            effect: { weights: { guardian: 0.5 } },
            kateReply: "Then I will check with you before any unusual large payment goes out.",
          },
          { label: "I do sometimes", kind: "correct", effect: { weights: { guardian: -0.2 } }, kateReply: "Understood. I will be a little less cautious." },
        ],
      },
    ],
    defaultBuckets: [
      { id: "home", name: "Home & energy", amount: 350 },
      { id: "food", name: "Groceries", amount: 420 },
      { id: "health", name: "Health", amount: 150 },
      { id: "family", name: "Grandchildren & gifts", amount: 150 },
      { id: "save", name: "Savings", amount: 300 },
    ],
  },
};

export const PERSONA_ORDER: PersonaId[] = ["lotte", "tom", "sofie", "marc"];
