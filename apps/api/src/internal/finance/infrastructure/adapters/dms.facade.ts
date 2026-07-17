import { Inject, Injectable } from '@nestjs/common';
import { IDocumentRepository } from '@ce/nestjs-shared-dms';

@Injectable()
export class DmsFacade {
  constructor(
    @Inject(IDocumentRepository) private readonly documentRepo: IDocumentRepository,
  ) {}

  async getDocuments(entityType: string, entityId: string): Promise<{ id: string }[]> {
    const docs = await this.documentRepo.findAllByEntity(entityType, entityId);
    return docs.map((d) => ({ id: d.id }));
  }

  async deleteFile(documentId: string): Promise<void> {
    await this.documentRepo.delete(documentId);
  }
}
