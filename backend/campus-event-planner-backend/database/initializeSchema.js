const sql = require('./connection');
const createUsersTable = require('./schemas/user');
const createClubTable = require('./schemas/club');
const createClubAdminTable = require('./schemas/clubAdmin');
const createLocationTable = require('./schemas/location');
const createEventCategoryTable = require('./schemas/eventCategory');
const createEventTable = require('./schemas/event');
const createEventCategoryAllotedTable = require('./schemas/eventCategoryAlloted');
const createEventUpdateTable = require('./schemas/eventUpdate');
const createReminderTable = require('./schemas/reminder');
const createUserPreferredCategoryTable = require('./schemas/userPreferredCategory');
const createUserNotPreferredCategoryTable = require('./schemas/userNotPreferredCategory');
const createUserPreferredClubTable = require('./schemas/userPreferredClub');
const createUserNotPreferredClubTable = require('./schemas/userNotPreferredClub');
const createAdminPermissionTable = require('./schemas/adminPermission');
const createAdminPermissionAllotedTable = require('./schemas/adminPermissionAlloted');

/**
 * Initialize database schema
 * Creates tables if they don't exist
 */
const dropAllTables = async () => {
    await sql`
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
    `;
};

const initializeSchema = async () => {
    try {
        console.log('🔄 Checking and initializing database schema...');

        if (process.env.RESET_DB === 'true') {
            console.log('⚠️ RESET_DB=true detected. Dropping all tables...');
            await dropAllTables();
            console.log('✅ All tables dropped');
        }

        const schemaSteps = [
            ['Users', createUsersTable],
            ['Club', createClubTable],
            ['Club admin', createClubAdminTable],
            ['Location', createLocationTable],
            ['Event category', createEventCategoryTable],
            ['Event', createEventTable],
            ['Event category alloted', createEventCategoryAllotedTable],
            ['Event update', createEventUpdateTable],
            ['Reminder', createReminderTable],
            ['User preferred category', createUserPreferredCategoryTable],
            ['User not preferred category', createUserNotPreferredCategoryTable],
            ['User preferred club', createUserPreferredClubTable],
            ['User not preferred club', createUserNotPreferredClubTable],
            ['Admin permission', createAdminPermissionTable],
            ['Admin permission alloted', createAdminPermissionAllotedTable]
        ];

        for (const [label, createFn] of schemaSteps) {
            await createFn(sql);
            console.log(`✅ ${label} table initialized`);
        }

        console.log('✨ Database schema initialized successfully!');
    } catch (error) {
        console.error('❌ Error initializing database schema:', error);
        throw error;
    }
};

module.exports = initializeSchema;
