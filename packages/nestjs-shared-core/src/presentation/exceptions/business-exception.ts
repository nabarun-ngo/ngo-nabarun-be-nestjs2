import { BusinessError } from '../../domain/errors/business-error';

/**
 * HTTP-presentable wrapper around `BusinessError`.
 *
 * Extends `BusinessError` so the `GlobalExceptionFilter` continues to
 * recognise it as a deliberate business-rule violation (→ 4xx with the
 * exact message, never masked in production).
 *
 * Adds `getStatus()` / `getResponse()` to mirror the `HttpException` API
 * expected by presentation-layer consumers and tests.
 */
export class BusinessException extends BusinessError {
  getStatus(): number {
    return this.statusCode;
  }

  getResponse(): { message: string; errorCode: string; statusCode: number } {
    return {
      message: this.message,
      errorCode: this.errorCode,
      statusCode: this.statusCode,
    };
  }
}
