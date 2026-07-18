export class SubscribeNewsletterCommand {
  constructor(
    public readonly email: string,
    public readonly ipAddress?: string,
  ) {}
}
