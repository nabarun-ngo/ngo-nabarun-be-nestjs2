import { DynamicModule, Module, ModuleMetadata } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { createRequiredPortsGuard } from '@nabarun-ngo/nestjs-shared-core';
import { ProjectModuleOptionsSchema } from './project.schema';
import { IProjectReferenceDataPort } from './application/ports/project-reference-data.port';
import { IProjectRepository } from './domain/repositories/project.repository';
import { IActivityRepository } from './domain/repositories/activity.repository';
import { IBeneficiaryRepository } from './domain/repositories/beneficiary.repository';
import { IGoalRepository } from './domain/repositories/goal.repository';
import { ProjectPrismaRepository } from '../../shared/persistence/project/project.prisma-repository';
import { ActivityPrismaRepository } from '../../shared/persistence/project/activity.prisma-repository';
import { BeneficiaryPrismaRepository } from '../../shared/persistence/project/beneficiary.prisma-repository';
import { GoalPrismaRepository } from '../../shared/persistence/project/goal.prisma-repository';
import { CreateProjectHandler } from './application/commands/create-project/create-project.handler';
import { UpdateProjectHandler } from './application/commands/update-project/update-project.handler';
import { CreateActivityHandler } from './application/commands/create-activity/create-activity.handler';
import { UpdateActivityHandler } from './application/commands/update-activity/update-activity.handler';
import { LinkExpenseToActivityHandler } from './application/commands/link-expense-to-activity/link-expense-to-activity.handler';
import { CreateBeneficiaryHandler } from './application/commands/create-beneficiary/create-beneficiary.handler';
import { UpdateBeneficiaryHandler } from './application/commands/update-beneficiary/update-beneficiary.handler';
import { CreateGoalHandler } from './application/commands/create-goal/create-goal.handler';
import { UpdateGoalHandler } from './application/commands/update-goal/update-goal.handler';
import { UpdateGoalProgressHandler } from './application/commands/update-goal-progress/update-goal-progress.handler';
import { ListProjectsHandler } from './application/queries/list-projects/list-projects.handler';
import { GetProjectByIdHandler } from './application/queries/get-project-by-id/get-project-by-id.handler';
import { ListActivitiesHandler } from './application/queries/list-activities/list-activities.handler';
import { GetProjectReferenceDataHandler } from './application/queries/get-project-reference-data/get-project-reference-data.handler';
import { ListBeneficiariesHandler } from './application/queries/list-beneficiaries/list-beneficiaries.handler';
import { GetBeneficiaryByIdHandler } from './application/queries/get-beneficiary-by-id/get-beneficiary-by-id.handler';
import { ListGoalsHandler } from './application/queries/list-goals/list-goals.handler';
import { GetProjectProgressHandler } from './application/queries/get-project-progress/get-project-progress.handler';
import { GetProjectDashboardHandler } from './application/queries/get-project-dashboard/get-project-dashboard.handler';
import { OnActivityCompletedHandler } from './application/event-handlers/on-activity-completed/on-activity-completed.handler';
import { ProjectReportProvider } from './application/reports/project-report.provider';
import { ActivityReportProvider } from './application/reports/activity-report.provider';
import { ProjectController } from './presentation/controllers/project.controller';
import { BeneficiaryController } from './presentation/controllers/beneficiary.controller';
import { GoalController } from './presentation/controllers/goal.controller';
import { MilestoneController } from './presentation/controllers/milestone.controller';
import { ProjectTeamController } from './presentation/controllers/project-team.controller';
import { ProjectRiskController } from './presentation/controllers/project-risk.controller';

const ProjectRequiredPortsGuard = createRequiredPortsGuard('ProjectModule', [
  {
    token: IProjectReferenceDataPort,
    fixHint: 'Register { provide: IProjectReferenceDataPort, useClass: ProjectReferenceDataAdapter } in IntegrationsModule.',
  },
]);

const COMMAND_HANDLERS = [
  CreateProjectHandler,
  UpdateProjectHandler,
  CreateActivityHandler,
  UpdateActivityHandler,
  LinkExpenseToActivityHandler,
  CreateBeneficiaryHandler,
  UpdateBeneficiaryHandler,
  CreateGoalHandler,
  UpdateGoalHandler,
  UpdateGoalProgressHandler,
];

const QUERY_HANDLERS = [
  ListProjectsHandler,
  GetProjectByIdHandler,
  ListActivitiesHandler,
  GetProjectReferenceDataHandler,
  ListBeneficiariesHandler,
  GetBeneficiaryByIdHandler,
  ListGoalsHandler,
  GetProjectProgressHandler,
  GetProjectDashboardHandler,
];

const EVENT_HANDLERS = [OnActivityCompletedHandler];

const REPORT_PROVIDERS = [ProjectReportProvider, ActivityReportProvider];

export interface ProjectModuleOptions {
  imports?: ModuleMetadata['imports'];
}

@Module({})
export class ProjectModule {
  static forRoot(options: ProjectModuleOptions = {}): DynamicModule {
    ProjectModuleOptionsSchema.parse({});
    return {
      module: ProjectModule,
      imports: [CqrsModule, ...(options.imports ?? [])],
      controllers: [
        ProjectController,
        BeneficiaryController,
        GoalController,
        MilestoneController,
        ProjectTeamController,
        ProjectRiskController,
      ],
      providers: [
        ProjectRequiredPortsGuard,
        { provide: IProjectRepository, useClass: ProjectPrismaRepository },
        { provide: IActivityRepository, useClass: ActivityPrismaRepository },
        { provide: IBeneficiaryRepository, useClass: BeneficiaryPrismaRepository },
        { provide: IGoalRepository, useClass: GoalPrismaRepository },
        ...COMMAND_HANDLERS,
        ...QUERY_HANDLERS,
        ...EVENT_HANDLERS,
        ...REPORT_PROVIDERS,
      ],
      exports: [IProjectRepository, IActivityRepository, ProjectReportProvider, ActivityReportProvider],
    };
  }
}
