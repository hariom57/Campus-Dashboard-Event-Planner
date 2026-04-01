const createUserPreferredCategoryTable = async (sql) => {
    await sql`
        CREATE TABLE IF NOT EXISTS user_preferred_category (
            event_category_id INTEGER NOT NULL REFERENCES event_category(id) ON DELETE CASCADE,
            user_id BIGINT NOT NULL REFERENCES "user"(user_id) ON DELETE CASCADE,
            PRIMARY KEY (event_category_id, user_id)
        );
    `;
};

module.exports = createUserPreferredCategoryTable;
