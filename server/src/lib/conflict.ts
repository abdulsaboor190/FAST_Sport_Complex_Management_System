import { prisma } from './prisma.js';
import type { Prisma } from '@prisma/client';

/**
 * Check if a time range overlaps with existing confirmed/pending bookings for the facility.
 */
export async function findConflicts(
  facilityId: string,
  startTime: Date,
  endTime: Date,
  excludeBookingId?: string
): Promise<{ id: string; startTime: Date; endTime: Date; userId: string }[]> {
  const bookings = await prisma.booking.findMany({
    where: {
      facilityId,
      id: excludeBookingId ? { not: excludeBookingId } : undefined,
      status: { in: ['Confirmed', 'Pending'] },
      OR: [
        { startTime: { lt: endTime }, endTime: { gt: startTime } },
      ],
    },
    select: { id: true, startTime: true, endTime: true, userId: true },
  });
  return bookings;
}

export async function hasConflict(
  facilityId: string,
  startTime: Date,
  endTime: Date,
  excludeBookingId?: string
): Promise<boolean> {
  const conflicts = await findConflicts(facilityId, startTime, endTime, excludeBookingId);
  return conflicts.length > 0;
}
