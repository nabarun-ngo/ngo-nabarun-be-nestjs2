/**
 * Base class for all domain / business rule violations.
 *
 * Extend this for every named domain error so the global exception filter
 * can distinguish a deliberate business rule violation (→ 4xx response with
 * the exact message) from an unexpected infrastructure failure (→ 500 with
 * a sanitised message).
 *
 * @example
 * export class OrderAlreadyCancelledError extends BusinessError {
 *   constructor(orderId: string) {
 *     super(`Order ${orderId} has already been cancelled.`, 'ORDER_ALREADY_CANCELLED');
 *   }
 * }
 */
export class BusinessError extends Error {
  readonly statusCode: number;
  readonly errorCode: string;

  constructor(
    message: string,
    errorCode: string = 'BUSINESS_ERROR',
    statusCode: number = 400,
  ) {
    super(message);
    this.name = 'BusinessError';
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    // Maintain correct prototype chain for `instanceof` checks across
    // transpilation targets (tsc with ES5 downlevelling).
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
