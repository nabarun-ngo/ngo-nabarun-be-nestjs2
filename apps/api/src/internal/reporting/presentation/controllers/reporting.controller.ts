import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  NotFoundException,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { CurrentUser, RequirePermissions, UnifiedAuthGuard } from '@ce/nestjs-shared-auth';
import type { AuthUser } from '@ce/nestjs-shared-auth';
import { ReportGenerationService } from '../../application/services/report-generation.service';
import { ReportRegistryService } from '../../application/services/report-registry.service';
import { IReportDefinitionsPort } from '../../domain/ports/report-definitions.port';
import { IReportRepository } from '../../domain/repositories/report.repository';
import {
  ReportCategoryDto,
  ReportDetailDto,
  ReportFilterDto,
  ReportInputFieldDto,
  ReportMapper,
} from '../../application/dtos/report.dto';
import { ReportStatus } from '../../domain/enums/report-status.enum';

@ApiTags('Report')
@ApiBearerAuth('jwt')
@ApiSecurity('api-key')
@UseGuards(UnifiedAuthGuard)
@Controller('report')
export class ReportingController {
  constructor(
    private readonly reportGenerationService: ReportGenerationService,
    private readonly registry: ReportRegistryService,
    @Inject(IReportDefinitionsPort) private readonly definitionsPort: IReportDefinitionsPort,
    @Inject(IReportRepository) private readonly reportRepository: IReportRepository,
  ) {}

  @Get('registered-reports')
  @RequirePermissions('read:reports')
  async getRegisteredReports(): Promise<ReportCategoryDto[]> {
    const definitions = await this.definitionsPort.listDefinitions();
    return definitions.filter((d) => d.isActive).map(ReportMapper.toCategoryDto);
  }

  @Post('generate/:reportCode')
  @RequirePermissions('create:reports')
  @HttpCode(HttpStatus.ACCEPTED)
  async generateReport(
    @Param('reportCode') reportCode: string,
    @Body() params: Record<string, unknown>,
    @CurrentUser() user: AuthUser,
  ): Promise<{ workflowId: string }> {
    const result = await this.reportGenerationService.startReportWorkflow({
      reportCode,
      parameters: params,
      requestedById: user.userId!,
      userPermissions: user.permissions ?? [],
      userRoles: user.userRoles ?? [],
    });
    return { workflowId: result.workflowId };
  }

  @Get('list/:reportCode')
  @RequirePermissions('read:reports')
  async listReports(
    @Param('reportCode') reportCode: string,
    @Query('pageIndex') pageIndex?: number,
    @Query('pageSize') pageSize?: number,
    @Query() filter?: ReportFilterDto,
  ) {
    const page = await this.reportRepository.findPaged({
      pageIndex: pageIndex ? Number(pageIndex) : 0,
      pageSize: pageSize ? Number(pageSize) : 20,
      props: {
        reportCode,
        status: filter?.status ? [filter.status] : undefined,
        requestedById: filter?.requestedById,
      },
    });
    return {
      content: page.content.map(ReportMapper.toDetailDto),
      totalSize: page.totalSize,
      pageIndex: page.pageIndex,
      pageSize: page.pageSize,
    };
  }

  @Post(':reportId/regenerate')
  @HttpCode(HttpStatus.OK)
  async regenerateReport(
    @Param('reportId') reportId: string,
    @CurrentUser() user: AuthUser,
  ): Promise<ReportDetailDto> {
    const existing = await this.reportRepository.findById(reportId);
    if (!existing) {
      throw new NotFoundException('Report not found');
    }
    const definition = await this.definitionsPort.getDefinition(existing.reportCode);
    const report = await this.reportGenerationService.generateForReport({
      reportId,
      reportCode: existing.reportCode,
      parameters: existing.parameters ?? {},
      requestedById: user.userId!,
      userPermissions: user.permissions ?? ['create:reports'],
      needApproval: existing.needApproval,
      approverRoles: existing.approverRoles,
      viewerRoles: existing.viewerRoles,
      reportName: existing.reportName,
      workflowId: existing.workflowId,
      regenerate: true,
    });
    return ReportMapper.toDetailDto(report);
  }

  @Delete(':reportId')
  @RequirePermissions('delete:reports')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteReport(@Param('reportId') reportId: string): Promise<void> {
    await this.reportGenerationService.deleteReport(reportId);
  }

  @Get('static/reportInputs')
  @RequirePermissions('read:reports')
  async getReportInputs(@Query('reportCode') reportCode: string): Promise<ReportInputFieldDto[]> {
    const provider = this.registry.getProvider(reportCode);
    if (!provider) {
      throw new NotFoundException(`Report provider for ${reportCode} not found`);
    }
    return provider.reportParams.map((field) => ({
      key: field.key,
      label: field.label,
      fieldType: field.defKey,
      mandatory: field.mandatory,
    }));
  }
}
