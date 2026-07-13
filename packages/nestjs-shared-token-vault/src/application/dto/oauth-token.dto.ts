import { ApiProperty } from '@nestjs/swagger';
import { IsDate, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class OAuthAccountDto {
  @ApiProperty()
  @IsString()
  id: string;

  @ApiProperty()
  @IsString()
  provider: string;

  @ApiProperty()
  @IsString()
  email: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  externalId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  givenName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  familyName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  pictureUrl?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  locale?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class OAuthTokenDto {
  @ApiProperty()
  @IsString()
  id: string;

  @ApiProperty()
  @IsString()
  accountId: string;

  @ApiProperty()
  @IsString()
  clientId: string;

  @ApiProperty()
  @IsString()
  provider: string;

  @ApiProperty()
  @IsString()
  email: string;

  @ApiProperty({ required: false, type: () => OAuthAccountDto })
  @IsOptional()
  account?: OAuthAccountDto;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDate()
  expiresAt?: Date;

  @ApiProperty({ required: false, isArray: true, type: String })
  @IsOptional()
  scope?: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  tokenType?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class AuthUrlResponseDto {
  @ApiProperty({ description: 'OAuth authorization URL to redirect the user to.' })
  url: string;

  @ApiProperty({ description: 'Server-generated CSRF state token. Include in the callback redirect.' })
  state: string;
}

export class AuthCallbackDto {
  @IsString()
  @MinLength(10)
  @MaxLength(500)
  @ApiProperty({ description: 'OAuth authorization code returned by the provider.', minLength: 10, maxLength: 500 })
  code: string;

  @IsString()
  @MinLength(10)
  @MaxLength(200)
  @ApiProperty({ description: 'State parameter for CSRF protection.', minLength: 10, maxLength: 200 })
  state: string;
}
