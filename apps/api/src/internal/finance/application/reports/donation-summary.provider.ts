import { Inject, Injectable } from '@nestjs/common';
import { formatDate } from '@ce/nestjs-shared-core';
import ExcelJS from 'exceljs';
import { DateTime } from 'luxon';
import {
  IReportProvider,
  ReportFieldDef,
  ReportGeneratedData,
  ReportProvider,
} from '../../../reporting/domain/reporting.interface';
import { Donation } from '../../domain/aggregates/donation/donation.aggregate';
import { DonationStatus } from '../../domain/enums/donation-status.enum';
import { IDonationRepository } from '../../domain/repositories/donation.repository';

@Injectable()
@ReportProvider()
export class DonationSummaryReportProvider implements IReportProvider<{ startDate: Date; endDate: Date }> {
  readonly reportCode = 'DONATION_SUMMARY_REPORT';

  readonly reportParams: ReportFieldDef<'startDate' | 'endDate'>[] = [
    { key: 'startDate', defKey: 'INPUT_DATE_FIELD', label: 'Start Date', mandatory: true },
    { key: 'endDate', defKey: 'INPUT_DATE_FIELD', label: 'End Date', mandatory: true },
  ];

  constructor(@Inject(IDonationRepository) private readonly donationRepository: IDonationRepository) {}

  async generate(params: { startDate: Date; endDate: Date }): Promise<ReportGeneratedData> {
    const startDt = this.toDateTime(params.startDate).setZone('Asia/Kolkata');
    const endDt = this.toDateTime(params.endDate).setZone('Asia/Kolkata');
    const buffer = await this.buildWorkbook(startDt.toJSDate(), endDt.toJSDate());

    const isExactFullMonth =
      startDt.day === 1 && endDt.toFormat('yyyy-MM-dd') === startDt.endOf('month').toFormat('yyyy-MM-dd');
    const fileName = isExactFullMonth
      ? `Donation_Summary_Report-${startDt.toFormat('MMMM_yyyy')}`
      : `Donation_Summary_Report-${startDt.toFormat('dd-MM-yyyy')}_${endDt.toFormat('dd-MM-yyyy')}`;

    return {
      buffer,
      fileName,
      fileExtension: 'xlsx',
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    };
  }

  private toDateTime(value: Date | string): DateTime {
    return typeof value === 'string' ? DateTime.fromISO(value) : DateTime.fromJSDate(value);
  }

  private async buildWorkbook(startDate: Date, endDate: Date): Promise<Buffer> {
    const [paidDonations, pendingDonations] = await Promise.all([
      this.donationRepository.findAll({
        startDate_paidOn: startDate,
        endDate_paidOn: endDate,
        status: [DonationStatus.PAID],
      }),
      this.donationRepository.findAll({
        status: Donation.outstandingStatus,
        startDate_lte: endDate,
      }),
    ]);

    const memberPending = pendingDonations.filter((d) => !d.isGuest);
    const workbook = new ExcelJS.Workbook();

    this.addPaidSheet(workbook, paidDonations);
    this.addPendingSheet(workbook, memberPending);
    this.addAccountBreakdownSheet(workbook, paidDonations);
    this.addDonorBreakdownSheet(workbook, paidDonations);

    const raw = await workbook.xlsx.writeBuffer();
    return Buffer.from(raw);
  }

  private addPaidSheet(workbook: ExcelJS.Workbook, donations: Donation[]): void {
    const sheet = workbook.addWorksheet('Paid Donations');
    sheet.addRow(['ID', 'Donor', 'Email', 'Amount', 'Paid On', 'Account', 'Payment Method']);
    for (const d of donations) {
      sheet.addRow([
        d.id,
        d.donorName ?? '',
        d.donorEmail ?? '',
        d.amount,
        d.paidOn ? formatDate(d.paidOn) : '',
        d.paidToAccount?.name ?? d.paidToAccount?.id ?? '',
        d.paymentMethod ?? '',
      ]);
    }
  }

  private addPendingSheet(workbook: ExcelJS.Workbook, donations: Donation[]): void {
    const sheet = workbook.addWorksheet('Pending Donations');
    sheet.addRow(['ID', 'Donor', 'Amount', 'Period', 'Status']);
    for (const d of donations) {
      sheet.addRow([
        d.id,
        d.donorName ?? '',
        d.amount,
        d.startDate && d.endDate ? `${formatDate(d.startDate)} - ${formatDate(d.endDate)}` : '',
        d.status,
      ]);
    }
  }

  private addAccountBreakdownSheet(workbook: ExcelJS.Workbook, donations: Donation[]): void {
    const sheet = workbook.addWorksheet('By Account');
    sheet.addRow(['Account', 'Total Amount', 'Count']);
    const byAccount = new Map<string, { name: string; total: number; count: number }>();
    for (const d of donations) {
      const key = d.paidToAccount?.id ?? 'unknown';
      const name = d.paidToAccount?.name ?? key;
      const entry = byAccount.get(key) ?? { name, total: 0, count: 0 };
      entry.total += d.amount;
      entry.count += 1;
      byAccount.set(key, entry);
    }
    for (const entry of byAccount.values()) {
      sheet.addRow([entry.name, entry.total, entry.count]);
    }
  }

  private addDonorBreakdownSheet(workbook: ExcelJS.Workbook, donations: Donation[]): void {
    const sheet = workbook.addWorksheet('By Donor');
    sheet.addRow(['Donor', 'Total Amount', 'Count']);
    const byDonor = new Map<string, { name: string; total: number; count: number }>();
    for (const d of donations) {
      const key = d.donorId ?? d.donorEmail ?? d.donorName ?? 'guest';
      const name = d.donorName ?? d.donorEmail ?? 'Guest';
      const entry = byDonor.get(key) ?? { name, total: 0, count: 0 };
      entry.total += d.amount;
      entry.count += 1;
      byDonor.set(key, entry);
    }
    for (const entry of byDonor.values()) {
      sheet.addRow([entry.name, entry.total, entry.count]);
    }
  }
}
