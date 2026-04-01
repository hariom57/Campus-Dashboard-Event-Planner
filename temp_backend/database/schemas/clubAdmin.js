const createClubAdminTable = async (sql) => {
    await sql`
        CREATE TABLE IF NOT EXISTS club_admin (
            club_id BIGINT NOT NULL,
            user_id BIGINT NOT NULL,
            PRIMARY KEY (club_id, user_id),
            CONSTRAINT club_admin_club_id_fkey FOREIGN KEY (club_id) REFERENCES club(id) ON DELETE CASCADE,
            CONSTRAINT club_admin_user_id_fkey FOREIGN KEY (user_id) REFERENCES "user"(user_id) ON DELETE CASCADE
        );
    `;
};

module.exports = createClubAdminTable;
