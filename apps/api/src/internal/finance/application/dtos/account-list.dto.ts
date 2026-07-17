import { AccountDetailDto } from './account.dto';
import { TransactionDetailDto } from './transaction.dto';

export class AccountListResponseDto {
  items!: AccountDetailDto[];
  total!: number;
  pageIndex!: number;
  pageSize!: number;
}

export class TransactionListResponseDto {
  items!: TransactionDetailDto[];
  total!: number;
  pageIndex!: number;
  pageSize!: number;
}

