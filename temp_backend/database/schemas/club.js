const createClubTable = async (sql) => {
    await sql`
        CREATE TABLE IF NOT EXISTS club (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL UNIQUE,
            email TEXT NOT NULL UNIQUE,
            description TEXT,
            logo_url TEXT
        );
    `;
};

module.exports = createClubTable;
