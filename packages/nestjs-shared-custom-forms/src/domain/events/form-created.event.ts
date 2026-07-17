import { DomainEvent } from '@ce/nestjs-shared-core';
import type { Form } from '../aggregates/form/form.aggregate';

export type FormCreatedSnapshot = Pick<
  Form,
  'id' | 'entityType' | 'key' | 'label' | 'status' | 'managePermissions' | 'readPermissions' | 'writePermissions'
>;

/** Emitted by Form.create(). */
export class FormCreatedEvent extends DomainEvent<FormCreatedSnapshot> {
  constructor(snapshot: FormCreatedSnapshot) {
    super(snapshot.id, snapshot);
  }
}
