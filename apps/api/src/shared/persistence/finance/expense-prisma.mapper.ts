import { Prisma } from '../prisma/client';
import { Expense } from '../../../modules/finance/domain/aggregates/expense/expense.aggregate';
import { ExpenseStatus, ExpenseRefType } from '../../../modules/finance/domain/enums/expense.enum';
import { ExpenseItem } from '../../../modules/finance/domain/value-objects/expense-item.vo';
import { MapperUtils } from './mapper-utils';
import { toFinanceUserRef } from './finance-user-mapper';
import { ExpensePersistence } from './expense.prisma-repository';

export class ExpensePrismaMapper {
  static toExpenseDomain(p: ExpensePersistence | null): Expense | null {
    if (!p) return null;

    let expenseItems: ExpenseItem[] = [];
    if (p.items) {
      try {
        const parsed = JSON.parse(p.items);
        expenseItems = Array.isArray(parsed)
          ? parsed.map((i: ExpenseItem) => new ExpenseItem(i.itemName, i.description, i.amount))
          : [];
      } catch {
        expenseItems = [];
      }
    }

    return new Expense(
      p.id,
      p.title || 'Expense',
      Number(p.amount),
      p.currency,
      p.status as ExpenseStatus,
      MapperUtils.nullToUndefined(p.description) || '',
      MapperUtils.nullToUndefined(p.referenceId),
      MapperUtils.nullToUndefined(p.referenceType as ExpenseRefType),
      MapperUtils.nullToUndefined(p.activity?.name ?? null),
      toFinanceUserRef(p.createdBy)!,
      toFinanceUserRef(p.submittedBy),
      toFinanceUserRef(p.finalizedBy),
      toFinanceUserRef(p.settledBy),
      toFinanceUserRef(p.rejectedBy),
      toFinanceUserRef(p.paidBy)!,
      MapperUtils.nullToUndefined(p.accountId),
      MapperUtils.nullToUndefined(p.transactionRef),
      p.expenseDate,
      MapperUtils.nullToUndefined(p.submittedOn),
      MapperUtils.nullToUndefined(p.finalizedOn),
      MapperUtils.nullToUndefined(p.settledOn),
      MapperUtils.nullToUndefined(p.rejectedOn),
      expenseItems,
      MapperUtils.nullToUndefined(p.transactionRef),
      MapperUtils.nullToUndefined(p.remarks),
      p.isDelegated,
      p.createdAt,
      p.updatedAt,
    );
  }

  static toExpenseCreatePersistence(domain: Expense): Prisma.ExpenseUncheckedCreateInput {
    const itemsJson = domain.expenseItems.length > 0 ? JSON.stringify(domain.expenseItems) : null;
    return {
      id: domain.id,
      title: domain.name,
      items: itemsJson,
      amount: domain.amount,
      currency: domain.currency,
      status: domain.status,
      description: domain.description,
      referenceId: MapperUtils.undefinedToNull(domain.referenceId),
      referenceType: MapperUtils.undefinedToNull(domain.referenceType),
      isDelegated: domain.isDelegated,
      createdById: domain.requestedBy?.id ?? '',
      paidById: domain.paidBy?.id ?? '',
      finalizedById: domain.finalizedBy?.id ?? null,
      finalizedOn: MapperUtils.undefinedToNull(domain.finalizedDate),
      settledById: domain.settledBy?.id ?? null,
      settledOn: MapperUtils.undefinedToNull(domain.settledDate),
      rejectedById: domain.rejectedBy?.id ?? null,
      updatedById: domain.requestedBy?.id ?? null,
      updatedOn: domain.updatedAt,
      accountId: domain.accountId ?? null,
      transactionRef: MapperUtils.undefinedToNull(domain.transactionId),
      expenseDate: domain.expenseDate,
      submittedById: domain.submittedBy?.id ?? domain.requestedBy?.id ?? null,
      submittedOn: domain.submittedDate ?? null,
      rejectedOn: domain.rejectedDate ?? null,
      remarks: MapperUtils.undefinedToNull(domain.remarks),
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
    };
  }

  static toExpenseUpdatePersistence(domain: Expense): Prisma.ExpenseUncheckedUpdateInput {
    const itemsJson = domain.expenseItems.length > 0 ? JSON.stringify(domain.expenseItems) : null;
    return {
      title: domain.name,
      items: itemsJson,
      amount: domain.amount,
      currency: domain.currency,
      status: domain.status,
      description: domain.description,
      referenceId: MapperUtils.undefinedToNull(domain.referenceId),
      referenceType: MapperUtils.undefinedToNull(domain.referenceType),
      isDelegated: domain.isDelegated,
      paidById: domain.paidBy?.id ?? '',
      finalizedById: domain.finalizedBy?.id ?? null,
      finalizedOn: MapperUtils.undefinedToNull(domain.finalizedDate),
      settledById: domain.settledBy?.id ?? null,
      settledOn: MapperUtils.undefinedToNull(domain.settledDate),
      rejectedById: domain.rejectedBy?.id ?? null,
      updatedById: domain.requestedBy?.id ?? null,
      updatedOn: domain.updatedAt,
      accountId: domain.accountId ?? null,
      transactionRef: MapperUtils.undefinedToNull(domain.transactionId),
      expenseDate: domain.expenseDate,
      submittedById: domain.submittedBy?.id ?? null,
      submittedOn: domain.submittedDate ?? null,
      rejectedOn: domain.rejectedDate ?? null,
      remarks: MapperUtils.undefinedToNull(domain.remarks),
      updatedAt: domain.updatedAt,
    };
  }
}
