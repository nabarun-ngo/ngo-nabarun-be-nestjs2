export class LinkExpenseToActivityCommand {
  constructor(
    public readonly params: {
      activityId: string;
      expenseId: string;
    },
  ) {}
}
