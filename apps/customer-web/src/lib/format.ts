/** Human-friendly distance — avoids showing "0.0 km" */
export function formatDistance(km: number): string {
  if (km < 0.15) return 'Nearby';
  if (km < 1) return `${Math.max(0.2, Math.round(km * 10) / 10)} km`;
  return `${km.toFixed(1)} km`;
}
