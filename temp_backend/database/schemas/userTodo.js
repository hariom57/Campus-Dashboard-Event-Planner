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
    completed: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
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
