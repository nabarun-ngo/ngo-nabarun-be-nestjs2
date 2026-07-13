import { HttpStatus } from '@nestjs/common';
import { BusinessException } from '@ce/nestjs-shared-core';

describe('BusinessException', () => {
  it('is an instance of Error', () => {
    const err = new BusinessException('Something went wrong');
    expect(err).toBeInstanceOf(Error);
  });

  it('has HTTP status 400 (BAD_REQUEST)', () => {
    const err = new BusinessException('bad input');
    expect(err.getStatus()).toBe(HttpStatus.BAD_REQUEST);
  });

  it('includes the message in the response body', () => {
    const err = new BusinessException('Invalid amount');
    const response = err.getResponse() as any;
    expect(response.message).toBe('Invalid amount');
  });

  it('defaults errorCode to BUSINESS_ERROR when not provided', () => {
    const err = new BusinessException('test error');
    const response = err.getResponse() as any;
    expect(response.errorCode).toBe('BUSINESS_ERROR');
  });

  it('uses the provided errorCode', () => {
    const err = new BusinessException('test error', 'CUSTOM_CODE');
    const response = err.getResponse() as any;
    expect(response.errorCode).toBe('CUSTOM_CODE');
  });

  it('includes statusCode 400 in the response body', () => {
    const err = new BusinessException('test');
    const response = err.getResponse() as any;
    expect(response.statusCode).toBe(400);
  });
});
