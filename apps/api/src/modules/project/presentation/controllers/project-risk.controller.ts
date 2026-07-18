import { Body, Controller, Get, HttpCode, HttpStatus, Param, Patch, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { BasePrismaService } from '@nabarun-ngo/nestjs-shared-persistence';
import { BusinessException } from '@nabarun-ngo/nestjs-shared-core';
import { RequirePermissions, UnifiedAuthGuard } from '@nabarun-ngo/nestjs-shared-auth';
import { PrismaClient } from '../../../../shared/persistence/prisma/client';
import { RiskCategory, RiskProbability, RiskSeverity, RiskStatus } from '../../domain/enums/risk.enum';
import { randomUUID } from 'crypto';

@ApiTags('ProjectRisk')
@ApiBearerAuth('jwt')
@ApiSecurity('api-key')
@UseGuards(UnifiedAuthGuard)
@Controller('projects/:projectId/risks')
export class ProjectRiskController {
  constructor(private readonly db: BasePrismaService<PrismaClient>) { }

  @Get()
  @RequirePermissions('read:risk')
  async list(@Param('projectId') projectId: string) {
    const items = await this.db.client.projectRisk.findMany({ where: { projectId, deletedAt: null }, orderBy: { identifiedDate: 'desc' } });
    return { items, total: items.length };
  }

  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('create:risk')
  async create(
    @Param('projectId') projectId: string,
    @Body()
    dto: {
      title: string;
      category: RiskCategory;
      severity: RiskSeverity;
      probability: RiskProbability;
      identifiedDate: Date;
      description?: string;
      impact?: string;
      mitigationPlan?: string;
      ownerId?: string;
    },
  ) {
    return this.db.client.projectRisk.create({
      data: {
        id: randomUUID(),
        projectId,
        title: dto.title,
        category: dto.category,
        severity: dto.severity,
        probability: dto.probability,
        identifiedDate: new Date(dto.identifiedDate),
        description: dto.description,
        impact: dto.impact,
        mitigationPlan: dto.mitigationPlan,
        ownerId: dto.ownerId,
        status: RiskStatus.IDENTIFIED,
      },
    });
  }

  @Put(':id/update')
  @RequirePermissions('update:risk')
  async update(
    @Param('id') id: string,
    @Body() dto: { title?: string; severity?: RiskSeverity; probability?: RiskProbability; mitigationPlan?: string; status?: RiskStatus },
  ) {
    return this.db.client.projectRisk.update({ where: { id }, data: dto });
  }

  @Patch(':id/resolve')
  @RequirePermissions('update:risk')
  async resolve(@Param('id') id: string) {
    const risk = await this.db.client.projectRisk.findUnique({ where: { id } });
    if (!risk) throw new BusinessException('Risk not found');
    if ((risk.severity === RiskSeverity.HIGH || risk.severity === RiskSeverity.CRITICAL) && !risk.mitigationPlan) {
      throw new BusinessException('Mitigation plan required for high/critical risks');
    }
    return this.db.client.projectRisk.update({ where: { id }, data: { status: RiskStatus.CLOSED, resolvedDate: new Date() } });
  }
}
