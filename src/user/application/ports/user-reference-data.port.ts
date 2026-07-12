export const IUserReferenceDataPort = Symbol('IUserReferenceDataPort');

export interface KeyValueOption {
  key: string;
  value: string;
  description?: string;
}

export interface IUserReferenceDataPort {
  getTitles(): Promise<KeyValueOption[]>;
  getGenders(): Promise<KeyValueOption[]>;
  getDocumentTypes(): Promise<KeyValueOption[]>;
  getCountries(): Promise<KeyValueOption[]>;
  getStates(countryCode: string): Promise<KeyValueOption[]>;
  getDistricts(countryCode: string, stateCode: string): Promise<KeyValueOption[]>;
  getPhoneCodes(): Promise<KeyValueOption[]>;
  /**
   * Returns the subset of Auth2 roles that should be surfaced in the front-end.
   * The list is managed as a JSON document at user-config / displayable-roles,
   * allowing roles to be toggled without a code deployment.
   */
  getDisplayableRoles(): Promise<KeyValueOption[]>;
}
