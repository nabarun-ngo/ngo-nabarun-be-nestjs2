import { DonationDto } from './donation.dto';

export class DonationListResponseDto {
  items!: DonationDto[];
  total!: number;
  pageIndex!: number;
  pageSize!: number;
}

