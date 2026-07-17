import { Inject, Injectable } from '@nestjs/common';
import { BusinessException, formatDate } from '@ce/nestjs-shared-core';
import {
  DocumentGeneratorService,
  ExcelStyles,
} from '@ce/nestjs-shared-document-generator';
import { DateTime } from 'luxon';
import {
  IReportProvider,
  ReportFieldDef,
  ReportGeneratedData,
  ReportProvider,
} from '../../../reporting/domain/reporting.interface';
import { DonationStatus } from '../../domain/enums/donation-status.enum';
import { DonationType } from '../../domain/enums/donation-type.enum';
import { ExpenseStatus } from '../../domain/enums/expense.enum';
import { EarningStatus } from '../../domain/enums/earning.enum';
import { AccountStatus } from '../../domain/enums/account-status.enum';
import { IDonationRepository } from '../../domain/repositories/donation.repository';
import { IExpenseRepository } from '../../domain/repositories/expense.repository';
import { IEarningRepository } from '../../domain/repositories/earning.repository';
import { IAccountRepository } from '../../domain/repositories/account.repository';
import { financeUserFullName } from '../../domain/types/finance-user-ref';
import { FinanceReportReferenceDataService } from './finance-report-reference-data.service';

@Injectable()
@ReportProvider()
export class AnnualAuditReportProvider implements IReportProvider<{ financialYear: string }> {
  readonly reportCode = 'ANNUAL_AUDIT_REPORT';

  constructor(
    @Inject(IDonationRepository) private readonly donationRepository: IDonationRepository,
    @Inject(IExpenseRepository) private readonly expenseRepository: IExpenseRepository,
    @Inject(IEarningRepository) private readonly earningRepository: IEarningRepository,
    @Inject(IAccountRepository) private readonly accountRepository: IAccountRepository,
    private readonly documentGenerator: DocumentGeneratorService,
    private readonly referenceDataService: FinanceReportReferenceDataService,
  ) {}

  readonly reportParams: ReportFieldDef<'financialYear'>[] = [
    {
      key: 'financialYear',
      defKey: 'INPUT_TEXT_FIELD',
      label: 'Financial Year (e.g. 2025-2026)',
      mandatory: true,
    },
  ];

  async generate(params: { financialYear: string }): Promise<ReportGeneratedData> {
    const buffer = await this.template({ financialYear: params.financialYear });
    return {
      buffer,
      fileName: `Annual_Audit_Report_FY_${params.financialYear}`,
      fileExtension: 'xlsx',
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    };
  }

  private async template(request: { financialYear: string }): Promise<Buffer> {
    if (!/^\d{4}-\d{4}$/.test(request.financialYear)) {
      throw new BusinessException(
        'Invalid financial year format. Expected format is YYYY-YYYY (e.g., 2025-2026).',
      );
    }
    const [startYear, endYear] = request.financialYear.split('-').map((y) => parseInt(y, 10));
    const startDate = DateTime.fromObject({ year: startYear, month: 4, day: 1 }).toJSDate();
    const endDate = DateTime.fromObject({ year: endYear, month: 3, day: 31 }).endOf('day').toJSDate();
    const password = crypto.randomUUID();

    const safeFormatDate = (date?: Date | null): string => {
      if (!date) return '-';
      try {
        return formatDate(date);
      } catch {
        return '-';
      }
    };

    const [donations, expenses, earnings, accounts] = await Promise.all([
      this.donationRepository.findAll({
        startDate_raisedOn: startDate,
        endDate_raisedOn: endDate,
      }),
      this.expenseRepository.findAll({ startDate, endDate }),
      this.earningRepository.findAll({ startDate, endDate }),
      this.accountRepository.findAll({ status: [AccountStatus.ACTIVE], includeBalance: true }),
    ]);

    const refData = await this.referenceDataService.getReferenceData();
    const incomeMap: { label: string; value: number }[] = [];
    const paidDons = donations.filter((d) => d.status === DonationStatus.PAID);
    incomeMap.push({
      label: 'Member Donations (Regular + One Time)',
      value: paidDons.filter((f) => !f.isGuest).reduce((sum, d) => sum + d.amount, 0),
    });
    incomeMap.push({
      label: 'Guest Donations',
      value: paidDons.filter((f) => f.isGuest).reduce((sum, d) => sum + d.amount, 0),
    });

    const receivedEarnings = earnings.filter((e) => e.status === EarningStatus.RECEIVED);
    for (const cat of refData.earn_categories) {
      incomeMap.push({
        label: `${cat.value} Earnings`,
        value: receivedEarnings
          .filter((e) => e.category === cat.key)
          .reduce((sum, e) => sum + e.amount, 0),
      });
    }

    const settledExpenses = expenses.filter((e) => e.status === ExpenseStatus.SETTLED);
    const expMap: { label: string; value: number }[] = [];
    for (const refType of refData.exp_categories) {
      expMap.push({
        label: `${refType.value} Expenses`,
        value: settledExpenses
          .filter((e) => e.referenceType === refType.key)
          .reduce((sum, e) => sum + e.amount, 0),
      });
    }

    const excelBuilder = this.documentGenerator.createExcelBuilder();
    const incomeRowStart = 17;
    const incomeTotalRow = incomeRowStart + incomeMap.length;
    const expSectionHeaderRow = incomeTotalRow + 2;
    const expRowStart = expSectionHeaderRow + 2;
    const expTotalRow = expRowStart + expMap.length;

    const summarySheet = excelBuilder.addSheet({
      name: 'Annual Summary',
      protection: { sheet: true, password },
    });

    summarySheet
      .setColumnWidth('A', 35)
      .setColumnWidth('B', 20)
      .setColumnWidth('C', 15)
      .addReportHeader({
        title: 'Annual Financial Audit Report',
        subtitle: `Financial Year: ${request.financialYear}`,
        mergeColumns: 3,
        generationDate: new Date(),
      })
      .mergeCells(10, 1, 10, 3)
      .setCell(10, 1, 'Financial Overview', ExcelStyles.sectionHeaderStyle)
      .setCell(11, 1, 'Total Gross Income', ExcelStyles.labelBoldStyle)
      .addFormula(11, 2, `B${incomeTotalRow}`, ExcelStyles.rupeeAmountBoldStyle)
      .setCell(11, 3, '-', ExcelStyles.rupeeAmountStyle)
      .setCell(12, 1, 'Total Expenditures', ExcelStyles.labelBoldStyle)
      .addFormula(12, 2, `B${expTotalRow}`, ExcelStyles.rupeeAmountBoldStyle)
      .setCell(12, 3, '-', ExcelStyles.rupeeAmountStyle)
      .setCell(13, 1, 'Net Annual Surplus / (Deficit)', ExcelStyles.totalRowLabelStyle)
      .addFormula(13, 2, 'B11-B12', ExcelStyles.totalRowAmountStyle)
      .setCell(13, 3, '-', ExcelStyles.totalRowAmountStyle)
      .mergeCells(15, 1, 15, 3)
      .setCell(15, 1, 'Consolidated Income Breakdown', ExcelStyles.sectionHeaderStyle)
      .setCell(16, 1, 'Income Source', ExcelStyles.labelBoldStyle)
      .setCell(16, 2, 'Amount', {
        ...ExcelStyles.labelBoldStyle,
        alignment: { horizontal: 'right' as const },
      })
      .setCell(16, 3, '% of Income', {
        ...ExcelStyles.labelBoldStyle,
        alignment: { horizontal: 'right' as const },
      });

    let incomeRow = incomeRowStart;
    for (const income of incomeMap) {
      summarySheet
        .setCell(incomeRow, 1, income.label, ExcelStyles.labelStyle)
        .setCell(incomeRow, 2, income.value, ExcelStyles.rupeeAmountStyle)
        .addFormula(
          incomeRow,
          3,
          `IFERROR(B${incomeRow}/B${incomeTotalRow}, 0)`,
          ExcelStyles.percentageReportStyle,
        );
      incomeRow++;
    }

    summarySheet
      .setCell(incomeTotalRow, 1, 'Total Consolidated Income', ExcelStyles.totalRowLabelStyle)
      .addFormula(
        incomeTotalRow,
        2,
        `SUM(B${incomeRowStart}:B${incomeTotalRow - 1})`,
        ExcelStyles.totalRowAmountStyle,
      )
      .addFormula(
        incomeTotalRow,
        3,
        `SUM(C${incomeRowStart}:C${incomeTotalRow - 1})`,
        ExcelStyles.totalRowPercentageStyle,
      )
      .mergeCells(expSectionHeaderRow, 1, expSectionHeaderRow, 3)
      .setCell(expSectionHeaderRow, 1, 'Consolidated Expenditures Breakdown', ExcelStyles.sectionHeaderStyle)
      .setCell(expSectionHeaderRow + 1, 1, 'Expense Category', ExcelStyles.labelBoldStyle)
      .setCell(expSectionHeaderRow + 1, 2, 'Amount', {
        ...ExcelStyles.labelBoldStyle,
        alignment: { horizontal: 'right' as const },
      })
      .setCell(expSectionHeaderRow + 1, 3, '% of Expenditures', {
        ...ExcelStyles.labelBoldStyle,
        alignment: { horizontal: 'right' as const },
      });

    let expRow = expRowStart;
    for (const exp of expMap) {
      summarySheet
        .setCell(expRow, 1, exp.label, ExcelStyles.labelStyle)
        .setCell(expRow, 2, exp.value, ExcelStyles.rupeeAmountStyle)
        .addFormula(
          expRow,
          3,
          `IFERROR(B${expRow}/B${expTotalRow}, 0)`,
          ExcelStyles.percentageReportStyle,
        );
      expRow++;
    }

    summarySheet
      .setCell(expTotalRow, 1, 'Total Consolidated Expenditures', ExcelStyles.totalRowLabelStyle)
      .addFormula(
        expTotalRow,
        2,
        `SUM(B${expRowStart}:B${expTotalRow - 1})`,
        ExcelStyles.totalRowAmountStyle,
      )
      .addFormula(
        expTotalRow,
        3,
        `SUM(C${expRowStart}:C${expTotalRow - 1})`,
        ExcelStyles.totalRowPercentageStyle,
      )
      .endSheet();

    const accTypeMap = new Map(refData.acc_type.map((item) => [item.key, item.value]));
    const accountRows = accounts.map((acc) => ({
      accountId: acc.id,
      accountName: acc.accountHolderName,
      accountType: accTypeMap.get(acc.type) || acc.type,
      status: acc.status,
      currency: acc.currency || 'INR',
      balance: acc.balance,
      activatedOn: safeFormatDate(acc.activatedOn) || '-',
    }));

    excelBuilder
      .addSheet({
        name: 'Account Summary',
        freezePane: { row: 1 },
        autoFilter: true,
        autoSizeColumns: true,
        protection: { sheet: true, password },
        columns: [
          { header: 'Account ID', key: 'accountId' },
          { header: 'Account Name', key: 'accountName' },
          { header: 'Account Type', key: 'accountType' },
          { header: 'Status', key: 'status' },
          { header: 'Activated Date', key: 'activatedOn' },
          { header: 'Currency', key: 'currency' },
          { header: 'Closing Balance', key: 'balance', style: ExcelStyles.rupeeAmountStyle },
        ],
      })
      .addRows(accountRows)
      .endSheet();

    const donationTypeMap = new Map(refData.donationType.map((item) => [item.key, item.value]));
    const donationStatusMap = new Map(refData.donationStatus.map((item) => [item.key, item.value]));
    const paymentMethodMap = new Map(refData.paymentMethod.map((item) => [item.key, item.value]));
    const upiTypeMap = new Map(refData.upiOption.map((item) => [item.key, item.value]));

    const donationRows = donations.map((d) => ({
      donationId: d.id,
      donationType: `${donationTypeMap.get(d.type) || d.type}${d.isGuest ? ' (Guest)' : ''}`,
      donorName: d.donorName,
      donorEmail: d.donorEmail || '-',
      donorPhone: d.donorNumber || '-',
      amount: d.amount,
      period: d.type === DonationType.REGULAR ? `${safeFormatDate(d.startDate)} - ${safeFormatDate(d.endDate)}` : '',
      currency: d.currency || 'INR',
      raisedOn: safeFormatDate(d.raisedOn),
      status: donationStatusMap.get(d.status) || d.status,
      paidOn: safeFormatDate(d.paidOn),
      paymentMethod: paymentMethodMap.get(d.paymentMethod ?? '') || d.paymentMethod || '-',
      paidUsingUPI: upiTypeMap.get(d.paidUsingUPI ?? '') || d.paidUsingUPI || '-',
      transactionRef: d.transactionRef || '-',
      activityName: d.activityName || '-',
      confirmedBy: financeUserFullName(d.confirmedBy) || '-',
      confirmedOn: safeFormatDate(d.confirmedOn),
      remarks: d.remarks || '-',
    }));

    excelBuilder
      .addSheet({
        name: 'Donations Details',
        freezePane: { row: 1 },
        autoFilter: true,
        protection: { sheet: true, password },
        columns: [
          { header: 'Donation ID', key: 'donationId', width: 15 },
          { header: 'Donation Type', key: 'donationType', width: 15 },
          { header: 'Donor Name', key: 'donorName', width: 25 },
          { header: 'Donor Email', key: 'donorEmail', width: 25 },
          { header: 'Donor Phone', key: 'donorPhone', width: 15 },
          { header: 'Currency', key: 'currency', width: 10 },
          { header: 'Donation Amount', key: 'amount', width: 15, style: ExcelStyles.rupeeAmountStyle },
          { header: 'Donation Period', key: 'period', width: 15 },
          { header: 'Raised Date', key: 'raisedOn', width: 15 },
          { header: 'Donation Status', key: 'status', width: 12 },
          { header: 'Paid Date', key: 'paidOn', width: 15 },
          { header: 'Payment Method', key: 'paymentMethod', width: 15 },
          { header: 'UPI Type', key: 'paidUsingUPI', width: 15 },
          { header: 'Transaction Ref', key: 'transactionRef', width: 20 },
          { header: 'Confirmed By', key: 'confirmedBy', width: 20 },
          { header: 'Confirmed Date', key: 'confirmedOn', width: 15 },
          { header: 'Activity Name', key: 'activityName', width: 25 },
          { header: 'Remarks', key: 'remarks', width: 25 },
        ],
      })
      .addRows(donationRows)
      .endSheet();

    const earningTypeMap = new Map(refData.earn_categories.map((item) => [item.key, item.value]));
    const earningStatusMap = new Map(refData.earn_status.map((item) => [item.key, item.value]));
    const earningRows = earnings.map((earn) => ({
      earningId: earn.id,
      category: earningTypeMap.get(earn.category) || earn.category || '-',
      source: earn.source || '-',
      description: earn.description || '-',
      currency: earn.currency || 'INR',
      amount: earn.amount,
      status: earningStatusMap.get(earn.status) || earn.status || '-',
      accountId: earn.accountId || '-',
      transactionId: earn.transactionId || '-',
      earningDate: safeFormatDate(earn.earningDate),
      receivedBy: financeUserFullName(earn.receivedBy) || '-',
      createdBy: financeUserFullName(earn.createdBy) || '-',
      referenceId: earn.referenceId || '-',
    }));

    excelBuilder
      .addSheet({
        name: 'Earnings Details',
        freezePane: { row: 1 },
        autoFilter: true,
        protection: { sheet: true, password },
        columns: [
          { header: 'Earning ID', key: 'earningId', width: 15 },
          { header: 'Category', key: 'category', width: 15 },
          { header: 'Source', key: 'source', width: 25 },
          { header: 'Description', key: 'description', width: 35 },
          { header: 'Amount', key: 'amount', width: 15, style: ExcelStyles.rupeeAmountStyle },
          { header: 'Currency', key: 'currency', width: 10 },
          { header: 'Earning Date', key: 'earningDate', width: 15 },
          { header: 'Status', key: 'status', width: 12 },
          { header: 'Account ID', key: 'accountId', width: 15 },
          { header: 'Transaction ID', key: 'transactionId', width: 20 },
          { header: 'Received By', key: 'receivedBy', width: 20 },
          { header: 'Created By', key: 'createdBy', width: 20 },
          { header: 'Reference ID', key: 'referenceId', width: 20 },
        ],
      })
      .addRows(earningRows)
      .endSheet();

    const expenseTypeMap = new Map(refData.exp_categories.map((item) => [item.key, item.value]));
    const expenseStatusMap = new Map(refData.exp_status.map((item) => [item.key, item.value]));
    const expenseRows = expenses.map((e) => ({
      expenseId: e.id,
      category: expenseTypeMap.get(e.referenceType ?? '') || e.referenceType || '-',
      name: e.name,
      description: e.description || '-',
      currency: e.currency || 'INR',
      amount: e.amount,
      status: expenseStatusMap.get(e.status) || e.status || '-',
      date: safeFormatDate(e.expenseDate),
      requestedBy: financeUserFullName(e.requestedBy) || '-',
      paidBy: financeUserFullName(e.paidBy) || '-',
      finalizedBy: financeUserFullName(e.finalizedBy) || '-',
      settledBy: financeUserFullName(e.settledBy) || '-',
      settledOn: safeFormatDate(e.settledDate),
      accountId: e.accountId || '-',
      transactionId: e.transactionId || '-',
      remarks: e.remarks || '-',
      activityName: e.activityName || '-',
    }));

    excelBuilder
      .addSheet({
        name: 'Expenses Details',
        freezePane: { row: 1 },
        autoFilter: true,
        autoSizeColumns: true,
        protection: { sheet: true, password },
        columns: [
          { header: 'Expense ID', key: 'expenseId' },
          { header: 'Expense Type', key: 'category' },
          { header: 'Name', key: 'name' },
          { header: 'Description', key: 'description' },
          { header: 'Currency', key: 'currency' },
          { header: 'Amount', key: 'amount', style: ExcelStyles.rupeeAmountStyle },
          { header: 'Status', key: 'status' },
          { header: 'Expense Date', key: 'date' },
          { header: 'Requested By', key: 'requestedBy' },
          { header: 'Paid By', key: 'paidBy' },
          { header: 'Finalized By', key: 'finalizedBy' },
          { header: 'Settled By', key: 'settledBy' },
          { header: 'Settled Date', key: 'settledOn' },
          { header: 'Account ID', key: 'accountId' },
          { header: 'Transaction ID', key: 'transactionId' },
          { header: 'Remarks', key: 'remarks' },
          { header: 'Activity Name', key: 'activityName' },
        ],
      })
      .addRows(expenseRows)
      .endSheet();

    return excelBuilder.build();
  }
}
