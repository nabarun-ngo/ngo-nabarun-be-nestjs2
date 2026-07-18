import { Injectable, Logger } from '@nestjs/common';
import { JsonStoreFacade } from '@ce/nestjs-shared-json-store';
import { ILinksContentPort, LinkItem } from '../../domain/ports/links-content.port';
import { AppLinksPayloadSchema, ContentLinksPayloadSchema } from '../../links.schema';

@Injectable()
export class LinksContentAdapter implements ILinksContentPort {
  private static readonly NAMESPACE = 'links';
  private readonly logger = new Logger(LinksContentAdapter.name);

  constructor(private readonly jsonStore: JsonStoreFacade) {}

  getUserGuides(): Promise<LinkItem[]> {
    return this.loadContentLinks('user-guides');
  }

  getPolicies(): Promise<LinkItem[]> {
    return this.loadContentLinks('policies');
  }

  getAppLinks(): Promise<LinkItem[]> {
    return this.loadAppLinks();
  }

  private async loadContentLinks(key: string): Promise<LinkItem[]> {
    const payload = await this.jsonStore.get(key, LinksContentAdapter.NAMESPACE);
    if (!payload) return [];
    const parsed = ContentLinksPayloadSchema.safeParse(payload);
    if (!parsed.success) {
      this.logger.warn(`Invalid links/${key} payload: ${parsed.error.message}`);
      return [];
    }
    return parsed.data.items.map((item) => ({
      key: item.key,
      value: item.value,
      description: item.description,
      category: item.category,
      linkType: item.linkType,
      tags: item.tags,
      active: item.active ?? true,
    }));
  }

  private async loadAppLinks(): Promise<LinkItem[]> {
    const payload = await this.jsonStore.get('app-links', LinksContentAdapter.NAMESPACE);
    if (!payload) return [];
    const parsed = AppLinksPayloadSchema.safeParse(payload);
    if (!parsed.success) {
      this.logger.warn(`Invalid links/app-links payload: ${parsed.error.message}`);
      return [];
    }
    return parsed.data.items.map((item) => ({
      key: item.key,
      value: item.value,
      description: item.description,
      linkType: item.linkType,
      platform: item.platform,
      tags: item.tags,
      active: item.active ?? true,
    }));
  }
}
