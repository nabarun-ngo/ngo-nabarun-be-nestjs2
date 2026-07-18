import { EarningDetailDto } from './earning.dto';

export class EarningListResponseDto {
  items!: EarningDetailDto[];
  total!: number;
  pageIndex!: number;
  pageSize!: number;
}

