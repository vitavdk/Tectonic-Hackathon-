"use client";

import { useMemo, useRef, useState } from "react";
import { Check, Plus, Upload } from "lucide-react";
import { useStore } from "@/lib/store";
import { say, TONE } from "@/lib/tone";
import { eur2, maskIban } from "@/lib/format";
import { isValidBeIban } from "@/lib/iban";
import { KateMsg, Panel, Primary, UserMsg, Chips, Ghost } from "../ui";
import type { FlowProps } from "./types";

// DEEP FLOW 1: restaurant payment → receipt → (mocked) line items → who had what
// → IBANs → payment requests. Receipt extraction is mocked: the uploaded file is
// never read or sent anywhere.

const BASE_ITEMS: [string, number][] = [
  ["Pizza Margherita", 12.5],
  ["Pizza Quattro Formaggi", 15.0],
  ["Pizza Diavola", 14.5],
  ["Tagliatelle al ragù", 17.4],
  ["House wine (bottle)", 28.0],
  ["Coca-Cola ×3", 10.5],
  ["Sparkling water 1L", 6.5],
  ["Tiramisu ×2", 14.0],
  ["Panna cotta", 7.0],
  ["Espresso ×2", 3.0],
];

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/heic", "image/webp", "application/pdf"];

type Person = { id: string; name: string; iban: string; me?: boolean };

export function SplitFlow({ onDone }: FlowProps) {
  const { persona, segment, update, toast } = useStore();
  const bill = persona.tx.find((t) => t.category === "restaurant") ?? {
    label: "Restaurant",
    amount: -128.4,
    id: "demo",
  };
  const total = Math.abs(bill.amount);

  const items = useMemo(() => scaleItems(total), [total]);
  const [step, setStep] = useState(0);
  const [source, setSource] = useState<string>("");
  const [people, setPeople] = useState<Person[]>(() => [
    { id: "me", name: `${persona.name} (me)`, iban: "", me: true },
    ...persona.contacts.map((c) => ({ ...c })),
  ]);
  // who shared each item: default everyone
  const [assign, setAssign] = useState<Record<number, string[]>>(() =>
    Object.fromEntries(items.map((_, i) => [i, ["me", ...persona.contacts.map((c) => c.id)]])),
  );
  const [newName, setNewName] = useState("");
  const [newIban, setNewIban] = useState("");
  const [err, setErr] = useState("");
  const [confirming, setConfirming] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const shares = useMemo(() => {
    const s: Record<string, number> = Object.fromEntries(people.map((p) => [p.id, 0]));
    items.forEach((it, i) => {
      const who = (assign[i] ?? []).filter((id) => id in s);
      if (who.length === 0) return;
      who.forEach((id) => (s[id] += it.price / who.length));
    });
    return s;
  }, [items, assign, people]);

  const requests = people.filter((p) => !p.me && shares[p.id] > 0.004);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    if (!ALLOWED_TYPES.includes(f.type) || f.size > MAX_UPLOAD_BYTES) {
      toast("Please use a photo (JPG/PNG/HEIC) or PDF under 5 MB.");
      return;
    }
    setSource(f.name.slice(0, 60));
    read();
  }

  function read() {
    setStep(1);
    setTimeout(() => setStep(2), 1100);
  }

  function toggle(i: number, id: string) {
    setAssign((a) => {
      const cur = a[i] ?? [];
      return { ...a, [i]: cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id] };
    });
  }

  function addPerson() {
    const name = newName.trim().replace(/[^\p{L}\p{N} .'-]/gu, "").slice(0, 30);
    const iban = newIban.replace(/\s+/g, "").toUpperCase();
    if (!name) return setErr("Add a name.");
    if (!isValidBeIban(iban)) return setErr("That doesn't look like a valid Belgian IBAN.");
    const id = `p${people.length}-${Date.now()}`;
    setPeople((p) => [...p, { id, name, iban }]);
    setAssign((a) => Object.fromEntries(Object.entries(a).map(([k, v]) => [k, [...v, id]])));
    setNewName("");
    setNewIban("");
    setErr("");
  }

  function send() {
    if (TONE[segment].confirmTwice && !confirming) {
      setConfirming(true);
      return;
    }
    setStep(4);
    update((l) => ({ ...l, completed: [...new Set([...l.completed, "split" as const])] }));
    onDone();
  }

  return (
    <>
      <KateMsg>
        <p>
          {say(segment, {
            young: `Saw ${eur2(total)} at ${bill.label.toLowerCase()} 🍕 Want me to split it? Snap the receipt and I'll do the maths.`,
            adult: `You paid ${eur2(total)} at ${bill.label}. Upload the receipt and I'll prepare payment requests for everyone.`,
            senior: `You paid ${eur2(total)} at ${bill.label}. If others should pay their share, I can prepare that for you. Take your time.`,
          })}
        </p>
      </KateMsg>

      {step === 0 && (
        <Panel>
          <input ref={fileRef} type="file" accept={ALLOWED_TYPES.join(",")} className="hidden" onChange={onFile} aria-label="Upload receipt" />
          <div className="flex flex-wrap gap-2">
            <Primary onClick={() => fileRef.current?.click()}>
              <span className="inline-flex items-center gap-2">
                <Upload size={16} /> Upload receipt
              </span>
            </Primary>
            <Ghost
              onClick={() => {
                setSource("demo-receipt.jpg");
                read();
              }}
            >
              Use demo receipt
            </Ghost>
          </div>
          <p className="mt-3 text-xs text-muted">Prototype: line items are mocked. Your photo stays on this device.</p>
        </Panel>
      )}

      {step >= 1 && <UserMsg>📎 {source}</UserMsg>}

      {step === 1 && (
        <KateMsg>
          <p className="animate-pulse text-muted">Reading your receipt…</p>
        </KateMsg>
      )}

      {step >= 2 && (
        <>
          <KateMsg>
            <p>
              {say(segment, {
                young: `Got ${items.length} items 👇 Tap names to say who had what. Shared stuff is split evenly.`,
                all: `I found ${items.length} items. Tap the names to mark who had what; shared items are split evenly.`,
              })}
            </p>
          </KateMsg>
          <Panel className="space-y-3">
            {items.map((it, i) => (
              <div key={i} className="border-b border-line pb-3 last:border-0 last:pb-0">
                <div className="flex justify-between text-sm">
                  <span>{it.name}</span>
                  <span className="tabular-nums text-muted">{eur2(it.price)}</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {people.map((p) => {
                    const on = (assign[i] ?? []).includes(p.id);
                    return (
                      <button
                        key={p.id}
                        type="button"
                        disabled={step > 2}
                        onClick={() => toggle(i, p.id)}
                        aria-pressed={on}
                        className={`rounded-full px-2.5 py-1 text-xs transition ${on ? "bg-kbc text-black" : "bg-surface-2 text-muted"}`}
                      >
                        {p.me ? "Me" : p.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
            <div className="flex justify-between pt-1 text-sm font-semibold">
              <span>Total</span>
              <span className="tabular-nums">{eur2(total)}</span>
            </div>
            {step === 2 && (
              <div className="pt-1">
                <Primary onClick={() => setStep(3)}>Calculate shares</Primary>
              </div>
            )}
          </Panel>
        </>
      )}

      {step >= 3 && (
        <>
          <KateMsg>
            <p>{say(segment, { young: "Here's who owes what 👇", all: "Here is everyone's share. Check the accounts before sending." })}</p>
          </KateMsg>
          <Panel className="space-y-2">
            {people.map((p) => (
              <div key={p.id} className="flex items-center justify-between text-sm">
                <div>
                  <div>{p.name}</div>
                  {!p.me && <div className="text-xs text-muted">{maskIban(p.iban)}</div>}
                </div>
                <div className="tabular-nums font-semibold">{eur2(shares[p.id] ?? 0)}</div>
              </div>
            ))}
            {step === 3 && (
              <div className="mt-3 space-y-2 border-t border-line pt-3">
                <div className="text-xs text-muted">Someone missing?</div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    maxLength={30}
                    placeholder="Name"
                    className="min-w-0 flex-1 rounded-lg bg-surface-2 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-kbc"
                  />
                  <input
                    value={newIban}
                    onChange={(e) => setNewIban(e.target.value)}
                    maxLength={24}
                    placeholder="BE.. IBAN"
                    className="min-w-0 flex-[1.4] rounded-lg bg-surface-2 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-kbc"
                  />
                  <button type="button" onClick={addPerson} className="inline-flex items-center justify-center gap-1 rounded-lg bg-surface-2 px-3 py-2 text-sm text-kbc-soft">
                    <Plus size={14} /> Add
                  </button>
                </div>
                {err && <div className="text-xs text-alert">{err}</div>}
                <p className="text-[11px] text-muted">Tip: test IBAN BE72 9979 5440 2516 works. Added people share every item; untick in the list above.</p>
              </div>
            )}
          </Panel>
          {step === 3 && people.length > persona.contacts.length + 1 && (
            <Chips options={[{ label: "Back to items", value: "back" }]} onPick={() => setStep(2)} />
          )}
          {step === 3 && (
            <Panel>
              {confirming && (
                <p className="mb-3 text-sm text-warn">
                  Please confirm: you are asking {requests.length} {requests.length === 1 ? "person" : "people"} to pay you. No money leaves your account.
                </p>
              )}
              <Primary onClick={send} disabled={requests.length === 0}>
                {confirming ? "Yes, send the requests" : `Send ${requests.length} payment request${requests.length === 1 ? "" : "s"}`}
              </Primary>
            </Panel>
          )}
        </>
      )}

      {step === 4 && (
        <KateMsg>
          <p>
            {say(segment, {
              young: "Done! Requests sent 🚀 I'll ping you when they pay up.",
              all: "Payment requests sent. I'll let you know as soon as someone pays.",
            })}
          </p>
          <ul className="space-y-1 text-sm text-muted">
            {requests.map((p) => (
              <li key={p.id} className="flex items-center gap-2">
                <Check size={14} className="text-ok" /> {p.name}: {eur2(shares[p.id])} requested
              </li>
            ))}
          </ul>
        </KateMsg>
      )}
    </>
  );
}

function scaleItems(total: number) {
  const base = BASE_ITEMS.reduce((a, [, p]) => a + p, 0);
  const f = total / base;
  const out = BASE_ITEMS.map(([name, p]) => ({ name, price: Math.round(p * f * 100) / 100 }));
  const diff = Math.round((total - out.reduce((a, i) => a + i.price, 0)) * 100) / 100;
  out[out.length - 1].price = Math.round((out[out.length - 1].price + diff) * 100) / 100;
  return out;
}
