const express = require('express');
const router = express.Router();
const sql = require('../database/connection');
const { userLoggedIn, userData } = require('../middlewares/userAuth');
const { checkEventPermission } = require('../middlewares/permissions/event');

// Protected route to get all current events
router.get('/all', userLoggedIn, async (req, res) => {
    try {
        const events = await sql`
            SELECT 
                event.id,
                event.name,
                event.tentative_start_time,
                event.duration_minutes,
                event.actual_start_time,
                event.description,
                club.name AS club_name,
                location.id AS location_id,
                location.name AS location_name,
                location.description AS location_description,
                location.images AS location_images
            FROM event
            LEFT JOIN club ON event.club_id = club.id
            LEFT JOIN location ON event.location_id = location.id
            WHERE event.tentative_start_time >= CURRENT_DATE
            ORDER BY event.tentative_start_time ASC
        `;
        res.json({ events });
    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Could not fetch events'
        });
    }
});

// Protected route to get events by venue/location ID
router.get('/venue/:venue_id', userLoggedIn, async (req, res) => {
    const { venue_id } = req.params;

    try {
        const events = await sql`
            SELECT 
                event.id,
                event.name,
                event.tentative_start_time,
                event.duration_minutes,
                event.actual_start_time,
                event.description,
                club.name AS club_name,
                location.id AS location_id,
                location.name AS location_name,
                location.description AS location_description,
                location.images AS location_images
            FROM event
            LEFT JOIN club ON event.club_id = club.id
            LEFT JOIN location ON event.location_id = location.id
            WHERE event.location_id = ${venue_id}
            AND event.tentative_start_time >= CURRENT_DATE
            ORDER BY event.tentative_start_time ASC
        `;

        res.json({ events });
    } catch (error) {
        console.error('Error fetching venue events:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Could not fetch venue events'
        });
    }
});

// Protected route to get events by date (YYYY-MM-DD)
router.get('/date/:date', userLoggedIn, async (req, res) => {
    const { date } = req.params;

    try {
        const events = await sql`
            SELECT 
                event.id,
                event.name,
                event.tentative_start_time,
                event.duration_minutes,
                event.actual_start_time,
                event.description,
                club.name AS club_name,
                location.id AS location_id,
                location.name AS location_name,
                location.description AS location_description,
                location.images AS location_images
            FROM event
            LEFT JOIN club ON event.club_id = club.id
            LEFT JOIN location ON event.location_id = location.id
            WHERE event.tentative_start_time::date = ${date}::date
            ORDER BY event.tentative_start_time ASC
        `;

        res.json({ events });
    } catch (error) {
        console.error('Error fetching date-wise events:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Could not fetch events for the selected date'
        });
    }
});

// Protected route to get particular event details by event ID
router.get('/:eventId', userLoggedIn, async (req, res) => {
    const { eventId } = req.params;
    try {
        const events = await sql`
            SELECT 
                event.id,
                event.name,
                event.tentative_start_time,
                event.duration_minutes,
                event.actual_start_time,
                event.description,
                club.name AS club_name,
                location.id AS location_id,
                location.name AS location_name,
                location.description AS location_description,
                location.images AS location_images
            FROM event
            LEFT JOIN club ON event.club_id = club.id
            LEFT JOIN location ON event.location_id = location.id
            WHERE event.id = ${eventId}
        `;
        res.json({ events });
    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Could not fetch events'
        });
    }
});

// Protected route to get events from user's preferred clubs
router.get('/clubs/preferred', userData, async (req, res) => {
    try {
        const events = await sql`
            SELECT 
                event.id,
                event.name,
                event.tentative_start_time,
                event.duration_minutes,
                event.actual_start_time,
                event.description,
                club.name AS club_name,
                location.id AS location_id,
                location.name AS location_name,
                location.description AS location_description,
                location.images AS location_images
            FROM event
            INNER JOIN club ON event.club_id = club.id
            INNER JOIN user_preferred_club ON club.id = user_preferred_club.club_id
            LEFT JOIN location ON event.location_id = location.id
            WHERE event.tentative_start_time >= CURRENT_DATE
            AND user_preferred_club.user_id = ${req.user.user_id}
        `;
        res.json({ events });
    } catch (error) {
        console.error('Error fetching preferred club events:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Could not fetch preferred club events'
        });
    }
});

// Protected route to get events from user's NOT preferred clubs
router.get('/clubs/not-preferred', userData, async (req, res) => {
    try {
        const events = await sql`
            SELECT 
                event.id,
                event.name,
                event.tentative_start_time,
                event.duration_minutes,
                event.actual_start_time,
                event.description,
                club.name AS club_name,
                location.id AS location_id,
                location.name AS location_name,
                location.description AS location_description,
                location.images AS location_images
            FROM event
            INNER JOIN club ON event.club_id = club.id
            INNER JOIN user_not_preferred_club ON club.id = user_not_preferred_club.club_id
            LEFT JOIN location ON event.location_id = location.id
            WHERE event.tentative_start_time >= CURRENT_DATE
            AND user_not_preferred_club.user_id = ${req.user.user_id}
            ORDER BY event.tentative_start_time ASC
        `;
        res.json({ events });
    } catch (error) {
        console.error('Error fetching not preferred club events:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Could not fetch not preferred club events'
        });
    }
});

// Protected route to get events from user's preferred categories
router.get('/categories/preferred', userData, async (req, res) => {
    try {
        const events = await sql`
            SELECT DISTINCT
                event.id,
                event.name,
                event.tentative_start_time,
                event.duration_minutes,
                event.actual_start_time,
                event.description,
                club.name AS club_name,
                location.id AS location_id,
                location.name AS location_name,
                location.description AS location_description,
                location.images AS location_images
            FROM event
            LEFT JOIN club ON event.club_id = club.id
            INNER JOIN event_category_alloted ON event.id = event_category_alloted.event_id
            INNER JOIN user_preferred_category ON event_category_alloted.event_category_id = user_preferred_category.event_category_id
            LEFT JOIN location ON event.location_id = location.id
            WHERE event.tentative_start_time >= CURRENT_DATE
            AND user_preferred_category.user_id = ${req.user.user_id}
            ORDER BY event.tentative_start_time ASC
        `;
        res.json({ events });
    } catch (error) {
        console.error('Error fetching preferred category events:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Could not fetch preferred category events'
        });
    }
});

// Protected route to get events from user's NOT preferred categories
router.get('/categories/not-preferred', userData, async (req, res) => {
    try {
        const events = await sql`
            SELECT DISTINCT
                event.id,
                event.name,
                event.tentative_start_time,
                event.duration_minutes,
                event.actual_start_time,
                event.description,
                club.name AS club_name,
                location.id AS location_id,
                location.name AS location_name,
                location.description AS location_description,
                location.images AS location_images
            FROM event
            LEFT JOIN club ON event.club_id = club.id
            INNER JOIN event_category_alloted ON event.id = event_category_alloted.event_id
            INNER JOIN user_not_preferred_category ON event_category_alloted.event_category_id = user_not_preferred_category.event_category_id
            LEFT JOIN location ON event.location_id = location.id
            WHERE event.tentative_start_time >= CURRENT_DATE
            AND user_not_preferred_category.user_id = ${req.user.user_id}
            ORDER BY event.tentative_start_time ASC
        `;
        res.json({ events });
    } catch (error) {
        console.error('Error fetching not preferred category events:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Could not fetch not preferred category events'
        });
    }
});

// Protected route to update an event
router.patch('/:eventId', checkEventPermission, async (req, res) => {
    const { eventId } = req.params;
    const {
        name,
        club_id,
        location_id,
        tentative_start_time,
        duration_minutes,
        actual_start_time,
        description
    } = req.body;

    try {
        // Build update object with only provided fields
        const updateData = {};
        if (name !== undefined) updateData.name = name;
        if (club_id !== undefined) updateData.club_id = club_id;
        if (location_id !== undefined) updateData.location_id = location_id;
        if (tentative_start_time !== undefined) updateData.tentative_start_time = tentative_start_time;
        if (duration_minutes !== undefined) updateData.duration_minutes = duration_minutes;
        if (actual_start_time !== undefined) updateData.actual_start_time = actual_start_time;
        if (description !== undefined) updateData.description = description;

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({
                error: 'Bad request',
                message: 'No fields to update'
            });
        }

        const result = await sql`
            UPDATE event
            SET ${sql(updateData)}
            WHERE id = ${eventId}
            RETURNING *
        `;

        if (!result || result.length === 0) {
            return res.status(404).json({
                error: 'Not found',
                message: 'Event not found'
            });
        }

        res.json({
            message: 'Event updated successfully',
            event: result[0]
        });
    } catch (error) {
        console.error('Error updating event:', error);

        // Check for overlapping events constraint violation
        if (error.code === '23P01' || error.message?.includes('no_overlapping_events_at_location')) {
            return res.status(409).json({
                error: 'Conflict',
                message: 'This time slot is already occupied at the selected location. Please choose a different time or location.'
            });
        }

        res.status(500).json({
            error: 'Internal server error',
            message: 'Could not update event'
        });
    }
});

// Protected route to delete an event
router.delete('/:eventId', checkEventPermission, async (req, res) => {
    const { eventId } = req.params;

    try {
        const result = await sql`
            DELETE FROM event
            WHERE id = ${eventId}
            RETURNING id
        `;

        if (!result || result.length === 0) {
            return res.status(404).json({
                error: 'Not found',
                message: 'Event not found'
            });
        }

        res.json({
            message: 'Event deleted successfully',
            eventId: result[0].id
        });
    } catch (error) {
        console.error('Error deleting event:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Could not delete event'
        });
    }
});

// Protected route to add a new event
router.post('/add', checkEventPermission, async (req, res) => {
    const {
        name,
        club_id,
        location_id,
        tentative_start_time,
        duration_minutes,
        actual_start_time,
        description
    } = req.body;

    try {
        // Validate required fields
        if (!name || !club_id || !tentative_start_time || !duration_minutes) {
            return res.status(400).json({
                error: 'Bad request',
                message: 'Missing required fields: name, club_id, tentative_start_time, duration_minutes'
            });
        }

        const result = await sql`
            INSERT INTO event (
                name,
                club_id,
                location_id,
                tentative_start_time,
                duration_minutes,
                actual_start_time,
                description
            ) VALUES (
                ${name},
                ${club_id},
                ${location_id || null},
                ${tentative_start_time},
                ${duration_minutes},
                ${actual_start_time || null},
                ${description || null}
            )
            RETURNING *
        `;

        res.status(201).json({
            message: 'Event created successfully',
            event: result[0]
        });
    } catch (error) {
        console.error('Error creating event:', error);

        // Check for overlapping events constraint violation
        if (error.code === '23P01' || error.message?.includes('no_overlapping_events_at_location')) {
            return res.status(409).json({
                error: 'Conflict',
                message: 'This time slot is already occupied at the selected location. Please choose a different time or location.'
            });
        }

        res.status(500).json({
            error: 'Internal server error',
            message: 'Could not create event'
        });
    }
});

module.exports = router;