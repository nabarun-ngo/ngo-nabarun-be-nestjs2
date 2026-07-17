import { Inject, Injectable } from '@nestjs/common';
import ExcelJS from 'exceljs';
import { formatDate } from '@ce/nestjs-shared-core';
import { IReportProvider, ReportFieldDef, ReportGeneratedData, ReportProvider } from '../../../reporting/domain/reporting.interface';
import { IActivityRepository } from '../../domain/repositories/activity.repository';
import { IProjectRepository } from '../../domain/repositories/project.repository';

@Injectable()
@ReportProvider()
export class ActivityReportProvider implements IReportProvider<{ activityId: string }> {
  readonly reportCode = 'ACTIVITY_REPORT';
  readonly reportParams: ReportFieldDef<'activityId'>[] = [
    { key: 'activityId', defKey: 'INPUT_TEXT_FIELD', label: 'Activity ID', mandatory: true },
  ];
  constructor(
    @Inject(IActivityRepository) private readonly activityRepository: IActivityRepository,
    @Inject(IProjectRepository) private readonly projectRepository: IProjectRepository,
  ) {}
  async generate(params: { activityId: string }): Promise<ReportGeneratedData> {
    const activity = await this.activityRepository.findById(params.activityId);
    if (!activity) throw new Error('Activity not found');
    const project = await this.projectRepository.findById(activity.projectId);
    const wb = new ExcelJS.Workbook();
    const sheet = wb.addWorksheet('Activity Report');
    sheet.addRow(['Activity', activity.name]);
    sheet.addRow(['Project', project?.name ?? activity.projectId]);
    sheet.addRow(['Scale', activity.scale]);
    sheet.addRow(['Status', activity.status]);
    sheet.addRow(['Start', activity.startDate ? formatDate(activity.startDate) : '']);
    sheet.addRow(['End', activity.endDate ? formatDate(activity.endDate) : '']);
    const buffer = Buffer.from(await wb.xlsx.writeBuffer());
    return { buffer, fileName: 'Activity_Report_' + params.activityId, fileExtension: 'xlsx', contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' };
  }
}
