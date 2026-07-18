import { DomainEvent } from '@nabarun-ngo/nestjs-shared-core';

export type FormFieldAddedSnapshot = {
  formId: string;
  field: Record<string, unknown>;
};

/** Emitted by Form.addField(). */
export class FormFieldAddedEvent extends DomainEvent<FormFieldAddedSnapshot> {
  constructor(snapshot: FormFieldAddedSnapshot) {
    super(snapshot.formId, snapshot);
  }
}
