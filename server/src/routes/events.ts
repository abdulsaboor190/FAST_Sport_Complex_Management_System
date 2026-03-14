import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authenticate, requireRoles, type AuthRequest } from '../middleware/auth.js';
import { uploadEventBanner, getEventBannerUrl } from '../lib/upload.js';
import type { EventType, EventStatus } from '@prisma/client';
import type { Prisma } from '@prisma/client';

const router = Router();

const createEventSchema = z.object({
  type: z.enum(['Workshop', 'Seminar', 'SportsDay', 'FitnessChallenge']),
  title: z.string().min(1),
  description: z.string().optional(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  venue: z.string().optional(),
  registrationRequired: z.boolean().optional(),
  capacity: z.number().int().min(0).optional().nullable(),
  entryFee: z.number().min(0).optional(),
  agenda: z.array(z.object({ time: z.string(), title: z.string(), description: z.string().optional() })).optional(),
  speakers: z.array(z.object({ name: z.string(), role: z.string().optional(), bio: z.string().optional() })).optional(),
  status: z.enum(['Draft', 'Published', 'Completed', 'Cancelled']).optional(),
});

const registerSchema = z.object({
  paymentRef: z.string().optional(),
});

const checkInSchema = z.object({
  registrationId: z.string().optional(),
  userId: z.string().optional(),
});

const feedbackSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  feedback: z.string().max(2000).optional(),
});

// ——— List events (published by default) ———
router.get('/', async (req, res) => {
  const from = req.query.from as string | undefined;
  const to = req.query.to as string | undefined;
  const type = req.query.type as EventType | undefined;
  const status = (req.query.status as EventStatus | undefined) ?? 'Published';
  const where: Prisma.EventWhereInput = { status };
  if (type) where.type = type;
  if (from && to) {
    where.AND = [
      { startTime: { lt: new Date(to) } },
      { endTime: { gt: new Date(from) } },
    ];
  } else if (from) where.startTime = { gte: new Date(from) };
  else if (to) where.endTime = { lte: new Date(to) };
  const events = await prisma.event.findMany({
    where,
    orderBy: { startTime: 'asc' },
    include: { _count: { select: { registrations: true } } },
  });
  res.json(events);
});

// ——— Get event by registration ID (for QR scan) ———
router.get('/by-registration/:registrationId', authenticate, async (req: AuthRequest, res) => {
  const reg = await prisma.eventRegistration.findUnique({
    where: { id: req.params.registrationId },
    include: { event: true, user: { select: { name: true, fastId: true } } },
  });
  if (!reg) return res.status(404).json({ message: 'Registration not found' });
  res.json(reg);
});

// ——— Get single event ———
router.get('/:id', async (req, res) => {
  const event = await prisma.event.findUnique({
    where: { id: req.params.id },
    include: { _count: { select: { registrations: true, checkIns: true } } },
  });
  if (!event) return res.status(404).json({ message: 'Event not found' });
  res.json(event);
});

// ——— Create event (Admin) ———
router.post('/', authenticate, requireRoles('Admin'), async (req: AuthRequest, res) => {
  const parse = createEventSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ message: 'Validation failed', errors: parse.error.flatten() });
  const data = {
    ...parse.data,
    startTime: new Date(parse.data.startTime),
    endTime: new Date(parse.data.endTime),
    registrationRequired: parse.data.registrationRequired ?? true,
    capacity: parse.data.capacity ?? null,
    entryFee: parse.data.entryFee ?? 0,
    agenda: parse.data.agenda ? (parse.data.agenda as Prisma.InputJsonValue) : undefined,
    speakers: parse.data.speakers ? (parse.data.speakers as Prisma.InputJsonValue) : undefined,
    status: (parse.data.status as EventStatus) ?? 'Draft',
  };
  const event = await prisma.event.create({ data });
  res.status(201).json(event);
});

// ——— Update event (Admin) ———
router.patch('/:id', authenticate, requireRoles('Admin'), async (req: AuthRequest, res) => {
  const parse = createEventSchema.partial().safeParse(req.body);
  if (!parse.success) return res.status(400).json({ message: 'Validation failed', errors: parse.error.flatten() });
  const existing = await prisma.event.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ message: 'Event not found' });
  const data: Record<string, unknown> = { ...parse.data };
  if (parse.data.startTime) data.startTime = new Date(parse.data.startTime);
  if (parse.data.endTime) data.endTime = new Date(parse.data.endTime);
  const event = await prisma.event.update({ where: { id: req.params.id }, data });
  res.json(event);
});

// ——— Upload banner ———
router.post(
  '/:id/banner',
  authenticate,
  requireRoles('Admin'),
  uploadEventBanner.single('banner'),
  async (req: AuthRequest, res) => {
    const event = await prisma.event.findUnique({ where: { id: req.params.id } });
    if (!event) return res.status(404).json({ message: 'Event not found' });
    const file = req.file;
    if (!file) return res.status(400).json({ message: 'No file uploaded' });
    const bannerUrl = getEventBannerUrl(file.filename);
    await prisma.event.update({ where: { id: req.params.id }, data: { bannerUrl } });
    res.json({ bannerUrl });
  }
);

// ——— Register for event ———
router.post('/:id/register', authenticate, async (req: AuthRequest, res) => {
  const event = await prisma.event.findUnique({ where: { id: req.params.id } });
  if (!event) return res.status(404).json({ message: 'Event not found' });
  if (event.status !== 'Published') return res.status(400).json({ message: 'Event not open for registration' });
  const parse = registerSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ message: 'Validation failed' });
  const existing = await prisma.eventRegistration.findUnique({
    where: { eventId_userId: { eventId: req.params.id, userId: req.user!.id } },
  });
  if (existing) return res.status(409).json({ message: 'Already registered' });
  if (event.capacity) {
    const count = await prisma.eventRegistration.count({ where: { eventId: req.params.id, status: 'Registered' } });
    if (count >= event.capacity) return res.status(409).json({ message: 'Event is full' });
  }
  const amount = Number(event.entryFee);
  const reg = await prisma.eventRegistration.create({
    data: {
      eventId: req.params.id,
      userId: req.user!.id,
      paymentRef: parse.data.paymentRef ?? null,
      amount: amount > 0 ? amount : null,
    },
    include: { user: { select: { name: true, fastId: true } } },
  });
  res.status(201).json(reg);
});

// ——— Unregister ———
router.delete('/:id/register', authenticate, async (req: AuthRequest, res) => {
  await prisma.eventRegistration.deleteMany({
    where: { eventId: req.params.id, userId: req.user!.id },
  });
  res.status(204).end();
});

// ——— My registrations ———
router.get('/registrations/me', authenticate, async (req: AuthRequest, res) => {
  const list = await prisma.eventRegistration.findMany({
    where: { userId: req.user!.id },
    include: { event: true },
    orderBy: { event: { startTime: 'asc' } },
  });
  res.json(list);
});

// ——— Check-in (QR code = registration id, or Admin can check-in by userId) ———
router.post('/:id/checkin', authenticate, async (req: AuthRequest, res) => {
  const parse = checkInSchema.safeParse(req.body);
  const event = await prisma.event.findUnique({ where: { id: req.params.id } });
  if (!event) return res.status(404).json({ message: 'Event not found' });
  let userId: string;
  if (parse.data?.registrationId) {
    const reg = await prisma.eventRegistration.findFirst({
      where: { id: parse.data.registrationId, eventId: req.params.id, status: 'Registered' },
    });
    if (!reg) return res.status(404).json({ message: 'Registration not found' });
    userId = reg.userId;
  } else if (parse.data?.userId && req.user!.role === 'Admin') {
    userId = parse.data.userId;
  } else {
    userId = req.user!.id;
  }
  const existing = await prisma.eventCheckIn.findUnique({
    where: { eventId_userId: { eventId: req.params.id, userId } },
  });
  if (existing) return res.status(409).json({ message: 'Already checked in' });
  const checkIn = await prisma.eventCheckIn.create({
    data: { eventId: req.params.id, userId },
    include: { user: { select: { name: true, fastId: true } } },
  });
  res.status(201).json(checkIn);
});

// ——— Submit feedback ———
router.post('/:id/feedback', authenticate, async (req: AuthRequest, res) => {
  const parse = feedbackSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ message: 'Validation failed' });
  const event = await prisma.event.findUnique({ where: { id: req.params.id } });
  if (!event) return res.status(404).json({ message: 'Event not found' });
  const existing = await prisma.eventFeedback.findUnique({
    where: { eventId_userId: { eventId: req.params.id, userId: req.user!.id } },
  });
  if (existing) return res.status(409).json({ message: 'Already submitted feedback' });
  const feedback = await prisma.eventFeedback.create({
    data: {
      eventId: req.params.id,
      userId: req.user!.id,
      rating: parse.data.rating ?? null,
      feedback: parse.data.feedback ?? null,
    },
  });
  res.status(201).json(feedback);
});

// ——— Admin: list registrations for event ———
router.get('/:id/registrations', authenticate, requireRoles('Admin'), async (req, res) => {
  const list = await prisma.eventRegistration.findMany({
    where: { eventId: req.params.id },
    include: {
      user: { select: { id: true, name: true, fastId: true } },
    },
    orderBy: { registeredAt: 'asc' },
  });
  const checkIns = await prisma.eventCheckIn.findMany({
    where: { eventId: req.params.id },
    select: { userId: true },
  });
  const checkedInSet = new Set(checkIns.map((c) => c.userId));
  res.json(list.map((r) => ({ ...r, checkedIn: checkedInSet.has(r.userId) })));
});

export default router;
