export class GetFormSubmissionQuery {
  constructor(
    public readonly formId: string,
    public readonly entityType: string,
    public readonly entityId: string,
    public readonly userPermissions: string[],
  ) {}
}
