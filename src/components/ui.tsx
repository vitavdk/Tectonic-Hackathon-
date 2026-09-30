"use client";

import type { ReactNode } from "react";

// Small building blocks shared by the shell and the Kate chat.

export function KateAvatar({ size = 36 }: { size?: number }) {
  return (
    <span
      aria-hidden
      className="inline-flex shrink-0 items-center justify-center rounded-full bg-white shadow-[0_0_0_3px_rgba(92,198,242,0.35)]"
      style={{ width: size, height: size }}
    >
      <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 20 20">
        <g stroke="#2aa4e6" strokeWidth="2.2" strokeLinecap="round">
          <line x1="6" y1="5" x2="14" y2="5" />
          <line x1="3" y1="10" x2="17" y2="10" />
          <line x1="7" y1="15" x2="13" y2="15" />
        </g>
      </svg>
    </span>
  );
}

export function KateMsg({ children }: { children: ReactNode }) {
  return (
    <div className="rise flex gap-3">
      <KateAvatar size={30} />
      <div className="max-w-[88%] space-y-2 pt-1 text-[15px] leading-relaxed">{children}</div>
    </div>
  );
}

export function UserMsg({ children }: { children: ReactNode }) {
  return (
    <div className="rise flex justify-end">
      <div className="max-w-[80%] rounded-2xl rounded-br-md bg-kbc-deep px-4 py-2 text-[15px]">{children}</div>
    </div>
  );
}

export function Chips({
  options,
  onPick,
  disabled,
}: {
  options: { label: string; value: string }[];
  onPick: (value: string, label: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="rise flex flex-wrap gap-2 pl-[42px]">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          disabled={disabled}
          onClick={() => onPick(o.value, o.label)}
          className="rounded-full border border-kbc px-4 py-2 text-sm font-medium text-kbc-soft transition hover:bg-kbc/15 disabled:opacity-40"
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rise ml-[42px] rounded-2xl border border-line bg-surface p-4 ${className}`}>{children}</div>;
}

export function Primary({
  children,
  onClick,
  disabled,
  className = "",
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-full bg-kbc px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-kbc-soft disabled:cursor-not-allowed disabled:opacity-40 ${className}`}
    >
      {children}
    </button>
  );
}

export function Ghost({ children, onClick, className = "" }: { children: ReactNode; onClick?: () => void; className?: string }) {
  return (
    <button type="button" onClick={onClick} className={`rounded-full px-4 py-2 text-sm font-medium text-kbc-soft hover:bg-kbc/10 ${className}`}>
      {children}
    </button>
  );
}

export function Bar({ value, max, tone = "kbc" }: { value: number; max: number; tone?: "kbc" | "warn" | "alert" | "ok" }) {
  const pct = Math.max(0, Math.min(100, (value / Math.max(max, 1)) * 100));
  const color = { kbc: "bg-kbc", warn: "bg-warn", alert: "bg-alert", ok: "bg-ok" }[tone];
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-surface-2">
      <div className={`h-full rounded-full ${color} transition-all duration-500`} style={{ width: `${pct}%` }} />
    </div>
  );
}
