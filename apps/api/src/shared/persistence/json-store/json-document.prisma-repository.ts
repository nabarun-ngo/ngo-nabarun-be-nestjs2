import { randomUUID } from 'crypto';
import { Injectable } from '@nestjs/common';
import {
  BasePrismaService,
  PrismaCrudRepositoryBase,
} from '@nabarun-ngo/nestjs-shared-persistence';
import { PrismaClient, Prisma } from '../prisma/client';
import {
  JsonStoreDocumentWhereInput,
  JsonStoreDocumentWhereUniqueInput,
  JsonStoreDocumentOrderByWithRelationInput,
} from '../prisma/models';
import { IJsonDocumentRepository, JsonDocumentFilter } from '@nabarun-ngo/nestjs-shared-json-store';
import { JsonDocument } from '@nabarun-ngo/nestjs-shared-json-store/domain/aggregates/json-document.aggregate';

type JsonStoreDocumentRow = {
  id: string;
  key: string;
  namespace: string;
  payload: Prisma.JsonValue;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class JsonDocumentPrismaRepository
  extends PrismaCrudRepositoryBase<
    PrismaClient,
    'jsonStoreDocument',
    JsonDocument,
    string,
    JsonDocumentFilter,
    JsonStoreDocumentRow,
    JsonStoreDocumentWhereInput,
    JsonStoreDocumentWhereUniqueInput,
    any,
    any,
    JsonStoreDocumentOrderByWithRelationInput
  >
  implements IJsonDocumentRepository {
  constructor(database: BasePrismaService<PrismaClient>) {
    super(database, 'jsonStoreDocument');
  }

  // ── IJsonDocumentRepository custom methods ─────────────────────────────────

  async findByKey(key: string, namespace: string): Promise<JsonDocument | null> {
    const row = await (this.client).jsonStoreDocument.findUnique({
      where: { json_store_key_namespace_unique: { key, namespace } },
    });
    return row ? this.toDomain(row as JsonStoreDocumentRow) : null;
  }

  async findByNamespace(namespace: string): Promise<JsonDocument[]> {
    const rows = await (this.client).jsonStoreDocument.findMany({
      where: { namespace },
      orderBy: { key: 'asc' },
    });
    return (rows as JsonStoreDocumentRow[]).map((row) => this.toDomain(row));
  }

  async upsertByKey(
    key: string,
    namespace: string,
    payload: Record<string, unknown>,
  ): Promise<{ document: JsonDocument; wasCreated: boolean; payloadChanged: boolean }> {
    // LOW-1: Fetch the existing document before upserting so we can compare payloads and
    // skip event publication when nothing changed.
    const existingRow = await (this.client).jsonStoreDocument.findUnique({
      where: { json_store_key_namespace_unique: { key, namespace } },
    }) as JsonStoreDocumentRow | null;

    const payloadChanged =
      existingRow === null ||
      JSON.stringify(existingRow.payload) !== JSON.stringify(payload);

    const newId = randomUUID();
    const now = new Date();

    const row = await (this.client).jsonStoreDocument.upsert({
      where: { json_store_key_namespace_unique: { key, namespace } },
      create: {
        id: newId,
        key,
        namespace,
        payload: this.toInputJson(payload),
        createdAt: now,
        updatedAt: now,
      },
      update: { payload: this.toInputJson(payload), updatedAt: now },
    });

    return {
      document: this.toDomain(row as JsonStoreDocumentRow),
      wasCreated: (row as JsonStoreDocumentRow).id === newId,
      payloadChanged,
    };
  }

  // ── PrismaCrudRepositoryBase mapping hooks ─────────────────────────────────

  protected toDomain(row: JsonStoreDocumentRow): JsonDocument {
    return new JsonDocument(
      row.id,
      row.key,
      row.namespace,
      (row.payload ?? {}) as Record<string, unknown>,
      row.createdAt,
      row.updatedAt,
    );
  }

  protected toCreateInput(entity: JsonDocument): any {
    return {
      id: entity.id,
      key: entity.key,
      namespace: entity.namespace,
      payload: entity.payload,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  protected toUpdateInput(_id: string, entity: JsonDocument): any {
    return {
      payload: entity.payload,
      updatedAt: entity.updatedAt,
    };
  }

  protected toUniqueWhere(id: string): JsonStoreDocumentWhereUniqueInput {
    return { id };
  }

  protected toFilterWhere(filter?: JsonDocumentFilter): JsonStoreDocumentWhereInput {
    return {
      ...(filter?.namespace ? { namespace: filter.namespace } : {}),
      ...(filter?.key ? { key: filter.key } : {}),
    };
  }

  protected defaultOrderBy(): JsonStoreDocumentOrderByWithRelationInput {
    return { createdAt: 'desc' };
  }

  protected supportsSoftDelete(): boolean {
    return false;
  }

  private toInputJson(payload: Record<string, unknown>): Prisma.InputJsonValue {
    return JSON.parse(JSON.stringify(payload)) as Prisma.InputJsonValue;
  }
}
