/**
 * seed-roster.ts
 *
 * Inserts the 5 real player groups into the production database.
 * Idempotent — safe to re-run, will replace existing flights/players for the event.
 *
 * Run (from repo root):
 *   DATABASE_URL="postgresql://..." npx ts-node packages/api/scripts/seed-roster.ts
 *
 * HCPs are set per player in the GROUPS array below.
 */

import { Pool } from 'pg';
import bcrypt from 'bcrypt';
const { v4: uuidv4 } = require('uuid');

require('dotenv/config');

// Strip accents: Vélez → Velez, Tomás → Tomas, Gaitán → Gaitan
const stripAccents = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

// ── ROSTER ────────────────────────────────────────────────────────────────────
// Each group: { blue: [Pos1, Pos2], red: [Pos1, Pos2] }
// blue = Pitufos (left side in cards, gold border)
// red  = Cariñositos (right side in cards, pink border)
// Each player: [name, handicap_index]
type PlayerEntry = [string, number];
const GROUPS: Array<{ blue: [PlayerEntry, PlayerEntry]; red: [PlayerEntry, PlayerEntry] }> = [
    { blue: [['Vélez', 20],  ['Rocha', 27]],    red: [['Adri', 13],      ['Camilo', 30]]   }, // Group 1
    { blue: [['Tomás', 14],  ['Burrowes', 15]], red: [['Fito', 12],      ['Herrera', 16]]  }, // Group 2
    { blue: [['Ana', 11],    ['Fercho', 17]],   red: [['Camacho', 14],   ['Manu', 15]]     }, // Group 3
    { blue: [['Pulido', 6],  ['Phil', 11]],     red: [['Pocho', 8],      ['Gaitán', 25]]   }, // Group 4
    { blue: [['Vargas', 15], ['Pilarica', 14]], red: [['Sardi', 16],     ['Bernie', 21]]   }, // Group 5
];

const EVENT_CODE = 'PC2026';

async function main() {
    const databaseUrl = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/ryder_cup_dev';
    console.log('Connecting to:', databaseUrl.replace(/:[^@]+@/, ':***@'));

    const pool = new Pool({ connectionString: databaseUrl });
    const passwordHash = await bcrypt.hash('Par00', 10);

    try {
        // ── Ensure organizer user ─────────────────────────────────────────────
        const orgRes = await pool.query(
            `INSERT INTO users (email, password_hash, name, created_at)
             VALUES ($1, $2, 'Organizer', NOW())
             ON CONFLICT (email) DO UPDATE SET email = $1
             RETURNING id`,
            ['organizer@par00.com', passwordHash]
        );
        const organizerId = orgRes.rows[0].id;

        // ── Ensure event ──────────────────────────────────────────────────────
        const eventRes = await pool.query(
            `INSERT INTO events (name, status, event_code, created_by_user_id, created_at, updated_at)
             VALUES ($1, $2, $3, $4, NOW(), NOW())
             ON CONFLICT (event_code) DO UPDATE SET name = $1, updated_at = NOW()
             RETURNING id`,
            ['Pitufos Carinositos 2026', 'live', EVENT_CODE, organizerId]
        );
        const eventId = eventRes.rows[0].id;
        console.log(`Event: ${eventId} (code: ${EVENT_CODE})`);

        // ── Ensure course + tee + 9 holes (par 4 default) ────────────────────
        const courseRes = await pool.query(
            `INSERT INTO courses (event_id, name, source, created_at)
             VALUES ($1, $2, 'manual', NOW())
             ON CONFLICT (event_id) DO UPDATE SET name = $2
             RETURNING id`,
            [eventId, 'Pitufos Carinositos 2026 Course']
        );
        const courseId = courseRes.rows[0].id;

        let teeRes = await pool.query(
            `SELECT id FROM tees WHERE course_id = $1 LIMIT 1`, [courseId]
        );
        let teeId: string;
        if (teeRes.rows.length === 0) {
            const newTee = await pool.query(
                `INSERT INTO tees (course_id, name, created_at) VALUES ($1, 'Default Tees', NOW()) RETURNING id`,
                [courseId]
            );
            teeId = newTee.rows[0].id;
            // 9 holes, par 4 each, stroke index 1-9
            await pool.query(`DELETE FROM holes WHERE tee_id = $1`, [teeId]);
            for (let h = 1; h <= 9; h++) {
                await pool.query(
                    `INSERT INTO holes (tee_id, hole_number, par, stroke_index) VALUES ($1,$2,4,$2)`,
                    [teeId, h]
                );
            }
            console.log(`Created tee + 9 default holes`);
        } else {
            teeId = teeRes.rows[0].id;
        }
        console.log(`Tee: ${teeId}`);


        // Clean slate for this event's flights/players/scores
        console.log('Clearing existing data...');
        await pool.query(`DELETE FROM scramble_team_scores WHERE event_id = $1`, [eventId]);
        await pool.query(`DELETE FROM hole_scores WHERE event_id = $1`, [eventId]);
        await pool.query(`DELETE FROM players WHERE event_id = $1`, [eventId]);
        await pool.query(`DELETE FROM flights WHERE event_id = $1`, [eventId]);

        let totalPlayers = 0;

        for (let i = 0; i < GROUPS.length; i++) {
            const group = GROUPS[i];
            const flightNumber = i + 1;

            // Create flight (not_started state — scores will be entered during play)
            const flightRes = await pool.query(
                `INSERT INTO flights (event_id, flight_number, front_state, back_state, created_at)
                 VALUES ($1, $2, 'open', 'open', NOW())
                 RETURNING id`,
                [eventId, flightNumber]
            );
            const flightId = flightRes.rows[0].id;
            console.log(`  Flight ${flightNumber}: ${flightId}`);

            // Insert players: blue (Pitufos) positions 1 & 2, then red (Cariñositos) 1 & 2
            const insertPlayer = async ([name, hcp]: PlayerEntry, team: 'blue' | 'red', position: number) => {
                const [firstName, ...rest] = name.split(' ');
                const lastName = rest.join(' ') || '-';
                const email = `${stripAccents(name).toLowerCase().replace(/[^a-z0-9]/g, '.')}@par00.com`;

                const userRes = await pool.query(
                    `INSERT INTO users (email, password_hash, name, created_at)
                     VALUES ($1, $2, $3, NOW())
                     ON CONFLICT (email) DO UPDATE SET email = $1
                     RETURNING id`,
                    [email, passwordHash, name]
                );
                const userId = userRes.rows[0].id;

                await pool.query(
                    `INSERT INTO players
                       (event_id, user_id, first_name, last_name, handicap_index, team, flight_id, position, tee_id, created_at)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())`,
                    [eventId, userId, firstName, lastName, hcp, team, flightId, position, teeId]
                );
                console.log(`    ${team === 'blue' ? '🔵' : '🔴'} ${name} (HCP ${hcp}) — Pos ${position}`);
                totalPlayers++;
            };

            await insertPlayer(group.blue[0], 'blue', 1);
            await insertPlayer(group.blue[1], 'blue', 2);
            await insertPlayer(group.red[0],  'red',  1);
            await insertPlayer(group.red[1],  'red',  2);
        }

        console.log(`\n✅ Seeded ${GROUPS.length} flights and ${totalPlayers} players.`);
        console.log(`\nEvent ID: ${eventId}`);
        console.log(`\nNext steps:`);
        console.log(`  1. HCPs are already set for all players.`);
        console.log(`  2. Assign tee boxes if needed.`);
        console.log(`  3. The leaderboard will show all 20 matches as "SIN INICIAR" until scores are entered.`);

    } finally {
        await pool.end();
    }
}

main().catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
});
