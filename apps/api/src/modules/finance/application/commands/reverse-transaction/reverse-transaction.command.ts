export class ReverseTransactionCommand {
  constructor(
    public readonly params: { transactionRef: string; reason: string },
  ) {}
}

