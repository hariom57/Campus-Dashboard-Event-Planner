//             CONSTRAINT no_overlapping_events_at_location 
//             EXCLUDE USING gist (
//                 location_id WITH =,
//                 tsrange(
//                     tentative_start_time, 
//                     tentative_start_time + make_interval(mins => duration_minutes)
//                 ) WITH &&
//             ) WHERE (location_id IS NOT NULL)
const { DataTypes } = require('sequelize');
const sequelize = require('../connection');

const Event = sequelize.define('Event', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    name: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    club_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: { model: 'club', key: 'id' },
        onDelete: 'CASCADE',
    },
    location_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'location', key: 'id' },
        onDelete: 'SET NULL',
    },
    tentative_start_time: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    duration_minutes: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    actual_start_time: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
}, {
    tableName: 'event',
    timestamps: false,
});

module.exports = Event;

// const createEventTable = async (sql) => {
//     // Enable btree_gist extension for exclusion constraints
//     await sql`CREATE EXTENSION IF NOT EXISTS btree_gist;`;

//     await sql`
//         CREATE TABLE IF NOT EXISTS event (
//             id SERIAL PRIMARY KEY,
//             name TEXT NOT NULL,
//             club_id BIGINT NOT NULL REFERENCES club(id) ON DELETE CASCADE,
//             location_id INTEGER REFERENCES location(id) ON DELETE SET NULL,
//             tentative_start_time TIMESTAMP NOT NULL,
//             duration_minutes INTEGER NOT NULL,
//             actual_start_time TIMESTAMP,
//             description TEXT,
//             CONSTRAINT no_overlapping_events_at_location 
//             EXCLUDE USING gist (
//                 location_id WITH =,
//                 tsrange(
//                     tentative_start_time, 
//                     tentative_start_time + make_interval(mins => duration_minutes)
//                 ) WITH &&
//             ) WHERE (location_id IS NOT NULL)
//         );
//     `;
// };

// module.exports = createEventTable;
