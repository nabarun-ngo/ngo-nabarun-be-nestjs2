import { FinanceUserRef } from '../../../modules/finance/domain/types/finance-user-ref';

export function toFinanceUserRef(
  u?: { id: string; email?: string | null; firstName?: string; lastName?: string } | null,
): FinanceUserRef | undefined {
  if (!u) return undefined;
  return { id: u.id, email: u.email ?? undefined, firstName: u.firstName, lastName: u.lastName };
}
