import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import type { SignOptions } from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { config } from '../config.js';
import { authenticate, type AuthRequest, type JwtPayload } from '../middleware/auth.js';
import { isValidFastId, normalizeFastId } from '../lib/fastId.js';
import { sendPasswordResetEmail } from '../lib/email.js';
import crypto from 'crypto';

const router = Router();

const registerSchema = z.object({
  fastId: z.string().min(1).refine(isValidFastId, { message: 'Invalid FAST ID format (e.g. 23I-0545)' }),
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2).max(100),
  role: z.enum(['Student', 'Faculty', 'Coach', 'Admin']).optional().default('Student'),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1).optional(),
});

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

function signAccessToken(payload: Omit<JwtPayload, 'type'>): string {
  return jwt.sign(
    { ...payload, type: 'access' },
    config.jwt.accessSecret,
    { expiresIn: config.jwt.accessExpiry as SignOptions['expiresIn'] }
  );
}

function signRefreshToken(payload: Omit<JwtPayload, 'type'>): string {
  return jwt.sign(
    { ...payload, type: 'refresh' },
    config.jwt.refreshSecret,
    { expiresIn: config.jwt.refreshExpiry as SignOptions['expiresIn'] }
  );
}

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/',
};

router.post('/register', async (req, res) => {
  try {
    const parse = registerSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ message: 'Validation failed', errors: parse.error.flatten() });
      return;
    }
    const { fastId, email, password, name, role } = parse.data;
    const normalizedFastId = normalizeFastId(fastId);

    const existing = await prisma.user.findFirst({
      where: { OR: [{ fastId: normalizedFastId }, { email: email.toLowerCase() }] },
    });
    if (existing) {
      res.status(409).json({
        message: existing.fastId === normalizedFastId ? 'FAST ID already registered' : 'Email already registered',
      });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        fastId: normalizedFastId,
        email: email.toLowerCase(),
        passwordHash,
        name: name.trim(),
        role,
      },
      select: { id: true, fastId: true, email: true, name: true, role: true, avatarUrl: true, createdAt: true },
    });

    const accessToken = signAccessToken({ userId: user.id, fastId: user.fastId, role: user.role });
    const refreshToken = signRefreshToken({ userId: user.id, fastId: user.fastId, role: user.role });
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    res.cookie('accessToken', accessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 });
    res.cookie('refreshToken', refreshToken, cookieOptions);
    res.status(201).json({
      user: {
        id: user.id,
        fastId: user.fastId,
        email: user.email,
        name: user.name,
        role: user.role,
        avatarUrl: user.avatarUrl,
      },
      accessToken,
      expiresIn: 900,
    });
  } catch (err: unknown) {
    console.error('Register failed:', err);
    const msg = typeof err === 'object' && err && 'code' in err ? `Database error (${(err as { code?: string }).code})` : 'Database error';
    res.status(500).json({
      message:
        `${msg}. Make sure PostgreSQL is running and DATABASE_URL in server/.env is correct.`,
    });
  }
});

router.post('/login', async (req, res) => {
  const parse = loginSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ message: 'Validation failed', errors: parse.error.flatten() });
    return;
  }
  const { email, password } = parse.data;

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    res.status(401).json({ message: 'Invalid email or password' });
    return;
  }

  const accessToken = signAccessToken({ userId: user.id, fastId: user.fastId, role: user.role });
  const refreshToken = signRefreshToken({ userId: user.id, fastId: user.fastId, role: user.role });
  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  res.cookie('accessToken', accessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 });
  res.cookie('refreshToken', refreshToken, cookieOptions);
  res.json({
    user: {
      id: user.id,
      fastId: user.fastId,
      email: user.email,
      name: user.name,
      role: user.role,
      avatarUrl: user.avatarUrl,
    },
    accessToken,
    expiresIn: 900,
  });
});

router.post('/refresh', async (req, res) => {
  const token = req.cookies?.refreshToken ?? req.body?.refreshToken;
  const parse = refreshSchema.safeParse({ refreshToken: token });
  if (!parse.success || !token) {
    res.status(401).json({ message: 'Refresh token required' });
    return;
  }

  try {
    const decoded = jwt.verify(token, config.jwt.refreshSecret) as JwtPayload;
    if (decoded.type !== 'refresh') {
      res.status(401).json({ message: 'Invalid token type' });
      return;
    }
    const stored = await prisma.refreshToken.findUnique({
      where: { token },
      include: { user: true },
    });
    if (!stored || stored.expiresAt < new Date()) {
      if (stored) await prisma.refreshToken.delete({ where: { id: stored.id } }).catch(() => {});
      res.status(401).json({ message: 'Invalid or expired refresh token' });
      return;
    }

    const accessToken = signAccessToken({
      userId: stored.user.id,
      fastId: stored.user.fastId,
      role: stored.user.role,
    });
    res.cookie('accessToken', accessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 });
    res.json({ accessToken, expiresIn: 900 });
  } catch {
    res.status(401).json({ message: 'Invalid refresh token' });
  }
});

router.post('/logout', authenticate, async (req: AuthRequest, res) => {
  const token = req.cookies?.refreshToken;
  if (token) {
    await prisma.refreshToken.deleteMany({ where: { token } }).catch(() => {});
  }
  res.clearCookie('accessToken', { path: '/' });
  res.clearCookie('refreshToken', { path: '/' });
  res.json({ message: 'Logged out' });
});

router.post('/forgot-password', async (req, res) => {
  const parse = forgotPasswordSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ message: 'Valid email required' });
    return;
  }
  const user = await prisma.user.findUnique({ where: { email: parse.data.email.toLowerCase() } });
  if (!user) {
    res.json({ message: 'If an account exists, you will receive a reset link' });
    return;
  }

  const rawToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  await prisma.passwordResetToken.create({
    data: { token: hashedToken, userId: user.id, expiresAt },
  });
  await sendPasswordResetEmail(user.email, user.name, rawToken);
  res.json({ message: 'If an account exists, you will receive a reset link' });
});

router.post('/reset-password', async (req, res) => {
  const parse = resetPasswordSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ message: 'Invalid request', errors: parse.error.flatten() });
    return;
  }
  const hashedToken = crypto.createHash('sha256').update(parse.data.token).digest('hex');
  const resetRecord = await prisma.passwordResetToken.findFirst({
    where: { token: hashedToken, used: false, expiresAt: { gt: new Date() } },
    include: { user: true },
  });
  if (!resetRecord) {
    res.status(400).json({ message: 'Invalid or expired reset link' });
    return;
  }

  const passwordHash = await bcrypt.hash(parse.data.password, 12);
  await prisma.$transaction([
    prisma.user.update({ where: { id: resetRecord.userId }, data: { passwordHash } }),
    prisma.passwordResetToken.update({ where: { id: resetRecord.id }, data: { used: true } }),
  ]);
  res.json({ message: 'Password reset successful' });
});

router.get('/me', authenticate, async (req: AuthRequest, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: { id: true, fastId: true, email: true, name: true, role: true, avatarUrl: true, createdAt: true },
  });
  if (!user) {
    res.status(404).json({ message: 'User not found' });
    return;
  }
  res.json(user);
});

export default router;
