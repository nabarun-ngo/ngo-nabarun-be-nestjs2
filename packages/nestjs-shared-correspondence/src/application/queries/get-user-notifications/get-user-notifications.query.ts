export class GetUserNotificationsQuery {
  constructor(
    public readonly userId: string,
    public readonly pageIndex?: number,
    public readonly pageSize?: number,
    public readonly isRead?: boolean,
    public readonly isArchived?: boolean,
  ) {}
}
