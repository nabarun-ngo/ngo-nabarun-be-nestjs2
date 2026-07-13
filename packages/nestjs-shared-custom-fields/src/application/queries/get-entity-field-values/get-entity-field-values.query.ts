export class GetEntityFieldValuesQuery {
  constructor(
    public readonly entityType: string,
    public readonly entityId: string,
    public readonly userPermissions: string[],
  ) {}
}
