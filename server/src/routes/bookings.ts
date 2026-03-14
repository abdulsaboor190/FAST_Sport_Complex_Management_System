import { Router } from 'express';
import { z } from 'zod';
import { addMinutes } from 'date-fns';
import { prisma } from '../lib/prisma.js';
import { authenticate, requireRoles, type AuthRequest } from '../middleware/auth.js';
import { hasConflict, findConflicts } from '../lib/conflict.js';
import { calculateRefundAmount, canCancelByPolicy, getRefundTier, CANCELLATION_POLICY } from '../lib/refund.js';
import { calculateBookingAmount } from '../lib/pricing.js';
import { sendCancellationEmail } from '../lib/email.js';
import type { Prisma, Role, BookingStatus } from '@prisma/client';

const router = Router();

const createSchema = z.object({
  facilityId: z.string().min(1),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  purpose: z.string().max(500).optional(),
  participantCount: z.number().int().min(1).max(500).optional(),
  specialRequirements: z.string().max(500).optional(),
});

router.use(authenticate);

router.post('/', async (req: AuthRequest, res) => {
  const parse = createSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ message: 'Validation failed', errors: parse.error.flatten() });
  }
  const { facilityId, startTime, endTime, purpose, participantCount, specialRequirements } = parse.data;
  const start = new Date(startTime);
  const end = new Date(endTime);
  if (end <= start) {
    return res.status(400).json({ message: 'End time must be after start time' });
  }

  const facility = await prisma.facility.findUnique({
    where: { id: facilityId, isActive: true },
  });
  if (!facility) return res.status(404).json({ message: 'Facility not found' });

  const durationMins = (end.getTime() - start.getTime()) / 60000;
  const slotCount = durationMins / facility.slotDurationMinutes;
  if (slotCount < facility.minBookingSlots || slotCount > facility.maxBookingSlots) {
    return res.status(400).json({
      message: `Duration must be between ${facility.minBookingSlots} and ${facility.maxBookingSlots} slots (${facility.slotDurationMinutes} min each)`,
    });
  }

  const conflict = await hasConflict(facilityId, start, end);
  if (conflict) {
    const conflicts = await findConflicts(facilityId, start, end);
    return res.status(409).json({
      message: 'Selected slot conflicts with an existing booking',
      code: 'CONFLICT',
      conflicts: conflicts.map((c) => ({ id: c.id, startTime: c.startTime, endTime: c.endTime })),
    });
  }

  const totalAmount = calculateBookingAmount(facility, start, end);
  const booking = await prisma.booking.create({
    data: {
      facilityId,
      userId: req.user!.id,
      startTime: start,
      endTime: end,
      purpose: purpose ?? null,
      participantCount: participantCount ?? null,
      specialRequirements: specialRequirements ?? null,
      totalAmount,
      status: 'Confirmed',
    },
    include: {
      facility: { select: { name: true, slug: true } },
    },
  });

  const io = req.app.get('io') as import('socket.io').Server | undefined;
  const dateStr = start.toISOString().slice(0, 10);
  io?.to(`facility:${facilityId}:${dateStr}`).emit('slots-updated', { facilityId, date: dateStr });

  res.status(201).json(booking);
});

router.get('/my', async (req: AuthRequest, res) => {
  const { upcoming, past, status } = req.query;
  const now = new Date();
  const where: Prisma.BookingWhereInput = { userId: req.user!.id };
  if (status && typeof status === 'string') {
    where.status = status as BookingStatus;
  }
  if (upcoming === 'true') where.endTime = { gte: now };
  if (past === 'true') where.endTime = { lt: now };

  const bookings = await prisma.booking.findMany({
    where,
    include: {
      facility: { select: { id: true, name: true, slug: true, imageUrl: true } },
    },
    orderBy: { startTime: 'asc' },
  });
  res.json(bookings);
});

router.get('/:id', async (req: AuthRequest, res) => {
  const booking = await prisma.booking.findFirst({
    where: {
      id: req.params.id,
      userId: req.user!.id,
    },
    include: {
      facility: true,
    },
  });
  if (!booking) return res.status(404).json({ message: 'Booking not found' });
  res.json(booking);
});

const cancelSchema = z.object({
  reason: z.string().max(500).optional(),
});

router.post('/:id/cancel', async (req: AuthRequest, res) => {
  const booking = await prisma.booking.findFirst({
    where: { id: req.params.id, userId: req.user!.id },
    include: { facility: true, user: { select: { email: true, name: true } } },
  });
  if (!booking) return res.status(404).json({ message: 'Booking not found' });
  if (booking.status === 'Cancelled') {
    return res.status(400).json({ message: 'Booking is already cancelled' });
  }

  const parse = cancelSchema.safeParse(req.body);
  const reason = parse.success ? parse.data.reason : undefined;

  const now = new Date();
  if (!canCancelByPolicy(booking.startTime, now)) {
    return res.status(400).json({
      message: `Cancellation requires at least ${CANCELLATION_POLICY.minNoticeHours} hours notice`,
    });
  }

  const refundAmount = calculateRefundAmount(
    Number(booking.totalAmount),
    now,
    booking.startTime
  );
  const refundTier = getRefundTier(now, booking.startTime);

  await prisma.booking.update({
    where: { id: booking.id },
    data: {
      status: 'Cancelled',
      cancelledAt: now,
      cancelledById: req.user!.id,
      cancelReason: reason ?? null,
      refundAmount: refundAmount > 0 ? refundAmount : null,
      refundStatus: refundAmount > 0 ? 'Pending' : 'None',
    },
  });

  if (refundAmount > 0) {
    try {
      await sendCancellationEmail(
        booking.user.email,
        booking.user.name,
        booking.facility.name,
        booking.startTime,
        refundAmount,
        refundTier
      );
    } catch (e) {
      console.error('Cancel email failed:', e);
    }
  }

  const io = req.app.get('io') as import('socket.io').Server | undefined;
  const dateStr = booking.startTime.toISOString().slice(0, 10);
  io?.to(`facility:${booking.facilityId}:${dateStr}`).emit('slots-updated', { facilityId: booking.facilityId, date: dateStr });

  res.json({
    message: 'Booking cancelled',
    refundAmount,
    refundTier,
    refundStatus: refundAmount > 0 ? 'Pending' : 'None',
  });
});

router.get('/admin/all', requireRoles('Admin' as Role), async (req, res) => {
  const bookings = await prisma.booking.findMany({
    include: {
      facility: { select: { id: true, name: true, slug: true } },
      user: { select: { id: true, name: true, email: true, fastId: true } },
    },
    orderBy: { startTime: 'desc' },
    take: 200,
  });
  res.json(bookings);
});

router.patch('/admin/:id/refund-status', requireRoles('Admin' as Role), async (req, res) => {
  const { status } = req.body as { status?: string };
  const valid: Array<'Pending' | 'Approved' | 'Processed' | 'None'> = ['Pending', 'Approved', 'Processed', 'None'];
  if (!status || !valid.includes(status as (typeof valid)[number])) {
    return res.status(400).json({ message: 'Invalid refund status' });
  }
  const booking = await prisma.booking.findUnique({
    where: { id: req.params.id },
  });
  if (!booking) return res.status(404).json({ message: 'Booking not found' });
  await prisma.booking.update({
    where: { id: req.params.id },
    data: { refundStatus: status as (typeof valid)[number] },
  });
  res.json({ message: 'Refund status updated' });
});

export default router;
