const createEventTable = async (sql) => {
    // Enable btree_gist extension for exclusion constraints
    await sql`CREATE EXTENSION IF NOT EXISTS btree_gist;`;

    await sql`
        CREATE TABLE IF NOT EXISTS event (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            club_id BIGINT NOT NULL REFERENCES club(id) ON DELETE CASCADE,
            location_id INTEGER REFERENCES location(id) ON DELETE SET NULL,
            tentative_start_time TIMESTAMP NOT NULL,
            duration_minutes INTEGER NOT NULL,
            actual_start_time TIMESTAMP,
            description TEXT,
            CONSTRAINT no_overlapping_events_at_location 
            EXCLUDE USING gist (
                location_id WITH =,
                tsrange(
                    tentative_start_time, 
                    tentative_start_time + (duration_minutes * INTERVAL '1 minute')
                ) WITH &&
            ) WHERE (location_id IS NOT NULL)
        );
    `;
};

module.exports = createEventTable;
