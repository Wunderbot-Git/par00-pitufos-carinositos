import { getPool } from '../config/database';
import { createBet, getBetsForFlight, getBetsForEvent, getUserBetsForEvent, Bet } from '../repositories/betRepository';
import { getFlightScoreboardData } from './scoreService';
import { getGeneralBetSettlement } from './generalBettingService';
import { getUserGeneralBets } from '../repositories/generalBetRepository';

interface PlaceBetInput {
    eventId: string;
    flightId: string;
    segmentType: 'singles1' | 'singles2' | 'fourball' | 'scramble';
    bettorId: string;
    pickedOutcome: 'A' | 'B' | 'AS';
    comment?: string;
}

export const placeBet = async (input: PlaceBetInput): Promise<Bet> => {
    const pool = getPool();
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // 1. Get Tournament/Event Bet Amount
        const eventRes = await client.query('SELECT bet_amount FROM events WHERE id = $1', [input.eventId]);
        if (eventRes.rows.length === 0) throw new Error('Event not found');
        const betAmount = eventRes.rows[0].bet_amount ? parseFloat(eventRes.rows[0].bet_amount) : null;

        if (betAmount === null || betAmount <= 0) {
            throw new Error('Betting is not enabled for this event.');
        }

        // 2. Check for duplicate bet using FOR UPDATE to prevent race conditions on the same flight/segment/bettor
        const existingBetRes = await client.query(
            'SELECT id FROM bets WHERE flight_id = $1 AND segment_type = $2 AND bettor_id = $3 FOR UPDATE',
            [input.flightId, input.segmentType, input.bettorId]
        );
        if (existingBetRes.rows.length > 0) {
            throw new Error('You have already placed a bet on this match.');
        }

        // 3. Get Match State
        const board = await getFlightScoreboardData(input.flightId);

        let currentHole = 0;
        let currentLeader: 'A' | 'B' | 'AS' = 'AS';
        let currentUp = 0;

        if (input.segmentType === 'scramble') {
            const scrambleScores = board.redPlayers[0].scores.slice(9, 18);
            currentHole = scrambleScores.filter(s => s !== null).length;
        } else {
            const scores = board.redPlayers[0].scores.slice(0, 9);
            currentHole = scores.filter(s => s !== null).length;
        }

        if (input.segmentType === 'fourball') {
            const statusStr = board.fourballStatus || 'AS';
            if (statusStr.includes('UP')) currentLeader = 'A';
            else if (statusStr.includes('DN')) currentLeader = 'B';
            else currentLeader = 'AS';
            const match = statusStr.match(/(\d+)/);
            if (match) currentUp = parseInt(match[1]);
        } else if (input.segmentType === 'scramble') {
            const statusStr = board.scrambleStatus || 'AS';
            if (statusStr.includes('UP')) currentLeader = 'A';
            else if (statusStr.includes('DN')) currentLeader = 'B';
            else currentLeader = 'AS';
            const match = statusStr.match(/(\d+)/);
            if (match) currentUp = parseInt(match[1]);
        } else if (input.segmentType === 'singles1') {
            const statusStr = board.redPlayers[0].singlesStatus || 'AS';
            if (statusStr.includes('UP')) currentLeader = 'A';
            else if (statusStr.includes('DN')) currentLeader = 'B';
            const match = statusStr.match(/(\d+)/);
            if (match) currentUp = parseInt(match[1]);
        } else if (input.segmentType === 'singles2') {
            const statusStr = board.redPlayers[1].singlesStatus || 'AS';
            if (statusStr.includes('UP')) currentLeader = 'A';
            else if (statusStr.includes('DN')) currentLeader = 'B';
            const match = statusStr.match(/(\d+)/);
            if (match) currentUp = parseInt(match[1]);
        }

        // 4. Betting Window Logic
        if (currentHole > 8) {
            throw new Error('Betting window closed: Match almost finished.');
        }

        if (currentLeader !== 'AS') {
            if (currentUp >= 3) {
                throw new Error('Betting window closed: Lead is 3 UP or more.');
            } else if (currentUp === 2 && currentHole > 5) {
                throw new Error('Betting window closed: 2 UP after Hole 5.');
            } else if (currentUp === 1 && currentHole > 7) {
                throw new Error('Betting window closed: 1 UP after Hole 7.');
            }
        }

        // 5. Leader Restriction Rule
        if (currentHole > 0) {
            if (input.pickedOutcome === currentLeader) {
                throw new Error('You cannot bet on the leader while the match is in progress.');
            }
        }

        // 6. Calculate Factors
        let timingFactor = 1;
        if (currentHole === 0) timingFactor = 3;
        else if (currentHole <= 3) timingFactor = 2;
        else timingFactor = 1;

        let riskFactor = 1;
        if (currentHole > 0 && currentLeader !== 'AS') {
            if (input.pickedOutcome !== 'AS' && input.pickedOutcome !== currentLeader) {
                if (currentUp === 1) riskFactor = 2;
                else if (currentUp === 2) riskFactor = 3;
            }
        }

        const partes = timingFactor * riskFactor;

        // 7. Insert Bet manually to use the transaction client
        const res = await client.query(
            `INSERT INTO bets (
                event_id, flight_id, segment_type, bettor_id, picked_outcome, 
                timing_factor, risk_factor, partes, amount, 
                score_at_bet, hole_at_bet, comment
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
            [
                input.eventId, input.flightId, input.segmentType, input.bettorId, input.pickedOutcome,
                timingFactor, riskFactor, partes, betAmount,
                currentLeader === 'AS' ? 0 : currentUp,
                currentHole === 0 ? null : currentHole,
                input.comment || null
            ]
        );

        await client.query('COMMIT');

        return {
            id: res.rows[0].id,
            eventId: res.rows[0].event_id,
            flightId: res.rows[0].flight_id,
            segmentType: res.rows[0].segment_type,
            bettorId: res.rows[0].bettor_id,
            pickedOutcome: res.rows[0].picked_outcome,
            timingFactor: res.rows[0].timing_factor,
            riskFactor: res.rows[0].risk_factor,
            partes: res.rows[0].partes,
            amount: parseFloat(res.rows[0].amount),
            scoreAtBet: res.rows[0].score_at_bet,
            holeAtBet: res.rows[0].hole_at_bet,
            comment: res.rows[0].comment,
            createdAt: res.rows[0].created_at
        } as Bet;

    } catch (e) {
        await client.query('ROLLBACK');
        throw e;
    } finally {
        client.release();
    }
};

export const getMatchBets = async (flightId: string, segmentType: string): Promise<any> => {
    const bets = await getBetsForFlight(flightId);
    const segmentBets = bets.filter(b => b.segmentType === segmentType);

    const potSize = segmentBets.reduce((sum, b) => sum + b.amount, 0);

    // Group partes by outcome
    const totalPartesA = segmentBets.filter(b => b.pickedOutcome === 'A').reduce((sum, b) => sum + b.partes, 0);
    const totalPartesB = segmentBets.filter(b => b.pickedOutcome === 'B').reduce((sum, b) => sum + b.partes, 0);
    const totalPartesAS = segmentBets.filter(b => b.pickedOutcome === 'AS').reduce((sum, b) => sum + b.partes, 0);

    const enrichBet = (bet: Bet) => {
        let potentialPayout = 0;
        if (bet.pickedOutcome === 'A' && totalPartesA > 0) {
            potentialPayout = (bet.partes / totalPartesA) * potSize;
        } else if (bet.pickedOutcome === 'B' && totalPartesB > 0) {
            potentialPayout = (bet.partes / totalPartesB) * potSize;
        } else if (bet.pickedOutcome === 'AS' && totalPartesAS > 0) {
            potentialPayout = (bet.partes / totalPartesAS) * potSize;
        }

        return {
            ...bet,
            potentialPayout
        };
    };

    return {
        bets: segmentBets.map(enrichBet),
        pot: potSize,
        partes: {
            A: totalPartesA,
            B: totalPartesB,
            AS: totalPartesAS
        }
    };
};

export interface Transfer {
    from: string;
    to: string;
    amount: number;
}

export const getTournamentSettlements = async (eventId: string) => {
    const pool = getPool();
    const bets = await getBetsForEvent(eventId);

    // Group bets by flight and segment
    const betsByMatch: Record<string, Bet[]> = {};
    bets.forEach(b => {
        const key = `${b.flightId}_${b.segmentType}`;
        if (!betsByMatch[key]) betsByMatch[key] = [];
        betsByMatch[key].push(b);
    });

    const flightIds = Array.from(new Set(bets.map(b => b.flightId)));

    let isPartial = false;
    const playerBalances: Record<string, number> = {};
    const playerOpenWagered: Record<string, number> = {};
    const playerClosedWagered: Record<string, number> = {};
    const playerClosedRecovered: Record<string, number> = {};
    const playerOpenPotential: Record<string, number> = {};
    const playerBets: Record<string, any[]> = {};

    for (const flightId of flightIds) {
        const board = await getFlightScoreboardData(flightId);

        // Helper to evaluate segment result
        const evalSegment = (segType: string, leader: string | null, statusStr: string) => {
            const key = `${flightId}_${segType}`;
            const matchBets = betsByMatch[key] || [];
            if (matchBets.length === 0) return;

            // A more robust check for closed:
            const currentHoleCount = (segType === 'scramble')
                ? board.redPlayers[0].scores.slice(9, 18).filter((s: number | null) => s !== null).length
                : board.redPlayers[0].scores.slice(0, 9).filter((s: number | null) => s !== null).length;

            const isFinished = statusStr === 'Halved' || /^\d+ & \d+$/.test(statusStr) || statusStr.includes('Won') || statusStr.includes('Lost') || currentHoleCount >= 9;

            if (!isFinished) isPartial = true;

            const potSize = matchBets.reduce((sum, b) => sum + b.amount, 0);

            // Calculate total partes per outcome
            const partesA = matchBets.filter(b => b.pickedOutcome === 'A').reduce((sum, b) => sum + b.partes, 0);
            const partesB = matchBets.filter(b => b.pickedOutcome === 'B').reduce((sum, b) => sum + b.partes, 0);
            const partesAS = matchBets.filter(b => b.pickedOutcome === 'AS').reduce((sum, b) => sum + b.partes, 0);

            // Determine winner
            let winningOutcome: 'A' | 'B' | 'AS' = 'AS';
            if (isFinished) {
                if (leader === 'red') winningOutcome = 'A';
                else if (leader === 'blue') winningOutcome = 'B';
                else winningOutcome = 'AS';
            }

            matchBets.forEach(bet => {
                if (!playerBalances[bet.bettorId]) playerBalances[bet.bettorId] = 0;
                if (!playerOpenWagered[bet.bettorId]) playerOpenWagered[bet.bettorId] = 0;
                if (!playerClosedWagered[bet.bettorId]) playerClosedWagered[bet.bettorId] = 0;
                if (!playerClosedRecovered[bet.bettorId]) playerClosedRecovered[bet.bettorId] = 0;
                if (!playerOpenPotential[bet.bettorId]) playerOpenPotential[bet.bettorId] = 0;
                if (!playerBets[bet.bettorId]) playerBets[bet.bettorId] = [];

                let enrichedBet = { ...bet, status: isFinished ? 'closed' : 'open', potentialPayout: 0, realizedPayout: 0 };

                if (isFinished) {
                    playerClosedWagered[bet.bettorId] += bet.amount;
                    playerBalances[bet.bettorId] -= bet.amount; // wager paid

                    let payout = 0;
                    if (winningOutcome === 'AS' && partesAS === 0) {
                        // Refund logic
                        payout = bet.amount;
                    } else if (bet.pickedOutcome === winningOutcome) {
                        const totalWinningPartes = winningOutcome === 'A' ? partesA : (winningOutcome === 'B' ? partesB : partesAS);
                        if (totalWinningPartes > 0) {
                            payout = (bet.partes / totalWinningPartes) * potSize;
                        }
                    }
                    if (payout > 0) {
                        playerBalances[bet.bettorId] += payout;
                        playerClosedRecovered[bet.bettorId] += payout;
                    }
                    enrichedBet.realizedPayout = payout;
                    enrichedBet.potentialPayout = payout; // For consistency in UI
                } else {
                    playerOpenWagered[bet.bettorId] += bet.amount;

                    // Calc potential
                    const totalPartes = bet.pickedOutcome === 'A' ? partesA : (bet.pickedOutcome === 'B' ? partesB : partesAS);
                    if (totalPartes > 0) {
                        const pot = (bet.partes / totalPartes) * potSize;
                        playerOpenPotential[bet.bettorId] += pot;
                        enrichedBet.potentialPayout = pot;
                    }
                }

                playerBets[bet.bettorId].push(enrichedBet);
            });
        };

        // Evaluate Fourball using explicit fourballStatus
        const fbStatus = board.fourballStatus || 'AS';
        const fbLeader = fbStatus.includes('UP') ? 'red' : (fbStatus.includes('DN') ? 'blue' : null);
        evalSegment('fourball', fbLeader, fbStatus);

        // Evaluate Singles1
        const s1Leader = board.redPlayers[0].singlesResult === 'win' ? 'red' : (board.bluePlayers[0].singlesResult === 'win' ? 'blue' : null);
        evalSegment('singles1', s1Leader, board.redPlayers[0].singlesStatus || 'AS');

        // Evaluate Singles2
        const s2Leader = board.redPlayers[1].singlesResult === 'win' ? 'red' : (board.bluePlayers[1].singlesResult === 'win' ? 'blue' : null);
        evalSegment('singles2', s2Leader, board.redPlayers[1].singlesStatus || 'AS');

        // Evaluate Scramble using explicit scrambleStatus
        const scStatus = board.scrambleStatus || 'AS';
        const scLeader = scStatus.includes('UP') ? 'red' : (scStatus.includes('DN') ? 'blue' : null);
        evalSegment('scramble', scLeader, scStatus);
    }

    // Merge general bet settlements
    const generalSettlement = await getGeneralBetSettlement(eventId);
    if (generalSettlement.isPartial) isPartial = true;

    for (const [id, bal] of Object.entries(generalSettlement.balances)) {
        playerBalances[id] = (playerBalances[id] || 0) + bal;
    }
    for (const [id, val] of Object.entries(generalSettlement.openWagered)) {
        playerOpenWagered[id] = (playerOpenWagered[id] || 0) + val;
    }
    for (const [id, val] of Object.entries(generalSettlement.closedWagered)) {
        playerClosedWagered[id] = (playerClosedWagered[id] || 0) + val;
    }
    for (const [id, val] of Object.entries(generalSettlement.closedRecovered)) {
        playerClosedRecovered[id] = (playerClosedRecovered[id] || 0) + val;
    }
    for (const [id, val] of Object.entries(generalSettlement.openPotential)) {
        playerOpenPotential[id] = (playerOpenPotential[id] || 0) + val;
    }

    // Min-Transfer algorithm

    // We need bettor names
    const bettors = Object.keys(playerBalances);
    const usersRes = await pool.query('SELECT id, name FROM users WHERE id = ANY($1)', [bettors.length > 0 ? bettors : [null]]);
    const nameMap: Record<string, string> = {};
    usersRes.rows.forEach(r => nameMap[r.id] = r.name || 'Unknown');

    const debtors = bettors.filter(id => playerBalances[id] < -0.01).map(id => ({ id, name: nameMap[id], balance: playerBalances[id] })).sort((a, b) => a.balance - b.balance);
    const creditors = bettors.filter(id => playerBalances[id] > 0.01).map(id => ({ id, name: nameMap[id], balance: playerBalances[id] })).sort((a, b) => b.balance - a.balance);

    const transfers: Transfer[] = [];
    let dIdx = 0;
    let cIdx = 0;

    while (dIdx < debtors.length && cIdx < creditors.length) {
        const debt = -debtors[dIdx].balance;
        const credit = creditors[cIdx].balance;
        const amount = Math.min(debt, credit);

        transfers.push({
            from: debtors[dIdx].id,
            to: creditors[cIdx].id,
            amount
        });

        debtors[dIdx].balance += amount;
        creditors[cIdx].balance -= amount;

        if (Math.abs(debtors[dIdx].balance) < 0.01) dIdx++;
        if (Math.abs(creditors[cIdx].balance) < 0.01) cIdx++;
    }

    return {
        isPartial,
        balances: bettors.map(id => ({
            id,
            name: nameMap[id],
            balance: playerBalances[id]
        })).sort((a, b) => b.balance - a.balance),
        transfers,
        personalStats: {
            playerOpenWagered,
            playerClosedWagered,
            playerClosedRecovered,
            playerOpenPotential,
            playerBets
        }
    };
};

export const getPersonalStats = async (eventId: string, bettorId: string): Promise<any> => {
    // Rely on the full tournament settlement to extract personal stats, ensuring logic reuse and perfect sync
    const [settlement, generalBets] = await Promise.all([
        getTournamentSettlements(eventId),
        getUserGeneralBets(eventId, bettorId)
    ]);

    const openWagered = settlement.personalStats.playerOpenWagered[bettorId] || 0;
    const closedWagered = settlement.personalStats.playerClosedWagered[bettorId] || 0;
    const closedRecovered = settlement.personalStats.playerClosedRecovered[bettorId] || 0;
    const potential = settlement.personalStats.playerOpenPotential[bettorId] || 0;
    const userBets = settlement.personalStats.playerBets[bettorId] || [];

    const wagered = openWagered + closedWagered;
    const realizedNet = closedRecovered - closedWagered;

    return {
        wagered,
        realizedNet,
        potential,
        closedWagered,
        closedRecovered,
        bets: userBets,
        generalBetsCount: generalBets.length
    };
};
