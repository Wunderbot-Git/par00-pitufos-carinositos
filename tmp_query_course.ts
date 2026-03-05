import { Pool } from 'pg';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/ryder_cup_dev'
});

async function run() {
    try {
        const events = await pool.query('SELECT * FROM events');

        for (const event of events.rows) {
            console.log(`Event: ${event.name} (ID: ${event.id})`);
            const courses = await pool.query('SELECT * FROM courses WHERE event_id = $1', [event.id]);
            for (const course of courses.rows) {
                console.log(`  Course: ${course.name} (ID: ${course.id})`);
                const tees = await pool.query('SELECT * FROM tees WHERE course_id = $1', [course.id]);
                for (const tee of tees.rows) {
                    console.log(`    Tee: ${tee.name} (ID: ${tee.id})`);
                    const holes = await pool.query('SELECT * FROM holes WHERE tee_id = $1 ORDER BY hole_number', [tee.id]);
                    console.log(`      Par: ${holes.rows.map(h => h.par).join(', ')}`);
                    console.log(`      Hcp: ${holes.rows.map(h => h.stroke_index).join(', ')}`);
                }
            }
        }
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}

run();
