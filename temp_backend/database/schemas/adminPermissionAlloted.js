const { DataTypes } = require('sequelize');
const sequelize = require('../connection');

const AdminPermissionAlloted = sequelize.define('AdminPermissionAlloted', {
    admin_permission_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        references: { model: 'admin_permission', key: 'id' },
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
    tableName: 'admin_permission_alloted',
    timestamps: false,
});

module.exports = AdminPermissionAlloted;

// const createAdminPermissionAllotedTable = async (sql) => {
//     await sql`
//         CREATE TABLE IF NOT EXISTS admin_permission_alloted (
//             admin_permission_id INTEGER NOT NULL REFERENCES admin_permission(id) ON DELETE CASCADE,
//             user_id BIGINT NOT NULL REFERENCES "user"(user_id) ON DELETE CASCADE,
//             PRIMARY KEY (admin_permission_id, user_id)
//         );
//     `;
// };

// module.exports = createAdminPermissionAllotedTable;
