import { randomUUID } from 'crypto';
import { BaseDomain } from '@ce/nestjs-shared-core';

export class DocumentMapping extends BaseDomain<string> {
  #refId: string;
  #refType: string;

  constructor(id: string, refId: string, refType: string, createdAt?: Date, updatedAt?: Date) {
    super(id, createdAt, updatedAt);
    this.#refId = refId;
    this.#refType = refType;
  }

  static create(params: { refId: string; refType: string }): DocumentMapping {
    return new DocumentMapping(randomUUID(), params.refId, params.refType);
  }

  get refId(): string {
    return this.#refId;
  }

  get refType(): string {
    return this.#refType;
  }
}
