// Score Service - Business logic for score submission

import { upsertHoleScore, upsertHoleScoresBatch, getFlightHoleScores, HoleScore, CreateHoleScoreInput } from '../repositories/holeScoreRepository';
import { upsertScrambleScore, upsertScrambleScoresBatch, getFlightScrambleScores, ScrambleScore, CreateScrambleScoreInput } from '../repositories/scrambleScoreRepository';
import { createAuditLog } from '../repositories/auditRepository';
import { getPool } from '../config/database';
import { formatMatchStatus } from '../scoring/matchStatus';
import { invalidateLeaderboardCache } from './leaderboardService';

export interface SubmitScoreInput {
    playerId: string;
    holeNumber: number;
    grossScore: number | null;
    mutationId: string;
}

export interface SubmitScoresInput {
    eventId: string;
    flightId: string;
    userId: string;
    scores: SubmitScoreInput[];
    source?: 'online' | 'offline';
}

export interface SubmitScrambleScoreInput {
    team: 'red' | 'blue';
    holeNumber: number;
    grossScore: number | null;
    mutationId: string;
}

export interface SubmitScrambleScoresInput {
    eventId: string;
    flightId: string;
    userId: string;
    scores: SubmitScrambleScoreInput[];
    source?: 'online' | 'offline';
}

export interface SubmitScoresResult {
    success: boolean;
    created: number;
    updated: number;
    conflicts: { holeNumber: number; playerId?: string; team?: string; currentVersion: number }[];
    scores: HoleScore[] | ScrambleScore[];
}

/**
 * Validate event is in 'live' state.
 */
export const validateEventLive = async (eventId: string): Promise<void> => {
    const pool = getPool();
    const res = await pool.query('SELECT status FROM events WHERE id = $1', [eventId]);
    if (res.rows.length === 0) {
        throw new Error('Event not found');
    }
    if (res.rows[0].status !== 'live') {
        throw new Error('Event is not live. Scores can only be submitted during live events.');
    }
};

/**
 * Validate player belongs to flight.
 */
export const validatePlayerInFlight = async (playerId: string, flightId: string): Promise<void> => {
    const pool = getPool();
    const res = await pool.query(
        `SELECT fm.id FROM flight_members fm 
         JOIN players p ON p.user_id = fm.user_id 
         WHERE p.id = $1 AND fm.flight_id = $2`,
        [playerId, flightId]
    );
    // Also check if player is directly associated via flight_id on players table
    const directRes = await pool.query(
        `SELECT id FROM players WHERE id = $1 AND flight_id = $2`,
        [playerId, flightId]
    );
    if (res.rows.length === 0 && directRes.rows.length === 0) {
        // Check if player exists at all
        const playerExists = await pool.query('SELECT id FROM players WHERE id = $1', [playerId]);
        if (playerExists.rows.length === 0) {
            throw new Error('Player not found');
        }
        // For now, allow scoring if player exists (organizer override)
    }
};

/**
 * Submit hole scores (front 9 or any hole 1-18).
 */
export const submitHoleScores = async (input: SubmitScoresInput): Promise<SubmitScoresResult> => {
    console.log(`[ScoreService] submitHoleScores input:`, JSON.stringify(input.scores));
    await validateEventLive(input.eventId);

    const conflicts: SubmitScoresResult['conflicts'] = [];
    const createInputs: CreateHoleScoreInput[] = [];

    for (const score of input.scores) {
        if (score.holeNumber < 1 || score.holeNumber > 18) {
            throw new Error(`Invalid hole number: ${score.holeNumber}. Must be between 1 and 18.`);
        }
        if (score.grossScore === null || score.grossScore === 0) {
            // 0 indicates deletion/clearing - skip validation and don't add to upsert batch
            continue;
        }
        if (typeof score.grossScore === 'number' && score.grossScore < 0) {
            throw new Error(`Invalid gross score: ${score.grossScore}. Must be a positive integer.`);
        }

        createInputs.push({
            eventId: input.eventId,
            flightId: input.flightId,
            playerId: score.playerId,
            holeNumber: score.holeNumber,
            grossScore: score.grossScore as number,
            mutationId: score.mutationId,
            enteredByUserId: input.userId,
            source: input.source || 'online'
        });
    }

    const result = await upsertHoleScoresBatch(createInputs);

    // Handle deletions (scores with 0 or null)
    for (const score of input.scores) {
        if (score.grossScore === null || score.grossScore === 0) {
            console.log(`[ScoreService] Deleting hole score. Flight: ${input.flightId}, Player: ${score.playerId}, Hole: ${score.holeNumber}`);

            const pool = getPool();
            const res = await pool.query(
                `DELETE FROM hole_scores 
                 WHERE event_id = $1 AND flight_id = $2 AND player_id = $3 AND hole_number = $4`,
                [input.eventId, input.flightId, score.playerId, score.holeNumber]
            );
            console.log(`[ScoreService] Deleted rows: ${res.rowCount}`);

            await createAuditLog({
                eventId: input.eventId,
                entityType: 'hole_score',
                entityId: `${score.playerId}-${score.holeNumber}`, // logical ID as real ID is unknown without query
                action: 'delete',
                previousValue: { grossScore: 'unknown' },
                newValue: { grossScore: null },
                source: input.source || 'online',
                byUserId: input.userId
            });
        }
    }

    // Invalidate leaderboard cache
    invalidateLeaderboardCache(input.eventId);

    return {
        success: true,
        created: result.created,
        updated: result.updated,
        conflicts,
        scores: result.scores
    };
};

/**
 * Submit scramble scores (back 9, holes 10-18).
 */
export const submitScrambleScores = async (input: SubmitScrambleScoresInput): Promise<SubmitScoresResult> => {
    console.log(`[ScoreService] submitScrambleScores input:`, JSON.stringify(input.scores));
    await validateEventLive(input.eventId);

    const conflicts: SubmitScoresResult['conflicts'] = [];
    const createInputs: CreateScrambleScoreInput[] = [];

    for (const score of input.scores) {
        if (score.holeNumber < 10 || score.holeNumber > 18) {
            throw new Error(`Invalid scramble hole number: ${score.holeNumber}. Must be between 10 and 18.`);
        }
        if (score.grossScore === null || score.grossScore === 0) {
            // 0 indicates deletion - skip validation and upsert
            continue;
        }
        if (typeof score.grossScore === 'number' && score.grossScore < 0) {
            throw new Error(`Invalid gross score: ${score.grossScore}. Must be a positive integer.`);
        }

        createInputs.push({
            eventId: input.eventId,
            flightId: input.flightId,
            team: score.team,
            holeNumber: score.holeNumber,
            grossScore: score.grossScore as number,
            mutationId: score.mutationId,
            enteredByUserId: input.userId,
            source: input.source || 'online'
        });
    }

    const result = await upsertScrambleScoresBatch(createInputs);

    // Handle deletions (scores with 0 or null)
    for (const score of input.scores) {
        if (score.grossScore === null || score.grossScore === 0) {
            console.log(`[ScoreService] Deleting scramble score. Flight: ${input.flightId}, Team: ${score.team}, Hole: ${score.holeNumber}`);

            const pool = getPool();
            const res = await pool.query(
                `DELETE FROM scramble_team_scores 
                 WHERE event_id = $1 AND flight_id = $2 AND team = $3 AND hole_number = $4`,
                [input.eventId, input.flightId, score.team, score.holeNumber]
            );
            // Also delete from hole_scores to prevent phantom scores from reappearing (fallback logic)
            // We delete for ALL players in that team for this hole
            await pool.query(
                `DELETE FROM hole_scores 
                 WHERE flight_id = $1 AND hole_number = $2 AND player_id IN (
                     SELECT id FROM players WHERE flight_id = $1 AND team = $3
                 )`,
                [input.flightId, score.holeNumber, score.team]
            );

            console.log(`[ScoreService] Deleted rows: ${res.rowCount}`);
        }
    }

    // Invalidate leaderboard cache
    invalidateLeaderboardCache(input.eventId);

    return {
        success: true,
        created: result.created,
        updated: result.updated,
        conflicts,
        scores: result.scores
    };
};

/**
 * Get all hole scores for a flight.
 */
export const getHoleScoresForFlight = async (flightId: string): Promise<HoleScore[]> => {
    return getFlightHoleScores(flightId);
};

/**
 * Get all scramble scores for a flight.
 */
export const getScrambleScoresForFlight = async (flightId: string): Promise<ScrambleScore[]> => {
    return getFlightScrambleScores(flightId);
};

/**
 * Get aggregated scoreboard data for a flight.
 */
import { getCourseByEventId } from '../repositories/courseRepository';
import { calculateFlightMatches, FlightPlayerScores } from '../scoring/flightMatchCalculator';

export const getFlightScoreboardData = async (flightId: string) => {
    const pool = getPool();

    // 1. Get Flight Info
    const flightRes = await pool.query('SELECT id, flight_number, event_id FROM flights WHERE id = $1', [flightId]);
    if (flightRes.rows.length === 0) throw new Error('Flight not found');
    const flight = flightRes.rows[0];

    // 2. Get Players
    const playersRes = await pool.query(
        `SELECT id, first_name, last_name, handicap_index, team, position 
         FROM players WHERE flight_id = $1 ORDER BY team, position`,
        [flightId]
    );
    const redPlayers = playersRes.rows.filter((p: any) => p.team === 'red');
    const bluePlayers = playersRes.rows.filter((p: any) => p.team === 'blue');

    // 3. Get Scores
    const holeScores = await getFlightHoleScores(flightId);
    const scrambleScores = await getScrambleScoresForFlight(flightId);

    // 4. Get Course Info (Pars/SI)
    const course = await getCourseByEventId(flight.event_id);
    let parValues = Array(18).fill(4);
    let siValues = Array.from({ length: 18 }, (_, i) => i + 1);

    if (course && course.tees.length > 0) {
        const tee = course.tees[0];
        const sortedHoles = [...tee.holes].sort((a, b) => a.holeNumber - b.holeNumber);
        if (sortedHoles.length === 18) {
            parValues = sortedHoles.map(h => h.par);
            siValues = sortedHoles.map(h => h.strokeIndex);
        }
    }

    // 5. Structure Player Data
    const mapPlayer = (p: any) => {
        const pScores = holeScores.filter(s => s.playerId === p.id);
        const scores = Array(18).fill(null);

        // Map individual hole scores
        pScores.forEach(s => {
            if (s.holeNumber >= 1 && s.holeNumber <= 18) {
                scores[s.holeNumber - 1] = s.grossScore;
            }
        });

        // Map scramble scores (override holes 10-18 for this team's players)
        // Scramble holes are ALWAYS 10-18 in this domain model
        const pTeamScores = scrambleScores.filter(s => s.team === p.team);
        pTeamScores.forEach(s => {
            if (s.holeNumber >= 10 && s.holeNumber <= 18) {
                scores[s.holeNumber - 1] = s.grossScore;
            }
        });

        return {
            playerId: p.id,
            playerName: [p.first_name, p.last_name].filter((n: string) => n && n !== '-').join(' ').trim(),
            hcp: parseFloat(p.handicap_index) || 0,
            scores,
            singlesStatus: null as string | null,
            singlesResult: null as 'win' | 'loss' | 'halved' | null,
            singlesHoles: Array(18).fill(null) as (string | null)[]
        };
    };

    const redPlayersData = redPlayers.map(mapPlayer);
    const bluePlayersData = bluePlayers.map(mapPlayer);

    // 6. Calculate Match Status & Progression
    let matchStatus = "Not Started";
    let fourballStatus = "Not Started";
    let scrambleStatus = "Not Started";
    let segmentType: 'singles' | 'fourball' | 'scramble' = 'fourball';
    const matchProgression = Array(18).fill(null);
    const holeWinners = Array(18).fill(null);
    const matchLeaders = Array(18).fill(null);

    // Default singles data
    redPlayersData.forEach((p: any) => { p.singlesStatus = null; p.singlesResult = null; });
    bluePlayersData.forEach((p: any) => { p.singlesStatus = null; p.singlesResult = null; });

    if (redPlayers.length >= 2 && bluePlayers.length >= 2) {

        const buildCalcInput = (pIdx: number, team: 'red' | 'blue'): FlightPlayerScores => {
            const playersList = team === 'red' ? redPlayersData : bluePlayersData;
            const pData = playersList[pIdx];

            const front = Array(9).fill(null);
            const back = Array(9).fill(null);

            pData.scores.forEach((score: number | null, idx: number) => {
                const hNum = idx + 1;
                const val = score || null;
                if (hNum <= 9) front[hNum - 1] = val;
                else back[hNum - 10] = val;
            });

            return {
                handicapIndex: pData.hcp,
                frontNineGross: front,
                backNineGross: back,
                strokeIndexes: siValues
            };
        };

        const result = calculateFlightMatches({
            redPlayer1: buildCalcInput(0, 'red'),
            redPlayer2: buildCalcInput(1, 'red'),
            bluePlayer1: buildCalcInput(0, 'blue'),
            bluePlayer2: buildCalcInput(1, 'blue')
        });

        // Unified singles status formatter
        const formatSinglesStatus = (res: any, team: 'red' | 'blue'): string | null => {
            if (!res) return null;
            if (res.result.finalStatus === 'Not Started') return null;

            // Match decided
            if (res.result.winner) {
                const status = res.result.finalStatus; // e.g. "3&2", "1 UP", "A/S"
                if (res.result.winner === team) return `Won ${status}`;
                // "Lost X&Y" is fine; for "X UP" show "Lost X DN"
                return `Lost ${status.replace('UP', 'DN')}`;
            }

            // Active match
            const leader = res.finalState.leader;
            const lead = res.finalState.lead;
            if (leader === null) return 'A/S';
            if (leader === team) return `${lead} UP`;
            return `${lead} DN`;
        };

        // Map Singles Status
        if (result.singles1) {
            redPlayersData[0].singlesStatus = formatSinglesStatus(result.singles1, 'red');
            bluePlayersData[0].singlesStatus = formatSinglesStatus(result.singles1, 'blue');

            redPlayersData[0].singlesResult = result.singles1.result.winner === 'red' ? 'win' : (result.singles1.result.winner === 'blue' ? 'loss' : null);
            bluePlayersData[0].singlesResult = result.singles1.result.winner === 'blue' ? 'win' : (result.singles1.result.winner === 'red' ? 'loss' : null);

            // Populate singles hole winners
            result.singles1.holes.forEach(h => {
                redPlayersData[0].singlesHoles[h.holeNumber - 1] = h.winner;
                bluePlayersData[0].singlesHoles[h.holeNumber - 1] = h.winner;
            });
        }

        if (result.singles2) {
            redPlayersData[1].singlesStatus = formatSinglesStatus(result.singles2, 'red');
            bluePlayersData[1].singlesStatus = formatSinglesStatus(result.singles2, 'blue');

            redPlayersData[1].singlesResult = result.singles2.result.winner === 'red' ? 'win' : (result.singles2.result.winner === 'blue' ? 'loss' : null);
            bluePlayersData[1].singlesResult = result.singles2.result.winner === 'blue' ? 'win' : (result.singles2.result.winner === 'red' ? 'loss' : null);

            // Populate singles hole winners
            result.singles2.holes.forEach(h => {
                redPlayersData[1].singlesHoles[h.holeNumber - 1] = h.winner;
                bluePlayersData[1].singlesHoles[h.holeNumber - 1] = h.winner;
            });
        }

        const maxHoleHole = Math.max(0, ...holeScores.map(s => s.holeNumber));
        const maxHoleScramble = Math.max(0, ...scrambleScores.map(s => s.holeNumber));
        const maxHole = Math.max(maxHoleHole, maxHoleScramble);

        // Always capture fourball status if available
        if (result.fourball) {
            fourballStatus = result.fourball.result.finalStatus;
        }
        // Always capture scramble status if available
        if (result.scramble) {
            scrambleStatus = result.scramble.result.finalStatus;
        }

        // Always populate BOTH fourball and scramble progression data
        // (frontend shows both segments with a toggle)
        if (result.fourball) {
            result.fourball.holes.forEach(h => {
                matchProgression[h.holeNumber - 1] = formatMatchStatus(h.matchState);
                holeWinners[h.holeNumber - 1] = h.winner;
                matchLeaders[h.holeNumber - 1] = h.matchState.leader;
            });
        }
        if (result.scramble) {
            result.scramble.holes.forEach(h => {
                matchProgression[h.holeNumber + 9 - 1] = formatMatchStatus(h.matchState);
                holeWinners[h.holeNumber + 9 - 1] = h.winner;
                matchLeaders[h.holeNumber + 9 - 1] = h.matchState.leader;
            });
        }

        if (maxHole > 9) {
            segmentType = 'scramble';
            matchStatus = scrambleStatus;
        } else {
            segmentType = 'fourball';
            matchStatus = fourballStatus;
        }
    }

    return {
        flightId: flight.id,
        flightName: `Grupo ${flight.flight_number}`,
        segmentType,
        matchStatus,
        fourballStatus,
        scrambleStatus,
        matchProgression,
        holeWinners,
        matchLeaders,
        currentHole: Math.max(0, ...holeScores.map(s => s.holeNumber)) + 1,
        redPlayers: redPlayersData,
        bluePlayers: bluePlayersData,
        parValues,
        siValues
    };
};
