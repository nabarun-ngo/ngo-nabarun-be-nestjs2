export class ValidateEntityFieldsQuery {
  constructor(
    public readonly entityType: string,
    public readonly entityId: string,
    public readonly userPermissions: string[],
  ) {}
}
