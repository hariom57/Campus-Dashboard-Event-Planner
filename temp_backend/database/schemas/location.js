const { DataTypes } = require('sequelize');
const sequelize = require('../connection');

const Location = sequelize.define('Location', {
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
    location_url: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    latitude: {
        type: DataTypes.DOUBLE,
        allowNull: true,
    },
    longitude: {
        type: DataTypes.DOUBLE,
        allowNull: true,
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    images: {
        type: DataTypes.JSONB,
        defaultValue: [],
        allowNull: true,
    },
}, {
    tableName: 'location',
    timestamps: false,
});

module.exports = Location;

// const createLocationTable = async (sql) => {
//     await sql`
//         CREATE TABLE IF NOT EXISTS location (
//             id SERIAL PRIMARY KEY,
//             name TEXT NOT NULL UNIQUE,
//             location_url TEXT,
//             latitude DOUBLE PRECISION,
//             longitude DOUBLE PRECISION,
//             description TEXT,
//             images JSONB DEFAULT '[]'::jsonb
//         );
//     `;
// };

// module.exports = createLocationTable;
