import { randomUUID } from 'crypto';
import { AggregateRoot } from '@nabarun-ngo/nestjs-shared-core';

export class RoleGroupFilter {
  key?: string;
  isActive?: boolean;
}

export class RoleGroup extends AggregateRoot<string> {
  readonly #key: string;
  #description?: string;
  #deletedAt?: Date;
  #roleKeys: string[];

  constructor(data: {
    id: string;
    key: string;
    description?: string;
    deletedAt?: Date;
    roleKeys?: string[];
    createdAt?: Date;
    updatedAt?: Date;
  }) {
    super(data.id, data.createdAt, data.updatedAt);
    this.#key = data.key;
    this.#description = data.description;
    this.#deletedAt = data.deletedAt;
    this.#roleKeys = data.roleKeys ?? [];
  }

  static create(data: { key: string; description?: string }): RoleGroup {
    return new RoleGroup({ id: randomUUID(), key: data.key, description: data.description });
  }

  softDelete(): void {
    if (this.#deletedAt) return;
    this.#deletedAt = new Date();
    this.touch();
  }

  withRoleKeys(keys: string[]): void {
    this.#roleKeys = keys;
  }

  isDeleted(): boolean {
    return !!this.#deletedAt;
  }

  get key(): string { return this.#key; }
  get description(): string | undefined { return this.#description; }
  get deletedAt(): Date | undefined { return this.#deletedAt; }
  get roleKeys(): string[] { return this.#roleKeys; }
}
