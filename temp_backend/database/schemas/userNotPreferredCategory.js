const { DataTypes } = require('sequelize');
const sequelize = require('../connection');

const UserNotPreferredCategory = sequelize.define('UserNotPreferredCategory', {
    event_category_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        references: { model: 'event_category', key: 'id' },
        onDelete: 'CASCADE',
    },
    user_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        primaryKey: true,
        references: { model: 'user', key: 'user_id' },
        onDelete: 'CASCADE',
    },
}, {
    tableName: 'user_not_preferred_category',
    timestamps: false,
});

module.exports = UserNotPreferredCategory;

// const createUserNotPreferredCategoryTable = async (sql) => {
//     await sql`
//         CREATE TABLE IF NOT EXISTS user_not_preferred_category (
//             event_category_id INTEGER NOT NULL REFERENCES event_category(id) ON DELETE CASCADE,
//             user_id BIGINT NOT NULL REFERENCES "user"(user_id) ON DELETE CASCADE,
//             PRIMARY KEY (event_category_id, user_id)
//         );
//     `;
// };

// module.exports = createUserNotPreferredCategoryTable;
