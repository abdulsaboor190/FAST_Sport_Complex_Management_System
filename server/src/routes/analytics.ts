import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authenticate, requireRoles, type AuthRequest } from '../middleware/auth.js';
import { startOfDay, endOfDay, startOfWeek, startOfMonth, format, addDays } from 'date-fns';
import type { Prisma } from '@prisma/client';

const router = Router();
router.use(authenticate, requireRoles('Admin'));

const rangeSchema = z.object({
  from: z.string().datetime(),
  to: z.string().datetime(),
});

function parseRange(req: AuthRequest) {
  const parse = rangeSchema.safeParse(req.query);
  if (!parse.success) return null;
  const from = new Date(parse.data.from);
  const to = new Date(parse.data.to);
  if (to <= from) return null;
  return { from, to };
}

function daysBetween(from: Date, to: Date) {
  const ms = to.getTime() - from.getTime();
  return Math.max(1, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

// ——— Overview cards ———
router.get('/overview', async (req: AuthRequest, res) => {
  const now = new Date();
  const todayFrom = startOfDay(now);
  const todayTo = endOfDay(now);
  const weekFrom = startOfWeek(now, { weekStartsOn: 1 });
  const monthFrom = startOfMonth(now);

  const [bookingsToday, bookingsWeek, bookingsMonth, activeUsers, revenueToday, upcomingEvents] =
    await Promise.all([
      prisma.booking.count({ where: { startTime: { gte: todayFrom, lte: todayTo } } }),
      prisma.booking.count({ where: { startTime: { gte: weekFrom, lte: now } } }),
      prisma.booking.count({ where: { startTime: { gte: monthFrom, lte: now } } }),
      prisma.booking.findMany({
        where: { startTime: { gte: monthFrom, lte: now } },
        select: { userId: true },
        distinct: ['userId'],
      }).then((rows) => rows.length),
      prisma.booking
        .aggregate({
          where: { status: 'Confirmed', startTime: { gte: todayFrom, lte: todayTo } },
          _sum: { totalAmount: true },
        })
        .then((a) => Number(a._sum.totalAmount ?? 0)),
      prisma.event.count({ where: { status: 'Published', startTime: { gt: now } } }),
    ]);

  res.json({
    bookings: { today: bookingsToday, week: bookingsWeek, month: bookingsMonth },
    activeUsers,
    revenueToday,
    upcomingEvents,
  });
});

// ——— Facility utilization ———
router.get('/facility-utilization', async (req: AuthRequest, res) => {
  const range = parseRange(req);
  if (!range) return res.status(400).json({ message: 'Invalid from/to query' });
  const { from, to } = range;

  const facilities = await prisma.facility.findMany({ where: { isActive: true } });
  const bookings = await prisma.booking.findMany({
    where: { status: { in: ['Confirmed', 'Pending'] }, startTime: { lt: to }, endTime: { gt: from } },
    select: { facilityId: true, startTime: true, endTime: true },
  });

  const openMinutesPerDay = 14 * 60; // 08:00–22:00 default
  const totalDays = daysBetween(from, to);
  const denom = totalDays * openMinutesPerDay;

  const minutesByFacility = new Map<string, number>();
  for (const b of bookings) {
    const start = b.startTime < from ? from : b.startTime;
    const end = b.endTime > to ? to : b.endTime;
    const mins = Math.max(0, (end.getTime() - start.getTime()) / 60000);
    minutesByFacility.set(b.facilityId, (minutesByFacility.get(b.facilityId) ?? 0) + mins);
  }

  const rows = facilities.map((f) => {
    const bookedMinutes = minutesByFacility.get(f.id) ?? 0;
    const utilization = denom > 0 ? bookedMinutes / denom : 0;
    return {
      facilityId: f.id,
      facilityName: f.name,
      category: f.category,
      bookedMinutes: Math.round(bookedMinutes),
      utilizationRate: Math.round(utilization * 1000) / 10, // %
      underUtilized: utilization < 0.2,
    };
  });

  res.json({ from: from.toISOString(), to: to.toISOString(), facilities: rows });
});

// ——— Peak hours heatmap (bookings) ———
router.get('/peak-heatmap', async (req: AuthRequest, res) => {
  const range = parseRange(req);
  if (!range) return res.status(400).json({ message: 'Invalid from/to query' });
  const facilityId = typeof req.query.facilityId === 'string' ? req.query.facilityId : undefined;
  const { from, to } = range;

  const where: Prisma.BookingWhereInput = {
    startTime: { lt: to },
    endTime: { gt: from },
    status: { in: ['Confirmed', 'Pending'] },
  };
  if (facilityId) where.facilityId = facilityId;

  const bookings = await prisma.booking.findMany({
    where,
    select: { startTime: true, endTime: true, facilityId: true },
  });

  // matrix[dayOfWeek][hour] = count
  const matrix = Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => 0));
  for (const b of bookings) {
    const start = b.startTime < from ? from : b.startTime;
    const end = b.endTime > to ? to : b.endTime;
    // Step by hour
    let cursor = new Date(start);
    cursor.setMinutes(0, 0, 0);
    while (cursor < end) {
      const hourStart = cursor;
      const hourEnd = new Date(cursor.getTime() + 60 * 60 * 1000);
      const overlaps = hourStart < end && hourEnd > start;
      if (overlaps) {
        matrix[hourStart.getDay()][hourStart.getHours()] += 1;
      }
      cursor = hourEnd;
    }
  }

  res.json({ from: from.toISOString(), to: to.toISOString(), facilityId: facilityId ?? null, matrix });
});

// ——— Booking trends ———
router.get('/booking-trends', async (req: AuthRequest, res) => {
  const range = parseRange(req);
  if (!range) return res.status(400).json({ message: 'Invalid from/to query' });
  const granularity = (req.query.granularity as string) ?? 'day';
  const { from, to } = range;

  const bookings = await prisma.booking.findMany({
    where: { startTime: { gte: from, lte: to } },
    select: { startTime: true, status: true },
  });

  const keyOf = (d: Date) => {
    if (granularity === 'month') return format(d, 'yyyy-MM');
    if (granularity === 'week') return format(startOfWeek(d, { weekStartsOn: 1 }), 'yyyy-MM-dd');
    return format(d, 'yyyy-MM-dd');
  };

  const bucket = new Map<string, { total: number; cancelled: number }>();
  for (const b of bookings) {
    const k = keyOf(b.startTime);
    const v = bucket.get(k) ?? { total: 0, cancelled: 0 };
    v.total += 1;
    if (b.status === 'Cancelled') v.cancelled += 1;
    bucket.set(k, v);
  }
  const series = Array.from(bucket.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => ({
      period: k,
      total: v.total,
      cancelled: v.cancelled,
      cancellationRate: v.total ? Math.round((v.cancelled / v.total) * 1000) / 10 : 0,
    }));

  res.json({ from: from.toISOString(), to: to.toISOString(), granularity, series });
});

// ——— Popular sports (facility category) ———
router.get('/popular-sports', async (req: AuthRequest, res) => {
  const range = parseRange(req);
  if (!range) return res.status(400).json({ message: 'Invalid from/to query' });
  const { from, to } = range;

  const facilities = await prisma.facility.findMany({ select: { id: true, category: true } });
  const byId = new Map(facilities.map((f) => [f.id, f.category]));
  const bookings = await prisma.booking.findMany({
    where: { startTime: { gte: from, lte: to } },
    select: { facilityId: true },
  });
  const counts = new Map<string, number>();
  for (const b of bookings) {
    const cat = byId.get(b.facilityId) ?? 'Unknown';
    counts.set(cat, (counts.get(cat) ?? 0) + 1);
  }
  const data = Array.from(counts.entries())
    .map(([sport, count]) => ({ sport, count }))
    .sort((a, b) => b.count - a.count);
  res.json({ from: from.toISOString(), to: to.toISOString(), data });
});

// ——— User engagement ———
router.get('/user-engagement', async (req: AuthRequest, res) => {
  const range = parseRange(req);
  if (!range) return res.status(400).json({ message: 'Invalid from/to query' });
  const { from, to } = range;

  const bookings = await prisma.booking.findMany({
    where: { startTime: { gte: from, lte: to } },
    select: { userId: true },
  });
  const counts = new Map<string, number>();
  for (const b of bookings) counts.set(b.userId, (counts.get(b.userId) ?? 0) + 1);

  const topUserIds = Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([id]) => id);
  const users = await prisma.user.findMany({
    where: { id: { in: topUserIds } },
    select: { id: true, name: true, fastId: true, role: true },
  });
  const userMap = new Map(users.map((u) => [u.id, u]));
  const mostActiveUsers = topUserIds.map((id) => ({
    ...(userMap.get(id) ?? { id, name: 'Unknown', fastId: '', role: 'Student' }),
    bookings: counts.get(id) ?? 0,
  }));

  // New vs returning: returning = had a booking before `from`
  const distinctInRange = Array.from(new Set(bookings.map((b) => b.userId)));
  const returningIds = await prisma.booking
    .findMany({
      where: { userId: { in: distinctInRange }, startTime: { lt: from } },
      select: { userId: true },
      distinct: ['userId'],
    })
    .then((rows) => new Set(rows.map((r) => r.userId)));
  const returning = distinctInRange.filter((id) => returningIds.has(id)).length;
  const newUsers = distinctInRange.length - returning;

  res.json({ from: from.toISOString(), to: to.toISOString(), mostActiveUsers, newUsers, returningUsers: returning });
});

// ——— Equipment analytics ———
router.get('/equipment', async (req: AuthRequest, res) => {
  const range = parseRange(req);
  if (!range) return res.status(400).json({ message: 'Invalid from/to query' });
  const { from, to } = range;

  const checkouts = await prisma.equipmentTransaction.findMany({
    where: { type: 'CheckOut', createdAt: { gte: from, lte: to } },
    select: { equipmentId: true, plannedReturnAt: true, returnedAt: true, damageReported: true, createdAt: true },
  });
  const byEq = new Map<string, { count: number; durationMins: number[]; damageCount: number }>();
  for (const tx of checkouts) {
    const item = byEq.get(tx.equipmentId) ?? { count: 0, durationMins: [], damageCount: 0 };
    item.count += 1;
    if (tx.returnedAt) {
      item.durationMins.push((tx.returnedAt.getTime() - tx.createdAt.getTime()) / 60000);
    }
    if (tx.damageReported) item.damageCount += 1;
    byEq.set(tx.equipmentId, item);
  }
  const equipment = await prisma.equipmentItem.findMany({
    where: { id: { in: Array.from(byEq.keys()) } },
    select: { id: true, name: true, category: { select: { name: true } } },
  });
  const eqMap = new Map(equipment.map((e) => [e.id, e]));

  const mostCheckedOut = Array.from(byEq.entries())
    .map(([equipmentId, v]) => ({
      equipmentId,
      name: eqMap.get(equipmentId)?.name ?? 'Unknown',
      category: eqMap.get(equipmentId)?.category?.name ?? '',
      checkouts: v.count,
      avgDurationMinutes: v.durationMins.length
        ? Math.round(v.durationMins.reduce((a, b) => a + b, 0) / v.durationMins.length)
        : null,
      damageRate: v.count ? Math.round((v.damageCount / v.count) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.checkouts - a.checkouts)
    .slice(0, 10);

  const maintenanceCount = await prisma.equipmentMaintenanceTask.count({
    where: { createdAt: { gte: from, lte: to } },
  });

  res.json({ from: from.toISOString(), to: to.toISOString(), mostCheckedOut, maintenanceCount });
});

// ——— Revenue analytics ———
router.get('/revenue', async (req: AuthRequest, res) => {
  const range = parseRange(req);
  if (!range) return res.status(400).json({ message: 'Invalid from/to query' });
  const { from, to } = range;

  const [bookingAgg, tournamentRegs, coachAgg, equipmentFees, eventRegs] = await Promise.all([
    prisma.booking.aggregate({
      where: { status: 'Confirmed', startTime: { gte: from, lte: to } },
      _sum: { totalAmount: true, refundAmount: true },
      _count: { id: true },
    }),
    prisma.tournamentRegistration.findMany({
      where: { paid: true, createdAt: { gte: from, lte: to } },
      include: { tournament: { select: { entryFee: true, name: true } } },
    }),
    prisma.coachSession.aggregate({
      where: { startTime: { gte: from, lte: to }, status: { in: ['Scheduled', 'Completed'] } },
      _sum: { amount: true },
      _count: { id: true },
    }),
    prisma.equipmentTransaction.findMany({
      where: { createdAt: { gte: from, lte: to } },
      select: { lateFee: true, damageFee: true },
    }),
    prisma.eventRegistration.findMany({
      where: { registeredAt: { gte: from, lte: to }, status: 'Registered' },
      include: { event: { select: { entryFee: true, title: true } } },
    }),
  ]);

  const bookingRevenue = Number(bookingAgg._sum.totalAmount ?? 0);
  const refunds = Number(bookingAgg._sum.refundAmount ?? 0);
  const tournamentRevenue = tournamentRegs.reduce((sum, r) => sum + Number(r.tournament.entryFee), 0);
  const coachingRevenue = Number(coachAgg._sum.amount ?? 0);
  const equipmentRevenue = equipmentFees.reduce(
    (sum, t) => sum + Number(t.lateFee ?? 0) + Number(t.damageFee ?? 0),
    0
  );
  const eventRevenue = eventRegs.reduce((sum, r) => sum + Number(r.event.entryFee ?? 0), 0);

  const totalRevenue = bookingRevenue + tournamentRevenue + coachingRevenue + equipmentRevenue + eventRevenue;

  // Simple forecast: avg daily revenue * next 7 days
  const totalDays = daysBetween(from, to);
  const avgDaily = totalDays ? totalRevenue / totalDays : 0;
  const forecastNext7Days = Math.round(avgDaily * 7);

  res.json({
    from: from.toISOString(),
    to: to.toISOString(),
    totals: {
      totalRevenue: Math.round(totalRevenue),
      bookingRevenue: Math.round(bookingRevenue),
      tournamentRevenue: Math.round(tournamentRevenue),
      coachingRevenue: Math.round(coachingRevenue),
      equipmentRevenue: Math.round(equipmentRevenue),
      eventRevenue: Math.round(eventRevenue),
      refunds: Math.round(refunds),
      forecastNext7Days,
    },
    counts: {
      bookings: bookingAgg._count.id,
      tournamentRegistrations: tournamentRegs.length,
      coachSessions: coachAgg._count.id,
      eventRegistrations: eventRegs.length,
    },
  });
});

export default router;

