import { Inject, Injectable } from '@nestjs/common';
import ExcelJS from 'exceljs';
import { formatDate } from '@ce/nestjs-shared-core';
import { IReportProvider, ReportFieldDef, ReportGeneratedData, ReportProvider } from '../../../reporting/domain/reporting.interface';
import { IProjectRepository } from '../../domain/repositories/project.repository';
import { IActivityRepository } from '../../domain/repositories/activity.repository';

@Injectable()
@ReportProvider()
export class ProjectReportProvider implements IReportProvider<{ projectId: string }> {
  readonly reportCode = 'PROJECT_REPORT';
  readonly reportParams: ReportFieldDef<'projectId'>[] = [
    { key: 'projectId', defKey: 'INPUT_TEXT_FIELD', label: 'Project ID', mandatory: true },
  ];
  constructor(
    @Inject(IProjectRepository) private readonly projectRepository: IProjectRepository,
    @Inject(IActivityRepository) private readonly activityRepository: IActivityRepository,
  ) {}
  async generate(params: { projectId: string }): Promise<ReportGeneratedData> {
    const project = await this.projectRepository.findById(params.projectId);
    if (!project) throw new Error('Project not found');
    const activities = await this.activityRepository.findAll({ projectId: params.projectId });
    const wb = new ExcelJS.Workbook();
    const sheet = wb.addWorksheet('Project Summary');
    sheet.addRow(['Project Closure Report']);
    sheet.addRow(['Name', project.name]);
    sheet.addRow(['Code', project.code]);
    sheet.addRow(['Budget', project.budget]);
    sheet.addRow(['Spent', project.spentAmount]);
    sheet.addRow(['Utilization %', project.getBudgetUtilization().toFixed(2)]);
    const actSheet = wb.addWorksheet('Activities');
    actSheet.addRow(['Name', 'Type', 'Scale', 'Status', 'Start', 'End']);
    for (const a of activities) {
      actSheet.addRow([a.name, a.type, a.scale, a.status, a.startDate ? formatDate(a.startDate) : '', a.endDate ? formatDate(a.endDate) : '']);
    }
    const buffer = Buffer.from(await wb.xlsx.writeBuffer());
    return { buffer, fileName: 'Project_Closure_Report_' + params.projectId, fileExtension: 'xlsx', contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' };
  }
}
