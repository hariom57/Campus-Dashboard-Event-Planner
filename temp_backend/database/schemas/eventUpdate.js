const { DataTypes } = require('sequelize');
const sequelize = require('../connection');

const EventUpdate = sequelize.define('EventUpdate', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    event_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'event', key: 'id' },
        onDelete: 'CASCADE',
    },
    update: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
}, {
    tableName: 'event_update',
    timestamps: false,
});

module.exports = EventUpdate;

// const createEventUpdateTable = async (sql) => {
//     await sql`
//         CREATE TABLE IF NOT EXISTS event_update (
//             id SERIAL PRIMARY KEY,
//             event_id INTEGER NOT NULL REFERENCES event(id) ON DELETE CASCADE,
//             update TEXT NOT NULL
//         );
//     `;
// };

// module.exports = createEventUpdateTable;
