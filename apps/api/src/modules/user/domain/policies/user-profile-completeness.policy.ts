/**
 * Pure policy — no I/O, no NestJS imports.
 * Accepts any object structurally matching ProfileSnapshot, so the User aggregate
 * can be passed directly without creating a circular dependency.
 */
export type ProfileSnapshot = {
  readonly firstName: string;
  readonly lastName: string;
  readonly dateOfBirth: Date | undefined;
  readonly gender: string | undefined;
  readonly email: string;
};

export class UserProfileCompletenessPolicy {
  /** Returns true when all required identification fields are present and non-empty. */
  static evaluate(profile: ProfileSnapshot): boolean {
    return !!(
      profile.firstName?.trim() &&
      profile.lastName?.trim() &&
      profile.dateOfBirth &&
      profile.gender?.trim() &&
      profile.email?.trim()
    );
  }

  /** Returns the names of fields that are missing or empty. */
  static missingFields(profile: ProfileSnapshot): string[] {
    const missing: string[] = [];
    if (!profile.firstName?.trim()) missing.push('firstName');
    if (!profile.lastName?.trim()) missing.push('lastName');
    if (!profile.dateOfBirth) missing.push('dateOfBirth');
    if (!profile.gender?.trim()) missing.push('gender');
    if (!profile.email?.trim()) missing.push('email');
    return missing;
  }
}
