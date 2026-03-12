const postgres = require('postgres');

// Clean up DATABASE_URL (remove trailing whitespace)
const dbUrl = (process.env.DATABASE_URL || '').trim();

// Determine if we need SSL based on the URL (Neon needs it, local doesn't)
const isLocal = dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1');

const options = {
    idle_timeout: 20,
    connect_timeout: 30,
};

// Add SSL for remote Neon DBs, omit for local Postgres
if (!isLocal) {
    const hostname = new URL(dbUrl).hostname;
    options.ssl = {
        rejectUnauthorized: false,
        servername: hostname,
    };
}

module.exports = postgres(dbUrl, options);