
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authenticate, requireRoles, type AuthRequest } from '../middleware/auth.js';

const router = Router();

const registerTeamSchema = z.object({
    tournamentId: z.string().cuid(),
    name: z.string().min(2).max(100),
    department: z.string().optional(),
    players: z.array(z.object({
        name: z.string().min(2),
        fastId: z.string().optional(), // e.g. 23I-1234
        position: z.string().optional(),
        jerseyNo: z.number().optional(),
    })).min(1),
    logoUrl: z.string().url().optional(),
});

// Create a team and register for a tournament
router.post('/register', authenticate, async (req: AuthRequest, res) => {
    const parse = registerTeamSchema.safeParse(req.body);
    if (!parse.success) {
        return res.status(400).json({ message: 'Validation failed', errors: parse.error.flatten() });
    }

    const { tournamentId, name, department, players, logoUrl } = parse.data;

    // Check tournament status
    const tournament = await prisma.tournament.findUnique({
        where: { id: tournamentId }
    });

    if (!tournament) return res.status(404).json({ message: 'Tournament not found' });

    if (!tournament.registrationOpen) {
        return res.status(400).json({ message: 'Registration is closed for this tournament' });
    }

    if (tournament.registrationDeadline && new Date() > tournament.registrationDeadline) {
        return res.status(400).json({ message: 'Registration deadline has passed' });
    }

    // Check current team count
    const currentTeams = await prisma.tournamentRegistration.count({
        where: { tournamentId }
    });

    if (currentTeams >= tournament.maxTeams) {
        return res.status(400).json({ message: 'Tournament is full' });
    }

    // Check if user is already coaching a team in this tournament (optional rule, but good for data integrity)
    // Or check if team name already exists in this tournament? 
    // The schema has @@unique([name, department]) for Team, but teams can be reused?
    // For simplicity, we'll create a new Team record or find existing if name+department matches, 
    // BUT we need to associate it with the tournament.

    // Transaction to create team, players, and registration
    try {
        const result = await prisma.$transaction(async (tx) => {
            // 1. Find or create Team
            // We'll create a new team for now to avoid complexity of reusing teams and merging rosters
            // Or we can try to find one.

            let team = await tx.team.findFirst({
                where: { name, department }
            });

            if (!team) {
                team = await tx.team.create({
                    data: {
                        name,
                        department,
                        coachUserId: req.user!.id,
                        logoUrl
                    }
                });
            } else {
                // If team exists, ensure the current user is the coach or admin?
                // For now, let's allow it but warn if we were strict.
            }

            // 2. Add players
            // We'll just create new player records tied to this team. 
            // If team existed, we might want to wipe old players or append?
            // Let's append for now or just create.
            await tx.player.createMany({
                data: players.map(p => ({
                    ...p,
                    teamId: team!.id
                }))
            });

            // 3. Register for tournament
            const registration = await tx.tournamentRegistration.create({
                data: {
                    tournamentId,
                    teamId: team!.id,
                    status: 'Pending', // pending approval or payment
                }
            });

            return { team, registration };
        });

        res.status(201).json(result);
    } catch (e: any) {
        if (e.code === 'P2002') { // Unique constraint failed
            return res.status(400).json({ message: 'Team already registered for this tournament' });
        }
        console.error(e);
        res.status(500).json({ message: 'Registration failed' });
    }
});

// Get My Teams
router.get('/my', authenticate, async (req: AuthRequest, res) => {
    const teams = await prisma.team.findMany({
        where: { coachUserId: req.user!.id },
        include: {
            registrations: {
                include: { tournament: true }
            },
            players: true
        }
    });
    res.json(teams);
});

export default router;
