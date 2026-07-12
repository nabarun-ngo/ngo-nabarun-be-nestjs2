import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GrantConnectionDto {
  @ApiProperty({
    description:
      'Logical connection key as configured in `idp.connections` (e.g. `passwordless`, `google`, `saml`).',
    example: 'passwordless',
  })
  @IsString()
  @IsNotEmpty()
  connectionKey!: string;
}
