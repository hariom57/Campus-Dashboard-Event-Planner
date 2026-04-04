const { Sequelize } = require('sequelize');
// const postgres = require('postgres');

// module.exports = postgres(`${process.env.DATABASE_URL}`);
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  dialectOptions: {
    ssl: process.env.NODE_ENV === 'production'
      ? { require: true, rejectUnauthorized: false }
      : false,
  },
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});

(async () => {
  try {
    await sequelize.authenticate();
    console.log('PostgreSQL connected via Sequelize.');
  } catch (err) {
    console.error('Database connection failed:', err);
    process.exit(1);
  }
})();

module.exports = sequelize;