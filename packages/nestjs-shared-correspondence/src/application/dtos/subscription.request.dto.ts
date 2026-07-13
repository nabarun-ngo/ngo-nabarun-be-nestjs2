import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ChannelType } from '../../domain/enums/channel-type.enum';
import { EmailRole } from '../../domain/enums/email-role.enum';
import { SubscribedVia } from '../../domain/enums/subscribed-via.enum';

export class ChannelConfigDto {
  @ApiProperty({ enum: ChannelType })
  @IsEnum(ChannelType)
  channel: ChannelType;

  @ApiProperty()
  @IsBoolean()
  enabled: boolean;

  @ApiPropertyOptional({ enum: EmailRole })
  @IsOptional()
  @IsEnum(EmailRole)
  emailRole?: EmailRole;
}

export class SubscribeUserRequestDto {
  @ApiProperty()
  @IsString()
  resourceType: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  resourceId?: string;

  @ApiPropertyOptional({ enum: SubscribedVia })
  @IsOptional()
  @IsEnum(SubscribedVia)
  via?: SubscribedVia;

  @ApiPropertyOptional({ type: [ChannelConfigDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChannelConfigDto)
  channels?: ChannelConfigDto[];
}

export class UpdateChannelConfigRequestDto {
  @ApiProperty({ enum: ChannelType })
  @IsEnum(ChannelType)
  channel: ChannelType;

  @ApiProperty()
  @IsBoolean()
  enabled: boolean;

  @ApiPropertyOptional({ enum: EmailRole })
  @IsOptional()
  @IsEnum(EmailRole)
  emailRole?: EmailRole;
}
