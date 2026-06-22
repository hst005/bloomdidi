export const DELIVERY_SLOTS = [
  { id: 'today-2-4', label: 'Today 2–4 PM', hours: 14, dayOffset: 0 },
  { id: 'today-4-6', label: 'Today 4–6 PM', hours: 16, dayOffset: 0 },
  { id: 'tomorrow-10-12', label: 'Tomorrow 10–12', hours: 10, dayOffset: 1 },
] as const;

export type DeliverySlotId = (typeof DELIVERY_SLOTS)[number]['id'];

export function slotToScheduledFor(slotId: DeliverySlotId): string {
  const slot = DELIVERY_SLOTS.find((s) => s.id === slotId);
  if (!slot) throw new Error('Invalid slot');
  const d = new Date();
  d.setDate(d.getDate() + slot.dayOffset);
  d.setHours(slot.hours, 0, 0, 0);
  return d.toISOString();
}

/** Display-only default — server recomputes delivery fee at order time. */
export const DISPLAY_DELIVERY_FEE_PAISE = 4000;
