import { BeneficiaryDetailFilterDto } from '../../dtos/beneficiary.dto';

export class ListBeneficiariesQuery {
  constructor(
    public readonly projectId: string,
    public readonly filter: BeneficiaryDetailFilterDto | Record<string, unknown>,
    public readonly pageIndex?: number,
    public readonly pageSize?: number,
  ) {}
}