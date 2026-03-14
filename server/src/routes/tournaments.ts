import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authenticate, requireRoles, type AuthRequest } from '../middleware/auth.js';
import type { Role, TournamentFormat, TournamentStatus } from '@prisma/client';

const router = Router();

// Validation schemas
const createTournamentSchema = z.object({
  name: z.string().min(3).max(100),
  sport: z.string().min(2).max(50),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  format: z.enum(['SingleElimination', 'DoubleElimination', 'RoundRobin', 'GroupStage']),
  registrationDeadline: z.string().datetime().optional(),
  maxTeams: z.number().int().min(2).max(128).default(16),
  entryFee: z.number().min(0).default(0),
  rules: z.string().optional(),
  prizes: z.any().optional(), // JSON
  posterUrl: z.string().url().optional(),
  announcement: z.string().optional(),
});

const updateTournamentSchema = createTournamentSchema.partial().extend({
  status: z.enum(['Draft', 'RegistrationOpen', 'RegistrationClosed', 'Scheduled', 'Live', 'Completed', 'Cancelled']).optional(),
  registrationOpen: z.boolean().optional(),
});

// Routes

// Get all tournaments (public/authenticated)
router.get('/', authenticate, async (req, res) => {
  const { status, sport, upcoming } = req.query;

  const where: any = {};
  if (status) where.status = status;
  if (sport) where.sport = sport;
  if (upcoming === 'true') where.startDate = { gte: new Date() };

  const tournaments = await prisma.tournament.findMany({
    where,
    orderBy: { startDate: 'asc' },
    include: {
      _count: {
        select: { registrations: true }
      }
    }
  });

  res.json(tournaments);
});

// Get single tournament details
router.get('/:id', authenticate, async (req, res) => {
  const tournament = await prisma.tournament.findUnique({
    where: { id: req.params.id },
    include: {
      registrations: {
        include: {
          team: true
        }
      },
      matches: {
        orderBy: [
          { round: 'asc' },
          { matchNumber: 'asc' }
        ],
        include: {
          homeTeam: true,
          awayTeam: true
        }
      },
      createdBy: {
        select: { name: true, email: true }
      }
    }
  });

  if (!tournament) {
    return res.status(404).json({ message: 'Tournament not found' });
  }

  res.json(tournament);
});

// Create tournament (Admin only)
router.post('/', authenticate, requireRoles('Admin'), async (req: AuthRequest, res) => {
  const parse = createTournamentSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ message: 'Validation failed', errors: parse.error.flatten() });
  }

  const data = parse.data;

  // Basic date validation
  if (new Date(data.endDate) <= new Date(data.startDate)) {
    return res.status(400).json({ message: 'End date must be after start date' });
  }

  const tournament = await prisma.tournament.create({
    data: {
      ...data,
      createdById: req.user!.id,
      status: 'Draft',
    }
  });

  res.status(201).json(tournament);
});

// Update tournament (Admin only)
router.patch('/:id', authenticate, requireRoles('Admin'), async (req, res) => {
  const parse = updateTournamentSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ message: 'Validation failed', errors: parse.error.flatten() });
  }

  const tournament = await prisma.tournament.findUnique({
    where: { id: req.params.id }
  });

  if (!tournament) {
    return res.status(404).json({ message: 'Tournament not found' });
  }

  const updated = await prisma.tournament.update({
    where: { id: req.params.id },
    data: parse.data
  });

  res.json(updated);
});

// Delete tournament (Admin only)
router.delete('/:id', authenticate, requireRoles('Admin'), async (req, res) => {
  // Check if tournament has started or has registrations
  const tournament = await prisma.tournament.findUnique({
    where: { id: req.params.id },
    include: { _count: { select: { registrations: true, matches: true } } }
  });

  if (!tournament) {
    return res.status(404).json({ message: 'Tournament not found' });
  }

  if (tournament.status !== 'Draft' && (tournament._count.registrations > 0 || tournament._count.matches > 0)) {
    return res.status(400).json({
      message: 'Cannot delete active tournament with registrations or matches. Cancel it instead.'
    });
  }

  await prisma.tournament.delete({
    where: { id: req.params.id }
  });

  res.status(204).end();
});


import { generateSingleElimination } from '../lib/tournament/bracket.js';

// Generate bracket (Admin only)
router.post('/:id/generate-bracket', authenticate, requireRoles('Admin'), async (req, res) => {
  const tournamentId = req.params.id;
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: { registrations: { where: { status: 'Approved' }, include: { team: true } } }
  });

  if (!tournament) return res.status(404).json({ message: 'Tournament not found' });

  if (tournament.registrations.length < 2) {
    return res.status(400).json({ message: 'Need at least 2 approved teams to generate bracket' });
  }

  // Delete existing matches if any?
  // For now, fail if matches exist
  const matchCount = await prisma.match.count({ where: { tournamentId } });
  if (matchCount > 0) {
    const { force } = req.body;
    if (!force) return res.status(400).json({ message: 'Bracket already exists. Pass {force: true} to overwrite.' });
    await prisma.match.deleteMany({ where: { tournamentId } });
  }

  const teamIds = tournament.registrations.map(r => r.teamId);
  // Shuffle teams for random seeding?
  // teamIds.sort(() => Math.random() - 0.5); 

  const generatedMatches = generateSingleElimination(teamIds);

  // Helper to find next match ID based on structure
  // We need to insert matches and link them.
  // Strategy: Insert all matches first, then link them?
  // Or Insert from Final, then previous rounds?
  // Or Insert sequential and then update links?
  // Actually, 'round' and 'matchNumber' uniquely identify a match in a tournament.
  // We can use that to link.

  // 1. Create all matches
  await prisma.match.createMany({
    data: generatedMatches.map(m => ({
      tournamentId,
      round: m.round,
      matchNumber: m.matchNumber,
      homeTeamId: m.homeTeamId,
      awayTeamId: m.awayTeamId,
      nextMatchSlot: m.nextMatchSlot ?? null,
    }))
  });

  // 2. Link nextMatchId
  // For each match in round R, find the target match in round R+1
  // Target is Match with round=R+1, matchNumber=ceil(currentMatchNumber/2)
  const allMatches = await prisma.match.findMany({ where: { tournamentId } });

  const updates = [];
  for (const match of allMatches) {
    // Find the match that this match feeds into
    // logic: next round, ceil(matchNumber/2)
    // Only if it's not the final (max round)
    // The generate function gave us 'round' but didn't explicitly say max round, but we can infer.
    // However, we can just look for the match with round+1 and correct number.
    const targetNum = Math.ceil(match.matchNumber / 2);
    const targetRound = match.round + 1;

    const targetMatch = allMatches.find(m => m.round === targetRound && m.matchNumber === targetNum);

    // Also, handle Byes: If a match has a team vs null, that team wins immediately.
    // We should update the winner and propagate to next match.

    if (targetMatch) {
      updates.push(prisma.match.update({
        where: { id: match.id },
        data: { nextMatchId: targetMatch.id }
      }));
    }

    // Handle Auto-Win for Byes (Initial seeding only)
    if (match.round === 1 && (match.homeTeamId && !match.awayTeamId)) {
      // Home team gets bye
      updates.push(prisma.match.update({
        where: { id: match.id },
        data: {
          winnerTeamId: match.homeTeamId,
          status: 'Completed',
          verificationStatus: 'Verified'
        }
      }));
      // We also need to push this winner to the next match immediately?
      // The live score update logic usually handles propagation.
      // Leaving it cleanly separate: The system (or admin) can "Verify" the bye match to advance it.
      // Or we can do it here. Let's do it here for smoother UX.
      if (targetMatch) {
        const slot = match.nextMatchSlot === 'home' ? 'homeTeamId' : 'awayTeamId';
        updates.push(prisma.match.update({
          where: { id: targetMatch.id },
          data: { [slot]: match.homeTeamId }
        }));
      }
    } else if (match.round === 1 && (!match.homeTeamId && match.awayTeamId)) {
      // Away team gets bye (Unlikely with standard filling but possible)
      updates.push(prisma.match.update({
        where: { id: match.id },
        data: {
          winnerTeamId: match.awayTeamId,
          status: 'Completed',
          verificationStatus: 'Verified'
        }
      }));
      if (targetMatch) {
        const slot = match.nextMatchSlot === 'home' ? 'homeTeamId' : 'awayTeamId';
        updates.push(prisma.match.update({
          where: { id: targetMatch.id },
          data: { [slot]: match.awayTeamId }
        }));
      }
    }
  }

  await prisma.$transaction(updates);

  // Update tournament status
  await prisma.tournament.update({
    where: { id: tournamentId },
    data: { status: 'Scheduled' }
  });

  res.json({ message: 'Bracket generated', matches: allMatches.length });
});

export default router;
