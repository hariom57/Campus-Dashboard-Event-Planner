const createAdminPermissionAllotedTable = async (sql) => {
    await sql`
        CREATE TABLE IF NOT EXISTS admin_permission_alloted (
            admin_permission_id INTEGER NOT NULL REFERENCES admin_permission(id) ON DELETE CASCADE,
            user_id BIGINT NOT NULL REFERENCES "user"(user_id) ON DELETE CASCADE,
            PRIMARY KEY (admin_permission_id, user_id)
        );
    `;
};

module.exports = createAdminPermissionAllotedTable;
