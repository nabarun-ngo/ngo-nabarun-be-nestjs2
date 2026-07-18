export class SettleExpenseCommand {
  constructor(
    public readonly params: {
      id: string;
      accountId: string;
      settledById: string;
    },
  ) {}
}

