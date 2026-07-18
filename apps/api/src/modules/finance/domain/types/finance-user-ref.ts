/** Lightweight user reference for finance domain — avoids coupling to UserModule aggregate. */
export type FinanceUserRef = {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
};

export function financeUserFullName(ref?: Partial<FinanceUserRef>): string | undefined {
  if (!ref) return undefined;
  const name = [ref.firstName, ref.lastName].filter(Boolean).join(' ').trim();
  return name || undefined;
}
