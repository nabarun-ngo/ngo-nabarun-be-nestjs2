import { Injectable, Logger } from '@nestjs/common';
import { JsonStoreFacade } from '@ce/nestjs-shared-json-store';
import {
  IUserReferenceDataPort,
  KeyValueOption,
} from '../../application/ports/user-reference-data.port';
import { UserReferenceDataPayloadSchema } from '../../user-reference-data.schema';

/**
 * DB-backed reference data adapter powered by JsonStore.
 *
 * All reference data lives under namespace 'user-reference-data'.
 * Each document key matches the data set name (e.g. 'titles', 'genders').
 * Document payload shape: { "items": KeyValueOption[] }
 *
 * Seeding: use `loadJsonStoreSeedFromDir` + `seedJsonStore` from @ce/nestjs-shared-json-store
 * in your seed script, pointing at the assets/user-reference-data directory.
 * Each JSON file in that directory must have the shape: { "items": [...] }
 */
@Injectable()
export class UserReferenceDataAdapter implements IUserReferenceDataPort {
  private static readonly NAMESPACE = 'user-reference-data';
  private readonly logger = new Logger(UserReferenceDataAdapter.name);

  constructor(private readonly jsonStore: JsonStoreFacade) {}

  async getTitles(): Promise<KeyValueOption[]> {
    return this.loadItems('titles');
  }

  async getGenders(): Promise<KeyValueOption[]> {
    return this.loadItems('genders');
  }

  async getDocumentTypes(): Promise<KeyValueOption[]> {
    return this.loadItems('document-types');
  }

  async getCountries(): Promise<KeyValueOption[]> {
    return this.loadItems('countries');
  }

  async getStates(countryCode: string): Promise<KeyValueOption[]> {
    const items = await this.loadItems<KeyValueOption & { countryCode?: string }>('states');
    return countryCode ? items.filter((s) => s.countryCode === countryCode) : items;
  }

  async getDistricts(countryCode: string, stateCode: string): Promise<KeyValueOption[]> {
    const items = await this.loadItems<KeyValueOption & { countryCode?: string; stateCode?: string }>(
      'districts',
    );
    return items.filter(
      (d) =>
        (!countryCode || d.countryCode === countryCode) &&
        (!stateCode || d.stateCode === stateCode),
    );
  }

  async getPhoneCodes(): Promise<KeyValueOption[]> {
    return this.loadItems('phone-codes');
  }

  async getDisplayableRoles(): Promise<KeyValueOption[]> {
    return this.loadItems('displayable-roles', UserReferenceDataAdapter.NAMESPACE);
  }

  private async loadItems<T = KeyValueOption>(key: string, namespace = UserReferenceDataAdapter.NAMESPACE): Promise<T[]> {
    const payload = await this.jsonStore.get(key, namespace);
    if (!payload) return [];

    const parsed = UserReferenceDataPayloadSchema.safeParse(payload);
    if (!parsed.success) {
      this.logger.warn(`Invalid user-reference-data payload for ${namespace}/${key}`);
      return [];
    }

    return parsed.data.items as T[];
  }
}
