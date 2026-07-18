import { Body, Controller, Get, HttpCode, HttpStatus, Param, Patch, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { BasePrismaService } from '@nabarun-ngo/nestjs-shared-persistence';
import { BusinessException } from '@nabarun-ngo/nestjs-shared-core';
import { RequirePermissions, UnifiedAuthGuard } from '@nabarun-ngo/nestjs-shared-auth';
import { PrismaClient } from '../../../../shared/persistence/prisma/client';
import { MilestoneImportance, MilestoneStatus } from '../../domain/enums/milestone.enum';
import { randomUUID } from 'crypto';

@ApiTags('Milestone')
@ApiBearerAuth('jwt')
@ApiSecurity('api-key')
@UseGuards(UnifiedAuthGuard)
@Controller('projects/:projectId/milestones')
export class MilestoneController {
  constructor(private readonly db: BasePrismaService<PrismaClient>) { }

  @Get()
  @RequirePermissions('read:milestone')
  async list(@Param('projectId') projectId: string) {
    const items = await this.db.client.milestone.findMany({ where: { projectId, deletedAt: null }, orderBy: { targetDate: 'asc' } });
    return { items, total: items.length };
  }

  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('create:milestone')
  async create(
    @Param('projectId') projectId: string,
    @Body() dto: { name: string; targetDate: Date; importance: MilestoneImportance; description?: string },
  ) {
    return this.db.client.milestone.create({
      data: {
        id: randomUUID(),
        projectId,
        name: dto.name,
        targetDate: new Date(dto.targetDate),
        importance: dto.importance,
        description: dto.description,
        status: MilestoneStatus.PENDING,
        dependencies: [],
      },
    });
  }

  @Put(':id/update')
  @RequirePermissions('update:milestone')
  async update(@Param('id') id: string, @Body() dto: { name?: string; targetDate?: Date; importance?: MilestoneImportance; description?: string }) {
    return this.db.client.milestone.update({ where: { id }, data: { ...dto, targetDate: dto.targetDate ? new Date(dto.targetDate) : undefined } });
  }

  @Patch(':id/complete')
  @RequirePermissions('update:milestone')
  async complete(@Param('id') id: string) {
    const m = await this.db.client.milestone.findUnique({ where: { id } });
    if (!m) throw new BusinessException('Milestone not found');
    return this.db.client.milestone.update({ where: { id }, data: { status: MilestoneStatus.ACHIEVED, actualDate: new Date() } });
  }
}
