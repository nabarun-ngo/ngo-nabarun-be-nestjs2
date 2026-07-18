export interface KeyValueOption {
  key: string;
  value: string;
  description?: string;
}

export const IProjectReferenceDataPort = Symbol('IProjectReferenceDataPort');

export interface IProjectReferenceDataPort {
  getProjectReferenceData(): Promise<Record<string, KeyValueOption[]>>;
}
