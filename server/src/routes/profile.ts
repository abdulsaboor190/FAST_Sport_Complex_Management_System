import path from 'path';
import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import { prisma } from '../lib/prisma.js';
import { authenticate, requireRoles, type AuthRequest } from '../middleware/auth.js';
import { isValidFastId, normalizeFastId } from '../lib/fastId.js';
import { uploadAvatar, getAvatarUrl } from '../lib/upload.js';

const router = Router();
router.use(authenticate);

const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  fastId: z.string().refine(isValidFastId).optional(),
  email: z.string().email().optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

router.get('/me', async (req: AuthRequest, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: { id: true, fastId: true, email: true, name: true, role: true, avatarUrl: true, createdAt: true },
  });
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json({ ...user, avatarUrl: user.avatarUrl ? getAvatarUrl(user.avatarUrl) : null });
});

router.patch('/me', async (req: AuthRequest, res) => {
  const parse = updateProfileSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ message: 'Validation failed', errors: parse.error.flatten() });
    return;
  }
  const data: { name?: string; fastId?: string; email?: string } = {};
  if (parse.data.name !== undefined) data.name = parse.data.name.trim();
  if (parse.data.fastId !== undefined) data.fastId = normalizeFastId(parse.data.fastId);
  if (parse.data.email !== undefined) data.email = parse.data.email.toLowerCase();

  if (data.fastId || data.email) {
    const existing = await prisma.user.findFirst({
      where: {
        id: { not: req.user!.id },
        OR: [
          ...(data.fastId ? [{ fastId: data.fastId }] : []),
          ...(data.email ? [{ email: data.email }] : []),
        ],
      },
    });
    if (existing) {
      res.status(409).json({ message: 'FAST ID or email already in use' });
      return;
    }
  }

  const user = await prisma.user.update({
    where: { id: req.user!.id },
    data,
    select: { id: true, fastId: true, email: true, name: true, role: true, avatarUrl: true },
  });
  res.json({ ...user, avatarUrl: user.avatarUrl ? getAvatarUrl(user.avatarUrl) : null });
});

router.post('/me/change-password', async (req: AuthRequest, res) => {
  const parse = changePasswordSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ message: 'Validation failed', errors: parse.error.flatten() });
    return;
  }
  const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
  if (!user || !(await bcrypt.compare(parse.data.currentPassword, user.passwordHash))) {
    res.status(401).json({ message: 'Current password is incorrect' });
    return;
  }
  const passwordHash = await bcrypt.hash(parse.data.newPassword, 12);
  await prisma.user.update({ where: { id: req.user!.id }, data: { passwordHash } });
  res.json({ message: 'Password updated' });
});

router.post('/me/avatar', uploadAvatar.single('avatar'), async (req: AuthRequest, res) => {
  const file = req.file as Express.Multer.File | undefined;
  if (!file) {
    res.status(400).json({ message: 'No file uploaded' });
    return;
  }
  const relativePath = path.basename(file.path);
  const user = await prisma.user.update({
    where: { id: req.user!.id },
    data: { avatarUrl: relativePath },
    select: { id: true, avatarUrl: true },
  });
  res.json({ avatarUrl: getAvatarUrl(user.avatarUrl!) });
});

export default router;
