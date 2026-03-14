import { differenceInHours } from 'date-fns';

export const CANCELLATION_POLICY = {
  fullRefundHours: 48,
  halfRefundHours: 24,
  minNoticeHours: 24,
} as const;

export type RefundTier = 'full' | 'half' | 'none';

export function getRefundTier(cancelAt: Date, bookingStart: Date): RefundTier {
  const hoursUntilStart = differenceInHours(bookingStart, cancelAt);
  if (hoursUntilStart >= CANCELLATION_POLICY.fullRefundHours) return 'full';
  if (hoursUntilStart >= CANCELLATION_POLICY.halfRefundHours) return 'half';
  return 'none';
}

export function calculateRefundAmount(
  totalAmount: number,
  cancelAt: Date,
  bookingStart: Date
): number {
  const tier = getRefundTier(cancelAt, bookingStart);
  if (tier === 'full') return totalAmount;
  if (tier === 'half') return Math.round(totalAmount * 0.5 * 100) / 100;
  return 0;
}

export function canCancelByPolicy(bookingStart: Date, now: Date = new Date()): boolean {
  const hoursUntilStart = differenceInHours(bookingStart, now);
  return hoursUntilStart >= CANCELLATION_POLICY.minNoticeHours;
}
