const createEventUpdateTable = async (sql) => {
    await sql`
        CREATE TABLE IF NOT EXISTS event_update (
            id SERIAL PRIMARY KEY,
            event_id INTEGER NOT NULL REFERENCES event(id) ON DELETE CASCADE,
            update TEXT NOT NULL
        );
    `;
};

module.exports = createEventUpdateTable;
