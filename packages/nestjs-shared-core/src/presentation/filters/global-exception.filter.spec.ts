import {
  ArgumentsHost,
  BadRequestException,
  HttpStatus,
  InternalServerErrorException,
} from '@nestjs/common';
import { GlobalExceptionFilter } from '@nabarun-ngo/nestjs-shared-core';
import { BusinessException } from '@nabarun-ngo/nestjs-shared-core';

function makeHost(): { host: ArgumentsHost; json: jest.Mock; status: jest.Mock } {
  const json = jest.fn();
  const status = jest.fn().mockReturnValue({ json });
  const host = {
    switchToHttp: () => ({
      getResponse: () => ({ status }),
      getRequest: () => ({ url: '/x', method: 'GET', headers: {} }),
    }),
  } as unknown as ArgumentsHost;
  return { host, json, status };
}

describe('GlobalExceptionFilter', () => {
  describe('production sanitisation (environment="prod")', () => {
    const filter = new GlobalExceptionFilter(undefined, 'prod');

    it('hides stack trace and masks unknown 5xx messages', () => {
      const { host, json, status } = makeHost();
      filter.catch(new Error('DB password is hunter2'), host);

      expect(status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      const body = json.mock.calls[0][0];
      expect(body.stackTrace).toBeUndefined();
      expect(body.messages).toEqual([
        'An internal server error occurred. Please try again later.',
      ]);
      expect(JSON.stringify(body)).not.toContain('hunter2');
    });

    it('still exposes 4xx client messages', () => {
      const { host, json, status } = makeHost();
      filter.catch(new BadRequestException('email is invalid'), host);
      expect(status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(json.mock.calls[0][0].messages).toContain('email is invalid');
    });

    it('preserves BusinessException messages even for 5xx', () => {
      const { host, json } = makeHost();
      filter.catch(new BusinessException('domain rule violated'), host);
      expect(json.mock.calls[0][0].messages).toContain('domain rule violated');
    });
  });

  describe('non-prod (environment="staging") is still treated as production-grade', () => {
    const filter = new GlobalExceptionFilter(undefined, 'staging');

    it('does not leak stack traces or raw 5xx messages in staging', () => {
      const { host, json } = makeHost();
      filter.catch(new Error('internal detail leak'), host);
      const body = json.mock.calls[0][0];
      expect(body.stackTrace).toBeUndefined();
      expect(JSON.stringify(body)).not.toContain('internal detail leak');
    });
  });

  describe('development environment', () => {
    const filter = new GlobalExceptionFilter(undefined, 'development');

    it('includes stack trace for debugging', () => {
      const { host, json } = makeHost();
      filter.catch(new Error('boom'), host);
      expect(json.mock.calls[0][0].stackTrace).toBeDefined();
    });
  });

  describe('technical-error event emission', () => {
    it('emits AppTechnicalError for 5xx when an emitter is provided', () => {
      const publish = jest.fn();
      const filter = new GlobalExceptionFilter({ publish } as any, 'prod');
      const { host } = makeHost();
      filter.catch(new InternalServerErrorException('x'), host);
      expect(publish).toHaveBeenCalledTimes(1);
    });

    it('does not emit for 4xx', () => {
      const publish = jest.fn();
      const filter = new GlobalExceptionFilter({ publish } as any, 'prod');
      const { host } = makeHost();
      filter.catch(new BadRequestException('x'), host);
      expect(publish).not.toHaveBeenCalled();
    });

    it('works without an emitter (alerting disabled)', () => {
      const filter = new GlobalExceptionFilter(undefined, 'prod');
      const { host, status } = makeHost();
      expect(() =>
        filter.catch(new InternalServerErrorException('x'), host),
      ).not.toThrow();
      expect(status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    });
  });
});
