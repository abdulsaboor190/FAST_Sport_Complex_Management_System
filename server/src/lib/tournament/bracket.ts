
interface MatchPlaceholder {
    round: number;
    matchNumber: number;
    homeTeamId: string | null;
    awayTeamId: string | null;
    nextMatchSlot?: 'home' | 'away';
}

/**
 * Generates a single elimination bracket.
 * 
 * @param teamIds Array of team IDs
 * @returns Array of matches to be created
 */
export function generateSingleElimination(teamIds: string[]): MatchPlaceholder[] {
    const matches: MatchPlaceholder[] = [];
    const totalTeams = teamIds.length;

    if (totalTeams < 2) return [];

    // 1. Calculate the next power of 2
    let powerOfTwo = 1;
    while (powerOfTwo < totalTeams) {
        powerOfTwo *= 2;
    }

    // Number of rounds needed
    const totalRounds = Math.log2(powerOfTwo);

    // We will build matches from the first round up to the final.
    // Actually, for single elimination, it's easier to think about the structure.
    // PowerOfTwo is the size of the bracket (e.g. 16 for 12 teams, meaning 4 byes).

    // Let's perform seeding (simple order for now)
    // Standard seeding pairs 1 vs N, 2 vs N-1, etc. but we'll just take them in order for now or randomize before calling.

    // We need to determine first round matches.
    // Valid teams are 0 to totalTeams-1.
    // Byes are powerOfTwo - totalTeams.

    // Actually, a simpler approach for the match structure:
    // Round 1 has powerOfTwo / 2 matches.
    // Round 2 has powerOfTwo / 4 matches...
    // Round N has 1 match (Final).

    // We need to map which match feeds into which.
    // Match M in Round R feeds into Match floor(M/2) in Round R+1.
    // If M is even, it's Home. If M is odd, it's Away. (Assuming 0-indexed match numbers per round).

    // Let's generate the structure first.
    let matchIdCounter = 0; // Just for internal tracking

    // Array to hold the teams placed in the first round slots.
    // The bracket size is powerOfTwo.
    // We place teams in slots 0 to powerOfTwo-1.
    // If we have byes, the top seeds get them.
    // Usually, seeds are placed: 1, 16, 8, 9, 4, 13, 5, 12... to preserve fair matchups.
    // For MVP, we'll fill slots 0..totalTeams-1 with teams, and the rest are "BYE".
    // But strictly, Byes should be handled so that a team advances automatically.

    // Simplified Logic: 
    // Generate the full binary tree structure.
    // Pop teams into the leaf nodes.
    // If a leaf node has a "BYE", the opponent automatically wins and moves to next round.

    // Let's just create the matches for the first round that actually need to be played?
    // No, we should create all matches but mark some as auto-completed?
    // Or better: Create the full bracket structure (Match records) so the UI can draw it.

    // Phase 1: Create all match slots
    let currentRoundSize = powerOfTwo / 2;
    let roundNumber = 1;
    const matchMap = new Map<string, MatchPlaceholder>(); // key: "R-M", val: Match

    while (currentRoundSize >= 1) {
        for (let i = 0; i < currentRoundSize; i++) {
            const match: MatchPlaceholder = {
                round: roundNumber,
                matchNumber: i + 1, // 1-indexed
                homeTeamId: null,
                awayTeamId: null,
            };
            matches.push(match);
            // Determine next match linkage
            if (currentRoundSize > 1) {
                // This match feeds into round + 1, match ceil((i+1)/2)
                // If i is even (0, 2), it's the first of the pair -> Home
                // If i is odd (1, 3), it's the second of the pair -> Away
                // wait, (i+1) ... 1 -> 1 (Home), 2 -> 1 (Away), 3 -> 2 (Home), 4 -> 2 (Away)
                const nextMatchNum = Math.ceil((i + 1) / 2);
                match.nextMatchSlot = (i % 2 === 0) ? 'home' : 'away';
            }
        }
        currentRoundSize /= 2;
        roundNumber++;
    }

    // Phase 2: Assign teams to Round 1
    // We have 'teamIds' list.
    // We have 'powerOfTwo' total slots in Round 1 input.
    // The first round matches are indices 0 to (powerOfTwo/2 - 1) in our 'matches' array (since we pushed them first).
    // Total Round 1 matches = powerOfTwo / 2.

    const round1Matches = matches.filter(m => m.round === 1);
    const totalSlots = powerOfTwo;
    const numByes = powerOfTwo - totalTeams;

    // We distribute byes. Usually highest seeds get byes.
    // Let's say we just fill slots sequentially for now.
    // Slot 0 (Match 1 Home), Slot 1 (Match 1 Away), Slot 2 (Match 2 Home)...

    // If we have byes, we should leave slots empty?
    // A match with a Bye typically means the team in the other slot advances to Round 2 instantly.
    // To support this in the database, we can:
    // 1. Create the match with one team and verificationStatus = 'Verified', winner = that team.
    // 2. OR, better, don't create Round 1 match for them?
    // Simplest for visualization: Create all matches. If one side is BYE (null) and other is Team, 
    // the helper logic should auto-promote the Team to the next match.

    // Assign teams to slots
    // Maps slot index (0..totalSlots-1) to teamId
    const slots: (string | null)[] = new Array(totalSlots).fill(null);

    // Simple fill:
    for (let i = 0; i < totalTeams; i++) {
        slots[i] = teamIds[i];
    }

    // Now place slots into Round 1 matches
    // Match 1: Slot 0 vs Slot 1
    // Match 2: Slot 2 vs Slot 3

    round1Matches.forEach((match, index) => {
        match.homeTeamId = slots[index * 2];
        match.awayTeamId = slots[index * 2 + 1];
    });

    return matches;
}
