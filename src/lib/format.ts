const fmt = new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR" });
const fmt0 = new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

/** €1,234.56 (whole euros shown without decimals) */
export function eur(n: number): string {
  return Number.isInteger(Math.round(n * 100) / 100) ? fmt0.format(n) : fmt.format(n);
}

export function eur2(n: number): string {
  return fmt.format(n);
}

export function maskIban(iban: string): string {
  const c = iban.replace(/\s+/g, "");
  return `${c.slice(0, 4)} •••• •••• ${c.slice(-4)}`;
}

export function clamp(n: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, n));
}
