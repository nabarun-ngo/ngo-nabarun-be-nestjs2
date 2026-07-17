import { EarningCategory, EarningStatus } from '../../domain/enums/earning.enum';
import { KeyValueOption } from '../ports/finance-reference-data.port';

export class EarningDetailDto {
  id!: string;
  category!: EarningCategory;
  amount!: number;
  currency!: string;
  status!: EarningStatus;
  description!: string;
  source!: string;
  referenceId?: string;
  referenceType?: string;
  accountId?: string;
  transactionId?: string;
  earningDate?: Date;
  receivedDate?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  receivedBy?: string;
  createdBy?: string;
}

export class EarningRefDataDto {
  earningStatuses?: KeyValueOption[];
  earningCategories?: KeyValueOption[];
}
