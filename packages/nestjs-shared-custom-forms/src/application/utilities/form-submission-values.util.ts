import { CustomFieldType } from '../../domain/enums/custom-field-type.enum';
import {
  FormAccessDeniedError,
  FormFieldNotFoundError,
  MandatoryFieldMissingError,
} from '../../domain/errors/form.errors';
import { Form } from '../../domain/aggregates/form/form.aggregate';
import { FormFieldDefinition } from '../../domain/entities/form-field-definition/form-field-definition.entity';
import { FormFieldValuePolicy } from '../../domain/policies/form-field-value.policy';
import { FieldValueCodecService } from '../../infrastructure/services/field-value-codec.service';
import { CustomFieldValueParsed } from '../../domain/value-objects/field-condition/field-condition.vo';

export function canSeeFormField(
  field: FormFieldDefinition,
  userPermissions: string[],
): boolean {
  if (field.viewPermissions.length === 0) return true;
  const userPermSet = new Set(userPermissions);
  return [...field.viewPermissions].some((p) => userPermSet.has(p));
}

export async function serialiseFormFieldValues(params: {
  form: Form;
  values: Record<string, unknown>;
  existingValuesByFieldDefId: Map<string, string | null>;
  userId: string;
  userPermissions: string[];
  codec: FieldValueCodecService;
  enforceMandatory?: boolean;
}): Promise<Array<{ fieldDefId: string; value: string | null; changedBy: string }>> {
  const {
    form,
    values,
    existingValuesByFieldDefId,
    userId,
    userPermissions,
    codec,
    enforceMandatory = false,
  } = params;

  const enabledFields = form.fields.filter((f) => f.enabled);
  const defByKey = new Map<string, FormFieldDefinition>(
    enabledFields.map((f) => [f.key, f]),
  );
  const incomingValues = new Map(Object.entries(values));

  if (enforceMandatory) {
    for (const def of enabledFields) {
      if (!canSeeFormField(def, userPermissions)) continue;
      if (!def.mandatory) continue;

      const isBeingSubmitted = Object.prototype.hasOwnProperty.call(values, def.key);
      const hasExistingValue = (existingValuesByFieldDefId.get(def.id) ?? null) !== null;

      if (isBeingSubmitted) {
        const raw = values[def.key];
        if (raw === null || raw === undefined || raw === '') {
          throw new MandatoryFieldMissingError(def.key);
        }
      } else if (!hasExistingValue) {
        throw new MandatoryFieldMissingError(def.key);
      }
    }
  }

  const serialisedValues: Array<{
    fieldDefId: string;
    value: string | null;
    changedBy: string;
  }> = [];

  for (const [key, rawValue] of Object.entries(values)) {
    const definition = defByKey.get(key);
    if (!definition) throw new FormFieldNotFoundError(key, form.id);

    if (!canSeeFormField(definition, userPermissions)) {
      throw new FormAccessDeniedError('write', form.id);
    }

    const parentDef = definition.dependentOptions
      ? defByKey.get(definition.dependentOptions.dependsOnKey)
      : null;

    let currentParentValue: string | null = null;
    if (parentDef) {
      const incomingParentRaw = incomingValues.get(parentDef.key);
      if (incomingParentRaw !== undefined) {
        currentParentValue = incomingParentRaw != null ? String(incomingParentRaw) : null;
      } else {
        currentParentValue = existingValuesByFieldDefId.get(parentDef.id) ?? null;
      }
    }

    if (rawValue !== null && rawValue !== undefined) {
      FormFieldValuePolicy.assertValueType(key, definition.fieldType, rawValue);
      FormFieldValuePolicy.assertOptionAllowed(
        key,
        definition.fieldType,
        rawValue,
        definition.fieldOptions,
        definition.dependentOptions,
        currentParentValue,
      );
      FormFieldValuePolicy.assertPatternMatch(
        key,
        definition.fieldType,
        rawValue,
        definition.validationRules,
      );
    }

    const serialisedRaw = rawValue !== null && rawValue !== undefined
      ? codec.serialise(definition.fieldType, rawValue)
      : null;
    const serialised = serialisedRaw !== null
      ? await codec.encryptIfNeeded(serialisedRaw, key, definition.isEncrypted)
      : null;

    serialisedValues.push({
      fieldDefId: definition.id,
      value:      serialised,
      changedBy:  userId,
    });
  }

  return serialisedValues;
}

export async function buildParsedValuesByFieldDefId(
  form: Form,
  storedByFieldDefId: Map<string, string | null>,
  codec: FieldValueCodecService,
): Promise<Map<string, CustomFieldValueParsed>> {
  const parsedByDefId = new Map<string, CustomFieldValueParsed>();

  await Promise.all(
    form.fields.map(async (def) => {
      const stored = storedByFieldDefId.get(def.id) ?? null;
      if (stored === null) {
        parsedByDefId.set(def.id, null);
        return;
      }
      const raw = await codec.decryptIfNeeded(stored, def.key, def.isEncrypted);
      parsedByDefId.set(def.id, codec.parse(def.fieldType, raw, def.key));
    }),
  );

  return parsedByDefId;
}

export function isFieldVisible(
  def: FormFieldDefinition,
  defByKey: Map<string, FormFieldDefinition>,
  parsedByDefId: Map<string, CustomFieldValueParsed>,
  userPermissions: string[],
): boolean {
  if (!def.enabled) return false;
  if (!canSeeFormField(def, userPermissions)) return false;
  if (!def.condition) return true;

  const parentDef = defByKey.get(def.condition.dependsOnKey);
  if (!parentDef) return false;
  return def.condition.isSatisfiedBy(parsedByDefId.get(parentDef.id) ?? null);
}

export function validateVisibleFields(
  form: Form,
  parsedByDefId: Map<string, CustomFieldValueParsed>,
  userPermissions: string[],
): {
  missingMandatory: string[];
  conditionViolations: string[];
  validationViolations: string[];
} {
  const defByKey = new Map(form.fields.map((f) => [f.key, f]));
  const missingMandatory: string[] = [];
  const conditionViolations: string[] = [];
  const validationViolations: string[] = [];

  for (const def of form.fields) {
    if (!isFieldVisible(def, defByKey, parsedByDefId, userPermissions)) continue;

    const parsedValue = parsedByDefId.get(def.id) ?? null;

    if (def.mandatory && (parsedValue === null || parsedValue === undefined)) {
      missingMandatory.push(def.key);
    }

    if (
      parsedValue !== null &&
      (def.fieldType === CustomFieldType.Select ||
        def.fieldType === CustomFieldType.Multiselect)
    ) {
      let availableKeys: Set<string>;
      if (def.dependentOptions) {
        const parentDef = defByKey.get(def.dependentOptions.dependsOnKey);
        const parentValue = parentDef
          ? (parsedByDefId.get(parentDef.id) as string | null)
          : null;
        availableKeys = new Set(
          [...def.dependentOptions.getOptionsFor(parentValue)].map((o) => o.key),
        );
      } else {
        availableKeys = new Set([...def.fieldOptions].map((o) => o.key));
      }

      if (availableKeys.size > 0) {
        const keys = Array.isArray(parsedValue)
          ? (parsedValue as string[])
          : [parsedValue as string];
        if (keys.some((k) => !availableKeys.has(k))) {
          conditionViolations.push(def.key);
        }
      }
    }

    if (
      parsedValue !== null &&
      parsedValue !== undefined &&
      def.validationRules &&
      !def.validationRules.matchesValue(def.fieldType, parsedValue)
    ) {
      validationViolations.push(def.key);
    }
  }

  return { missingMandatory, conditionViolations, validationViolations };
}
