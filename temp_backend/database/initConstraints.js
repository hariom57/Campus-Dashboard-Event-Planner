const sequelize = require('./connection');

const applyConstraints = async () => {
    try {
        await sequelize.query(`CREATE EXTENSION IF NOT EXISTS btree_gist;`);

        await sequelize.query(`
            DO $$
            BEGIN
                IF EXISTS (
                    SELECT 1
                    FROM pg_constraint
                    WHERE conname = 'no_overlapping_events_at_location'
                ) THEN
                    ALTER TABLE event DROP CONSTRAINT no_overlapping_events_at_location;
                END IF;

                ALTER TABLE event
                ADD CONSTRAINT no_overlapping_events_at_location
                EXCLUDE USING gist (
                    location_id WITH =,
                    tstzrange(
                        tentative_start_time,
                        tentative_start_time + (duration_minutes * INTERVAL '1 minute')
                    ) WITH &&
                ) WHERE (location_id IS NOT NULL);
            END
            $$;
        `);

        console.log('DB constraints applied successfully.');
    } catch (err) {
        // timestamptz range exclusion expressions may fail on some Postgres setups
        // because the index expression is considered non-immutable.
        if (err?.original?.code === '42P17' || err?.parent?.code === '42P17') {
            console.warn('Skipping overlap exclusion constraint due to Postgres immutability limitation.');
            return;
        }

        console.error('Failed to apply DB constraints:', err);
        throw err;
    }
};

module.exports = applyConstraints;