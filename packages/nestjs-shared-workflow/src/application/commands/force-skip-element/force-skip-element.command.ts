export class ForceSkipElementCommand {
  constructor(
    public readonly params: {
      instanceId: string;
      elementId: string;
      actorId?: string | null;
    },
  ) {}
}
