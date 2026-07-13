export class BulkUpdateSortOrderCommand {
  constructor(
    public readonly entityType: string,
    public readonly items: Array<{ id: string; sortOrder: number }>,
    public readonly userId: string,
    public readonly userPermissions: string[],
  ) {}
}
