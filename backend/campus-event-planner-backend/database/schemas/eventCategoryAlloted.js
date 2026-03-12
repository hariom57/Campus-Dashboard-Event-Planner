const createEventCategoryAllotedTable = async (sql) => {
    await sql`
        CREATE TABLE IF NOT EXISTS event_category_alloted (
            event_id INTEGER NOT NULL REFERENCES event(id) ON DELETE CASCADE,
            event_category_id INTEGER NOT NULL REFERENCES event_category(id) ON DELETE CASCADE,
            PRIMARY KEY (event_id, event_category_id)
        );
    `;
};

module.exports = createEventCategoryAllotedTable;
