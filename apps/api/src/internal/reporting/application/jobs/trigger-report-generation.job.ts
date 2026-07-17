export class TriggerReportGenerationJob {
  constructor(
    readonly reportCode: string,
    readonly params: Record<string, unknown> = {},
    readonly requestedById?: string,
    readonly userRoles: string[] = [],
  ) {}
}
