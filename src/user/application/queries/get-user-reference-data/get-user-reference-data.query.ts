export class GetUserReferenceDataQuery {
  constructor(
    public readonly countryCode?: string,
    public readonly stateCode?: string,
  ) {}
}
