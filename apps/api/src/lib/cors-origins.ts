/** Allowed browser origins for CORS + Better Auth trustedOrigins. */
export function allowedCorsOrigins(): string[] {
  const fromEnv =
    process.env.CORS_ORIGINS?.split(',')
      .map((o) => o.trim())
      .filter(Boolean) ?? [];

  if (fromEnv.length > 0) return fromEnv;

  return [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
  ];
}

/** Railway (and similar) preview URLs change per service — allow without manual env updates. */
export function isAllowedCorsOrigin(origin: string | undefined): boolean {
  if (!origin) return true;
  if (allowedCorsOrigins().includes(origin)) return true;
  try {
    const { hostname, protocol } = new URL(origin);
    if (protocol !== 'http:' && protocol !== 'https:') return false;
    return hostname.endsWith('.up.railway.app');
  } catch {
    return false;
  }
}

export function corsOriginCallback(
  origin: string | undefined,
  callback: (err: Error | null, allow?: boolean) => void,
): void {
  callback(null, isAllowedCorsOrigin(origin));
}
