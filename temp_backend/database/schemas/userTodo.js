const { DataTypes } = require('sequelize');
const sequelize = require('../connection');

const UserTodo = sequelize.define('UserTodo', {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
    },
    user_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
    },
    text: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: null,
    },
    due_date: {
        // Stored as a date string (YYYY-MM-DD), null = no date set
        type: DataTypes.DATEONLY,
        allowNull: true,
        defaultValue: null,
    },
    due_time: {
        // Stored as a time string (HH:MM), null = no time set
        type: DataTypes.STRING(5),
        allowNull: true,
        defaultValue: null,
    },
    completed: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
    },
    // Optional event linkage — if this todo was created from the event feed
    linked_event_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
        defaultValue: null,
    },
    linked_event_name: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: null,
    },
    linked_event_club: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: null,
    },
    linked_event_date: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: null,
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
}, {
    tableName: 'user_todo',
    timestamps: false,
    indexes: [
        { fields: ['user_id'], name: 'idx_user_todo_user_id' },
    ],
});

module.exports = UserTodo;
