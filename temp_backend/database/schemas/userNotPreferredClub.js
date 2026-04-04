const { DataTypes } = require('sequelize');
const sequelize = require('../connection');

const UserNotPreferredClub = sequelize.define('UserNotPreferredClub', {
    club_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        primaryKey: true,
        references: { model: 'club', key: 'id' },
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
    tableName: 'user_not_preferred_club',
    timestamps: false,
});

module.exports = UserNotPreferredClub;

// const createUserNotPreferredClubTable = async (sql) => {
//     await sql`
//         CREATE TABLE IF NOT EXISTS user_not_preferred_club (
//             club_id BIGINT NOT NULL REFERENCES club(id) ON DELETE CASCADE,
//             user_id BIGINT NOT NULL REFERENCES "user"(user_id) ON DELETE CASCADE,
//             PRIMARY KEY (club_id, user_id)
//         );
//     `;
// };

// module.exports = createUserNotPreferredClubTable;
