import { randomUUID } from 'crypto';
import { AggregateRoot } from '@ce/nestjs-shared-core';
import { CustomFieldType } from '../../enums/custom-field-type.enum';
import { FieldOption } from '../../value-objects/field-option/field-option.vo';
import { FieldCondition } from '../../value-objects/field-condition/field-condition.vo';
import { DependentOptions } from '../../value-objects/dependent-options/dependent-options.vo';
import { CustomFieldDefinitionCreatedEvent, type CustomFieldDefinitionCreatedSnapshot } from '../../events/custom-field-definition-created.event';
import { CustomFieldDefinitionUpdatedEvent, type CustomFieldDefinitionUpdatedSnapshot } from '../../events/custom-field-definition-updated.event';
import { CustomFieldDefinitionDeactivatedEvent, type CustomFieldDefinitionDeactivatedSnapshot } from '../../events/custom-field-definition-deactivated.event';

export class CustomFieldDefinition extends AggregateRoot<string> {
  #entityType: string;
  #key: string;
  #label: string;
  #fieldType: CustomFieldType;
  #mandatory: boolean;
  #fieldOptions: FieldOption[];
  #isHidden: boolean;
  #isEncrypted: boolean;
  #active: boolean;
  #sortOrder: number;
  #condition: FieldCondition | null;
  #dependentOptions: DependentOptions | null;
  #viewPermissions: string[];
  #createdBy?: string;
  #deactivatedBy?: string;

  constructor(
    id: string,
    entityType: string,
    key: string,
    label: string,
    fieldType: CustomFieldType,
    mandatory: boolean,
    fieldOptions: FieldOption[],
    isHidden: boolean,
    isEncrypted: boolean,
    active: boolean,
    sortOrder: number,
    condition: FieldCondition | null,
    dependentOptions: DependentOptions | null,
    createdAt?: Date,
    updatedAt?: Date,
    createdBy?: string,
    deactivatedBy?: string,
    viewPermissions: string[] = [],
  ) {
    super(id, createdAt, updatedAt);
    this.#entityType       = entityType;
    this.#key              = key;
    this.#label            = label;
    this.#fieldType        = fieldType;
    this.#mandatory        = mandatory;
    this.#fieldOptions     = fieldOptions;
    this.#isHidden         = isHidden;
    this.#isEncrypted      = isEncrypted;
    this.#active           = active;
    this.#sortOrder        = sortOrder;
    this.#condition        = condition;
    this.#dependentOptions = dependentOptions;
    this.#viewPermissions  = viewPermissions;
    this.#createdBy        = createdBy;
    this.#deactivatedBy    = deactivatedBy;
  }

  static create(params: {
    entityType: string;
    key: string;
    label: string;
    fieldType: CustomFieldType;
    mandatory?: boolean;
    fieldOptions?: FieldOption[];
    isHidden?: boolean;
    isEncrypted?: boolean;
    sortOrder?: number;
    condition?: FieldCondition | null;
    dependentOptions?: DependentOptions | null;
    createdBy?: string;
    viewPermissions?: string[];
  }): CustomFieldDefinition {
    const definition = new CustomFieldDefinition(
      randomUUID(),
      params.entityType,
      params.key,
      params.label,
      params.fieldType,
      params.mandatory ?? false,
      params.fieldOptions ?? [],
      params.isHidden ?? false,
      params.isEncrypted ?? false,
      true,
      params.sortOrder ?? 0,
      params.condition ?? null,
      params.dependentOptions ?? null,
      undefined,
      undefined,
      params.createdBy,
      undefined,
      params.viewPermissions ?? [],
    );
    definition.addDomainEvent(new CustomFieldDefinitionCreatedEvent(definition.toSnapshot<CustomFieldDefinitionCreatedSnapshot>()));
    return definition;
  }

  update(patch: {
    label?: string;
    fieldType?: CustomFieldType;
    mandatory?: boolean;
    fieldOptions?: FieldOption[];
    isHidden?: boolean;
    isEncrypted?: boolean;
    active?: boolean;
    sortOrder?: number;
    condition?: FieldCondition | null;
    dependentOptions?: DependentOptions | null;
    viewPermissions?: string[];
  }): void {
    if (patch.label !== undefined)     this.#label     = patch.label;
    if (patch.fieldType !== undefined) this.#fieldType = patch.fieldType;
    if (patch.mandatory !== undefined) this.#mandatory = patch.mandatory;
    if (patch.fieldOptions !== undefined) this.#fieldOptions = patch.fieldOptions;
    if (patch.isHidden !== undefined)  this.#isHidden  = patch.isHidden;
    if (patch.isEncrypted !== undefined) this.#isEncrypted = patch.isEncrypted;
    if (patch.active !== undefined)    this.#active    = patch.active;
    if (patch.sortOrder !== undefined) this.#sortOrder = patch.sortOrder;
    if ('condition' in patch)           this.#condition         = patch.condition ?? null;
    if ('dependentOptions' in patch)    this.#dependentOptions  = patch.dependentOptions ?? null;
    if (patch.viewPermissions !== undefined) this.#viewPermissions = patch.viewPermissions;
    this.touch();
    this.addDomainEvent(new CustomFieldDefinitionUpdatedEvent(this.toSnapshot<CustomFieldDefinitionUpdatedSnapshot>()));
  }

  /** Soft-deactivates the definition. Idempotent if already inactive. */
  deactivate(deactivatedBy?: string): void {
    if (!this.#active) return;
    this.#active = false;
    this.#deactivatedBy = deactivatedBy;
    this.touch();
    this.addDomainEvent(new CustomFieldDefinitionDeactivatedEvent(this.toSnapshot<CustomFieldDefinitionDeactivatedSnapshot>()));
  }

  /** Updates sort order only — used by BulkUpdateSortOrderHandler. */
  updateSortOrder(sortOrder: number): void {
    if (this.#sortOrder === sortOrder) return;
    this.#sortOrder = sortOrder;
    this.touch();
  }

  get entityType(): string                           { return this.#entityType; }
  get key(): string                                  { return this.#key; }
  get label(): string                                { return this.#label; }
  get fieldType(): CustomFieldType                   { return this.#fieldType; }
  get mandatory(): boolean                           { return this.#mandatory; }
  get fieldOptions(): ReadonlyArray<FieldOption>     { return this.#fieldOptions; }
  get isHidden(): boolean                            { return this.#isHidden; }
  get isEncrypted(): boolean                         { return this.#isEncrypted; }
  get active(): boolean                              { return this.#active; }
  get sortOrder(): number                            { return this.#sortOrder; }
  get condition(): FieldCondition | null             { return this.#condition; }
  get dependentOptions(): DependentOptions | null    { return this.#dependentOptions; }
  get viewPermissions(): ReadonlyArray<string>       { return this.#viewPermissions; }
  get createdBy(): string | undefined               { return this.#createdBy; }
  get deactivatedBy(): string | undefined           { return this.#deactivatedBy; }
}
