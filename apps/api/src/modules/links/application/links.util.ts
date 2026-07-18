import { LinkItem } from '../domain/ports/links-content.port';
import { LinkGroupDto, LinkItemDto } from './dtos/links.dto';

const DEFAULT_CATEGORY = 'General';

export function toLinkItemDto(link: LinkItem): LinkItemDto {
  return {
    key: link.key,
    value: link.value,
    description: link.description,
    displayValue: link.value,
    active: link.active,
    linkType: link.linkType,
    platform: link.platform,
    category: link.category,
    tags: link.tags?.length ? link.tags : undefined,
  };
}

export function groupLinksByCategory(links: LinkItem[]): LinkGroupDto[] {
  return links.reduce<LinkGroupDto[]>((groups, link) => {
    const name = link.category || DEFAULT_CATEGORY;
    const existingGroup = groups.find((group) => group.name === name);
    if (existingGroup) {
      existingGroup.links.push(toLinkItemDto(link));
    } else {
      groups.push({ name, links: [toLinkItemDto(link)] });
    }
    return groups;
  }, []);
}
