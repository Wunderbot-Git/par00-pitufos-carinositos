// Scramble Score Repository - CRUD for team scramble scores (back 9)

import { getPool } from '../config/database';

export interface ScrambleScore {
    id: string;
    eventId: string;
    flightId: string;
    team: 'red' | 'blue';
    holeNumber: number; // 10-18
    grossScore: number;
    mutationId: string;
    version: number;
    source: 'online' | 'offline';
    enteredByUserId: string;
    clientTimestamp: Date;
    serverTimestamp: Date;
}

export interface CreateScrambleScoreInput {
    eventId: string;
    flightId: string;
    team: 'red' | 'blue';
    holeNumber: number; // Must be 10-18
    grossScore: number;
    mutationId: string;
    enteredByUserId: string;
    source?: 'online' | 'offline';
    clientTimestamp?: Date;
}

const mapRowToScrambleScore = (row: any): ScrambleScore => ({
    id: row.id,
    eventId: row.event_id,
    flightId: row.flight_id,
    team: row.team,
    holeNumber: row.hole_number,
    grossScore: row.gross_score,
    mutationId: row.mutation_id,
    version: row.version,
    source: row.source,
    enteredByUserId: row.entered_by_user_id,
    clientTimestamp: row.client_timestamp,
    serverTimestamp: row.server_timestamp
});

/**
 * Upsert a scramble score with idempotency.
 */
export const upsertScrambleScore = async (input: CreateScrambleScoreInput): Promise<{ score: ScrambleScore; wasCreated: boolean; previousValue?: number }> => {
    if (input.holeNumber < 10 || input.holeNumber > 18) {
        throw new Error('Scramble scores must be for holes 10-18');
    }

    const pool = getPool();
    const source = input.source || 'online';
    const clientTimestamp = input.clientTimestamp || new Date();

    // Check idempotency by mutation_id
    const existingByMutation = await pool.query(
        `SELECT * FROM scramble_team_scores WHERE mutation_id = $1`,
        [input.mutationId]
    );

    if (existingByMutation.rows.length > 0) {
        return { score: mapRowToScrambleScore(existingByMutation.rows[0]), wasCreated: false };
    }

    // Check existing by flight/team/hole
    const existing = await pool.query(
        `SELECT * FROM scramble_team_scores WHERE event_id = $1 AND flight_id = $2 AND team = $3 AND hole_number = $4`,
        [input.eventId, input.flightId, input.team, input.holeNumber]
    );

    if (existing.rows.length === 0) {
        const res = await pool.query(
            `INSERT INTO scramble_team_scores (event_id, flight_id, team, hole_number, gross_score, mutation_id, version, source, entered_by_user_id, client_timestamp)
             VALUES ($1, $2, $3, $4, $5, $6, 1, $7, $8, $9)
             RETURNING *`,
            [input.eventId, input.flightId, input.team, input.holeNumber, input.grossScore, input.mutationId, source, input.enteredByUserId, clientTimestamp]
        );
        return { score: mapRowToScrambleScore(res.rows[0]), wasCreated: true };
    }

    const existingScore = mapRowToScrambleScore(existing.rows[0]);
    const previousValue = existingScore.grossScore;

    const res = await pool.query(
        `UPDATE scramble_team_scores 
         SET gross_score = $1, mutation_id = $2, version = version + 1, source = $3, entered_by_user_id = $4, client_timestamp = $5, server_timestamp = NOW()
         WHERE id = $6
         RETURNING *`,
        [input.grossScore, input.mutationId, source, input.enteredByUserId, clientTimestamp, existingScore.id]
    );

    return { score: mapRowToScrambleScore(res.rows[0]), wasCreated: false, previousValue };
};

/**
 * Batch upsert scramble scores.
 */
export const upsertScrambleScoresBatch = async (inputs: CreateScrambleScoreInput[]): Promise<{ scores: ScrambleScore[]; created: number; updated: number }> => {
    const results: ScrambleScore[] = [];
    let created = 0;
    let updated = 0;

    for (const input of inputs) {
        const result = await upsertScrambleScore(input);
        results.push(result.score);
        if (result.wasCreated) created++;
        else if (result.previousValue !== undefined) updated++;
    }

    return { scores: results, created, updated };
};

/**
 * Get all scramble scores for a flight.
 */
export const getFlightScrambleScores = async (flightId: string): Promise<ScrambleScore[]> => {
    const pool = getPool();
    const res = await pool.query(
        `SELECT * FROM scramble_team_scores WHERE flight_id = $1 ORDER BY team, hole_number`,
        [flightId]
    );
    return res.rows.map(mapRowToScrambleScore);
};
