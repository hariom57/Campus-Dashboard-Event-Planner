const { DataTypes } = require('sequelize');
const sequelize = require('../connection');

const User = sequelize.define('User', {
    user_id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        allowNull: false,
    },
    full_name: {
        type: DataTypes.STRING(255),
        allowNull: false,
    },
    email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
    },
    phone_number: {
        type: DataTypes.STRING(20),
        allowNull: true,
    },
    display_picture: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    enrolment_number: {
        type: DataTypes.STRING(255),
        allowNull: true,
        unique: true,
    },
    branch: {
        type: DataTypes.STRING(255),
        allowNull: true,
    },
    current_year: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    branch_department_name: {
        type: DataTypes.STRING(255),
        allowNull: true,
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
    updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
}, {
    tableName: 'user',
    timestamps: false,
    indexes: [
        { fields: ['email'], name: 'idx_user_email' },
        { fields: ['enrolment_number'], name: 'idx_user_enrolment_number' },
    ],
});

module.exports = User;

// const createUsersTable = async (sql) => {
//     await sql`
//         CREATE TABLE IF NOT EXISTS "user" (
//             user_id BIGINT PRIMARY KEY,
//             full_name VARCHAR(255) NOT NULL,
//             email VARCHAR(255) UNIQUE NOT NULL,
//             phone_number VARCHAR(20),
//             display_picture TEXT,
//             enrolment_number VARCHAR(255) UNIQUE,
//             branch VARCHAR(255),
//             current_year INTEGER,
//             branch_department_name VARCHAR(255),
//             created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//             updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
//         );
//     `;

//     await sql`CREATE INDEX IF NOT EXISTS idx_user_email ON "user"(email);`;
//     await sql`CREATE INDEX IF NOT EXISTS idx_user_enrolment_number ON "user"(enrolment_number);`;
// };

// module.exports = createUsersTable;
