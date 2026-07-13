export class DeactivateFieldDefinitionCommand {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly userPermissions: string[],
  ) {}
}
