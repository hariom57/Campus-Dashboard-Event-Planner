const createLocationTable = async (sql) => {
    await sql`
        CREATE TABLE IF NOT EXISTS location (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL UNIQUE,
            location_url TEXT,
            latitude DOUBLE PRECISION,
            longitude DOUBLE PRECISION,
            description TEXT,
            images JSONB DEFAULT '[]'::jsonb
        );
    `;
};

module.exports = createLocationTable;
