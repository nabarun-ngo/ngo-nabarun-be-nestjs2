export class SubmitPublicFormCommand {
  constructor(
    public readonly publicFormId: string,
    public readonly values: Record<string, unknown>,
  ) {}
}
