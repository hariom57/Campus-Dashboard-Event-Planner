const { DataTypes } = require('sequelize');
const sequelize = require('../connection');

const EventCategory = sequelize.define('EventCategory', {
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
}, {
    tableName: 'event_category',
    timestamps: false,
});

module.exports = EventCategory;

// const createEventCategoryTable = async (sql) => {
//     await sql`
//         CREATE TABLE IF NOT EXISTS event_category (
//             id SERIAL PRIMARY KEY,
//             name TEXT NOT NULL UNIQUE
//         );
//     `;
// };

// module.exports = createEventCategoryTable;
