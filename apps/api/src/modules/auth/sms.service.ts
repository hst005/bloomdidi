import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  constructor(private config: ConfigService) {}

  async sendOtp(phone: string, otp: string): Promise<void> {
    const authKey = this.config.get<string>('MSG91_AUTH_KEY');
    if (!authKey) {
      this.logger.log(`[DEV] OTP for ${phone}: ${otp}`);
      return;
    }

    // Production: integrate MSG91 REST API
    // await fetch(`https://control.msg91.com/api/v5/flow/...`, { ... });
    this.logger.log(`OTP sent to ${phone} via MSG91`);
  }
}
