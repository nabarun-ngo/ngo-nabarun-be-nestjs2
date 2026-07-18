import { DomainEvent } from '@nabarun-ngo/nestjs-shared-core';
import type { Form } from '../aggregates/form/form.aggregate';

export type FormDisabledSnapshot = Pick<Form, 'id' | 'entityType' | 'key' | 'status' | 'disabledBy'>;

/** Emitted by Form.disable(). */
export class FormDisabledEvent extends DomainEvent<FormDisabledSnapshot> {
  constructor(snapshot: FormDisabledSnapshot) {
    super(snapshot.id, snapshot);
  }
}
