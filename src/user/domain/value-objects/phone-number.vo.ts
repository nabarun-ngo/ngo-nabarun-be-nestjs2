/** Immutable value object representing a phone number slot (primary or secondary). */
export class PhoneNumber {
  private constructor(
    public readonly phoneCode: string,
    public readonly phoneNumber: string,
    public readonly hidden: boolean,
  ) {}

  static of(phoneCode: string, phoneNumber: string, hidden = false): PhoneNumber {
    if (!phoneCode?.trim()) throw new Error('phoneCode is required');
    if (!phoneNumber?.trim()) throw new Error('phoneNumber is required');
    return new PhoneNumber(phoneCode.trim(), phoneNumber.trim(), hidden);
  }

  equals(other: PhoneNumber): boolean {
    return (
      this.phoneCode === other.phoneCode &&
      this.phoneNumber === other.phoneNumber &&
      this.hidden === other.hidden
    );
  }
}
