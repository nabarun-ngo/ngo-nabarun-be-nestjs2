export class GetStuckWorkflowsQuery {
  constructor(public readonly olderThanMinutes: number = 60) {}
}
