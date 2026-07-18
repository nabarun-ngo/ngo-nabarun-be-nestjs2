import { Inject, Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BusinessException } from '@nabarun-ngo/nestjs-shared-core';
import { Beneficiary } from '../../../domain/aggregates/beneficiary/beneficiary.aggregate';
import { IBeneficiaryRepository } from '../../../domain/repositories/beneficiary.repository';
import { IProjectRepository } from '../../../domain/repositories/project.repository';
import { CreateBeneficiaryCommand } from './create-beneficiary.command';

@CommandHandler(CreateBeneficiaryCommand)
@Injectable()
export class CreateBeneficiaryHandler implements ICommandHandler<CreateBeneficiaryCommand, Beneficiary> {
  constructor(
    @Inject(IBeneficiaryRepository) private readonly beneficiaryRepository: IBeneficiaryRepository,
    @Inject(IProjectRepository) private readonly projectRepository: IProjectRepository,
  ) { }
  async execute({ params }: CreateBeneficiaryCommand): Promise<Beneficiary> {
    const project = await this.projectRepository.findById(params.projectId);
    if (!project) throw new BusinessException('Project not found');
    if (!project.isActive()) throw new BusinessException('Cannot add beneficiary to inactive project');
    const beneficiary = Beneficiary.create(params as any);
    return this.beneficiaryRepository.create(beneficiary);
  }
}