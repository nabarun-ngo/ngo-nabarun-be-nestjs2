import { Injectable, Logger } from '@nestjs/common';
import { JsonStoreFacade } from '@ce/nestjs-shared-json-store';
import {
  EmailTemplatePayloadSchema,
  ITemplatePort,
  EmailTemplateData,
  TEMPLATE_PORT,
} from '@ce/nestjs-shared-correspondence';

const JSON_STORE_NAMESPACE = 'correspondence';

@Injectable()
export class JsonStoreTemplateAdapter implements ITemplatePort {
  private readonly logger = new Logger(JsonStoreTemplateAdapter.name);

  constructor(private readonly jsonStore: JsonStoreFacade) {}

  async findByKey(key: string): Promise<EmailTemplateData | null> {
    const payload = await this.jsonStore.get(key, JSON_STORE_NAMESPACE);
    if (!payload) return null;

    const parsed = EmailTemplatePayloadSchema.safeParse(payload);
    if (!parsed.success) {
      this.logger.warn(
        `Invalid correspondence template payload for ${JSON_STORE_NAMESPACE}/${key}`,
      );
      return null;
    }

    return {
      subject: parsed.data.subject,
      htmlTemplate: parsed.data.htmlTemplate,
      textTemplate: parsed.data.textTemplate,
      defaultData: parsed.data.defaultData,
    };
  }
}

export const TEMPLATE_PORT_PROVIDER = {
  provide: TEMPLATE_PORT,
  useClass: JsonStoreTemplateAdapter,
};
