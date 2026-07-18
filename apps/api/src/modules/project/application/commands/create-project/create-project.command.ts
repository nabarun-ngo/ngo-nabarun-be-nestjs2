import { ProjectCategory, ProjectPhase, ProjectStatus } from '../../../domain/enums/project.enum';

export class CreateProjectCommand {
  constructor(
    public readonly params: {
      name: string;
      description: string;
      code: string;
      category: ProjectCategory;
      status?: ProjectStatus;
      phase?: ProjectPhase;
      startDate: Date;
      endDate?: Date;
      budget: number;
      currency: string;
      location?: string;
      targetBeneficiaryCount?: number;
      managerId: string;
      sponsorId?: string;
      tags?: string[];
      metadata?: Record<string, unknown>;
    },
  ) {}
}
