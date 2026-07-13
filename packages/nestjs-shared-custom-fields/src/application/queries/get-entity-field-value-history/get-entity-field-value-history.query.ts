export class GetEntityFieldValueHistoryQuery {
  constructor(
    public readonly entityType: string,
    public readonly entityId: string,
    public readonly userPermissions: string[],
    public readonly fieldKey?: string,
  ) {}
}
