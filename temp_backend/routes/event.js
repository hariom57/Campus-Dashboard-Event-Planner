const express = require('express');
const router = express.Router();
const { Event, Club, Location, EventCategoryAlloted, UserPreferredCategory, UserNotPreferredCategory, UserPreferredClub, UserNotPreferredClub, sequelize } = require('../database/schemas');
const { userLoggedIn, userData } = require('../middlewares/userAuth');
const { checkEventPermission } = require('../middlewares/permissions/event');
const { Op } = require('sequelize');

// Protected route to get all current events
router.get('/all', userLoggedIn, async (req, res) => {
    try {
        const page = parseInt(req.query?.page) || 1;
        const limit = 10;
        const offset = (page - 1) * limit;

        const events = await Event.findAll({
            attributes: [
                'id',
                'name',
                'tentative_start_time',
                'duration_minutes',
                'actual_start_time',
                'description'
            ],
            include: [
                {
                    model: Club,
                    attributes: [['name', 'club_name']],
                    required: false
                },
                {
                    model: Location,
                    attributes: [['id', 'location_id'], ['name', 'location_name'], ['description', 'location_description'], ['images', 'location_images']],
                    required: false
                }
            ],
            where: {
                tentative_start_time: {
                    [Op.gte]: sequelize.literal('CURRENT_DATE')
                }
            },
            order: [['tentative_start_time', 'ASC']],
            limit: limit,
            offset: offset,
            raw: true,
            subQuery: false
        });

        res.json({ 
            events,
            currentPage: page
         });
    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Could not fetch events'
        });
    }
});

// Protected route to fetch total number of events
router.get('/count', userLoggedIn, async (req, res) => {
    try {
        const count = await Event.count()

        res.status(200).json({
            count,
            success: "true"
        })

    } catch (error) {
        console.error('Error fetching total number of events:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Could not fetch total number of events'
        });
    }
})

// Protected route to get events by venue/location ID
router.get('/venue/:venue_id', userLoggedIn, async (req, res) => {
    const { venue_id } = req.params;

    try {
        const events = await Event.findAll({
            attributes: [
                'id',
                'name',
                'tentative_start_time',
                'duration_minutes',
                'actual_start_time',
                'description'
            ],
            include: [
                {
                    model: Club,
                    attributes: [['name', 'club_name']],
                    required: false
                },
                {
                    model: Location,
                    attributes: [['id', 'location_id'], ['name', 'location_name'], ['description', 'location_description'], ['images', 'location_images']],
                    required: false
                }
            ],
            where: {
                location_id: venue_id,
                tentative_start_time: {
                    [Op.gte]: sequelize.literal('CURRENT_DATE')
                }
            },
            order: [['tentative_start_time', 'ASC']],
            raw: true,
            subQuery: false
        });

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
        const events = await Event.findAll({
            attributes: [
                'id',
                'name',
                'tentative_start_time',
                'duration_minutes',
                'actual_start_time',
                'description'
            ],
            include: [
                {
                    model: Club,
                    attributes: [['name', 'club_name']],
                    required: false
                },
                {
                    model: Location,
                    attributes: [['id', 'location_id'], ['name', 'location_name'], ['description', 'location_description'], ['images', 'location_images']],
                    required: false
                }
            ],
            where: sequelize.where(
                sequelize.cast(sequelize.col('tentative_start_time'), 'DATE'),
                Op.eq,
                sequelize.cast(date, 'DATE')
            ),
            order: [['tentative_start_time', 'ASC']],
            raw: true,
            subQuery: false
        });

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
        const events = await Event.findAll({
            attributes: [
                'id',
                'name',
                'tentative_start_time',
                'duration_minutes',
                'actual_start_time',
                'description'
            ],
            include: [
                {
                    model: Club,
                    attributes: [['name', 'club_name']],
                    required: false
                },
                {
                    model: Location,
                    attributes: [['id', 'location_id'], ['name', 'location_name'], ['description', 'location_description'], ['images', 'location_images']],
                    required: false
                }
            ],
            where: {
                id: eventId
            },
            raw: true,
            subQuery: false
        });
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

        const events = await Event.findAll({
            attributes: [
                'id',
                'name',
                'tentative_start_time',
                'duration_minutes',
                'actual_start_time',
                'description',
                [sequelize.col('Club.name'), 'club_name'],
                [sequelize.col('Location.id'), 'location_id'],
                [sequelize.col('Location.name'), 'location_name'],
                [sequelize.col('Location.description'), 'location_description'],
                [sequelize.col('Location.images'), 'location_images']
            ],
            include: [
                {
                    model: Club,
                    attributes: [], 
                    required: true,
                    include: [{
                        model: UserPreferredClub,
                        where: { user_id: req.user.user_id },
                        attributes: [],
                        required: true 
                    }]
                },
                {
                    model: Location,
                    attributes: [], 
                    required: false 
                }
            ],
            where: {
                tentative_start_time: {
                    [Op.gte]: new Date() 
                }
            },
            order: [['tentative_start_time', 'ASC']],
            raw: true,
            subQuery: false
        });

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
        const events = await Event.findAll({
            attributes: [
                'id',
                'name',
                'tentative_start_time',
                'duration_minutes',
                'actual_start_time',
                'description'
            ],
            include: [
                {
                    model: Club,
                    attributes: [['name', 'club_name']],
                    required: true
                },
                {
                    model: Location,
                    attributes: [['id', 'location_id'], ['name', 'location_name'], ['description', 'location_description'], ['images', 'location_images']],
                    required: false
                }
            ],
            where: {
                club_id: {
                    [Op.in]: sequelize.literal(`(SELECT club_id FROM user_not_preferred_club WHERE user_id = ${req.user.user_id})`)
                },
                tentative_start_time: {
                    [Op.gte]: sequelize.literal('CURRENT_DATE')
                }
            },
            order: [['tentative_start_time', 'ASC']],
            raw: true,
            subQuery: false
        });

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
        const events = await Event.findAll({
            attributes: [
                'id',
                'name',
                'tentative_start_time',
                'duration_minutes',
                'actual_start_time',
                'description'
            ],
            include: [
                {
                    model: Club,
                    attributes: [['name', 'club_name']],
                    required: false
                },
                {
                    model: Location,
                    attributes: [['id', 'location_id'], ['name', 'location_name'], ['description', 'location_description'], ['images', 'location_images']],
                    required: false
                }
            ],
            where: {
                id: {
                    [Op.in]: sequelize.literal(`(SELECT DISTINCT event_id FROM event_category_alloted WHERE event_category_id IN (SELECT event_category_id FROM user_preferred_category WHERE user_id = ${req.user.user_id}))`)
                },
                tentative_start_time: {
                    [Op.gte]: sequelize.literal('CURRENT_DATE')
                }
            },
            order: [['tentative_start_time', 'ASC']],
            raw: true,
            subQuery: false
        });

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
        const events = await Event.findAll({
            attributes: [
                'id',
                'name',
                'tentative_start_time',
                'duration_minutes',
                'actual_start_time',
                'description'
            ],
            include: [
                {
                    model: Club,
                    attributes: [['name', 'club_name']],
                    required: false
                },
                {
                    model: Location,
                    attributes: [['id', 'location_id'], ['name', 'location_name'], ['description', 'location_description'], ['images', 'location_images']],
                    required: false
                }
            ],
            where: {
                id: {
                    [Op.in]: sequelize.literal(`(SELECT DISTINCT event_id FROM event_category_alloted WHERE event_category_id IN (SELECT event_category_id FROM user_not_preferred_category WHERE user_id = ${req.user.user_id}))`)
                },
                tentative_start_time: {
                    [Op.gte]: sequelize.literal('CURRENT_DATE')
                }
            },
            order: [['tentative_start_time', 'ASC']],
            raw: true,
            subQuery: false
        });

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

        const result = await Event.update(updateData, {
            where: { id: eventId },
            returning: true
        });

        if (result[0] === 0) {
            return res.status(404).json({
                error: 'Not found',
                message: 'Event not found'
            });
        }

        res.json({
            message: 'Event updated successfully',
            event: result[1][0]
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
        const result = await Event.destroy({
            where: { id: eventId }
        });

        if (result === 0) {
            return res.status(404).json({
                error: 'Not found',
                message: 'Event not found'
            });
        }

        res.json({
            message: 'Event deleted successfully',
            eventId: eventId
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

        const result = await Event.create({
            name,
            club_id,
            location_id: location_id || null,
            tentative_start_time,
            duration_minutes,
            actual_start_time: actual_start_time || null,
            description: description || null
        });

        res.status(201).json({
            message: 'Event created successfully',
            event: result
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