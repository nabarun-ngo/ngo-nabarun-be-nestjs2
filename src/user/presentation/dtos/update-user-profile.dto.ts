import {
  IsString,
  IsOptional,
  IsBoolean,
  IsDateString,
  ValidateNested,
  IsArray,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class PhoneNumberInputDto {
  @ApiPropertyOptional()
  @IsString()
  phoneCode!: string;

  @ApiPropertyOptional()
  @IsString()
  phoneNumber!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  hidden?: boolean;
}

export class AddressInputDto {
  @ApiPropertyOptional()
  @IsString()
  addressLine1!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  addressLine2?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  addressLine3?: string;

  @ApiPropertyOptional()
  @IsString()
  hometown!: string;

  @ApiPropertyOptional()
  @IsString()
  zipCode!: string;

  @ApiPropertyOptional()
  @IsString()
  state!: string;

  @ApiPropertyOptional()
  @IsString()
  district!: string;

  @ApiPropertyOptional()
  @IsString()
  country!: string;
}

export class SocialLinkInputDto {
  @ApiPropertyOptional()
  @IsString()
  linkName!: string;

  @ApiPropertyOptional()
  @IsString()
  linkType!: string;

  @ApiPropertyOptional()
  @IsString()
  linkValue!: string;
}

export class UpdateUserProfileDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  middleName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  gender?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  about?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  picture?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isSameAddress?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateNested()
  @Type(() => PhoneNumberInputDto)
  primaryPhone?: PhoneNumberInputDto;

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateNested()
  @Type(() => PhoneNumberInputDto)
  secondaryPhone?: PhoneNumberInputDto;

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateNested()
  @Type(() => AddressInputDto)
  presentAddress?: AddressInputDto;

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateNested()
  @Type(() => AddressInputDto)
  permanentAddress?: AddressInputDto;

  @ApiPropertyOptional({ type: [SocialLinkInputDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SocialLinkInputDto)
  socialMediaLinks?: SocialLinkInputDto[];
}
