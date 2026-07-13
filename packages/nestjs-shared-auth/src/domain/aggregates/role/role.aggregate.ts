import { randomUUID } from 'crypto';
import { AggregateRoot } from '@ce/nestjs-shared-core';

export class RoleFilter {
  key?: string;
  isActive?: boolean;
}

export class Role extends AggregateRoot<string> {
  readonly #key: string;
  #description?: string;
  #deletedAt?: Date;
  #permissionKeys: string[];

  constructor(data: {
    id: string;
    key: string;
    description?: string;
    deletedAt?: Date;
    permissionKeys?: string[];
    createdAt?: Date;
    updatedAt?: Date;
  }) {
    super(data.id, data.createdAt, data.updatedAt);
    this.#key = data.key;
    this.#description = data.description;
    this.#deletedAt = data.deletedAt;
    this.#permissionKeys = data.permissionKeys ?? [];
  }

  static create(data: { key: string; description?: string }): Role {
    return new Role({ id: randomUUID(), key: data.key, description: data.description });
  }

  softDelete(): void {
    if (this.#deletedAt) return;
    this.#deletedAt = new Date();
    this.touch();
  }

  withPermissionKeys(keys: string[]): void {
    this.#permissionKeys = keys;
  }

  isDeleted(): boolean {
    return !!this.#deletedAt;
  }

  get key(): string { return this.#key; }
  get description(): string | undefined { return this.#description; }
  get deletedAt(): Date | undefined { return this.#deletedAt; }
  get permissionKeys(): string[] { return this.#permissionKeys; }
}
