import { Inject, Injectable, Optional } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { EntityTypePolicyUtil, checkEntityRecordAccess } from '@ce/nestjs-shared-core';
import { EntityTypeConfig } from '../../../domain/policies/custom-field-entity-type.policy';
import { CustomFieldValuePolicy } from '../../../domain/policies/custom-field-value.policy';
import {
  CustomFieldAccessDeniedError,
  CustomFieldDefinitionNotFoundError,
  MandatoryFieldMissingError,
} from '../../../domain/errors/custom-field.errors';
import {
  ICustomFieldDefinitionRepository,
} from '../../../domain/repositories/custom-field-definition.repository';
import {
  ICustomFieldValueRepository,
} from '../../../domain/repositories/custom-field-value.repository';
import {
  ICustomFieldEntityAccessPort,
} from '../../../domain/ports/entity-access.port';
import { CUSTOM_FIELDS2_OPTIONS } from '../../../infrastructure/custom-fields-options.token';
import { CustomFields2ModuleOptions } from '../../../custom-fields.schema';
import { FieldValueCodecService } from '../../../infrastructure/services/field-value-codec.service';
import { ResolvedCustomFieldValueResponseDto } from '../../dtos/response/custom-field-response.dtos';
import { SetEntityFieldValuesCommand } from './set-entity-field-values.command';
import { CustomFieldDefinition } from '../../../domain/aggregates/custom-field-definition/custom-field-definition.aggregate';
import { CustomFieldValue } from '../../../domain/aggregates/custom-field-value/custom-field-value.aggregate';

@CommandHandler(SetEntityFieldValuesCommand)
@Injectable()
export class SetEntityFieldValuesHandler
  implements ICommandHandler<SetEntityFieldValuesCommand, ResolvedCustomFieldValueResponseDto[]>
{
  constructor(
    @Inject(ICustomFieldDefinitionRepository)
    private readonly definitionRepo: ICustomFieldDefinitionRepository,
    @Inject(ICustomFieldValueRepository)
    private readonly valueRepo: ICustomFieldValueRepository,
    @Optional()
    @Inject(ICustomFieldEntityAccessPort)
    private readonly accessPort: ICustomFieldEntityAccessPort | null,
    @Inject(CUSTOM_FIELDS2_OPTIONS)
    private readonly options: CustomFields2ModuleOptions,
    private readonly codec: FieldValueCodecService,
    private readonly eventBus: EventBus,
  ) {}

  async execute(
    cmd: SetEntityFieldValuesCommand,
  ): Promise<ResolvedCustomFieldValueResponseDto[]> {
    const config = EntityTypePolicyUtil.findConfig<EntityTypeConfig>(
      cmd.entityType,
      this.options.entityTypes,
      'CUSTOM_FIELD',
    );
    EntityTypePolicyUtil.assertHasPermission(
      config?.writePermissions,
      cmd.userPermissions,
      'write',
      cmd.entityType,
      'CUSTOM_FIELD',
    );

    await checkEntityRecordAccess(
      this.accessPort,
      {
        entityType:      cmd.entityType,
        entityId:        cmd.entityId,
        userId:          cmd.userId,
        userPermissions: cmd.userPermissions,
        action:          'write',
      },
      'CUSTOM_FIELD',
    );

    const definitions = await this.definitionRepo.findByEntityType(cmd.entityType, {
      activeOnly: true,
    });
    const defByKey = new Map<string, CustomFieldDefinition>(
      definitions.map((d) => [d.key, d]),
    );

    const userPermSet = new Set(cmd.userPermissions);
    const canSeeField = (def: CustomFieldDefinition): boolean =>
      def.viewPermissions.length === 0 ||
      [...def.viewPermissions].some((p) => userPermSet.has(p));

    // Load all existing field values once — used for both parent-value lookups and event sourcing
    const existingValues = await this.valueRepo.findByEntity(cmd.entityType, cmd.entityId);
    const existingByFieldDefId = new Map<string, CustomFieldValue>(
      existingValues.map((v) => [v.fieldDefId, v]),
    );

    // Build in-memory map of incoming raw values so same-batch parent updates are visible
    // to child field validation without re-reading the DB (HIGH-1).
    const incomingValues = new Map(Object.entries(cmd.values));

    // MEDIUM-1: Enforce mandatory fields — scoped to fields the caller can see.
    // A user who cannot see a field is not expected to supply it.
    for (const def of definitions) {
      if (!canSeeField(def)) continue;
      if (!def.mandatory) continue;
      const isBeingSubmitted = Object.prototype.hasOwnProperty.call(cmd.values, def.key);
      const hasExistingValue = existingValues.some(
        (v) => v.fieldDefId === def.id && v.value !== null,
      );

      if (isBeingSubmitted) {
        const raw = cmd.values[def.key];
        if (raw === null || raw === undefined || raw === '') {
          throw new MandatoryFieldMissingError(def.key);
        }
      } else if (!hasExistingValue) {
        throw new MandatoryFieldMissingError(def.key);
      }
    }

    const serialisedValues: Array<{
      fieldDefId: string;
      value: string | null;
      changedBy: string;
    }> = [];

    for (const [key, rawValue] of Object.entries(cmd.values)) {
      const definition = defByKey.get(key);
      if (!definition) throw new CustomFieldDefinitionNotFoundError(key);

      if (!canSeeField(definition)) {
        throw new CustomFieldAccessDeniedError('write', cmd.entityType, cmd.entityId);
      }

      const parentDef = definition.dependentOptions
        ? defByKey.get(definition.dependentOptions.dependsOnKey)
        : null;

      // HIGH-1: Check incoming batch first so child fields see the parent's NEW value
      // when both parent and child are updated in the same request.
      let currentParentValue: string | null = null;
      if (parentDef) {
        const incomingParentRaw = incomingValues.get(parentDef.key);
        if (incomingParentRaw !== undefined) {
          currentParentValue = incomingParentRaw != null ? String(incomingParentRaw) : null;
        } else {
          const parentStoredValue = existingValues.find((v) => v.fieldDefId === parentDef.id);
          currentParentValue = parentStoredValue?.value ?? null;
        }
      }

      if (rawValue !== null && rawValue !== undefined) {
        CustomFieldValuePolicy.assertValueType(key, definition.fieldType, rawValue);
        CustomFieldValuePolicy.assertOptionAllowed(
          key,
          definition.fieldType,
          rawValue,
          definition.fieldOptions,
          definition.dependentOptions,
          currentParentValue,
        );
      }
      const serialisedRaw = rawValue !== null && rawValue !== undefined
        ? this.codec.serialise(definition.fieldType, rawValue)
        : null;
      const serialised = serialisedRaw !== null
        ? await this.codec.encryptIfNeeded(serialisedRaw, key, definition.isEncrypted)
        : null;

      serialisedValues.push({
        fieldDefId: definition.id,
        value:      serialised,
        changedBy:  cmd.userId,
      });
    }

    // Call setValue() on each aggregate in the handler so domain events are raised here,
    // not inside the repository where the mutated objects are discarded after persist.
    const mutatedAggregates: CustomFieldValue[] = [];
    for (const item of serialisedValues) {
      const existing = existingByFieldDefId.get(item.fieldDefId);
      if (existing) {
        existing.setValue(item.value, item.changedBy);
        mutatedAggregates.push(existing);
      } else {
        mutatedAggregates.push(
          CustomFieldValue.create({
            entityType: cmd.entityType,
            entityId:   cmd.entityId,
            fieldDefId: item.fieldDefId,
            value:      item.value,
            changedBy:  item.changedBy,
          }),
        );
      }
    }

    // Snapshot events BEFORE the repository write — after persist the repo returns
    // fresh toDomain() instances that carry no events.
    const allEvents = mutatedAggregates.flatMap((v) => {
      const events = [...v.domainEvents];
      v.clearEvents();
      return events;
    });

    const updatedValues = await this.valueRepo.upsertMany(
      cmd.entityType,
      cmd.entityId,
      serialisedValues,
    );

    // Publish after a successful write so events reflect committed state.
    this.eventBus.publishAll(allEvents);

    // MEDIUM-3: Deserialise stored values before returning — mirrors GetEntityFieldValuesHandler
    // so callers always receive typed, decrypted values regardless of the operation.
    return Promise.all(
      updatedValues.map(async (v) => {
        const def = definitions.find((d) => d.id === v.fieldDefId)!;
        const raw = v.value !== null
          ? await this.codec.decryptIfNeeded(v.value, def.key, def.isEncrypted)
          : null;
        const parsedValue = raw !== null ? this.codec.parse(def.fieldType, raw, def.key) : null;
        const dto = new ResolvedCustomFieldValueResponseDto();
        dto.fieldDefId        = def.id;
        dto.key               = def.key;
        dto.label             = def.label;
        dto.fieldType         = def.fieldType;
        dto.value             = parsedValue;
        dto.mandatory         = def.mandatory;
        dto.isEncrypted       = def.isEncrypted;
        dto.isHidden          = def.isHidden;
        dto.condition         = null;
        dto.dependentOptions  = null;
        dto.availableOptions  = [];
        return dto;
      }),
    );
  }
}
