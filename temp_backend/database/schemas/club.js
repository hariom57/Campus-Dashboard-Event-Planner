const { DataTypes } = require('sequelize');
const sequelize = require('../connection');

const Club = sequelize.define('Club', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    name: {
        type: DataTypes.TEXT,
        allowNull: false,
        unique: true,
    },
    email: {
        type: DataTypes.TEXT,
        allowNull: false,
        unique: true,
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    logo_url: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
}, {
    tableName: 'club',
    timestamps: false,
});

module.exports = Club;

// const createClubTable = async (sql) => {
//     await sql`
//         CREATE TABLE IF NOT EXISTS club (
//             id SERIAL PRIMARY KEY,
//             name TEXT NOT NULL UNIQUE,
//             email TEXT NOT NULL UNIQUE,
//             description TEXT,
//             logo_url TEXT
//         );
//     `;
// };
// module.exports = createClubTable;