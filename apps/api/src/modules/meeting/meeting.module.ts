import { DynamicModule, FactoryProvider, Module, ModuleMetadata, Provider } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { createRequiredPortsGuard } from '@nabarun-ngo/nestjs-shared-core';
import { MeetingModuleInput, MeetingModuleOptions, MeetingModuleOptionsSchema } from './meeting.schema';
import { MEETING_OPTIONS } from './infrastructure/meeting-options.token';
import { IMeetingRepository } from './domain/repositories/meeting.repository';
import { IMeetingCalendarPort } from './application/ports/meeting-calendar.port';
import { MeetingPrismaRepository } from '../../shared/persistence/meeting/meeting.prisma-repository';

import { CreateMeetingHandler } from './application/commands/create-meeting/create-meeting.handler';
import { UpdateMeetingHandler } from './application/commands/update-meeting/update-meeting.handler';
import { DeleteMeetingHandler } from './application/commands/delete-meeting/delete-meeting.handler';

import { ListMeetingsHandler } from './application/queries/list-meetings/list-meetings.handler';
import { GetMeetingByIdHandler } from './application/queries/get-meeting-by-id/get-meeting-by-id.handler';

import { ProcessFathomMeetingWebhookHandler } from './application/jobs/process-fathom-meeting-webhook.handler';

import { MeetingController } from './presentation/controllers/meeting.controller';
import { MeetingWebhookController } from './presentation/controllers/meeting-webhook.controller';
import { FathomWebhookGuard } from './presentation/guards/fathom-webhook.guard';

const MeetingRequiredPortsGuard = createRequiredPortsGuard('MeetingModule', [
  {
    token: IMeetingCalendarPort,
    fixHint: 'Register { provide: IMeetingCalendarPort, useClass: GoogleCalendarMeetingAdapter } in IntegrationsModule.',
  },
]);

const COMMAND_HANDLERS = [CreateMeetingHandler, UpdateMeetingHandler, DeleteMeetingHandler];

const QUERY_HANDLERS = [ListMeetingsHandler, GetMeetingByIdHandler];

const JOB_HANDLERS = [ProcessFathomMeetingWebhookHandler];

export interface MeetingModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  inject?: FactoryProvider['inject'];
  useFactory: (...args: any[]) => MeetingModuleInput | Promise<MeetingModuleInput>;
}

@Module({})
export class MeetingModule {
  static forRoot(options: MeetingModuleInput = {}): DynamicModule {
    const parsed = MeetingModuleOptionsSchema.parse(options);
    return MeetingModule.buildModule([{ provide: MEETING_OPTIONS, useValue: parsed }]);
  }

  static forRootAsync(asyncOptions: MeetingModuleAsyncOptions): DynamicModule {
    const optionsProvider: FactoryProvider = {
      provide: MEETING_OPTIONS,
      inject: asyncOptions.inject ?? [],
      useFactory: async (...args: any[]) => MeetingModuleOptionsSchema.parse(await asyncOptions.useFactory(...args)),
    };
    return MeetingModule.buildModule([optionsProvider], asyncOptions.imports ?? []);
  }

  private static buildModule(optionProviders: Provider[], extraImports: any[] = []): DynamicModule {
    return {
      module: MeetingModule,
      imports: [CqrsModule, ...extraImports],
      controllers: [MeetingController, MeetingWebhookController],
      providers: [
        ...optionProviders,
        MeetingRequiredPortsGuard,
        { provide: IMeetingRepository, useClass: MeetingPrismaRepository },
        FathomWebhookGuard,
        ...COMMAND_HANDLERS,
        ...QUERY_HANDLERS,
        ...JOB_HANDLERS,
      ],
      exports: [IMeetingRepository],
    };
  }
}

export type { MeetingModuleOptions };
