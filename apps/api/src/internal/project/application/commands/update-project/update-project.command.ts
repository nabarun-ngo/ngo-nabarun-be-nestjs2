import { ProjectCategory, ProjectPhase, ProjectStatus } from '../../../domain/enums/project.enum';

export class UpdateProjectCommand {
  constructor(
    public readonly params: {
      id: string;
      name?: string;
      description?: string;
      category?: ProjectCategory;
      status?: ProjectStatus;
      phase?: ProjectPhase;
      endDate?: Date;
      budget?: number;
      location?: string;
      targetBeneficiaryCount?: number;
      sponsorId?: string;
      tags?: string[];
      metadata?: Record<string, unknown>;
    },
  ) {}
}
