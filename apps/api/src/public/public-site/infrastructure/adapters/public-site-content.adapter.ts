import { Injectable } from '@nestjs/common';
import { JsonStoreFacade } from '@ce/nestjs-shared-json-store';

@Injectable()
export class PublicSiteContentAdapter {
  constructor(private readonly jsonStore: JsonStoreFacade) {}

  async getStaticContent(): Promise<Record<string, unknown>> {
    const payload = await this.jsonStore.get('static', 'public-site');
    if (!payload) {
      throw new Error('Public site static content is not configured');
    }
    return payload;
  }

  async getDynamicContent(): Promise<Record<string, unknown>> {
    const payload = await this.jsonStore.get('dynamic', 'public-site');
    if (!payload) {
      throw new Error('Public site dynamic content is not configured');
    }
    return payload;
  }
}
