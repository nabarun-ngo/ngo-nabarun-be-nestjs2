import { TransactionStatus, TransactionType } from '../../../domain/enums/transaction.enum';

export class ListAccountTransactionsQuery {
  constructor(
    public readonly accountId: string,
    public readonly filter: {
      txnId?: string;
      txnType?: TransactionType[];
      txnStatus?: TransactionStatus[];
      transactionRef?: string;
      startDate?: Date;
      endDate?: Date;
    } = {},
    public readonly pageIndex?: number,
    public readonly pageSize?: number,
    public readonly userId?: string,
  ) {}
}

