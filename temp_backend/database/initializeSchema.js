const { sequelize } = require('./schemas');
const applyConstraints = require('./initConstraints');
// const sql = require('./connection');
// const createUsersTable = require('./schemas/user');
// const createClubTable = require('./schemas/club');
// const createClubAdminTable = require('./schemas/clubAdmin');
// const createLocationTable = require('./schemas/location');
// const createEventCategoryTable = require('./schemas/eventCategory');
// const createEventTable = require('./schemas/event');
// const createEventCategoryAllotedTable = require('./schemas/eventCategoryAlloted');
// const createEventUpdateTable = require('./schemas/eventUpdate');
// const createReminderTable = require('./schemas/reminder');
// const createUserPreferredCategoryTable = require('./schemas/userPreferredCategory');
// const createUserNotPreferredCategoryTable = require('./schemas/userNotPreferredCategory');
// const createUserPreferredClubTable = require('./schemas/userPreferredClub');
// const createUserNotPreferredClubTable = require('./schemas/userNotPreferredClub');
// const createAdminPermissionTable = require('./schemas/adminPermission');
// const createAdminPermissionAllotedTable = require('./schemas/adminPermissionAlloted');

/**
 * Initialize database schema
 * Creates tables if they don't exist
 */
const dropAllTables = async () => {
    await sequelize.query(`
        DROP TABLE IF EXISTS
            admin_permission_alloted,
            admin_permission,
            user_not_preferred_club,
            user_preferred_club,
            user_not_preferred_category,
            user_preferred_category,
            reminder,
            event_update,
            event_category_alloted,
            event,
            event_category,
            location,
            club_admin,
            club,
            "user"
        CASCADE;
    `);
};

const initializeSchema = async () => {
    try {
        console.log('🔄 Checking and initializing database schema...');

        if (process.env.RESET_DB === 'true') {
            console.log('⚠️ RESET_DB=true detected. Dropping all tables...');
            await dropAllTables();
            console.log('✅ All tables dropped');
        }

        // const schemaSteps = [
        //     ['Users', createUsersTable],
        //     ['Club', createClubTable],
        //     ['Club admin', createClubAdminTable],
        //     ['Location', createLocationTable],
        //     ['Event category', createEventCategoryTable],
        //     ['Event', createEventTable],
        //     ['Event category alloted', createEventCategoryAllotedTable],
        //     ['Event update', createEventUpdateTable],
        //     ['Reminder', createReminderTable],
        //     ['User preferred category', createUserPreferredCategoryTable],
        //     ['User not preferred category', createUserNotPreferredCategoryTable],
        //     ['User preferred club', createUserPreferredClubTable],
        //     ['User not preferred club', createUserNotPreferredClubTable],
        //     ['Admin permission', createAdminPermissionTable],
        //     ['Admin permission alloted', createAdminPermissionAllotedTable]
        // ];

        const schemaSteps = [
            'Users',
            'Club',
            'Club admin',
            'Location',
            'Event category',
            'Event',
            'Event category alloted',
            'Event update',
            'Reminder',
            'User preferred category',
            'User not preferred category',
            'User preferred club',
            'User not preferred club',
            'Admin permission',
            'Admin permission alloted',
        ];

        // sequelize.sync() handles all models in dependency order via foreign key awareness.
        // alter: false = safe for existing DBs, never modifies existing columns.
        await sequelize.sync({ alter: false });

        // Normalize legacy timestamp columns to timestamptz so event times are timezone-safe.
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

                IF EXISTS (
                    SELECT 1
                    FROM information_schema.columns
                    WHERE table_schema = 'public'
                      AND table_name = 'event'
                      AND column_name = 'tentative_start_time'
                      AND data_type = 'timestamp without time zone'
                ) THEN
                    ALTER TABLE event
                    ALTER COLUMN tentative_start_time TYPE TIMESTAMPTZ
                    USING tentative_start_time AT TIME ZONE 'Asia/Kolkata';
                END IF;

                IF EXISTS (
                    SELECT 1
                    FROM information_schema.columns
                    WHERE table_schema = 'public'
                      AND table_name = 'event'
                      AND column_name = 'actual_start_time'
                      AND data_type = 'timestamp without time zone'
                ) THEN
                    ALTER TABLE event
                    ALTER COLUMN actual_start_time TYPE TIMESTAMPTZ
                    USING actual_start_time AT TIME ZONE 'Asia/Kolkata';
                END IF;
            END
            $$;
        `);

        // for (const [label, createFn] of schemaSteps) {
        //     await createFn(sql);
        //     console.log(`✅ ${label} table initialized`);
        // }

        for (const label of schemaSteps) {
            console.log(`✅ ${label} table initialized`);
        }
        await applyConstraints();

        console.log('✨ Database schema initialized successfully!');
    } catch (error) {
        console.error('❌ Error initializing database schema:', error);
        throw error;
    }
};

module.exports = initializeSchema;
