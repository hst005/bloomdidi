import { ConfigService } from '@nestjs/config';
import { DEV_OTP, DEMO_PHONES } from '@bloomdidi/shared';

export function normalizePhone(phone: string): string {
  const trimmed = phone.trim();
  if (trimmed.startsWith('+')) return trimmed;
  return `+${trimmed.replace(/^0+/, '')}`;
}

export function isDemoPhone(phone: string): boolean {
  return (DEMO_PHONES as readonly string[]).includes(normalizePhone(phone));
}

/** MSG91 must have both key and template before we send real SMS OTPs. */
export function smsFullyConfigured(config: ConfigService): boolean {
  const key = config.get<string>('MSG91_AUTH_KEY')?.trim();
  const template = config.get<string>('MSG91_TEMPLATE_ID')?.trim();
  return !!(key && template);
}

export function resolveOtp(
  phone: string,
  config: ConfigService,
  generateRandom: () => string,
): { otp: string; isDemo: boolean } {
  const normalized = normalizePhone(phone);
  if (isDemoPhone(normalized) || !smsFullyConfigured(config)) {
    return { otp: DEV_OTP, isDemo: true };
  }
  return { otp: generateRandom(), isDemo: false };
}

export function smsFullyConfiguredFromEnv(): boolean {
  const key = process.env.MSG91_AUTH_KEY?.trim();
  const template = process.env.MSG91_TEMPLATE_ID?.trim();
  return !!(key && template);
}
