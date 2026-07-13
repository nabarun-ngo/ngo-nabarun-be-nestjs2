export class ListTokensQuery {
  constructor(
    public readonly params: {
      provider?: string;
      ownerSub?: string;
      isAdmin?: boolean;
      pageIndex?: number;
      pageSize?: number;
    },
  ) {}
}
