require('dotenv').config();
const sql = require('./database/connection');

async function seed() {
    try {
        console.log('🌱 Starting database seeding...');

        // 1. Seed Locations
        console.log('📍 Seeding locations...');
        const locations = [
            {
                name: 'LHC-101',
                description: 'Lecture Hall Complex Room 101',
                latitude: 29.8649,
                longitude: 77.8966,
                location_url: 'https://maps.app.goo.gl/9zX9X9X9X9X9X9X9'
            },
            {
                name: 'MAC Auditorium',
                description: 'Multi Activity Centre',
                latitude: 29.8655,
                longitude: 77.8945,
                location_url: 'https://maps.app.goo.gl/yYyYyYyYyYyYyYyY'
            },
            {
                name: 'O.P. Jain Hall',
                description: 'Civil Engineering Department',
                latitude: 29.8632,
                longitude: 77.8988,
                location_url: 'https://maps.app.goo.gl/zZzZzZzZzZzZzZzZ'
            }
        ];

        for (const loc of locations) {
            await sql`
                INSERT INTO location (name, description, latitude, longitude, location_url)
                VALUES (${loc.name}, ${loc.description}, ${loc.latitude}, ${loc.longitude}, ${loc.location_url})
                ON CONFLICT (name) DO NOTHING;
            `;
        }

        // 2. Seed Clubs (Note: Backend uses BigInt for club_id in event table, but let's see schema)
        // Actually, the schemas/club.js defines the club table.
        console.log('🏛️ Seeding clubs...');
        const clubs = [
            { id: 1, name: 'Technical Society', email: 'tech@iitr.ac.in' },
            { id: 2, name: 'Cultural Council', email: 'cultural@iitr.ac.in' },
            { id: 3, name: 'Sports Council', email: 'sports@iitr.ac.in' }
        ];

        for (const club of clubs) {
            await sql`
                INSERT INTO club (id, name, email)
                VALUES (${club.id}, ${club.name}, ${club.email})
                ON CONFLICT (id) DO NOTHING;
            `;
        }

        // 3. Seed Events
        console.log('📅 Seeding events...');
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        tomorrow.setHours(18, 0, 0, 0);

        const events = [
            {
                name: 'Intro to AI Workshop',
                club_id: 1,
                location_id: 1,
                tentative_start_time: tomorrow.toISOString(),
                duration_minutes: 120,
                description: 'A deep dive into the world of Artificial Intelligence.'
            },
            {
                name: 'Open Mic Night',
                club_id: 2,
                location_id: 2,
                tentative_start_time: new Date(tomorrow.getTime() + 86400000).toISOString(), // Day after tomorrow
                duration_minutes: 180,
                description: 'Showcase your talent on stage!'
            }
        ];

        for (const event of events) {
            await sql`
                INSERT INTO event (name, club_id, location_id, tentative_start_time, duration_minutes, description)
                VALUES (${event.name}, ${event.club_id}, ${event.location_id}, ${event.tentative_start_time}, ${event.duration_minutes}, ${event.description})
                ON CONFLICT DO NOTHING;
            `;
        }

        console.log('✅ Seeding completed successfully!');
    } catch (error) {
        console.error('❌ Seeding failed:', error);
    } finally {
        process.exit();
    }
}

seed();
