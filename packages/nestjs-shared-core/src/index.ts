// ─────────────────────────────────────────────────────────────────────────────
// @nabarun-ngo/nestjs-shared-core — Public API barrel
//
// Layer order: Domain → Application → Infrastructure → Presentation
// ─────────────────────────────────────────────────────────────────────────────

// ── Domain layer ──────────────────────────────────────────────────────────────
export type { UserInfo } from './domain/ports/user-lookup.port';
export { IUserLookupPort } from './domain/ports/user-lookup.port';
export {
  OAUTH_ACCESS_TOKEN_PORT,
  type IOAuthAccessTokenPort,
  type OAuthAccessTokenRequest,
} from './domain/ports/oauth-access-token.port';
export { ICACHE_PORT, type ICachePort, type CacheSetOptions } from './domain/ports/cache.port';
export {
  NotificationType,
  NotificationCategory,
  NotificationPriority,
} from './domain/enums/notification-channel.enum';
export { BusinessError } from './domain/errors/business-error';
export { MissingRequiredPortError } from './domain/errors/missing-required-port.error';
export { EntityTypeForbiddenError, EntityAccessDeniedError } from './domain/errors/entity-access.errors';
export { EntityTypePolicyUtil } from './domain/utilities/entity-type-policy.util';
export { RootEvent } from './domain/events/root-event';
export { DomainEvent } from './domain/events/domain-event';
export { AggregateRoot } from './domain/models/aggregate-root';
export { BaseDomain } from './domain/models/base-domain';
export type { ICriteria } from './domain/models/base-filter-props';
export { Criteria, BaseFilter } from './domain/models/base-filter-props';
export { Page } from './domain/models/page';
export { SortOrder } from './domain/models/sort-order.enum';
export type { IRepository } from './domain/repositories/repository.interface';

// ── Application layer ─────────────────────────────────────────────────────────
export { ApplyTryCatch } from './application/decorators/apply-try-catch.decorator';
export { AppTechnicalError } from './application/events/app-technical-error.event';
export type { TechnicalErrorPayload } from './application/events/app-technical-error.event';
export {
  CorrespondenceRequestEvent,
  type CorrespondenceRecipients,
  type CorrespondenceChannels,
  type InAppChannelOptions,
  type EmailChannelOptions,
  type PushChannelOptions,
  type NotificationAction,
  type TargetUsersRecipients,
  type TargetRolesRecipients,
  type TargetResourceRecipients,
} from './application/events/correspondence-request.event';
export { formatDate, evaluateCondition, isTrue } from './application/utilities/common.util';
export { checkEntityRecordAccess } from './application/utilities/entity-record-access.util';
export type { IEntityAccessPort } from './application/utilities/entity-record-access.util';

// ── Infrastructure layer ──────────────────────────────────────────────────────
export type { RouteExclusion, AppConfigOptions } from './infrastructure/config/app.config';
export { applyConfig } from './infrastructure/config/app.config';
export { bootstrapApp } from './infrastructure/config/bootstrap';
export { registerHandlebarsHelpers } from './infrastructure/handlebars/handlebars-helpers';
export { TraceContextLogger } from './infrastructure/logging/trace-context.logger';
export type { DynamicModuleAsyncOptions } from './base-dynamic.module';
export { BaseDynamicModule } from './base-dynamic.module';
export { CoreModule } from './core.module';
export {
  encryptText,
  decryptText,
  isEncryptedText,
  safeEqual,
  hashText,
  validateApiKey,
} from './infrastructure/utilities/crypto.util';
export { getEnv, isProd, isNonProd, isHigherEnv, isLocalEnv } from './infrastructure/utilities/env.util';
export { generatePassword, generateUniqueNDigitNumber } from './infrastructure/utilities/password-util';
export type { UserContext, TraceContext } from './infrastructure/utilities/trace-context.util';
export { traceStorage, getTraceId, getUserContext, setUserContext, resolveTraceId } from './infrastructure/utilities/trace-context.util';
export { validateModuleOptions } from './infrastructure/utilities/validate-options.util';
export {
  createRequiredPortsGuard,
  type RequiredPortSpec,
} from './infrastructure/guards/required-ports.guard';

// ── Presentation layer ────────────────────────────────────────────────────────
export type { SwaggerOptions } from './presentation/config/swagger.config';
export { configureSwagger } from './presentation/config/swagger.config';
export { BusinessException } from './presentation/exceptions/business-exception';
export type { ApiAutoResponseOptions } from './presentation/decorators/api-auto-response.decorator';
export {
  ApiAutoResponse,
  ApiAutoSuccessResponse,
  ApiAutoPrimitiveResponse,
  ApiAutoVoidResponse,
  ApiAutoPagedResponse,
} from './presentation/decorators/api-auto-response.decorator';
export { BypassSuccessEnvelope } from './presentation/decorators/bypass-success-envelope.decorator';
export { GlobalExceptionFilter } from './presentation/filters/global-exception.filter';
export { SuccessResponseInterceptor } from './presentation/interceptors/success-response.interceptor';
export { TimingInterceptor } from './presentation/interceptors/timing.interceptor';
export { AccessGatedResponse } from './presentation/models/access-gated-response';
export { PagedResponse } from './presentation/models/paged-response';
export { PaginatedQueryDto } from './presentation/models/paginated-query.dto';
export { SuccessResponse, ErrorResponse } from './presentation/models/response-model';
export {
  createSuccessResponseType,
  createPageType,
  createPagedSuccessResponseType,
  createVoidSuccessResponseType,
} from './presentation/models/typed-responses';
