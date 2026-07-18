import { AppLinkPlatform, LinkOpenType } from '../../links.schema';

export interface LinkItem {
  key: string;
  value: string;
  description?: string;
  category?: string;
  linkType: LinkOpenType;
  platform?: AppLinkPlatform;
  tags?: string[];
  active: boolean;
}

export const ILinksContentPort = Symbol('ILinksContentPort');

export interface ILinksContentPort {
  getUserGuides(): Promise<LinkItem[]>;
  getPolicies(): Promise<LinkItem[]>;
  getAppLinks(): Promise<LinkItem[]>;
}
