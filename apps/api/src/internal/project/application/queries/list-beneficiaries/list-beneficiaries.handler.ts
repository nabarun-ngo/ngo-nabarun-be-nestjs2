import { Inject, Injectable } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { BaseFilter } from '@ce/nestjs-shared-core';
import { IBeneficiaryRepository } from '../../../domain/repositories/beneficiary.repository';
import { BeneficiaryMapper } from '../../mappers/beneficiary.mapper';
import { BeneficiaryListResponseDto } from '../../dtos/beneficiary.dto';
import { ListBeneficiariesQuery } from './list-beneficiaries.query';

@QueryHandler(ListBeneficiariesQuery)
@Injectable()
export class ListBeneficiariesHandler implements IQueryHandler<ListBeneficiariesQuery, BeneficiaryListResponseDto> {
  constructor(@Inject(IBeneficiaryRepository) private readonly repo: IBeneficiaryRepository) {}
  async execute(q: ListBeneficiariesQuery): Promise<BeneficiaryListResponseDto> {
    const page = await this.repo.findPaged(new BaseFilter({ ...q.filter, projectId: q.projectId }, q.pageIndex ?? 0, q.pageSize ?? 20));
    return { items: page.content.map(BeneficiaryMapper.toDto), total: page.totalSize, pageIndex: page.pageIndex, pageSize: page.pageSize };
  }
}