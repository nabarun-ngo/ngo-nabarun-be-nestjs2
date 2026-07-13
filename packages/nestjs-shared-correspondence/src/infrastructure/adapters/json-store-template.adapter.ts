import { Injectable } from '@nestjs/common';
import { JsonStoreFacade } from '@ce/nestjs-shared-json-store';
import { ITemplatePort, EmailTemplateData } from '../../domain/ports/template.port';

const JSON_STORE_NAMESPACE = 'correspondence';

/**
 * Implements ITemplatePort using JsonStore as the backing store.
 * Templates are stored as JSON documents keyed by (templateKey, 'correspondence').
 * Expected JSON shape: { subject, htmlTemplate, textTemplate?, defaultData? }
 */
@Injectable()
export class JsonStoreTemplateAdapter implements ITemplatePort {
  constructor(private readonly jsonStore: JsonStoreFacade) {}

  async findByKey(key: string): Promise<EmailTemplateData | null> {
    const payload = await this.jsonStore.get(key, JSON_STORE_NAMESPACE);
    if (!payload) return null;
    if (!payload['htmlTemplate']) return null;

    return {
      subject: (payload['subject'] as string) ?? '',
      htmlTemplate: payload['htmlTemplate'] as string,
      textTemplate: payload['textTemplate'] as string | undefined,
      defaultData: payload['defaultData'] as Record<string, any> | undefined,
    };
  }
}
