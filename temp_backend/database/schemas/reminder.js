const { DataTypes } = require('sequelize');
const sequelize = require('../connection');

const Reminder = sequelize.define('Reminder', {
    event_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        references: { model: 'event', key: 'id' },
        onDelete: 'CASCADE',
    },
    user_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        primaryKey: true,
        references: { model: 'user', key: 'user_id' },
        onDelete: 'CASCADE',
    },
    offset_minutes: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 30,
        primaryKey: true,
    },
    reminder_time: {
        type: DataTypes.DATE,
        allowNull: false,
    },
}, {
    tableName: 'reminder',
    timestamps: false,
});

module.exports = Reminder;

// const createReminderTable = async (sql) => {
//     await sql`
//         CREATE TABLE IF NOT EXISTS reminder (
//             event_id INTEGER NOT NULL REFERENCES event(id) ON DELETE CASCADE,
//             user_id BIGINT NOT NULL REFERENCES "user"(user_id) ON DELETE CASCADE,
//             reminder_time TIMESTAMP NOT NULL,
//             PRIMARY KEY (event_id, user_id)
//         );
//     `;
// };

// module.exports = createReminderTable;
