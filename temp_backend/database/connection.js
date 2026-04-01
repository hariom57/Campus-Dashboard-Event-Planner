const postgres = require('postgres');

module.exports = postgres(`${process.env.DATABASE_URL}`);