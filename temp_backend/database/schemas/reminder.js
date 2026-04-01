const createReminderTable = async (sql) => {
    await sql`
        CREATE TABLE IF NOT EXISTS reminder (
            event_id INTEGER NOT NULL REFERENCES event(id) ON DELETE CASCADE,
            user_id BIGINT NOT NULL REFERENCES "user"(user_id) ON DELETE CASCADE,
            reminder_time TIMESTAMP NOT NULL,
            PRIMARY KEY (event_id, user_id)
        );
    `;
};

module.exports = createReminderTable;
