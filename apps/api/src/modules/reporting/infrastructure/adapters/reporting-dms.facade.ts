import { Inject, Injectable } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { IDocumentRepository } from '@ce/nestjs-shared-dms';
import { UploadDocumentCommand } from '@ce/nestjs-shared-dms/application/commands/upload-document/upload-document.command';

@Injectable()
export class ReportingDmsFacade {
  constructor(
    private readonly commandBus: CommandBus,
    @Inject(IDocumentRepository) private readonly documentRepo: IDocumentRepository,
  ) {}

  async uploadReportDocument(params: {
    buffer: Buffer;
    fileName: string;
    contentType: string;
    reportId: string;
    userId: string;
    userPermissions: string[];
  }): Promise<string> {
    const result = await this.commandBus.execute(
      new UploadDocumentCommand(
        params.buffer,
        params.fileName,
        params.contentType,
        [{ entityType: 'report', entityId: params.reportId }],
        'PRIVATE',
        params.userId,
        params.userPermissions,
      ),
    );
    return result.id;
  }

  async getDocuments(reportId: string): Promise<{ id: string }[]> {
    const docs = await this.documentRepo.findAllByEntity('report', reportId);
    return docs.map((d) => ({ id: d.id }));
  }

  async deleteDocuments(documentIds: string[]): Promise<void> {
    for (const id of documentIds) {
      await this.documentRepo.delete(id);
    }
  }
}
