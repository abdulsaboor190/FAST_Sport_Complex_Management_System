import { Router } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import { prisma } from '../lib/prisma.js';
import { authenticate, requireRoles, type AuthRequest } from '../middleware/auth.js';
import { uploadEquipmentPhoto, getEquipmentPhotoUrl } from '../lib/upload.js';
import type { EquipmentStatus, EquipmentCondition, MaintenanceTaskType, MaintenanceTaskStatus } from '@prisma/client';
import type { Prisma } from '@prisma/client';

const router = Router();

function generateQrCode(): string {
  return `EQ-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
}

const categorySchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1).max(20),
  description: z.string().optional(),
});

const createItemSchema = z.object({
  categoryId: z.string().min(1),
  name: z.string().min(1),
  sportType: z.string().optional(),
  brand: z.string().optional(),
  specifications: z.record(z.unknown()).optional(),
  purchaseDate: z.string().datetime().optional(),
  warrantyUntil: z.string().datetime().optional(),
  condition: z.enum(['Excellent', 'Good', 'Fair', 'Poor']).optional(),
  lowStockThreshold: z.number().int().min(0).optional(),
  quantity: z.number().int().min(1).optional(),
});

const checkoutSchema = z.object({
  equipmentId: z.string().min(1).optional(),
  qrCode: z.string().min(1).optional(),
  plannedReturnAt: z.string().datetime(),
  notes: z.string().max(500).optional(),
  damageReported: z.string().max(1000).optional(),
  acceptTerms: z.literal(true),
});

const checkinSchema = z.object({
  transactionId: z.string().min(1).optional(),
  qrCode: z.string().min(1).optional(),
  conditionOnReturn: z.enum(['Excellent', 'Good', 'Fair', 'Poor']).optional(),
  damageReported: z.string().max(1000).optional(),
  notes: z.string().max(500).optional(),
});

const maintenanceSchema = z.object({
  equipmentId: z.string().min(1),
  type: z.enum(['RoutineInspection', 'Repair', 'DeepCleaning', 'Replacement']),
  scheduledFor: z.string().datetime(),
  assignedTo: z.string().optional(),
  checklist: z.array(z.unknown()).optional(),
  notes: z.string().optional(),
});

const updateMaintenanceSchema = z.object({
  status: z.enum(['Planned', 'InProgress', 'Completed', 'Cancelled']).optional(),
  completedAt: z.string().datetime().optional().nullable(),
  cost: z.number().optional().nullable(),
  invoiceUrl: z.string().optional().nullable(),
  notes: z.string().optional(),
});

// ——— Categories (public list for catalog) ———
router.get('/categories', async (_req, res) => {
  const categories = await prisma.equipmentCategory.findMany({
    orderBy: { name: 'asc' },
    include: {
      _count: { select: { items: true } },
    },
  });
  res.json(categories);
});

// ——— Categories CRUD (Admin) ———
router.post('/categories', authenticate, requireRoles('Admin'), async (req: AuthRequest, res) => {
  const parse = categorySchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ message: 'Validation failed', errors: parse.error.flatten() });
  }
  const existing = await prisma.equipmentCategory.findUnique({
    where: { code: parse.data.code },
  });
  if (existing) return res.status(409).json({ message: 'Category code already exists' });
  const category = await prisma.equipmentCategory.create({ data: parse.data });
  res.status(201).json(category);
});

// ——— List equipment (with filters) ———
router.get('/', async (req, res) => {
  const categoryId = req.query.categoryId as string | undefined;
  const status = req.query.status as EquipmentStatus | undefined;
  const condition = req.query.condition as EquipmentCondition | undefined;
  const search = req.query.search as string | undefined;

  const where: Prisma.EquipmentItemWhereInput = {};
  if (categoryId) where.categoryId = categoryId;
  if (status) where.status = status;
  if (condition) where.condition = condition;
  if (search?.trim()) {
    where.OR = [
      { name: { contains: search.trim(), mode: 'insensitive' } },
      { brand: { contains: search.trim(), mode: 'insensitive' } },
      { sportType: { contains: search.trim(), mode: 'insensitive' } },
    ];
  }

  const items = await prisma.equipmentItem.findMany({
    where,
    include: {
      category: { select: { id: true, name: true, code: true } },
      currentHolder: { select: { id: true, name: true, fastId: true } },
    },
    orderBy: [{ category: { name: 'asc' } }, { name: 'asc' }],
  });
  res.json(items);
});

// ——— Get by QR (for scanner) ———
router.get('/by-qr/:qrCode', authenticate, async (req: AuthRequest, res) => {
  const item = await prisma.equipmentItem.findUnique({
    where: { qrCode: req.params.qrCode },
    include: {
      category: { select: { id: true, name: true, code: true } },
      currentHolder: { select: { id: true, name: true, fastId: true } },
    },
  });
  if (!item) return res.status(404).json({ message: 'Equipment not found' });
  res.json(item);
});

// ——— Get single item (full profile) ———
router.get('/:id', async (req, res) => {
  const item = await prisma.equipmentItem.findUnique({
    where: { id: req.params.id },
    include: {
      category: true,
      currentHolder: { select: { id: true, name: true, fastId: true } },
      transactions: {
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: { user: { select: { id: true, name: true, fastId: true } } },
      },
      maintenanceTasks: {
        orderBy: { scheduledFor: 'desc' },
        take: 10,
      },
    },
  });
  if (!item) return res.status(404).json({ message: 'Equipment not found' });
  res.json(item);
});

// ——— Create equipment (Admin) ———
router.post('/', authenticate, requireRoles('Admin'), async (req: AuthRequest, res) => {
  const parse = createItemSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ message: 'Validation failed', errors: parse.error.flatten() });
  }
  const category = await prisma.equipmentCategory.findUnique({
    where: { id: parse.data.categoryId },
  });
  if (!category) return res.status(404).json({ message: 'Category not found' });

  const data = {
    ...parse.data,
    specifications: parse.data.specifications
      ? (parse.data.specifications as Prisma.InputJsonValue)
      : undefined,
    purchaseDate: parse.data.purchaseDate ? new Date(parse.data.purchaseDate) : null,
    warrantyUntil: parse.data.warrantyUntil ? new Date(parse.data.warrantyUntil) : null,
    condition: (parse.data.condition as EquipmentCondition) ?? 'Good',
    quantity: parse.data.quantity ?? 1,
    lowStockThreshold: parse.data.lowStockThreshold ?? null,
    qrCode: generateQrCode(),
  };
  const item = await prisma.equipmentItem.create({
    data,
    include: {
      category: { select: { id: true, name: true, code: true } },
    },
  });
  res.status(201).json(item);
});

// ——— Update equipment (Admin) ———
router.patch('/:id', authenticate, requireRoles('Admin'), async (req: AuthRequest, res) => {
  const parse = createItemSchema.partial().safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ message: 'Validation failed', errors: parse.error.flatten() });
  }
  const existing = await prisma.equipmentItem.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ message: 'Equipment not found' });

  const data: Record<string, unknown> = { ...parse.data };
  if (parse.data.purchaseDate !== undefined) data.purchaseDate = parse.data.purchaseDate ? new Date(parse.data.purchaseDate) : null;
  if (parse.data.warrantyUntil !== undefined) data.warrantyUntil = parse.data.warrantyUntil ? new Date(parse.data.warrantyUntil) : null;
  if (parse.data.condition !== undefined) data.condition = parse.data.condition;

  const item = await prisma.equipmentItem.update({
    where: { id: req.params.id },
    data,
    include: {
      category: { select: { id: true, name: true, code: true } },
      currentHolder: { select: { id: true, name: true, fastId: true } },
    },
  });
  res.json(item);
});

// ——— Upload equipment photos (Admin) ———
router.post(
  '/:id/photos',
  authenticate,
  requireRoles('Admin'),
  uploadEquipmentPhoto.array('photos', 10),
  async (req: AuthRequest, res) => {
    const item = await prisma.equipmentItem.findUnique({ where: { id: req.params.id } });
    if (!item) return res.status(404).json({ message: 'Equipment not found' });
    const files = (req.files as Express.Multer.File[]) || [];
    const urls = files.map((f) => getEquipmentPhotoUrl(f.filename));
    const currentPhotos = (item.photos as string[] | null) || [];
    const newPhotos = [...currentPhotos, ...urls];
    await prisma.equipmentItem.update({
      where: { id: req.params.id },
      data: { photos: newPhotos },
    });
    res.json({ photos: newPhotos });
  }
);

// ——— Check-out ———
router.post('/checkout', authenticate, async (req: AuthRequest, res) => {
  const parse = checkoutSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ message: 'Validation failed', errors: parse.error.flatten() });
  }
  const { equipmentId, qrCode, plannedReturnAt, notes, damageReported } = parse.data;

  const item = equipmentId
    ? await prisma.equipmentItem.findUnique({ where: { id: equipmentId } })
    : await prisma.equipmentItem.findUnique({ where: { qrCode: qrCode! } });
  if (!item) return res.status(404).json({ message: 'Equipment not found' });
  if (item.status !== 'Available') {
    return res.status(400).json({ message: 'Equipment is not available for check-out' });
  }

  const plannedReturn = new Date(plannedReturnAt);
  const transaction = await prisma.equipmentTransaction.create({
    data: {
      equipmentId: item.id,
      userId: req.user!.id,
      type: 'CheckOut',
      plannedReturnAt: plannedReturn,
      notes: notes ?? null,
      damageReported: damageReported ?? null,
    },
    include: {
      equipment: { include: { category: { select: { name: true } } } },
      user: { select: { name: true, fastId: true } },
    },
  });
  await prisma.equipmentItem.update({
    where: { id: item.id },
    data: { status: 'CheckedOut', currentHolderId: req.user!.id },
  });

  res.status(201).json(transaction);
});

// ——— Check-in ———
router.post('/checkin', authenticate, async (req: AuthRequest, res) => {
  const parse = checkinSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ message: 'Validation failed', errors: parse.error.flatten() });
  }
  const { transactionId, qrCode, conditionOnReturn, damageReported, notes } = parse.data;

  let transaction = null;
  if (transactionId) {
    transaction = await prisma.equipmentTransaction.findFirst({
      where: { id: transactionId, type: 'CheckOut', returnedAt: null },
      include: { equipment: true },
    });
  } else if (qrCode) {
    const item = await prisma.equipmentItem.findUnique({
      where: { qrCode },
      include: { transactions: { where: { type: 'CheckOut', returnedAt: null }, orderBy: { createdAt: 'desc' }, take: 1 } },
    });
    if (!item) return res.status(404).json({ message: 'Equipment not found' });
    const openTx = item.transactions[0];
    if (!openTx) return res.status(400).json({ message: 'No open check-out found for this equipment' });
    transaction = await prisma.equipmentTransaction.findUnique({
      where: { id: openTx.id },
      include: { equipment: true },
    });
  }
  if (!transaction) return res.status(404).json({ message: 'Transaction not found' });

  const now = new Date();
  let lateFee: number | null = null;
  if (transaction.plannedReturnAt && now > transaction.plannedReturnAt) {
    const hoursLate = (now.getTime() - transaction.plannedReturnAt.getTime()) / (1000 * 60 * 60);
    lateFee = Math.ceil(hoursLate) * 10; // e.g. 10 per hour — configurable later
  }

  await prisma.equipmentTransaction.update({
    where: { id: transaction.id },
    data: {
      returnedAt: now,
      conditionOnReturn: conditionOnReturn ?? undefined,
      damageReported: damageReported ?? transaction.damageReported,
      notes: notes ?? undefined,
      lateFee: lateFee != null ? lateFee : undefined,
    },
  });
  await prisma.equipmentItem.update({
    where: { id: transaction.equipmentId },
    data: {
      status: 'Available',
      currentHolderId: null,
      ...(conditionOnReturn && { condition: conditionOnReturn as EquipmentCondition }),
    },
  });

  const checkinTx = await prisma.equipmentTransaction.create({
    data: {
      equipmentId: transaction.equipmentId,
      userId: req.user!.id,
      type: 'CheckIn',
      returnedAt: now,
      conditionOnReturn: conditionOnReturn ?? undefined,
      damageReported: damageReported ?? undefined,
      notes: notes ?? undefined,
      lateFee: lateFee != null ? lateFee : undefined,
    },
    include: {
      equipment: { include: { category: { select: { name: true } } } },
      user: { select: { name: true, fastId: true } },
    },
  });

  res.status(201).json(checkinTx);
});

// ——— My transactions ———
router.get('/transactions/me', authenticate, async (req: AuthRequest, res) => {
  const list = await prisma.equipmentTransaction.findMany({
    where: { userId: req.user!.id },
    orderBy: { createdAt: 'desc' },
    include: {
      equipment: { include: { category: { select: { name: true } } } },
    },
  });
  res.json(list);
});

// ——— Maintenance: list ———
router.get('/maintenance/list', authenticate, async (req, res) => {
  const from = req.query.from as string | undefined;
  const to = req.query.to as string | undefined;
  const status = req.query.status as MaintenanceTaskStatus | undefined;
  const equipmentId = req.query.equipmentId as string | undefined;

  const where: Prisma.EquipmentMaintenanceTaskWhereInput = {};
  if (equipmentId) where.equipmentId = equipmentId;
  if (status) where.status = status;
  if (from || to) {
    where.scheduledFor = {};
    if (from) where.scheduledFor.gte = new Date(from);
    if (to) where.scheduledFor.lte = new Date(to);
  }

  const tasks = await prisma.equipmentMaintenanceTask.findMany({
    where,
    include: {
      equipment: { include: { category: { select: { name: true } } } },
    },
    orderBy: { scheduledFor: 'asc' },
  });
  res.json(tasks);
});

// ——— Maintenance: create (Admin) ———
router.post('/maintenance', authenticate, requireRoles('Admin'), async (req: AuthRequest, res) => {
  const parse = maintenanceSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ message: 'Validation failed', errors: parse.error.flatten() });
  }
  const equipment = await prisma.equipmentItem.findUnique({
    where: { id: parse.data.equipmentId },
  });
  if (!equipment) return res.status(404).json({ message: 'Equipment not found' });

  const task = await prisma.equipmentMaintenanceTask.create({
    data: {
      equipmentId: parse.data.equipmentId,
      type: parse.data.type as MaintenanceTaskType,
      scheduledFor: new Date(parse.data.scheduledFor),
      assignedTo: parse.data.assignedTo ?? null,
      checklist: parse.data.checklist
        ? (parse.data.checklist as Prisma.InputJsonValue)
        : undefined,
      notes: parse.data.notes ?? null,
    },
    include: {
      equipment: { include: { category: { select: { name: true } } } },
    },
  });
  res.status(201).json(task);
});

// ——— Maintenance: update (Admin) ———
router.patch('/maintenance/:id', authenticate, requireRoles('Admin'), async (req: AuthRequest, res) => {
  const parse = updateMaintenanceSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ message: 'Validation failed', errors: parse.error.flatten() });
  }
  const existing = await prisma.equipmentMaintenanceTask.findUnique({
    where: { id: req.params.id },
  });
  if (!existing) return res.status(404).json({ message: 'Maintenance task not found' });

  const data: Record<string, unknown> = {};
  if (parse.data.status !== undefined) data.status = parse.data.status as MaintenanceTaskStatus;
  if (parse.data.completedAt !== undefined) data.completedAt = parse.data.completedAt ? new Date(parse.data.completedAt) : null;
  if (parse.data.cost !== undefined) data.cost = parse.data.cost;
  if (parse.data.invoiceUrl !== undefined) data.invoiceUrl = parse.data.invoiceUrl;
  if (parse.data.notes !== undefined) data.notes = parse.data.notes;
  if (parse.data.status === 'Completed' && existing.status !== 'Completed') {
    data.completedAt = new Date();
  }

  const task = await prisma.equipmentMaintenanceTask.update({
    where: { id: req.params.id },
    data,
    include: {
      equipment: { include: { category: { select: { name: true } } } },
    },
  });
  res.json(task);
});

// ——— Admin stats (dashboard) ———
router.get('/admin/stats', authenticate, requireRoles('Admin'), async (_req, res) => {
  const [byCategory, byStatus, total, transactionsRecent, maintenanceDue, lowStock] = await Promise.all([
    prisma.equipmentItem.groupBy({
      by: ['categoryId'],
      _count: { id: true },
      where: {},
    }),
    prisma.equipmentItem.groupBy({
      by: ['status'],
      _count: { id: true },
    }),
    prisma.equipmentItem.count(),
    prisma.equipmentTransaction.findMany({
      where: { type: 'CheckOut' },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        equipment: { include: { category: { select: { name: true } } } },
        user: { select: { name: true, fastId: true } },
      },
    }),
    prisma.equipmentMaintenanceTask.findMany({
      where: { status: { in: ['Planned', 'InProgress'] } },
      orderBy: { scheduledFor: 'asc' },
      take: 20,
      include: {
        equipment: { include: { category: { select: { name: true } } } },
      },
    }),
    prisma.equipmentItem.findMany({
      where: { lowStockThreshold: { not: null } },
      include: { category: { select: { name: true } } },
    }).then((items) =>
      items.filter((i) => i.lowStockThreshold != null && i.quantity <= i.lowStockThreshold)
    ),
  ]);

  const categories = await prisma.equipmentCategory.findMany({
    select: { id: true, name: true, code: true },
  });
  const byCategoryWithNames = byCategory.map((g) => ({
    categoryId: g.categoryId,
    categoryName: categories.find((c) => c.id === g.categoryId)?.name ?? '',
    count: g._count.id,
  }));

  res.json({
    totalEquipment: total,
    byCategory: byCategoryWithNames,
    byStatus: byStatus.map((s) => ({ status: s.status, count: s._count.id })),
    recentCheckouts: transactionsRecent,
    maintenanceDue,
    lowStock,
  });
});

export default router;
