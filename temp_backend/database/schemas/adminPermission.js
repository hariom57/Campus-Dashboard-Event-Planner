const createAdminPermissionTable = async (sql) => {
    await sql`
        CREATE TABLE IF NOT EXISTS admin_permission (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL UNIQUE
        );
    `;
};

module.exports = createAdminPermissionTable;
