import { betterAuth } from 'better-auth/minimal';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { bearer, phoneNumber } from 'better-auth/plugins';
import { dash } from '@better-auth/infra';
import { PrismaClient } from '@prisma/client';
import { DEV_OTP } from '@bloomdidi/shared';

/** Shared Prisma client for Better Auth (separate from Nest DI lifecycle). */
const prisma = new PrismaClient();

function corsOrigins(): string[] {
  return (
    process.env.CORS_ORIGINS?.split(',').map((o) => o.trim()) ?? [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5175',
    ]
  );
}

async function sendOtpSms(phone: string, code: string): Promise<void> {
  const authKey = process.env.MSG91_AUTH_KEY;
  if (!authKey) {
    console.log(`[DEV] Better Auth OTP for ${phone}: ${code}`);
    return;
  }
  // MSG91 wiring — same provider as legacy SmsService
  await fetch('https://control.msg91.com/api/v5/flow/', {
    method: 'POST',
    headers: {
      authkey: authKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      template_id: process.env.MSG91_TEMPLATE_ID,
      recipients: [{ mobiles: phone.replace('+', ''), OTP: code }],
    }),
  });
}

export const auth = betterAuth({
  appName: 'BloomDidi',
  baseURL: process.env.BETTER_AUTH_URL ?? 'http://localhost:3000',
  basePath: '/api/auth',
  secret: process.env.BETTER_AUTH_SECRET ?? process.env.JWT_SECRET!,
  trustedOrigins: corsOrigins(),
  database: prismaAdapter(prisma, { provider: 'postgresql' }),
  emailAndPassword: {
    enabled: true,
  },
  user: {
    additionalFields: {
      role: {
        type: 'string',
        required: false,
        defaultValue: 'CUSTOMER',
        input: false,
      },
    },
  },
  plugins: [
    bearer(),
    phoneNumber({
      otpLength: 6,
      expiresIn: 300,
      allowedAttempts: 5,
      sendOTP: async ({ phoneNumber: phone, code }) => {
        if (process.env.NODE_ENV !== 'production' && phone.endsWith('9123456789')) {
          console.log(`[DEV] Better Auth OTP for ${phone}: ${DEV_OTP} (sent: ${code})`);
        }
        await sendOtpSms(phone, code);
      },
      signUpOnVerification: {
        getTempEmail: (phone) => `${phone.replace(/\D/g, '')}@phone.bloomdidi.local`,
      },
      callbackOnVerification: async ({ phoneNumber: phone, user }) => {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            phone,
            phoneNumber: phone,
            phoneNumberVerified: true,
            name: user.name ?? undefined,
          },
        });
      },
    }),
    ...(process.env.BETTER_AUTH_API_KEY
      ? [
          dash({
            apiKey: process.env.BETTER_AUTH_API_KEY,
          }),
        ]
      : []),
  ],
});

export type BetterAuthSession = typeof auth.$Infer.Session;
