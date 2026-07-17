import { ExpenseDetailDto } from './expense.dto';

export class ExpenseListResponseDto {
  items!: ExpenseDetailDto[];
  total!: number;
  pageIndex!: number;
  pageSize!: number;
}

