import { Inject, Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { IRecaptchaPort } from '../../application/ports/recaptcha.port';
import { AUTH2_OPTIONS } from '../auth-options.token';
import { Auth2ModuleOptions } from '../../auth-options';


interface RecaptchaVerifyResponse {
  success: boolean;
  score: number;
  action: string;
  challenge_ts: string;
  hostname: string;
  'error-codes'?: string[];
}

@Injectable()
export class RecaptchaAdapter implements IRecaptchaPort {
  private readonly logger = new Logger(RecaptchaAdapter.name);

  constructor(
    private readonly httpService: HttpService,
    @Inject(AUTH2_OPTIONS) private readonly options: Auth2ModuleOptions,
  ) {}

  async verify(token: string, action: string, threshold: number): Promise<boolean> {
    const secretKey = this.options.recaptcha?.secretKey;
    if (!secretKey) {
      this.logger.warn(
        'reCAPTCHA secret key is not configured — all captcha checks will pass. ' +
          'Set recaptcha.secretKey in Auth2ModuleOptions to protect public endpoints.',
      );
      return true;
    }

    try {
      const response = await firstValueFrom(
        this.httpService.post<RecaptchaVerifyResponse>(
          'https://www.google.com/recaptcha/api/siteverify',
          null,
          { params: { secret: secretKey, response: token } },
        ),
      );

      const data = response.data;
      if (!data.success) return false;
      if (data.action !== action) return false;
      return data.score >= threshold;
    } catch {
      return false;
    }
  }
}
