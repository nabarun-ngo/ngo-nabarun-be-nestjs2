export class SetEntityFieldValuesCommand {
  constructor(
    public readonly entityType: string,
    public readonly entityId: string,
    /** Map of fieldDefinition key → raw user-provided value */
    public readonly values: Record<string, unknown>,
    public readonly userId: string,
    public readonly userPermissions: string[],
  ) {}
}
