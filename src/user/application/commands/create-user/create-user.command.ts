export class CreateUserCommand {
  constructor(
    public readonly params: {
      email: string;
      firstName: string;
      lastName: string;
      title?: string;
      middleName?: string;
      dateOfBirth?: Date;
      gender?: string;
      about?: string;
      picture?: string;
      isPublic?: boolean;
      /** Optional admin-supplied password; if omitted a system password is generated. */
      adminPassword?: string;
      /** App profile UUID of the admin performing the create. Never idpSub. */
      createdById: string;
    },
  ) {}
}
