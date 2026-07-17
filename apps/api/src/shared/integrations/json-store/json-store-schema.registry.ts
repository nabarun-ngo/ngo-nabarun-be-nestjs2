import { z } from 'zod';
import { EmailTemplatePayloadSchema } from '@ce/nestjs-shared-correspondence';
import { CronJobPayloadSchema } from '@ce/nestjs-shared-cron';
import { WorkflowDefinitionSchema } from '@ce/nestjs-shared-workflow';
import { UserReferenceDataPayloadSchema } from '../../../internal/user/user-reference-data.schema';
import { FinanceReferenceDataPayloadSchema } from '../../../internal/finance/finance-reference-data.schema';
import { ProjectReferenceDataPayloadSchema } from '../../../internal/project/project-reference-data.schema';
import {
  PublicSiteDynamicContentSchema,
  PublicSiteStaticContentSchema,
} from '../../../public/public-site/public-site.schema';
import { ReportDefinitionsPayloadSchema } from '../../../internal/reporting/reporting.schema';
import {
  AppLinksPayloadSchema,
  ContentLinksPayloadSchema,
  LinksPayloadSchema,
  LinksReferenceDataPayloadSchema,
} from '../../../internal/links/links.schema';

export type JsonStoreSchemaRegistry = Record<string, z.ZodType>;

export const JSON_STORE_SCHEMA_REGISTRY: JsonStoreSchemaRegistry = {
  correspondence: EmailTemplatePayloadSchema,
  cron: CronJobPayloadSchema,
  workflow: WorkflowDefinitionSchema,
  'user-reference-data': UserReferenceDataPayloadSchema,
  'finance-reference-data': FinanceReferenceDataPayloadSchema,
  'project-reference-data': ProjectReferenceDataPayloadSchema,
  'report-definitions': ReportDefinitionsPayloadSchema,
  links: LinksPayloadSchema,
  'links:user-guides': ContentLinksPayloadSchema,
  'links:policies': ContentLinksPayloadSchema,
  'links:app-links': AppLinksPayloadSchema,
  'links:link-open-types': LinksReferenceDataPayloadSchema,
  'links:app-link-types': LinksReferenceDataPayloadSchema,
  'links:link-categories': LinksReferenceDataPayloadSchema,
  'public-site': z.union([PublicSiteStaticContentSchema, PublicSiteDynamicContentSchema]),
};

export function resolveJsonStoreSchema(
  registry: JsonStoreSchemaRegistry,
  namespace: string,
  key: string,
): z.ZodType | undefined {
  return registry[`${namespace}:${key}`] ?? registry[namespace];
}

export function formatZodValidationErrors(error: z.ZodError): string {
  return error.issues
    .map((issue) => {
      const path = issue.path.length > 0 ? issue.path.join('.') : 'root';
      return `${path}: ${issue.message}`;
    })
    .join('; ');
}
