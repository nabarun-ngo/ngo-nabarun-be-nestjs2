import { Body, Controller, Get, HttpCode, HttpStatus, Param, Patch, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { BasePrismaService } from '@nabarun-ngo/nestjs-shared-persistence';
import { BusinessException } from '@nabarun-ngo/nestjs-shared-core';
import { RequirePermissions, UnifiedAuthGuard } from '@nabarun-ngo/nestjs-shared-auth';
import { PrismaClient } from '../../../../shared/persistence/prisma/client';
import { TeamMemberRole } from '../../domain/enums/team-member.enum';
import { randomUUID } from 'crypto';

@ApiTags('ProjectTeam')
@ApiBearerAuth('jwt')
@ApiSecurity('api-key')
@UseGuards(UnifiedAuthGuard)
@Controller('projects/:projectId/team')
export class ProjectTeamController {
  constructor(private readonly db: BasePrismaService<PrismaClient>) { }

  @Get()
  @RequirePermissions('read:project_team')
  async list(@Param('projectId') projectId: string) {
    const items = await this.db.client.projectTeamMember.findMany({ where: { projectId, deletedAt: null }, orderBy: { startDate: 'desc' } });
    return { items, total: items.length };
  }

  @Post('add')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('create:project_team')
  async add(
    @Param('projectId') projectId: string,
    @Body() dto: { userId: string; role: TeamMemberRole; startDate: Date; responsibilities?: string; hoursAllocated?: number },
  ) {
    return this.db.client.projectTeamMember.create({
      data: {
        id: randomUUID(),
        projectId,
        userId: dto.userId,
        role: dto.role,
        startDate: new Date(dto.startDate),
        responsibilities: dto.responsibilities,
        hoursAllocated: dto.hoursAllocated,
        isActive: true,
      },
    });
  }

  @Put(':id/update')
  @RequirePermissions('update:project_team')
  async update(@Param('id') id: string, @Body() dto: { role?: TeamMemberRole; responsibilities?: string; hoursAllocated?: number }) {
    return this.db.client.projectTeamMember.update({ where: { id }, data: dto });
  }

  @Patch(':id/deactivate')
  @RequirePermissions('update:project_team')
  async deactivate(@Param('id') id: string) {
    const member = await this.db.client.projectTeamMember.findUnique({ where: { id } });
    if (!member) throw new BusinessException('Team member not found');
    return this.db.client.projectTeamMember.update({ where: { id }, data: { isActive: false, endDate: new Date() } });
  }
}
