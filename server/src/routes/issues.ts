import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authenticate, requireRoles, type AuthRequest } from '../middleware/auth.js';
import { uploadIssueMedia } from '../lib/upload.js';
import { config } from '../config.js';
import type { IssueCategory, IssuePriority, IssueStatus, Prisma } from '@prisma/client';

const router = Router();

const createIssueSchema = z.object({
  category: z.enum(['Facility', 'Equipment', 'Booking', 'Safety', 'Other']),
  facilityId: z.string().optional(),
  equipmentId: z.string().optional(),
  bookingId: z.string().optional(),
  title: z.string().min(3).max(200),
  description: z.string().max(4000).optional(),
  priority: z.enum(['Low', 'Medium', 'High', 'Urgent']),
  location: z.string().max(500).optional(),
});

const updateIssueSchema = z.object({
  status: z.enum(['Open', 'Acknowledged', 'InProgress', 'Resolved', 'Closed']).optional(),
  priority: z.enum(['Low', 'Medium', 'High', 'Urgent']).optional(),
  assigneeId: z.string().nullable().optional(),
  resolution: z.string().max(4000).optional(),
});

const commentSchema = z.object({
  message: z.string().min(1).max(2000),
  internal: z.boolean().optional(),
});

const satisfactionSchema = z.object({
  rating: z.number().int().min(1).max(5),
});

function issueSelect() {
  return {
    id: true,
    category: true,
    title: true,
    description: true,
    priority: true,
    status: true,
    location: true,
    attachments: true,
    resolution: true,
    satisfactionRating: true,
    createdAt: true,
    updatedAt: true,
    reporter: { select: { id: true, name: true, fastId: true, role: true } },
    assignee: { select: { id: true, name: true, fastId: true, role: true } },
    facility: { select: { id: true, name: true, category: true } },
    equipment: { select: { id: true, name: true } },
  } satisfies Prisma.IssueSelect;
}

async function logActivity(issueId: string, actorId: string | null, type: string, payload?: Prisma.InputJsonValue) {
  await prisma.issueActivity.create({
    data: {
      issueId,
      actorId,
      type,
      payload: payload ?? undefined,
    },
  });
}

// Create issue (user)
router.post(
  '/',
  authenticate,
  uploadIssueMedia.array('files', 6),
  async (req: AuthRequest, res) => {
    const parse = createIssueSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ message: 'Validation failed', errors: parse.error.flatten() });
    }
    const data = parse.data;
    const files = (req.files as Express.Multer.File[]) || [];
    const attachments = files.map((f) => `/uploads/issues/${f.filename}`);

    const issue = await prisma.issue.create({
      data: {
        reporterId: req.user!.id,
        category: data.category as IssueCategory,
        facilityId: data.facilityId || null,
        equipmentId: data.equipmentId || null,
        bookingId: data.bookingId || null,
        title: data.title,
        description: data.description || null,
        priority: data.priority as IssuePriority,
        location: data.location || null,
        attachments: attachments.length ? (attachments as unknown as Prisma.InputJsonValue) : undefined,
      },
      select: issueSelect(),
    });

    await logActivity(issue.id, req.user!.id, 'created', {
      priority: issue.priority,
      category: issue.category,
    });

    // notify all admins by console for now (email can be added similarly to sendAdminReportEmail)
    console.log('[issue] New issue reported:', issue.id, issue.title, 'by', req.user!.id);

    const io = req.app.get('io') as import('socket.io').Server | undefined;
    io?.emit('issues:new', issue);

    res.status(201).json(issue);
  }
);

// My issues
router.get('/me', authenticate, async (req: AuthRequest, res) => {
  const issues = await prisma.issue.findMany({
    where: { reporterId: req.user!.id },
    orderBy: { createdAt: 'desc' },
    select: issueSelect(),
  });
  res.json(issues);
});

// Admin list
router.get('/', authenticate, requireRoles('Admin'), async (req: AuthRequest, res) => {
  const status = req.query.status as IssueStatus | undefined;
  const category = req.query.category as IssueCategory | undefined;
  const priority = req.query.priority as IssuePriority | undefined;
  const q = req.query.q as string | undefined;

  const where: Prisma.IssueWhereInput = {};
  if (status) where.status = status;
  if (category) where.category = category;
  if (priority) where.priority = priority;
  if (q?.trim()) {
    where.OR = [
      { title: { contains: q.trim(), mode: 'insensitive' } },
      { description: { contains: q.trim(), mode: 'insensitive' } },
    ];
  }

  const issues = await prisma.issue.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    select: issueSelect(),
  });
  res.json(issues);
});

// Issue detail
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  const issue = await prisma.issue.findUnique({
    where: { id: req.params.id },
    select: {
      ...issueSelect(),
      activities: {
        orderBy: { createdAt: 'asc' },
        include: { actor: { select: { id: true, name: true, fastId: true, role: true } } },
      },
      comments: {
        orderBy: { createdAt: 'asc' },
        include: { author: { select: { id: true, name: true, fastId: true, role: true } } },
      },
    },
  });
  if (!issue) return res.status(404).json({ message: 'Issue not found' });

  if (req.user!.role !== 'Admin' && issue.reporter.id !== req.user!.id) {
    return res.status(403).json({ message: 'Not allowed' });
  }

  res.json(issue);
});

// Update issue (admin)
router.patch('/:id', authenticate, requireRoles('Admin'), async (req: AuthRequest, res) => {
  const parse = updateIssueSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ message: 'Validation failed', errors: parse.error.flatten() });
  }
  const existing = await prisma.issue.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ message: 'Issue not found' });

  const data: Prisma.IssueUpdateInput = {};
  if (parse.data.status !== undefined) data.status = parse.data.status as IssueStatus;
  if (parse.data.priority !== undefined) data.priority = parse.data.priority as IssuePriority;
  if (parse.data.assigneeId !== undefined) data.assignee = parse.data.assigneeId
    ? { connect: { id: parse.data.assigneeId } }
    : { disconnect: true };
  if (parse.data.resolution !== undefined) data.resolution = parse.data.resolution;

  const updated = await prisma.issue.update({
    where: { id: req.params.id },
    data,
    select: issueSelect(),
  });

  await logActivity(updated.id, req.user!.id, 'updated', {
    statusFrom: existing.status,
    statusTo: updated.status,
    priorityFrom: existing.priority,
    priorityTo: updated.priority,
    assigneeId: parse.data.assigneeId ?? null,
  });

  const io = req.app.get('io') as import('socket.io').Server | undefined;
  io?.emit('issues:updated', updated);

  res.json(updated);
});

// Comments
router.post('/:id/comments', authenticate, async (req: AuthRequest, res) => {
  const parse = commentSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ message: 'Validation failed', errors: parse.error.flatten() });
  }
  const issue = await prisma.issue.findUnique({ where: { id: req.params.id } });
  if (!issue) return res.status(404).json({ message: 'Issue not found' });

  const internal = !!parse.data.internal;
  if (internal && req.user!.role !== 'Admin') {
    return res.status(403).json({ message: 'Only admins can post internal notes' });
  }

  const comment = await prisma.issueComment.create({
    data: {
      issueId: issue.id,
      authorId: req.user!.id,
      message: parse.data.message,
      internal,
    },
    include: { author: { select: { id: true, name: true, fastId: true, role: true } } },
  });

  await logActivity(issue.id, req.user!.id, internal ? 'note' : 'comment', {
    internal,
  });

  res.status(201).json(comment);
});

// Satisfaction rating (reporter)
router.post('/:id/satisfaction', authenticate, async (req: AuthRequest, res) => {
  const parse = satisfactionSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ message: 'Validation failed', errors: parse.error.flatten() });
  }
  const issue = await prisma.issue.findUnique({ where: { id: req.params.id } });
  if (!issue) return res.status(404).json({ message: 'Issue not found' });
  if (issue.reporterId !== req.user!.id) return res.status(403).json({ message: 'Not your issue' });
  if (issue.status !== 'Resolved' && issue.status !== 'Closed') {
    return res.status(400).json({ message: 'Can only rate resolved issues' });
  }

  const updated = await prisma.issue.update({
    where: { id: issue.id },
    data: { satisfactionRating: parse.data.rating },
    select: issueSelect(),
  });

  await logActivity(issue.id, req.user!.id, 'satisfaction', { rating: parse.data.rating });
  res.json(updated);
});

export default router;

