import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { APP_LINK_PLATFORMS, LINK_OPEN_TYPES } from '../../links.schema';

export class LinkItemDto {
  @ApiProperty() key!: string;
  @ApiProperty() value!: string;
  @ApiPropertyOptional() description?: string;
  @ApiProperty() displayValue!: string;
  @ApiProperty() active!: boolean;
  @ApiProperty({
    enum: LINK_OPEN_TYPES,
    description: 'INTERNAL = open in-app; EXTERNAL = open in browser or external app',
  })
  linkType!: string;
  @ApiPropertyOptional({ description: 'UI section grouping (user guides and policies)' })
  category?: string;
  @ApiPropertyOptional({
    enum: APP_LINK_PLATFORMS,
    description: 'App-link platform filter key (app links only)',
  })
  platform?: string;
  @ApiPropertyOptional({ type: String, isArray: true, description: 'Cross-cutting facets for filter/search' })
  tags?: string[];
}

export class LinkGroupDto {
  @ApiProperty({ description: 'Category name used to group links in the UI' })
  name!: string;
  @ApiProperty({ type: LinkItemDto, isArray: true }) links!: LinkItemDto[];
}
