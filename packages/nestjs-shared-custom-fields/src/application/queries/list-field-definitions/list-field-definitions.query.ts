export class ListFieldDefinitionsQuery {
  constructor(
    public readonly entityType: string,
    public readonly userPermissions: string[],
    public readonly activeOnly: boolean = true,
    public readonly includeHidden: boolean = false,
  ) {}
}
