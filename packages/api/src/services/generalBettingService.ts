import { getPool } from '../config/database';
import {
    GeneralBet, GeneralBetType,
    createGeneralBet, getGeneralBetsForEvent, getUserGeneralBets,
    getGeneralBetsByType, checkExistingBet
} from '../repositories/generalBetRepository';
import { getLeaderboard, Match, LeaderboardData } from './leaderboardService';

interface PlaceGeneralBetInput {
    eventId: string;
    bettorId: string;
    betType: GeneralBetType;
    pickedOutcome: string;
    flightId?: string;
    segmentType?: string;
    comment?: string;
}

const VALID_OUTCOMES: Record<GeneralBetType, string[]> = {
    tournament_winner: ['red', 'blue'],
    flight_winner: ['red', 'blue', 'tie'],
    flight_sweep: ['red', 'blue'],
    biggest_blowout: [], // dynamic — any flight+segment id
    any_halve: ['yes', 'no'],
    early_close: ['yes', 'no'],
    mvp: [], // dynamic — any player id
    worst_player: [], // dynamic — any player id
};

/**
 * Determine timing factor based on tournament state.
 * Pre-tournament (no matches started) = 3x, early play = 2x, mid/late = 1x
 */
function getTimingFactor(leaderboard: LeaderboardData): number {
    const started = leaderboard.matches.filter(m => m.status !== 'not_started').length;
    const total = leaderboard.matches.length;
    if (started === 0) return 3;
    if (started / total < 0.25) return 2;
    return 1;
}

export const placeGeneralBet = async (input: PlaceGeneralBetInput): Promise<GeneralBet> => {
    const pool = getPool();
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // 1. Validate event has betting enabled
        const eventRes = await client.query('SELECT bet_amount FROM events WHERE id = $1', [input.eventId]);
        if (eventRes.rows.length === 0) throw new Error('Event not found');
        const betAmount = eventRes.rows[0].bet_amount ? parseFloat(eventRes.rows[0].bet_amount) : null;
        if (!betAmount || betAmount <= 0) throw new Error('Betting is not enabled for this event.');

        // 2. Validate bet type and outcome
        const dynamicBetTypes: GeneralBetType[] = ['biggest_blowout', 'mvp', 'worst_player'];
        const validOutcomes = VALID_OUTCOMES[input.betType];
        if (!dynamicBetTypes.includes(input.betType) && !validOutcomes.includes(input.pickedOutcome)) {
            throw new Error(`Invalid outcome '${input.pickedOutcome}' for bet type '${input.betType}'.`);
        }

        // 3. Validate flight-scoped bets have a flight_id
        if (['flight_winner', 'flight_sweep', 'early_close'].includes(input.betType) && !input.flightId) {
            throw new Error(`Bet type '${input.betType}' requires a flight_id.`);
        }

        // 4. Check for duplicate bet
        const existing = await checkExistingBet(
            input.eventId, input.bettorId, input.betType,
            input.flightId || null, input.segmentType || null
        );
        if (existing) throw new Error('You have already placed this type of bet.');

        // 5. Get leaderboard for timing factor and validation
        const leaderboard = await getLeaderboard(input.eventId);

        // 6. Tournament winner can't be bet on if already decided
        if (input.betType === 'tournament_winner') {
            const { red, blue } = leaderboard.totalScore;
            const totalPossible = leaderboard.matches.length; // rough upper bound
            const winThreshold = totalPossible / 2 + 0.5;
            if (red >= winThreshold || blue >= winThreshold) {
                throw new Error('Tournament winner already decided.');
            }
        }

        const timingFactor = getTimingFactor(leaderboard);
        const partes = timingFactor; // No risk factor for general bets — just timing

        // 7. Insert via raw query to use transaction client
        const res = await client.query(
            `INSERT INTO general_bets (
                event_id, bettor_id, bet_type, flight_id, segment_type,
                picked_outcome, timing_factor, partes, amount, comment
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING *`,
            [
                input.eventId, input.bettorId, input.betType,
                input.flightId || null, input.segmentType || null,
                input.pickedOutcome, timingFactor, partes, betAmount,
                input.comment || null
            ]
        );

        await client.query('COMMIT');

        const row = res.rows[0];
        return {
            id: row.id,
            eventId: row.event_id,
            bettorId: row.bettor_id,
            betType: row.bet_type,
            flightId: row.flight_id,
            segmentType: row.segment_type,
            pickedOutcome: row.picked_outcome,
            timingFactor: row.timing_factor,
            partes: row.partes,
            amount: parseFloat(row.amount),
            comment: row.comment,
            createdAt: row.created_at
        };
    } catch (e) {
        await client.query('ROLLBACK');
        throw e;
    } finally {
        client.release();
    }
};

// ──────────────────────────────────────────────────
// Resolution helpers
// ──────────────────────────────────────────────────

interface ResolvedOutcome {
    betType: GeneralBetType;
    flightId: string | null;
    segmentType: string | null;
    winningOutcome: string | null; // null = not yet resolved
    isResolved: boolean;
}

function resolveFromLeaderboard(leaderboard: LeaderboardData): ResolvedOutcome[] {
    const outcomes: ResolvedOutcome[] = [];
    const allCompleted = leaderboard.matches.every(m => m.status === 'completed');

    // ── Tournament Winner ──
    const { red, blue } = leaderboard.totalScore;
    const totalMatches = leaderboard.matches.length;
    const winThreshold = totalMatches / 2 + 0.5;
    let tournamentWinner: string | null = null;
    if (red >= winThreshold) tournamentWinner = 'red';
    else if (blue >= winThreshold) tournamentWinner = 'blue';
    else if (allCompleted && red === blue) tournamentWinner = 'tie';
    else if (allCompleted) tournamentWinner = red > blue ? 'red' : 'blue';

    outcomes.push({
        betType: 'tournament_winner',
        flightId: null, segmentType: null,
        winningOutcome: tournamentWinner,
        isResolved: tournamentWinner !== null
    });

    // ── Any Halve ──
    const anyHalve = leaderboard.matches.some(m => m.status === 'completed' && m.matchStatus === 'Halved');
    outcomes.push({
        betType: 'any_halve',
        flightId: null, segmentType: null,
        winningOutcome: allCompleted ? (anyHalve ? 'yes' : 'no') : (anyHalve ? 'yes' : null),
        isResolved: allCompleted || anyHalve // "yes" can resolve early
    });

    // ── Per-flight bets ──
    const flightIds = [...new Set(leaderboard.matches.map(m => m.flightId))];
    for (const flightId of flightIds) {
        const flightMatches = leaderboard.matches.filter(m => m.flightId === flightId);
        const flightCompleted = flightMatches.every(m => m.status === 'completed');

        // Flight Winner: count points per team
        let flightRed = 0;
        let flightBlue = 0;
        flightMatches.forEach(m => {
            if (m.status === 'completed') {
                if (m.matchWinner === 'red') {
                    flightRed += m.segmentType === 'scramble' ? 2 : 1;
                } else if (m.matchWinner === 'blue') {
                    flightBlue += m.segmentType === 'scramble' ? 2 : 1;
                } else {
                    // halved — 0.5 each
                    flightRed += m.segmentType === 'scramble' ? 1 : 0.5;
                    flightBlue += m.segmentType === 'scramble' ? 1 : 0.5;
                }
            }
        });

        let flightWinner: string | null = null;
        if (flightCompleted) {
            if (flightRed > flightBlue) flightWinner = 'red';
            else if (flightBlue > flightRed) flightWinner = 'blue';
            else flightWinner = 'tie';
        }

        outcomes.push({
            betType: 'flight_winner',
            flightId, segmentType: null,
            winningOutcome: flightWinner,
            isResolved: flightCompleted
        });

        // Flight Sweep: one team wins all 4 segments
        const completedFlightMatches = flightMatches.filter(m => m.status === 'completed');
        const allRedWins = completedFlightMatches.length === 4 && completedFlightMatches.every(m => m.matchWinner === 'red');
        const allBlueWins = completedFlightMatches.length === 4 && completedFlightMatches.every(m => m.matchWinner === 'blue');

        let sweepOutcome: string | null = null;
        if (flightCompleted) {
            if (allRedWins) sweepOutcome = 'red';
            else if (allBlueWins) sweepOutcome = 'blue';
            else sweepOutcome = '__none__'; // no sweep happened
        }

        outcomes.push({
            betType: 'flight_sweep',
            flightId, segmentType: null,
            winningOutcome: sweepOutcome,
            isResolved: flightCompleted
        });

        // Early Close: any match in flight decided by 3&2 or bigger (margin >= 3)
        const hasEarlyClose = flightMatches.some(m =>
            m.status === 'completed' && parseMargin(m.matchStatus) >= 4
        );
        outcomes.push({
            betType: 'early_close',
            flightId, segmentType: null,
            winningOutcome: flightCompleted ? (hasEarlyClose ? 'yes' : 'no') : (hasEarlyClose ? 'yes' : null),
            isResolved: flightCompleted || hasEarlyClose // "yes" resolves early
        });
    }

    // ── Biggest Blowout ──
    if (allCompleted) {
        let biggestMargin = 0;
        let biggestMatch: Match | null = null;

        leaderboard.matches.forEach(m => {
            if (m.status !== 'completed') return;
            const margin = parseMargin(m.matchStatus);
            if (margin > biggestMargin) {
                biggestMargin = margin;
                biggestMatch = m;
            }
        });

        outcomes.push({
            betType: 'biggest_blowout',
            flightId: null, segmentType: null,
            winningOutcome: biggestMatch ? `${(biggestMatch as Match).flightId}_${(biggestMatch as Match).segmentType}` : null,
            isResolved: true
        });
    } else {
        outcomes.push({
            betType: 'biggest_blowout',
            flightId: null, segmentType: null,
            winningOutcome: null,
            isResolved: false
        });
    }

    // ── MVP & Worst Player ──
    // Score each player by their singles match result: Win=2, Halve=1, Loss=0
    if (allCompleted) {
        const playerScores: Record<string, { id: string; name: string; score: number }> = {};

        leaderboard.matches.forEach(m => {
            if (m.segmentType !== 'singles1' && m.segmentType !== 'singles2') return;
            const winner = m.matchWinner;

            const allPlayers = [...m.redPlayers, ...m.bluePlayers];
            allPlayers.forEach(p => {
                if (!playerScores[p.playerId]) playerScores[p.playerId] = { id: p.playerId, name: p.playerName, score: 0 };
                const team = m.redPlayers.some(rp => rp.playerId === p.playerId) ? 'red' : 'blue';
                if (!winner || m.matchStatus === 'Halved') {
                    playerScores[p.playerId].score += 1; // halve
                } else if (winner === team) {
                    playerScores[p.playerId].score += 2; // win
                }
                // loss = 0
            });
        });

        const sorted = Object.values(playerScores).sort((a, b) => b.score - a.score);
        const mvpId = sorted.length > 0 ? sorted[0].id : null;
        const worstId = sorted.length > 0 ? sorted[sorted.length - 1].id : null;

        outcomes.push({
            betType: 'mvp', flightId: null, segmentType: null,
            winningOutcome: mvpId, isResolved: true
        });
        outcomes.push({
            betType: 'worst_player', flightId: null, segmentType: null,
            winningOutcome: worstId, isResolved: true
        });
    } else {
        outcomes.push({ betType: 'mvp', flightId: null, segmentType: null, winningOutcome: null, isResolved: false });
        outcomes.push({ betType: 'worst_player', flightId: null, segmentType: null, winningOutcome: null, isResolved: false });
    }

    return outcomes;
}

/** Parse a match status string into a numeric margin for comparison.
 *  "6 & 5" => 6, "3 & 2" => 3, "2 UP" => assumes went to last hole so margin ~1, "Halved" => 0
 */
function parseMargin(status: string): number {
    // "X & Y" format — X is the winning margin (holes up with Y to play)
    const closedMatch = status.match(/^(\d+) & (\d+)$/);
    if (closedMatch) return parseInt(closedMatch[1]);

    // "X UP" at end of match — means won by X on the last hole
    const upMatch = status.match(/^(\d+) UP$/);
    if (upMatch) return parseInt(upMatch[1]);

    // "Won X UP" / "Won"
    const wonMatch = status.match(/Won (\d+)/);
    if (wonMatch) return parseInt(wonMatch[1]);

    return 0; // Halved or unrecognized
}

// ──────────────────────────────────────────────────
// Pool & settlement for general bets
// ──────────────────────────────────────────────────

export interface GeneralBetPool {
    betType: GeneralBetType;
    flightId: string | null;
    flightName: string | null;
    segmentType: string | null;
    pot: number;
    betsCount: number;
    outcomePartes: Record<string, number>;
    isResolved: boolean;
    winningOutcome: string | null;
    redPlayerNames: string[];
    bluePlayerNames: string[];
}

export const getGeneralBetPools = async (eventId: string): Promise<GeneralBetPool[]> => {
    const allBets = await getGeneralBetsForEvent(eventId);
    const leaderboard = await getLeaderboard(eventId);
    const resolutions = resolveFromLeaderboard(leaderboard);

    // Group bets by (betType, flightId, segmentType)
    const poolMap: Record<string, GeneralBet[]> = {};
    allBets.forEach(b => {
        const key = `${b.betType}|${b.flightId || ''}|${b.segmentType || ''}`;
        if (!poolMap[key]) poolMap[key] = [];
        poolMap[key].push(b);
    });

    // Build flight name map and player names map
    const flightNameMap: Record<string, string> = {};
    const flightRedPlayers: Record<string, Set<string>> = {};
    const flightBluePlayers: Record<string, Set<string>> = {};
    leaderboard.matches.forEach(m => {
        flightNameMap[m.flightId] = m.flightName;
        if (!flightRedPlayers[m.flightId]) flightRedPlayers[m.flightId] = new Set();
        if (!flightBluePlayers[m.flightId]) flightBluePlayers[m.flightId] = new Set();
        m.redPlayers.forEach(p => flightRedPlayers[m.flightId].add(p.playerName));
        m.bluePlayers.forEach(p => flightBluePlayers[m.flightId].add(p.playerName));
    });

    const pools: GeneralBetPool[] = [];

    // Create pools for all defined bet types (even if no bets yet)
    const betTypes: GeneralBetType[] = ['tournament_winner'];
    const flightIds = [...new Set(leaderboard.matches.map(m => m.flightId))];

    // Tournament-level pools
    for (const bt of betTypes) {
        const key = `${bt}||`;
        const bets = poolMap[key] || [];
        const resolution = resolutions.find(r => r.betType === bt && !r.flightId);

        const outcomePartes: Record<string, number> = {};
        bets.forEach(b => {
            outcomePartes[b.pickedOutcome] = (outcomePartes[b.pickedOutcome] || 0) + b.partes;
        });

        pools.push({
            betType: bt,
            flightId: null, flightName: null, segmentType: null,
            pot: bets.reduce((s, b) => s + b.amount, 0),
            betsCount: bets.length,
            outcomePartes,
            isResolved: resolution?.isResolved || false,
            winningOutcome: resolution?.winningOutcome || null,
            redPlayerNames: [],
            bluePlayerNames: []
        });
    }

    // Flight-level pools
    for (const flightId of flightIds) {
        for (const bt of ['flight_winner', 'flight_sweep', 'early_close'] as GeneralBetType[]) {
            const key = `${bt}|${flightId}|`;
            const bets = poolMap[key] || [];
            const resolution = resolutions.find(r => r.betType === bt && r.flightId === flightId);

            const outcomePartes: Record<string, number> = {};
            bets.forEach(b => {
                outcomePartes[b.pickedOutcome] = (outcomePartes[b.pickedOutcome] || 0) + b.partes;
            });

            pools.push({
                betType: bt,
                flightId, flightName: flightNameMap[flightId] || flightId,
                segmentType: null,
                pot: bets.reduce((s, b) => s + b.amount, 0),
                betsCount: bets.length,
                outcomePartes,
                isResolved: resolution?.isResolved || false,
                winningOutcome: resolution?.winningOutcome || null,
                redPlayerNames: [...(flightRedPlayers[flightId] || [])],
                bluePlayerNames: [...(flightBluePlayers[flightId] || [])]
            });
        }
    }

    // MVP & Worst Player pools (tournament-level, player-based)
    for (const bt of ['mvp', 'worst_player'] as GeneralBetType[]) {
        const key = `${bt}||`;
        const bets = poolMap[key] || [];
        const resolution = resolutions.find(r => r.betType === bt && !r.flightId);

        const outcomePartes: Record<string, number> = {};
        bets.forEach(b => {
            outcomePartes[b.pickedOutcome] = (outcomePartes[b.pickedOutcome] || 0) + b.partes;
        });

        // Collect all player names from leaderboard for display
        const allPlayerNames: string[] = [];
        leaderboard.matches.forEach(m => {
            m.redPlayers.forEach(p => allPlayerNames.push(p.playerName));
            m.bluePlayers.forEach(p => allPlayerNames.push(p.playerName));
        });

        pools.push({
            betType: bt,
            flightId: null, flightName: null, segmentType: null,
            pot: bets.reduce((s, b) => s + b.amount, 0),
            betsCount: bets.length,
            outcomePartes,
            isResolved: resolution?.isResolved || false,
            winningOutcome: resolution?.winningOutcome || null,
            redPlayerNames: [...new Set(leaderboard.matches.flatMap(m => m.redPlayers.map(p => `${p.playerId}:${p.playerName}`)))],
            bluePlayerNames: [...new Set(leaderboard.matches.flatMap(m => m.bluePlayers.map(p => `${p.playerId}:${p.playerName}`)))]
        });
    }

    // Biggest blowout pool (tournament-level)
    {
        const key = `biggest_blowout||`;
        const bets = poolMap[key] || [];
        const resolution = resolutions.find(r => r.betType === 'biggest_blowout');

        const outcomePartes: Record<string, number> = {};
        bets.forEach(b => {
            outcomePartes[b.pickedOutcome] = (outcomePartes[b.pickedOutcome] || 0) + b.partes;
        });

        pools.push({
            betType: 'biggest_blowout',
            flightId: null, flightName: null, segmentType: null,
            pot: bets.reduce((s, b) => s + b.amount, 0),
            betsCount: bets.length,
            outcomePartes,
            isResolved: resolution?.isResolved || false,
            winningOutcome: resolution?.winningOutcome || null,
            redPlayerNames: [],
            bluePlayerNames: []
        });
    }

    return pools;
};

export const getGeneralBetSettlement = async (eventId: string) => {
    const allBets = await getGeneralBetsForEvent(eventId);
    const leaderboard = await getLeaderboard(eventId);
    const resolutions = resolveFromLeaderboard(leaderboard);

    let isPartial = false;
    const balances: Record<string, number> = {};
    const openWagered: Record<string, number> = {};
    const closedWagered: Record<string, number> = {};
    const closedRecovered: Record<string, number> = {};
    const openPotential: Record<string, number> = {};

    // Group bets by pool key for pari-mutuel calculation
    const poolMap: Record<string, GeneralBet[]> = {};
    allBets.forEach(b => {
        const key = `${b.betType}|${b.flightId || ''}|${b.segmentType || ''}`;
        if (!poolMap[key]) poolMap[key] = [];
        poolMap[key].push(b);
    });

    for (const [key, bets] of Object.entries(poolMap)) {
        const [betType, flightId] = key.split('|');
        const resolution = resolutions.find(r =>
            r.betType === betType &&
            (r.flightId || '') === flightId
        );

        const potSize = bets.reduce((s, b) => s + b.amount, 0);

        // Group partes by outcome
        const partesByOutcome: Record<string, number> = {};
        bets.forEach(b => {
            partesByOutcome[b.pickedOutcome] = (partesByOutcome[b.pickedOutcome] || 0) + b.partes;
        });

        if (!resolution?.isResolved) {
            isPartial = true;
        }

        bets.forEach(bet => {
            if (!balances[bet.bettorId]) balances[bet.bettorId] = 0;
            if (!openWagered[bet.bettorId]) openWagered[bet.bettorId] = 0;
            if (!closedWagered[bet.bettorId]) closedWagered[bet.bettorId] = 0;
            if (!closedRecovered[bet.bettorId]) closedRecovered[bet.bettorId] = 0;
            if (!openPotential[bet.bettorId]) openPotential[bet.bettorId] = 0;

            if (resolution?.isResolved) {
                closedWagered[bet.bettorId] += bet.amount;
                balances[bet.bettorId] -= bet.amount;

                const winOutcome = resolution.winningOutcome;
                let payout = 0;

                if (winOutcome === '__none__') {
                    // No sweep happened — refund sweep bets
                    payout = bet.amount;
                } else if (bet.pickedOutcome === winOutcome) {
                    const totalWinningPartes = partesByOutcome[winOutcome] || 0;
                    if (totalWinningPartes > 0) {
                        payout = (bet.partes / totalWinningPartes) * potSize;
                    }
                }

                if (payout > 0) {
                    balances[bet.bettorId] += payout;
                    closedRecovered[bet.bettorId] += payout;
                }
            } else {
                openWagered[bet.bettorId] += bet.amount;
                const totalPartes = partesByOutcome[bet.pickedOutcome] || 0;
                if (totalPartes > 0) {
                    openPotential[bet.bettorId] += (bet.partes / totalPartes) * potSize;
                }
            }
        });
    }

    return { isPartial, balances, openWagered, closedWagered, closedRecovered, openPotential };
};

export const getPersonalGeneralStats = async (eventId: string, bettorId: string) => {
    const bets = await getUserGeneralBets(eventId, bettorId);
    const settlement = await getGeneralBetSettlement(eventId);

    const wagered = (settlement.openWagered[bettorId] || 0) + (settlement.closedWagered[bettorId] || 0);
    const realizedNet = (settlement.closedRecovered[bettorId] || 0) - (settlement.closedWagered[bettorId] || 0);
    const potential = settlement.openPotential[bettorId] || 0;

    return { wagered, realizedNet, potential, bets };
};
