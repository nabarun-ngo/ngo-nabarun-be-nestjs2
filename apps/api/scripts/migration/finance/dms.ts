/**
 * Finance migration ETL: document_references → dms_document_reference, document_mappings → dms_document_mapping
 * Run: npx ts-node scripts/migration/finance/dms.ts
 */
import { batchUpsert, closeEtlContext, createEtlContext, log } from './etl-utils';

async function main(): Promise<void> {
  const ctx = await createEtlContext();
  log('dms', 'starting', { dryRun: ctx.dryRun });

  try {
    const { rows: docRefs } = await ctx.source.query<{
      id: string;
      fileName: string;
      remotePath: string;
      publicToken: string;
      contentType: string;
      fileSize: number;
      isPublic: boolean;
      createdAt: Date;
      uploadedById: string | null;
    }>(`
      SELECT id, "fileName", "remotePath", "publicToken", "contentType", "fileSize",
             "isPublic", "createdAt", "uploadedById"
      FROM document_references
    `);

    const refRows = docRefs.map((r) => ({
      id: r.id,
      fileName: r.fileName,
      remotePath: r.remotePath,
      publicToken: r.publicToken,
      contentType: r.contentType,
      fileSize: r.fileSize,
      isPublic: r.isPublic,
      uploadedById: r.uploadedById,
      storageOwnerSub: null,
      createdAt: r.createdAt,
      updatedAt: r.createdAt,
      deletedAt: null,
    }));

    const refColumns = [
      'id', 'fileName', 'remotePath', 'publicToken', 'contentType', 'fileSize',
      'isPublic', 'uploadedById', 'storageOwnerSub', 'createdAt', 'updatedAt', 'deletedAt',
    ];
    const refsUpserted = await batchUpsert(ctx, 'dms_document_reference', refColumns, refRows);
    log('dms', `dms_document_reference: ${refsUpserted} rows`);

    const { rows: mappings } = await ctx.source.query<{
      id: string;
      documentReferenceId: string;
      entityType: string;
      entityId: string;
      createdAt: Date;
    }>(`
      SELECT id, "documentReferenceId", "entityType", "entityId", "createdAt"
      FROM document_mappings
    `);

    const mapColumns = ['id', 'documentReferenceId', 'entityId', 'entityType', 'createdAt'];
    const mapsUpserted = await batchUpsert(ctx, 'dms_document_mapping', mapColumns, mappings);
    log('dms', `dms_document_mapping: ${mapsUpserted} rows`, { dryRun: ctx.dryRun });

    log('dms', 'complete');
  } finally {
    await closeEtlContext(ctx);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
