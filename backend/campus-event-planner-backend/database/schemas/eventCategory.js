const createEventCategoryTable = async (sql) => {
    await sql`
        CREATE TABLE IF NOT EXISTS event_category (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL UNIQUE
        );
    `;
};

module.exports = createEventCategoryTable;
