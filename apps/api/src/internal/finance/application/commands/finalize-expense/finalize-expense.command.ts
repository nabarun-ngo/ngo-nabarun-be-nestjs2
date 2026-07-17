export class FinalizeExpenseCommand {
  constructor(public readonly params: { id: string; finalizedById: string }) {}
}

