const { DataTypes } = require('sequelize');
const sequelize = require('../connection');

const AdminPermission = sequelize.define('AdminPermission', {
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
    tableName: 'admin_permission',
    timestamps: false,
});

module.exports = AdminPermission;

// const createAdminPermissionTable = async (sql) => {
//     await sql`
//         CREATE TABLE IF NOT EXISTS admin_permission (
//             id SERIAL PRIMARY KEY,
//             name TEXT NOT NULL UNIQUE
//         );
//     `;
// };

// module.exports = createAdminPermissionTable;