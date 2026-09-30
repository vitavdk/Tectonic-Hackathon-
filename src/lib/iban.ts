// Belgian IBAN check (format + ISO 7064 mod-97). Used to validate
// payment-request recipients typed by the user.
export function isValidBeIban(input: string): boolean {
  const iban = input.replace(/\s+/g, "").toUpperCase();
  if (!/^BE\d{14}$/.test(iban)) return false;
  const rearranged = iban.slice(4) + iban.slice(0, 4);
  const numeric = rearranged.replace(/[A-Z]/g, (ch) => String(ch.charCodeAt(0) - 55));
  let rem = 0;
  for (const d of numeric) rem = (rem * 10 + Number(d)) % 97;
  if (rem !== 1) return false;
  // national check: first 10 digits mod 97 (97 when 0) == last 2 digits
  const bban = iban.slice(4);
  const base = Number(bban.slice(0, 10));
  const chk = base % 97 || 97;
  return chk === Number(bban.slice(10));
}
