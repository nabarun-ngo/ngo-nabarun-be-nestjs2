import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsObject, IsOptional, IsString } from 'class-validator';

export class StartWorkflowRequestDto {
  @ApiProperty()
  @IsString()
  definitionId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  definitionVersion?: number;

  @ApiProperty()
  @IsString()
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  context?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  initiatedForId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  idempotencyKey?: string;
}

export class CompleteUserTaskRequestDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  formValues?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  idempotencyKey?: string;
}

export class DelegateTaskRequestDto {
  @ApiProperty()
  @IsString()
  toUserId!: string;
}

export class CancelWorkflowRequestDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remarks?: string;
}

export class PublishDefinitionRequestDto {
  @ApiProperty()
  @IsObject()
  definition!: Record<string, unknown>;
}

export class ForceSkipElementRequestDto {
  @ApiProperty()
  @IsString()
  elementId!: string;
}

export class WorkflowInstanceDto {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string;
  @ApiProperty() definitionId!: string;
  @ApiProperty() definitionVersion!: number;
  @ApiProperty() status!: string;
  @ApiPropertyOptional() currentElementId?: string | null;
  @ApiProperty() context!: Record<string, unknown>;
  @ApiPropertyOptional() completedAt?: Date | null;
}

export class WorkflowInboxTaskDto {
  @ApiProperty() id!: string;
  @ApiProperty() instanceId!: string;
  @ApiProperty() elementId!: string;
  @ApiProperty() workflowType!: string;
  @ApiPropertyOptional() formKey?: string | null;
  @ApiProperty() status!: string;
  @ApiPropertyOptional() assignedToId?: string | null;
}

export class WorkflowTimelineEntryDto {
  @ApiProperty() id!: string;
  @ApiProperty() sequence!: number;
  @ApiProperty() eventType!: string;
  @ApiPropertyOptional() elementId?: string | null;
  @ApiProperty() occurredAt!: Date;
  @ApiProperty() payload!: Record<string, unknown>;
}
