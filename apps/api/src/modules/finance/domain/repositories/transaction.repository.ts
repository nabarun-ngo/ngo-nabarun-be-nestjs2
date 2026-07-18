import { IRepository } from '@nabarun-ngo/nestjs-shared-core';
import { Transaction } from '../entities/transaction.entity';
import { TransactionRefType, TransactionStatus, TransactionType } from '../enums/transaction.enum';

export interface TransactionFilter {
  transactionRef?: string;
  type?: TransactionType[];
  status?: TransactionStatus[];
  referenceType?: TransactionRefType[];
  referenceId?: string;
  accountIds?: string[];
  startDate?: Date;
  endDate?: Date;
  id?: string;
}

export const ITransactionRepository = Symbol('ITransactionRepository');

export interface ITransactionRepository extends IRepository<Transaction, string, TransactionFilter> { }
