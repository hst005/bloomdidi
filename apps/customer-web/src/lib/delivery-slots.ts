import type { ShopOpeningHours } from '@bloomdidi/shared';

export const DISPLAY_DELIVERY_FEE_PAISE = 4000;

const SLOT_HOURS = 2;
const LEAD_MS = 60 * 60 * 1000;

const DAY_KEYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

export const DEFAULT_OPENING_HOURS: ShopOpeningHours = {
  Mon: { open: '09:00', close: '21:00', closed: false },
  Tue: { open: '09:00', close: '21:00', closed: false },
  Wed: { open: '09:00', close: '21:00', closed: false },
  Thu: { open: '09:00', close: '21:00', closed: false },
  Fri: { open: '09:00', close: '21:00', closed: false },
  Sat: { open: '09:00', close: '21:00', closed: false },
  Sun: { open: '10:00', close: '20:00', closed: false },
};

export type DeliverySlot = {
  id: string;
  label: string;
  scheduledFor: string;
};

function dayKey(date: Date): string {
  return DAY_KEYS[date.getDay()];
}

function parseTime(hhmm: string): { h: number; m: number } {
  const [h, m] = hhmm.split(':').map(Number);
  return { h: h ?? 0, m: m ?? 0 };
}

function atTime(date: Date, hhmm: string): Date {
  const { h, m } = parseTime(hhmm);
  const d = new Date(date);
  d.setHours(h, m, 0, 0);
  return d;
}

function ceilToHour(date: Date): Date {
  const d = new Date(date);
  d.setMinutes(0, 0, 0);
  if (d.getTime() < date.getTime()) {
    d.setHours(d.getHours() + 1);
  }
  return d;
}

function formatTime(d: Date): string {
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true });
}

function formatSlotLabel(start: Date, end: Date, now: Date): string {
  const today = now.toDateString();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const day =
    start.toDateString() === today
      ? 'Today'
      : start.toDateString() === tomorrow.toDateString()
        ? 'Tomorrow'
        : start.toLocaleDateString(undefined, { weekday: 'short' });
  return `${day} ${formatTime(start)}–${formatTime(end)}`;
}

function resolveHours(hours?: ShopOpeningHours | null): ShopOpeningHours {
  if (!hours || typeof hours !== 'object') return DEFAULT_OPENING_HOURS;
  return { ...DEFAULT_OPENING_HOURS, ...hours };
}

/** Slots from now + 1 hour through tomorrow's vendor closing time (2-hour windows). */
export function buildDeliverySlots(
  hours?: ShopOpeningHours | null,
  now: Date = new Date(),
): DeliverySlot[] {
  const schedule = resolveHours(hours);
  const earliest = new Date(now.getTime() + LEAD_MS);
  let cursor = ceilToHour(earliest);

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowDay = schedule[dayKey(tomorrow)] ?? DEFAULT_OPENING_HOURS[dayKey(tomorrow)];
  if (tomorrowDay.closed) return [];

  const endBoundary = atTime(tomorrow, tomorrowDay.close);
  const slotMs = SLOT_HOURS * 60 * 60 * 1000;
  const slots: DeliverySlot[] = [];

  while (cursor.getTime() < endBoundary.getTime()) {
    const slotEnd = new Date(cursor.getTime() + slotMs);
    const dayHours = schedule[dayKey(cursor)] ?? DEFAULT_OPENING_HOURS[dayKey(cursor)];

    if (!dayHours.closed) {
      const dayOpen = atTime(cursor, dayHours.open);
      const dayClose = atTime(cursor, dayHours.close);

      if (
        cursor.getTime() >= earliest.getTime() &&
        cursor.getTime() >= dayOpen.getTime() &&
        slotEnd.getTime() <= dayClose.getTime() &&
        slotEnd.getTime() <= endBoundary.getTime()
      ) {
        slots.push({
          id: cursor.toISOString(),
          label: formatSlotLabel(cursor, slotEnd, now),
          scheduledFor: cursor.toISOString(),
        });
      }
    }

    cursor = new Date(cursor.getTime() + slotMs);
  }

  return slots;
}

export function slotToScheduledFor(slotId: string, slots?: DeliverySlot[]): string {
  const match = slots?.find((s) => s.id === slotId);
  if (match) return match.scheduledFor;
  const parsed = new Date(slotId);
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
  throw new Error('Invalid delivery slot');
}
