import { DomainEvent } from '@nabarun-ngo/nestjs-shared-core';

export type FormFieldUpdatedSnapshot = {
  formId: string;
  field: Record<string, unknown>;
};

/** Emitted by Form.updateField(). */
export class FormFieldUpdatedEvent extends DomainEvent<FormFieldUpdatedSnapshot> {
  constructor(snapshot: FormFieldUpdatedSnapshot) {
    super(snapshot.formId, snapshot);
  }
}
