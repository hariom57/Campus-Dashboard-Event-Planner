const { DataTypes } = require('sequelize');
const sequelize = require('../connection');

const EventCategoryAlloted = sequelize.define('EventCategoryAlloted', {
    event_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        references: { model: 'event', key: 'id' },
        onDelete: 'CASCADE',
    },
    event_category_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        references: { model: 'event_category', key: 'id' },
        onDelete: 'CASCADE',
    },
}, {
    tableName: 'event_category_alloted',
    timestamps: false,
});

module.exports = EventCategoryAlloted;

// const createEventCategoryAllotedTable = async (sql) => {
//     await sql`
//         CREATE TABLE IF NOT EXISTS event_category_alloted (
//             event_id INTEGER NOT NULL REFERENCES event(id) ON DELETE CASCADE,
//             event_category_id INTEGER NOT NULL REFERENCES event_category(id) ON DELETE CASCADE,
//             PRIMARY KEY (event_id, event_category_id)
//         );
//     `;
// };

// module.exports = createEventCategoryAllotedTable;
