const createUserPreferredClubTable = async (sql) => {
    await sql`
        CREATE TABLE IF NOT EXISTS user_preferred_club (
            club_id BIGINT NOT NULL REFERENCES club(id) ON DELETE CASCADE,
            user_id BIGINT NOT NULL REFERENCES "user"(user_id) ON DELETE CASCADE,
            PRIMARY KEY (club_id, user_id)
        );
    `;
};

module.exports = createUserPreferredClubTable;
