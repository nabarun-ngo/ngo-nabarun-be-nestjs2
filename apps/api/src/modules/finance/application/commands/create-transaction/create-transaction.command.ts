export class CreateTransactionCommand {
  constructor(
    public readonly params: {
      txnType: 'IN' | 'OUT' | 'TRANSFER';
      txnAmount: number;
      currency: string;
      accountId: string;
      transferToAccountId?: string;
      txnDescription: string;
      txnRefId?: string;
      txnRefType?: string;
      txnDate?: Date;
      actorUserId?: string;
    },
  ) {}
}

