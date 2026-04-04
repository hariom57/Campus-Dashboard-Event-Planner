const sequelize = require('./connection');

const applyConstraints = async () => {
    const queryInterface = sequelize.getQueryInterface();

    try {
        await sequelize.query(`CREATE EXTENSION IF NOT EXISTS btree_gist;`);

        await sequelize.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1
                    FROM pg_constraint
                    WHERE conname = 'no_overlapping_events_at_location'
                ) THEN
                    ALTER TABLE event
                    ADD CONSTRAINT no_overlapping_events_at_location
                    EXCLUDE USING gist (
                        location_id WITH =,
                        tsrange(
                            tentative_start_time,
                            tentative_start_time + make_interval(mins => duration_minutes)
                        ) WITH &&
                    ) WHERE (location_id IS NOT NULL);
                END IF;
            END
            $$;
        `);

        console.log('DB constraints applied successfully.');
    } catch (err) {
        console.error('Failed to apply DB constraints:', err);
        throw err;
    }
};

module.exports = applyConstraints;