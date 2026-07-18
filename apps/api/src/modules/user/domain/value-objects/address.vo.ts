/** Immutable value object representing an address slot (present or permanent). */
export class Address {
  private constructor(
    public readonly addressLine1: string,
    public readonly addressLine2: string | undefined,
    public readonly addressLine3: string | undefined,
    public readonly hometown: string,
    public readonly zipCode: string,
    public readonly state: string,
    public readonly district: string,
    public readonly country: string,
  ) {}

  static of(
    addressLine1: string,
    hometown: string,
    zipCode: string,
    state: string,
    district: string,
    country: string,
    addressLine2?: string,
    addressLine3?: string,
  ): Address {
    if (!addressLine1?.trim()) throw new Error('addressLine1 is required');
    return new Address(
      addressLine1.trim(),
      addressLine2?.trim(),
      addressLine3?.trim(),
      hometown.trim(),
      zipCode.trim(),
      state.trim(),
      district.trim(),
      country.trim(),
    );
  }

  equals(other: Address): boolean {
    return (
      this.addressLine1 === other.addressLine1 &&
      this.addressLine2 === other.addressLine2 &&
      this.addressLine3 === other.addressLine3 &&
      this.hometown === other.hometown &&
      this.zipCode === other.zipCode &&
      this.state === other.state &&
      this.district === other.district &&
      this.country === other.country
    );
  }
}
