// Hole Score Repository - CRUD operations for individual hole scores

import { getPool } from '../config/database';

export interface HoleScore {
    id: string;
    eventId: string;
    flightId: string;
    playerId: string;
    holeNumber: number;
    grossScore: number;
    mutationId: string;
    version: number;
    source: 'online' | 'offline';
    enteredByUserId: string;
    clientTimestamp: Date;
    serverTimestamp: Date;
}

export interface CreateHoleScoreInput {
    eventId: string;
    flightId: string;
    playerId: string;
    holeNumber: number;
    grossScore: number;
    mutationId: string;
    enteredByUserId: string;
    source?: 'online' | 'offline';
    clientTimestamp?: Date;
}

const mapRowToHoleScore = (row: any): HoleScore => ({
    id: row.id,
    eventId: row.event_id,
    flightId: row.flight_id,
    playerId: row.player_id,
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
 * Upsert a single hole score with idempotency.
 */
export const upsertHoleScore = async (input: CreateHoleScoreInput): Promise<{ score: HoleScore; wasCreated: boolean; previousValue?: number }> => {
    const pool = getPool();
    const source = input.source || 'online';
    const clientTimestamp = input.clientTimestamp || new Date();

    // Check for existing score by mutation_id first (idempotency)
    const existingByMutation = await pool.query(
        `SELECT * FROM hole_scores WHERE mutation_id = $1`,
        [input.mutationId]
    );

    if (existingByMutation.rows.length > 0) {
        return { score: mapRowToHoleScore(existingByMutation.rows[0]), wasCreated: false };
    }

    // Check for existing score by player/hole
    const existing = await pool.query(
        `SELECT * FROM hole_scores WHERE event_id = $1 AND player_id = $2 AND hole_number = $3`,
        [input.eventId, input.playerId, input.holeNumber]
    );

    if (existing.rows.length === 0) {
        // Create new
        const res = await pool.query(
            `INSERT INTO hole_scores (event_id, flight_id, player_id, hole_number, gross_score, mutation_id, version, source, entered_by_user_id, client_timestamp)
             VALUES ($1, $2, $3, $4, $5, $6, 1, $7, $8, $9)
             RETURNING *`,
            [input.eventId, input.flightId, input.playerId, input.holeNumber, input.grossScore, input.mutationId, source, input.enteredByUserId, clientTimestamp]
        );
        return { score: mapRowToHoleScore(res.rows[0]), wasCreated: true };
    }

    const existingScore = mapRowToHoleScore(existing.rows[0]);
    const previousValue = existingScore.grossScore;

    // Update with new mutationId
    const res = await pool.query(
        `UPDATE hole_scores 
         SET gross_score = $1, mutation_id = $2, version = version + 1, source = $3, entered_by_user_id = $4, client_timestamp = $5, server_timestamp = NOW()
         WHERE id = $6
         RETURNING *`,
        [input.grossScore, input.mutationId, source, input.enteredByUserId, clientTimestamp, existingScore.id]
    );

    return { score: mapRowToHoleScore(res.rows[0]), wasCreated: false, previousValue };
};

/**
 * Batch upsert hole scores.
 */
export const upsertHoleScoresBatch = async (inputs: CreateHoleScoreInput[]): Promise<{ scores: HoleScore[]; created: number; updated: number }> => {
    const results: HoleScore[] = [];
    let created = 0;
    let updated = 0;

    for (const input of inputs) {
        const result = await upsertHoleScore(input);
        results.push(result.score);
        if (result.wasCreated) created++;
        else if (result.previousValue !== undefined) updated++;
    }

    return { scores: results, created, updated };
};

/**
 * Get all hole scores for a flight.
 */
export const getFlightHoleScores = async (flightId: string): Promise<HoleScore[]> => {
    const pool = getPool();
    const res = await pool.query(
        `SELECT * FROM hole_scores WHERE flight_id = $1 ORDER BY player_id, hole_number`,
        [flightId]
    );
    return res.rows.map(mapRowToHoleScore);
};

/**
 * Get hole scores for a specific player.
 */
export const getPlayerHoleScores = async (playerId: string): Promise<HoleScore[]> => {
    const pool = getPool();
    const res = await pool.query(
        `SELECT * FROM hole_scores WHERE player_id = $1 ORDER BY hole_number`,
        [playerId]
    );
    return res.rows.map(mapRowToHoleScore);
};

/**
 * Delete all hole scores for a flight.
 */
export const deleteFlightHoleScores = async (flightId: string): Promise<number> => {
    const pool = getPool();
    const res = await pool.query('DELETE FROM hole_scores WHERE flight_id = $1', [flightId]);
    return res.rowCount || 0;
};

/**
 * Delete hole scores for a specific hole in a flight.
 */
export const deleteHoleScoresForHole = async (flightId: string, holeNumber: number): Promise<number> => {
    const pool = getPool();
    const res = await pool.query(
        'DELETE FROM hole_scores WHERE flight_id = $1 AND hole_number = $2',
        [flightId, holeNumber]
    );
    return res.rowCount || 0;
};
