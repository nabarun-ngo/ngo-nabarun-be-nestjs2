import { Inject, Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BusinessException } from '@ce/nestjs-shared-core';
import { Beneficiary } from '../../../domain/aggregates/beneficiary/beneficiary.aggregate';
import { IBeneficiaryRepository } from '../../../domain/repositories/beneficiary.repository';
import { IProjectRepository } from '../../../domain/repositories/project.repository';
import { UpdateBeneficiaryCommand } from './update-beneficiary.command';

@CommandHandler(UpdateBeneficiaryCommand)
@Injectable()
export class UpdateBeneficiaryHandler implements ICommandHandler<UpdateBeneficiaryCommand, Beneficiary> {
  constructor(
    @Inject(IBeneficiaryRepository) private readonly beneficiaryRepository: IBeneficiaryRepository,
    @Inject(IProjectRepository) private readonly projectRepository: IProjectRepository,
  ) {}
  async execute({ params }: UpdateBeneficiaryCommand): Promise<Beneficiary> {
    const beneficiary = await this.beneficiaryRepository.findById(params.id);
    if (!beneficiary) throw new BusinessException('Beneficiary not found');
    const { id, exit, ...rest } = params;
    beneficiary.update(rest as any);
    if (exit) beneficiary.markAsExited();
    const saved = await this.beneficiaryRepository.update(id, beneficiary);
    const count = await this.beneficiaryRepository.countByProject(saved.projectId);
    const project = await this.projectRepository.findById(saved.projectId);
    if (project) { project.updateBeneficiaryCount(count); await this.projectRepository.update(project.id, project); }
    return saved;
  }
}