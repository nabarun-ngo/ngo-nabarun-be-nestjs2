import { Injectable, Inject, Optional, Logger } from '@nestjs/common';
import { encryptText, decryptText } from '@ce/nestjs-shared-core';
import { CustomFieldType } from '../../domain/enums/custom-field-type.enum';
import {
  EncryptionKeyMissingError,
  InvalidFieldValueError,
} from '../../domain/errors/custom-field.errors';
import { CustomFieldValueParsed } from '../../domain/value-objects/field-condition/field-condition.vo';
import { CUSTOM_FIELDS2_OPTIONS } from '../custom-fields-options.token';
import { CustomFields2ModuleOptions } from '../../custom-fields.schema';

/**
 * Infrastructure service responsible for converting field values between their
 * in-memory (typed) representation and their stored (string) form, including
 * encryption and decryption of sensitive fields.
 *
 * All serialisation format decisions live here. Domain and application layers
 * remain unaware of how values are stored or encrypted.
 */
@Injectable()
export class FieldValueCodecService {
  private readonly logger = new Logger(FieldValueCodecService.name);

  constructor(
    @Optional()
    @Inject(CUSTOM_FIELDS2_OPTIONS)
    private readonly options: CustomFields2ModuleOptions | null,
  ) {}

  /** Converts a typed in-memory value to the raw string written to the DB. */
  serialise(fieldType: CustomFieldType, value: unknown): string {
    if (fieldType === CustomFieldType.Multiselect) {
      return JSON.stringify(value);
    }
    return String(value);
  }

  /** Converts a raw DB string back to a typed in-memory value. */
  parse(fieldType: CustomFieldType, raw: string, fieldKey?: string): CustomFieldValueParsed {
    switch (fieldType) {
      case CustomFieldType.Number:
        return parseFloat(raw);
      case CustomFieldType.Boolean:
        return raw === 'true';
      case CustomFieldType.Multiselect:
        try {
          return JSON.parse(raw) as string[];
        } catch {
          this.logger.warn(
            `Corrupt multiselect value for field "${fieldKey ?? 'unknown'}": ${raw}`,
          );
          return [];
        }
      default:
        return raw;
    }
  }

  /**
   * Encrypts `serialised` when `isEncrypted` is true.
   * Returns `serialised` unchanged when the field is not encrypted.
   */
  async encryptIfNeeded(
    serialised: string,
    fieldKey: string,
    isEncrypted: boolean,
  ): Promise<string> {
    if (!isEncrypted) return serialised;
    if (!this.options?.encryptionKey) throw new EncryptionKeyMissingError(fieldKey);
    return encryptText(serialised, this.options.encryptionKey);
  }

  /**
   * Decrypts `stored` when `isEncrypted` is true.
   * Returns `stored` unchanged when the field is not encrypted.
   */
  async decryptIfNeeded(
    stored: string,
    fieldKey: string,
    isEncrypted: boolean,
  ): Promise<string> {
    if (!isEncrypted) return stored;
    if (!this.options?.encryptionKey) throw new EncryptionKeyMissingError(fieldKey);
    try {
      return await decryptText(stored, this.options.encryptionKey);
    } catch {
      throw new InvalidFieldValueError(`Failed to decrypt value for field "${fieldKey}"`);
    }
  }
}
