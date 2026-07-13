import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { SuccessResponse } from '../models/response-model';
import { getTraceId } from '../../infrastructure/utilities/trace-context.util';

/**
 * Global interceptor that wraps every successful controller response in a
 * `SuccessResponse<T>` envelope. Registered via `CoreModule` — no per-module
 * setup needed.
 *
 * Complements `GlobalExceptionFilter`, which wraps error responses in
 * `ErrorResponse`. Together they guarantee a consistent HTTP response shape:
 *   - Success: `{ info, timestamp, traceId, responsePayload: T }`
 *   - Error:   `{ info, timestamp, traceId, messages[], errorCode? }`
 *
 * Controllers return raw DTOs — they must NOT construct `SuccessResponse` directly.
 */
@Injectable()
export class SuccessResponseInterceptor<T>
  implements NestInterceptor<T, SuccessResponse<T>>
{
  intercept(_context: ExecutionContext, next: CallHandler): Observable<SuccessResponse<T>> {
    return next.handle().pipe(
      map((data) => {
        const response = new SuccessResponse<T>(data);
        response.traceId = getTraceId() ?? '';
        return response;
      }),
    );
  }
}
