import { Router } from 'express';
import { z } from 'zod';
import { addDays, setHours, setMinutes, parseISO, isBefore, isAfter } from 'date-fns';
import { prisma } from '../lib/prisma.js';
import { authenticate, requireRoles, type AuthRequest } from '../middleware/auth.js';
import type { CoachSessionType, CoachSessionStatus } from '@prisma/client';

const router = Router();

const profileSchema = z.object({
  bio: z.string().max(2000).optional(),
  specializations: z.array(z.string()).optional(),
  qualifications: z.string().max(1000).optional(),
  experience: z.string().max(2000).optional(),
  achievements: z.string().max(2000).optional(),
  hourlyRate: z.number().min(0).optional(),
  isActive: z.boolean().optional(),
});

const availabilitySchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  type: z.enum(['Available', 'Break']).optional(),
});

const bookSessionSchema = z.object({
  coachId: z.string().min(1), // CoachProfile id
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  sessionType: z.enum(['Individual', 'Group', 'Team']),
  specialRequirements: z.string().max(500).optional(),
});

const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  review: z.string().max(2000).optional(),
});

function parseTime(timeStr: string, baseDate: Date): Date {
  const [h, m] = timeStr.split(':').map(Number);
  return setMinutes(setHours(baseDate, h), m);
}

// ——— List coaches (with avg rating) ———
router.get('/', async (_req, res) => {
  const profiles = await prisma.coachProfile.findMany({
    where: { isActive: true },
    include: {
      user: { select: { id: true, name: true, fastId: true, avatarUrl: true } },
      sessions: {
        where: { status: 'Completed' },
        include: { review: true },
      },
    },
  });
  const withRating = profiles.map((p) => {
    const reviews = p.sessions.filter((s) => s.review).map((s) => s.review!.rating);
    const avgRating = reviews.length ? reviews.reduce((a, b) => a + b, 0) / reviews.length : null;
    const { sessions, ...rest } = p;
    return { ...rest, avgRating: avgRating != null ? Math.round(avgRating * 10) / 10 : null, reviewCount: reviews.length };
  });
  res.json(withRating);
});

// ——— Get my coach profile ———
router.get('/profile/me', authenticate, requireRoles('Coach', 'Admin'), async (req: AuthRequest, res) => {
  const profile = await prisma.coachProfile.findUnique({
    where: { userId: req.user!.id },
    include: {
      user: { select: { id: true, name: true, fastId: true, avatarUrl: true } },
      availability: true,
    },
  });
  if (!profile) return res.status(404).json({ message: 'Coach profile not found' });
  res.json(profile);
});

// ——— Create/update coach profile (Coach or Admin) ———
router.put('/profile/me', authenticate, requireRoles('Coach', 'Admin'), async (req: AuthRequest, res) => {
  const parse = profileSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ message: 'Validation failed', errors: parse.error.flatten() });
  const userId = req.user!.id;
  const existing = await prisma.coachProfile.findUnique({ where: { userId } });
  const data = {
    ...parse.data,
    userId,
    hourlyRate: parse.data.hourlyRate ?? existing?.hourlyRate ?? 0,
  };
  const profile = existing
    ? await prisma.coachProfile.update({ where: { userId }, data, include: { user: { select: { name: true, avatarUrl: true } } } })
    : await prisma.coachProfile.create({ data, include: { user: { select: { name: true, avatarUrl: true } } } });
  res.json(profile);
});

// ——— List my availability (Coach) ———
router.get('/profile/me/availability', authenticate, requireRoles('Coach'), async (req: AuthRequest, res) => {
  const profile = await prisma.coachProfile.findUnique({ where: { userId: req.user!.id } });
  if (!profile) return res.json([]);
  const list = await prisma.coachAvailability.findMany({ where: { coachId: profile.id }, orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }] });
  res.json(list);
});

// ——— Add availability (Coach) ———
router.post('/profile/me/availability', authenticate, requireRoles('Coach'), async (req: AuthRequest, res) => {
  const profile = await prisma.coachProfile.findUnique({ where: { userId: req.user!.id } });
  if (!profile) return res.status(400).json({ message: 'Create coach profile first' });
  const parse = availabilitySchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ message: 'Validation failed', errors: parse.error.flatten() });
  const slot = await prisma.coachAvailability.create({
    data: { coachId: profile.id, ...parse.data, type: (parse.data.type as 'Available' | 'Break') ?? 'Available' },
  });
  res.status(201).json(slot);
});

router.delete('/profile/me/availability/:slotId', authenticate, requireRoles('Coach'), async (req: AuthRequest, res) => {
  const profile = await prisma.coachProfile.findUnique({ where: { userId: req.user!.id } });
  if (!profile) return res.status(404).json({ message: 'Coach profile not found' });
  await prisma.coachAvailability.deleteMany({ where: { id: req.params.slotId, coachId: profile.id } });
  res.status(204).end();
});

// ——— Book session ———
router.post('/sessions', authenticate, async (req: AuthRequest, res) => {
  const parse = bookSessionSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ message: 'Validation failed', errors: parse.error.flatten() });
  const start = new Date(parse.data.startTime);
  const end = new Date(parse.data.endTime);
  if (end <= start) return res.status(400).json({ message: 'End must be after start' });
  const profile = await prisma.coachProfile.findUnique({ where: { id: parse.data.coachId }, include: { user: true } });
  if (!profile) return res.status(404).json({ message: 'Coach not found' });
  const conflict = await prisma.coachSession.findFirst({
    where: {
      coachId: profile.id,
      status: 'Scheduled',
      OR: [
        { startTime: { lt: end }, endTime: { gt: start } },
      ],
    },
  });
  if (conflict) return res.status(409).json({ message: 'Slot no longer available' });
  const durationHrs = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
  const amount = Number(profile.hourlyRate) * durationHrs;
  const session = await prisma.coachSession.create({
    data: {
      coachId: profile.id,
      studentId: req.user!.id,
      startTime: start,
      endTime: end,
      sessionType: parse.data.sessionType as CoachSessionType,
      specialRequirements: parse.data.specialRequirements ?? null,
      amount,
    },
    include: {
      coach: { include: { user: { select: { name: true } } } },
      student: { select: { name: true, fastId: true } },
    },
  });
  res.status(201).json(session);
});

// ——— My sessions ———
router.get('/sessions/me', authenticate, async (req: AuthRequest, res) => {
  const list = await prisma.coachSession.findMany({
    where: { studentId: req.user!.id },
    orderBy: { startTime: 'desc' },
    include: {
      coach: { include: { user: { select: { name: true, avatarUrl: true } } } },
      review: true,
    },
  });
  res.json(list);
});

// ——— Cancel session ———
router.patch('/sessions/:id/cancel', authenticate, async (req: AuthRequest, res) => {
  const session = await prisma.coachSession.findUnique({ where: { id: req.params.id } });
  if (!session) return res.status(404).json({ message: 'Session not found' });
  if (session.studentId !== req.user!.id) return res.status(403).json({ message: 'Not your session' });
  if (session.status !== 'Scheduled') return res.status(400).json({ message: 'Session cannot be cancelled' });
  await prisma.coachSession.update({ where: { id: req.params.id }, data: { status: 'Cancelled' } });
  res.json({ message: 'Cancelled' });
});

// ——— Update session status (Coach/Admin: mark Completed/NoShow) ———
router.patch('/sessions/:id', authenticate, requireRoles('Coach', 'Admin'), async (req: AuthRequest, res) => {
  const body = z.object({ status: z.enum(['Scheduled', 'Completed', 'Cancelled', 'NoShow']) }).safeParse(req.body);
  if (!body.success) return res.status(400).json({ message: 'Invalid status' });
  const session = await prisma.coachSession.findUnique({ where: { id: req.params.id }, include: { coach: true } });
  if (!session) return res.status(404).json({ message: 'Session not found' });
  if (req.user!.role !== 'Admin' && session.coach.userId !== req.user!.id) return res.status(403).json({ message: 'Not your session' });
  const updated = await prisma.coachSession.update({
    where: { id: req.params.id },
    data: { status: body.data.status as CoachSessionStatus },
    include: { coach: { include: { user: { select: { name: true } } } }, student: { select: { name: true } } },
  });
  res.json(updated);
});

// ——— Submit review (after session completed) ———
router.post('/sessions/:id/review', authenticate, async (req: AuthRequest, res) => {
  const parse = reviewSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ message: 'Validation failed', errors: parse.error.flatten() });
  const session = await prisma.coachSession.findUnique({ where: { id: req.params.id }, include: { review: true } });
  if (!session) return res.status(404).json({ message: 'Session not found' });
  if (session.studentId !== req.user!.id) return res.status(403).json({ message: 'Not your session' });
  if (session.status !== 'Completed') return res.status(400).json({ message: 'Can only review completed sessions' });
  if (session.review) return res.status(409).json({ message: 'Already reviewed' });
  const review = await prisma.coachReview.create({
    data: { sessionId: session.id, userId: req.user!.id, rating: parse.data.rating, review: parse.data.review ?? null },
    include: { user: { select: { name: true } } },
  });
  res.status(201).json(review);
});

// ——— Admin: coach performance ———
router.get('/admin/performance', authenticate, requireRoles('Admin'), async (_req, res) => {
  const profiles = await prisma.coachProfile.findMany({
    include: {
      user: { select: { id: true, name: true, fastId: true } },
      sessions: { include: { review: true } },
    },
  });
  const stats = profiles.map((p) => {
    const completed = p.sessions.filter((s) => s.status === 'Completed');
    const reviews = completed.filter((s) => s.review).map((s) => s.review!.rating);
    const revenue = completed.reduce((sum, s) => sum + Number(s.amount), 0);
    const avgRating = reviews.length ? reviews.reduce((a, b) => a + b, 0) / reviews.length : null;
    return {
      coachId: p.id,
      coachName: p.user.name,
      totalSessions: completed.length,
      avgRating: avgRating != null ? Math.round(avgRating * 10) / 10 : null,
      revenue,
    };
  });
  res.json(stats);
});

// ——— Get coach profile (with availability, reviews) ———
router.get('/:id', async (req, res) => {
  const profile = await prisma.coachProfile.findUnique({
    where: { id: req.params.id },
    include: {
      user: { select: { id: true, name: true, fastId: true, avatarUrl: true } },
      availability: { orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }] },
      sessions: {
        where: { status: 'Completed' },
        include: { review: { include: { user: { select: { name: true } } } } },
        orderBy: { startTime: 'desc' },
        take: 20,
      },
    },
  });
  if (!profile) return res.status(404).json({ message: 'Coach not found' });
  const reviews = profile.sessions.filter((s) => s.review).map((s) => s.review!);
  const avgRating = reviews.length ? reviews.reduce((a, r) => a + r.rating, 0) / reviews.length : null;
  res.json({ ...profile, avgRating: avgRating != null ? Math.round(avgRating * 10) / 10 : null, reviewCount: reviews.length });
});

// ——— Get available slots for a coach on a date ———
router.get('/:id/slots', async (req, res) => {
  const dateStr = req.query.date as string;
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return res.status(400).json({ message: 'Query date (YYYY-MM-DD) required' });
  }
  const profile = await prisma.coachProfile.findUnique({
    where: { id: req.params.id },
    include: { availability: true },
  });
  if (!profile) return res.status(404).json({ message: 'Coach not found' });
  const date = parseISO(dateStr);
  const dayOfWeek = date.getDay();
  const windows = profile.availability.filter((a) => a.dayOfWeek === dayOfWeek && a.type === 'Available');
  const slotDuration = 30;
  const slots: { start: string; end: string }[] = [];
  for (const w of windows) {
    let slotStart = parseTime(w.startTime, new Date(date));
    const windowEnd = parseTime(w.endTime, new Date(date));
    while (isBefore(slotStart, windowEnd)) {
      const slotEnd = new Date(slotStart.getTime() + slotDuration * 60 * 1000);
      if (!isAfter(slotEnd, windowEnd)) slots.push({ start: slotStart.toISOString(), end: slotEnd.toISOString() });
      slotStart = slotEnd;
    }
  }
  const booked = await prisma.coachSession.findMany({
    where: {
      coachId: req.params.id,
      status: { in: ['Scheduled'] },
      startTime: { gte: new Date(dateStr), lt: addDays(date, 1) },
    },
    select: { startTime: true, endTime: true },
  });
  const overlaps = (s: { start: string; end: string }, b: { startTime: Date; endTime: Date }) => {
    const sStart = new Date(s.start).getTime();
    const sEnd = new Date(s.end).getTime();
    const bStart = b.startTime.getTime();
    const bEnd = b.endTime.getTime();
    return sStart < bEnd && sEnd > bStart;
  };
  const available = slots.filter((s) => !booked.some((b) => overlaps(s, b)));
  res.json({ date: dateStr, slots: available, booked: slots.filter((s) => booked.some((b) => overlaps(s, b))) });
});

export default router;
