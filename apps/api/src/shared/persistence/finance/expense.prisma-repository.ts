import { Injectable } from '@nestjs/common';
import { BasePrismaService } from '@ce/nestjs-shared-persistence';
import { BaseFilter, Page } from '@ce/nestjs-shared-core';
import { Prisma, PrismaClient } from '../prisma/client';
import { IExpenseRepository, ExpenseFilter } from '../../../internal/finance/domain/repositories/expense.repository';
import { Expense } from '../../../internal/finance/domain/aggregates/expense/expense.aggregate';
import { ExpenseStatus } from '../../../internal/finance/domain/enums/expense.enum';
import { ExpensePrismaMapper } from './expense-prisma.mapper';


export type ExpensePersistence = Prisma.ExpenseGetPayload<{
  include: {
    account: true;
    createdBy: true;
    updatedBy: true;
    finalizedBy: true;
    settledBy: true;
    rejectedBy: true;
    submittedBy: true;
    paidBy: true;
    activity: true;
  }
}>;

@Injectable()
export class ExpensePrismaRepository implements IExpenseRepository {
  constructor(private readonly database: BasePrismaService<PrismaClient>) { }

  async count(filter: ExpenseFilter): Promise<number> {
    const where = this.whereQuery(filter);
    return await this.database.client.expense.count({ where });
  }

  async findPaged(filter?: BaseFilter<ExpenseFilter>): Promise<Page<Expense>> {
    const where = this.whereQuery(filter?.props);

    const [data, total] = await Promise.all([
      this.database.client.expense.findMany({
        where,
        orderBy: { expenseDate: 'desc' },
        include: {
          account: true,
          createdBy: true,
          updatedBy: true,
          finalizedBy: true,
          settledBy: true,
          rejectedBy: true,
          submittedBy: true,
          paidBy: true,
          activity: true,
        },
        skip: (filter?.pageIndex ?? 0) * (filter?.pageSize ?? 1000),
        take: filter?.pageSize ?? 1000,
      }),
      this.database.client.expense.count({ where }),
    ]);

    return new Page<Expense>(
      data.map(m => ExpensePrismaMapper.toExpenseDomain(m)!),
      total,
      filter?.pageIndex ?? 0,
      filter?.pageSize ?? 1000,
    );
  }

  async findAll(filter?: ExpenseFilter): Promise<Expense[]> {
    const expenses = await this.database.client.expense.findMany({
      where: this.whereQuery(filter),
      orderBy: { expenseDate: 'desc' },
      include: {
        account: true,
        createdBy: true,
        updatedBy: true,
        finalizedBy: true,
        settledBy: true,
        rejectedBy: true,
        submittedBy: true,
        paidBy: true,
        activity: true,
      },
    });

    return expenses.map(m => ExpensePrismaMapper.toExpenseDomain(m)!);
  }

  private whereQuery(props?: ExpenseFilter): Prisma.ExpenseWhereInput {
    const where: Prisma.ExpenseWhereInput = {
      ...(props?.expenseStatus ? { status: { in: props.expenseStatus } } : {}),
      ...(props?.expenseId ? { id: props.expenseId } : {}),
      ...(props?.payerId ? { paidById: props.payerId } : {}),
      ...(props?.expenseRefId ? { referenceId: props.expenseRefId } : {}),
      ...(props?.startDate || props?.endDate
        ? {
          expenseDate: {
            ...(props.startDate ? { gte: props.startDate } : {}),
            ...(props.endDate ? { lte: props.endDate } : {}),
          },
        }
        : {}),
      deletedAt: null,
    };
    return where;
  }

  async findById(id: string): Promise<Expense | null> {
    const expense = await this.database.client.expense.findUnique({
      where: { id },
      include: {
        account: true,
        createdBy: true,
        updatedBy: true,
        finalizedBy: true,
        settledBy: true,
        rejectedBy: true,
        submittedBy: true,
        paidBy: true,
        activity: true,
      },
    });

    return ExpensePrismaMapper.toExpenseDomain(expense!);
  }


  async findByStatus(status: ExpenseStatus): Promise<Expense[]> {
    const expenses = await this.database.client.expense.findMany({
      where: { status, deletedAt: null },
      orderBy: { expenseDate: 'desc' },
      include: {
        account: true,
        createdBy: true,
        updatedBy: true,
        finalizedBy: true,
        settledBy: true,
        rejectedBy: true,
        submittedBy: true,
        paidBy: true,
        activity: true,
      },
    });

    return expenses.map(m => ExpensePrismaMapper.toExpenseDomain(m)!);
  }

  async findByRequestedBy(userId: string): Promise<Expense[]> {
    const expenses = await this.database.client.expense.findMany({
      where: { createdById: userId, deletedAt: null },
      orderBy: { expenseDate: 'desc' },
      include: {
        account: true,
        createdBy: true,
        updatedBy: true,
        finalizedBy: true,
        settledBy: true,
        rejectedBy: true,
        paidBy: true,
        submittedBy: true,
        activity: true,
      },
    });

    return expenses.map(m => ExpensePrismaMapper.toExpenseDomain(m)!);
  }



  async create(expense: Expense): Promise<Expense> {
    const createData: Prisma.ExpenseUncheckedCreateInput = {
      ...ExpensePrismaMapper.toExpenseCreatePersistence(expense),
    };

    const created = await this.database.client.expense.create({
      data: createData,
      include: {
        account: true,
        createdBy: true,
        updatedBy: true,
        finalizedBy: true,
        settledBy: true,
        rejectedBy: true,
        submittedBy: true,
        paidBy: true,
        activity: true,
      },
    });

    return ExpensePrismaMapper.toExpenseDomain(created)!;
  }

  async update(id: string, expense: Expense): Promise<Expense> {
    const updateData: Prisma.ExpenseUncheckedUpdateInput = {
      ...ExpensePrismaMapper.toExpenseUpdatePersistence(expense),
    };

    const updated = await this.database.client.expense.update({
      where: { id },
      data: updateData,
      include: {
        account: true,
        createdBy: true,
        updatedBy: true,
        finalizedBy: true,
        settledBy: true,
        rejectedBy: true,
        paidBy: true,
        submittedBy: true,
        activity: true,
      },
    });

    return ExpensePrismaMapper.toExpenseDomain(updated)!;
  }

  async delete(id: string): Promise<void> {
    await this.database.client.expense.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  }
}

