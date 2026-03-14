import { Router } from 'express';
import { z } from 'zod';
import { startOfDay, endOfDay, addMinutes, setHours, setMinutes } from 'date-fns';
import { prisma } from '../lib/prisma.js';
const router = Router();

const availabilityQuerySchema = z.object({
  facilityId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

router.get('/', async (_req, res) => {
  const facilities = await prisma.facility.findMany({
    where: { isActive: true },
    orderBy: [{ category: 'asc' }, { name: 'asc' }],
  });
  res.json(facilities);
});

/**
 * Returns booked slots for a facility on a given day (for calendar coloring).
 * Must be before /:id to avoid "availability" being captured as id.
 */
router.get('/availability/slots', async (req, res) => {
  const parse = availabilityQuerySchema.safeParse(req.query);
  if (!parse.success) {
    return res.status(400).json({ message: 'Invalid query', errors: parse.error.flatten() });
  }
  const { facilityId, date } = parse.data;
  const dayStart = startOfDay(new Date(date));
  const dayEnd = endOfDay(new Date(date));

  const bookings = await prisma.booking.findMany({
    where: {
      facilityId,
      status: { in: ['Confirmed', 'Pending'] },
      startTime: { lt: dayEnd },
      endTime: { gt: dayStart },
    },
    select: { id: true, startTime: true, endTime: true, userId: true, status: true },
  });

  const slots = bookings.map((b) => ({
    id: b.id,
    start: b.startTime.toISOString(),
    end: b.endTime.toISOString(),
    userId: b.userId,
    status: b.status,
  }));

  res.json({ date, facilityId, slots });
});

/**
 * Returns available slot ranges for a facility on a date.
 * Facility has opening hours; we assume 08:00–22:00 if not set.
 */
router.get('/availability/available-ranges', async (req, res) => {
  const parse = availabilityQuerySchema.safeParse(req.query);
  if (!parse.success) {
    return res.status(400).json({ message: 'Invalid query' });
  }
  const { facilityId, date } = parse.data;
  const facility = await prisma.facility.findUnique({
    where: { id: facilityId },
  });
  if (!facility) return res.status(404).json({ message: 'Facility not found' });

  const dayStart = startOfDay(new Date(date));
  const openHour = 8;
  const openMin = 0;
  const closeHour = 22;
  const closeMin = 0;
  let rangeStart = setMinutes(setHours(dayStart, openHour), openMin);
  const rangeEnd = setMinutes(setHours(dayStart, closeHour), closeMin);
  const slotMins = facility.slotDurationMinutes;
  const slots: { start: string; end: string }[] = [];

  const bookings = await prisma.booking.findMany({
    where: {
      facilityId,
      status: { in: ['Confirmed', 'Pending'] },
      startTime: { lt: rangeEnd },
      endTime: { gt: rangeStart },
    },
    select: { startTime: true, endTime: true },
    orderBy: { startTime: 'asc' },
  });

  while (rangeStart < rangeEnd) {
    const slotEnd = addMinutes(rangeStart, slotMins);
    if (slotEnd > rangeEnd) break;
    const overlaps = bookings.some(
      (b) => rangeStart < b.endTime && slotEnd > b.startTime
    );
    if (!overlaps) {
      slots.push({
        start: rangeStart.toISOString(),
        end: slotEnd.toISOString(),
      });
    }
    rangeStart = slotEnd;
  }

  res.json({ date, facilityId, slots });
});

router.get('/:idOrSlug', async (req, res) => {
  const idOrSlug = req.params.idOrSlug;
  let facility = await prisma.facility.findUnique({
    where: { id: idOrSlug, isActive: true } as never,
  });
  if (!facility) {
    facility = await prisma.facility.findUnique({
      where: { slug: idOrSlug, isActive: true } as never,
    });
  }
  if (!facility) return res.status(404).json({ message: 'Facility not found' });
  res.json(facility);
});

export default router;
