import { Type } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Creates a concrete SuccessResponse class for a specific type.
 * This is needed because TypeScript doesn't preserve generic type information at runtime,
 * so Swagger can't properly generate schemas for generic types like SuccessResponse<T>.
 */
export function createSuccessResponseType<T>(
  modelClass: Type<T>,
  isArray: boolean = false,
) {
  if (isArray) {
    class ConcreteSuccessResponseArray {
      @ApiProperty() info: string;
      @ApiProperty() timestamp: Date;
      @ApiProperty() traceId?: string;
      @ApiProperty() message: string;
      @ApiProperty({
        type: () => modelClass,
        description: 'Response payload data',
        isArray: true,
      })
      responsePayload?: T[];
    }

    Object.defineProperty(ConcreteSuccessResponseArray, 'name', {
      value: `SuccessResponseArray${modelClass.name}`,
      writable: false,
    });

    return ConcreteSuccessResponseArray as Type<{
      info: string;
      timestamp: Date;
      traceId?: string;
      message: string;
      responsePayload?: T[];
    }>;
  } else {
    class ConcreteSuccessResponse {
      @ApiProperty() info: string;
      @ApiProperty() timestamp: Date;
      @ApiProperty() traceId?: string;
      @ApiProperty() message: string;
      @ApiProperty({
        type: () => modelClass,
        description: 'Response payload data',
      })
      responsePayload?: T;
    }

    Object.defineProperty(ConcreteSuccessResponse, 'name', {
      value: `SuccessResponse${modelClass.name}`,
      writable: false,
    });

    return ConcreteSuccessResponse as Type<{
      info: string;
      timestamp: Date;
      traceId?: string;
      message: string;
      responsePayload?: T;
    }>;
  }
}

/**
 * Creates a concrete PagedResponse class for a specific type.
 * Used by Swagger to properly generate schemas for paginated responses.
 */
export function createPageType<T>(modelClass: Type<T>) {
  class ConcretePage {
    @ApiProperty({
      description: 'List of items for the current page',
      type: () => modelClass,
      isArray: true,
    })
    content: T[];

    @ApiProperty({ description: 'Current page index (0-based)' })
    pageIndex: number;

    @ApiProperty({ description: 'Page size (number of items per page)' })
    pageSize: number;

    @ApiProperty({ description: 'Total number of items across all pages' })
    totalSize: number;
  }

  Object.defineProperty(ConcretePage, 'name', {
    value: `Page${modelClass.name}`,
    writable: false,
  });

  return ConcretePage as Type<{
    content: T[];
    totalSize: number;
    pageIndex: number;
    pageSize: number;
  }>;
}

/**
 * Creates a concrete SuccessResponse wrapping a PagedResponse for a specific type.
 */
export function createPagedSuccessResponseType<T>(modelClass: Type<T>) {
  const PageType = createPageType(modelClass);

  class ConcretePagedSuccessResponse {
    @ApiProperty() info: string;
    @ApiProperty() timestamp: Date;
    @ApiProperty() traceId?: string;
    @ApiProperty() message: string;
    @ApiProperty({
      type: () => PageType,
      description: 'Paginated response payload',
    })
    responsePayload?: InstanceType<typeof PageType>;
  }

  Object.defineProperty(ConcretePagedSuccessResponse, 'name', {
    value: `SuccessResponsePage${modelClass.name}`,
    writable: false,
  });

  return ConcretePagedSuccessResponse as Type<{
    info: string;
    timestamp: Date;
    traceId?: string;
    message: string;
    responsePayload?: InstanceType<typeof PageType>;
  }>;
}

/**
 * Creates a concrete SuccessResponse class for void (no payload) responses.
 */
export function createVoidSuccessResponseType() {
  class ConcreteVoidSuccessResponse {
    @ApiProperty() info: string;
    @ApiProperty() timestamp: Date;
    @ApiProperty() traceId?: string;
    @ApiProperty() message: string;
  }

  Object.defineProperty(ConcreteVoidSuccessResponse, 'name', {
    value: 'SuccessResponseVoid',
    writable: false,
  });

  return ConcreteVoidSuccessResponse as Type<{
    info: string;
    timestamp: Date;
    traceId?: string;
    message: string;
  }>;
}
