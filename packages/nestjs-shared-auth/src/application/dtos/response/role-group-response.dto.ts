import { ApiProperty } from '@nestjs/swagger';

export class RoleGroupResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() key: string;
  @ApiProperty({ required: false }) description?: string;
  @ApiProperty({ type: [String] }) roleKeys: string[];
  @ApiProperty() createdAt: Date;
}
