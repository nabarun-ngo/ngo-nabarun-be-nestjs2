import 'dotenv/config';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CoreModule, isProd } from '@ce/nestjs-shared-core';
import { ObservabilityModule } from '@ce/nestjs-shared-observability';
import { DmsModule } from '@ce/nestjs-shared-dms';
import { CustomFormsModule } from '@ce/nestjs-shared-custom-forms';
import { CronModule } from '@ce/nestjs-shared-cron';
import { Configkey } from './shared/config-keys';
import { CommentModule } from '@ce/nestjs-shared-comment';
import { CorrespondenceModule } from '@ce/nestjs-shared-correspondence';
import { UserModule } from './modules/user/user.module';
import { ReportingModule } from './modules/reporting/reporting.module';
import { ProjectModule } from './modules/project/project.module';
import { LinksModule } from './modules/links/links.module';
import { IntegrationsModule } from './shared/integrations/integrations.module';
import { PublicSiteModule } from './modules/public-site/public-site.module';
import { DocumentGeneratorModule } from '@ce/nestjs-shared-document-generator';
import { join } from 'path';
import { AUTH_MODULE } from './config/auth-module.config';
import { QUEUE_MODULE } from './config/queue-module.config';
import { USER_MODULE } from './config/user-module.config';
import { FINANCE_MODULE } from './config/finance-module.config';
import { WORKFLOW_HOST_MODULE, WORKFLOW_MODULE } from './config/workflow-module.config';
import { MEETING_MODULE } from './config/meeting-module.config';
import { PERSISTANCE_MODULE } from './config/database-module.config';
import { OBS_MODULE } from './config/obs-module.config';
import { DMS_MODULE } from './config/dms-module.config';
import { COMMENT_MODULE } from './config/comment-module.config';
import { CUSTOM_FORM_MODULE } from './config/custom-form-module.config';
import { CORRESPONDENCE_MODULE } from './config/correspondence-module.config';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CoreModule,
    DocumentGeneratorModule.forRoot({
      watermarkPath: join(process.cwd(), 'src/assets/watermark.png'),
    }),
    PERSISTANCE_MODULE,
    AUTH_MODULE,
    OBS_MODULE,
    QUEUE_MODULE,
    IntegrationsModule.forRoot({ imports: [QUEUE_MODULE] }),
    DMS_MODULE,
    COMMENT_MODULE,
    CUSTOM_FORM_MODULE,
    CronModule.forRoot({
      timezone: 'Asia/Kolkata',
    }),
    USER_MODULE,
    FINANCE_MODULE,
    WORKFLOW_MODULE,
    WORKFLOW_HOST_MODULE,
    ReportingModule.forRoot({ imports: [WORKFLOW_MODULE] }),
    ProjectModule.forRoot({ imports: [USER_MODULE, QUEUE_MODULE, FINANCE_MODULE] }),
    MEETING_MODULE,
    LinksModule.forRoot(),
    CORRESPONDENCE_MODULE,
    PublicSiteModule.forRoot({ imports: [WORKFLOW_MODULE] }),
  ],
})
export class AppModule { }
