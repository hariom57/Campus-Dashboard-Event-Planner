const express = require('express');
const router = express.Router();
const { Event, Club, Location, EventCategory, EventCategoryAlloted, UserPreferredCategory, UserNotPreferredCategory, UserPreferredClub, UserNotPreferredClub, sequelize } = require('../database/schemas');
const { userLoggedIn, userData } = require('../middlewares/userAuth');
const { checkEventPermission } = require('../middlewares/permissions/event');
const { Op } = require('sequelize');

class NotFoundError extends Error {
    constructor(message) {
        super(message);
        this.name = 'NotFoundError';
    }
}

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

const getPaginationParams = (req) => {
    const parsedPage = Number.parseInt(req.query?.page, 10);
    const parsedLimit = Number.parseInt(req.query?.limit, 10);

    const page = Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : DEFAULT_PAGE;
    const limit = Number.isInteger(parsedLimit) && parsedLimit > 0
        ? Math.min(parsedLimit, MAX_LIMIT)
        : DEFAULT_LIMIT;
    const offset = (page - 1) * limit;

    return { page, limit, offset };
};

const buildPaginationMeta = (count, page, limit) => ({
    currentPage: page,
    pageSize: limit,
    totalEvents: count,
    totalPages: Math.max(1, Math.ceil(count / limit))
});

const normalizeCategoryIds = (categoryIds) => {
    if (!Array.isArray(categoryIds)) return [];

    return categoryIds
        .map((id) => Number.parseInt(id, 10))
        .filter((id) => Number.isInteger(id) && id > 0);
};

// Protected route to get all current events
router.get('/all', userLoggedIn, async (req, res) => {
    try {
        const { page, limit, offset } = getPaginationParams(req);
        const whereClause = {
            tentative_start_time: {
                [Op.gte]: sequelize.literal('CURRENT_DATE')
            }
        };

        const [count, events] = await Promise.all([
            Event.count({ where: whereClause }),
            Event.findAll({
                attributes: [
                    'id',
                    'name',
                    'club_id',
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
                where: whereClause,
                order: [['tentative_start_time', 'ASC']],
                limit: limit,
                offset: offset,
                raw: true,
                subQuery: false
            })
        ]);

        const eventIds = events.map((ev) => ev.id);

        let categoryRows = [];
        if (eventIds.length > 0) {
            categoryRows = await EventCategoryAlloted.findAll({
                where: {
                    event_id: {
                        [Op.in]: eventIds,
                    },
                },
                attributes: ['event_id', 'event_category_id'],
                raw: true,
            });
        }

        const categoryIds = Array.from(new Set(categoryRows.map((row) => row.event_category_id)));
        const categories = categoryIds.length > 0
            ? await EventCategory.findAll({
                where: {
                    id: {
                        [Op.in]: categoryIds,
                    },
                },
                attributes: ['id', 'name'],
                raw: true,
            })
            : [];

        const categoryNameById = new Map(categories.map((cat) => [Number(cat.id), cat.name]));
        const categoryIdsByEventId = new Map();

        for (const row of categoryRows) {
            const eventId = Number(row.event_id);
            const catId = Number(row.event_category_id);
            const existing = categoryIdsByEventId.get(eventId) || [];
            existing.push(catId);
            categoryIdsByEventId.set(eventId, existing);
        }

        const enrichedEvents = events.map((ev) => {
            const ids = categoryIdsByEventId.get(Number(ev.id)) || [];
            const names = ids
                .map((id) => categoryNameById.get(id))
                .filter(Boolean);

            return {
                ...ev,
                category_ids: ids,
                categories: names.join(', '),
            };
        });

        res.json({
            events: enrichedEvents,
            ...buildPaginationMeta(count, page, limit)
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
        const { page, limit, offset } = getPaginationParams(req);

        const { rows: events, count } = await Event.findAndCountAll({
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
            order: [['tentative_start_time', 'DESC']],
            limit,
            offset,
            raw: true,
            subQuery: false,
            distinct: true,
            col: 'Event.id'
        });

        res.json({
            events,
            ...buildPaginationMeta(count, page, limit)
        });
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
        const { page, limit, offset } = getPaginationParams(req);

        const { rows: events, count } = await Event.findAndCountAll({
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
            order: [['tentative_start_time', 'DESC']],
            limit,
            offset,
            raw: true,
            subQuery: false,
            distinct: true,
            col: 'Event.id'
        });

        res.json({
            events,
            ...buildPaginationMeta(count, page, limit)
        });
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
        const event = await Event.findByPk(eventId, {
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
                },
                {
                    model: EventCategory,
                    attributes: ['id', 'name'],
                    through: { attributes: [] },
                    required: false
                }
            ],
            subQuery: false
        });

        if (!event) {
            return res.status(404).json({
                error: 'Not found',
                message: 'Event not found'
            });
        }

        const plainEvent = event.toJSON();
        const categories = Array.isArray(plainEvent.EventCategories) ? plainEvent.EventCategories : [];

        res.json({
            event: {
                ...plainEvent,
                category_ids: categories.map((cat) => cat.id),
                categories,
            }
        });
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
        const { page, limit, offset } = getPaginationParams(req);

        const { rows: events, count } = await Event.findAndCountAll({
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
            order: [['tentative_start_time', 'DESC']],
            limit,
            offset,
            raw: true,
            subQuery: false,
            distinct: true,
            col: 'Event.id'
        });

        res.json({
            events,
            ...buildPaginationMeta(count, page, limit)
        });
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
        const { page, limit, offset } = getPaginationParams(req);

        const { rows: events, count } = await Event.findAndCountAll({
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
            order: [['tentative_start_time', 'DESC']],
            limit,
            offset,
            raw: true,
            subQuery: false,
            distinct: true,
            col: 'Event.id'
        });

        res.json({
            events,
            ...buildPaginationMeta(count, page, limit)
        });
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
        const { page, limit, offset } = getPaginationParams(req);

        const { rows: events, count } = await Event.findAndCountAll({
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
            order: [['tentative_start_time', 'DESC']],
            limit,
            offset,
            raw: true,
            subQuery: false,
            distinct: true,
            col: 'Event.id'
        });

        res.json({
            events,
            ...buildPaginationMeta(count, page, limit)
        });
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
        const { page, limit, offset } = getPaginationParams(req);

        const { rows: events, count } = await Event.findAndCountAll({
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
            order: [['tentative_start_time', 'DESC']],
            limit,
            offset,
            raw: true,
            subQuery: false,
            distinct: true,
            col: 'Event.id'
        });

        res.json({
            events,
            ...buildPaginationMeta(count, page, limit)
        });
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
        description,
        category_ids
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

        let updatedEvent;
        await sequelize.transaction(async (t) => {
            const result = await Event.update(updateData, {
                where: { id: eventId },
                returning: true,
                transaction: t
            });

            if (result[0] === 0) {
                throw new NotFoundError('Event not found');
            }

            updatedEvent = result[1][0];

            if (category_ids !== undefined) {
                const normalizedCategoryIds = normalizeCategoryIds(category_ids);

                await EventCategoryAlloted.destroy({
                    where: { event_id: eventId },
                    transaction: t
                });

                if (normalizedCategoryIds.length > 0) {
                    const rows = normalizedCategoryIds.map((categoryId) => ({
                        event_id: eventId,
                        event_category_id: categoryId
                    }));

                    await EventCategoryAlloted.bulkCreate(rows, { transaction: t });
                }
            }
        });

        res.json({
            message: 'Event updated successfully',
            event: updatedEvent
        });
    } catch (error) {
        console.error('Error updating event:', error);

        if (error.name === 'NotFoundError') {
            return res.status(404).json({
                error: 'Not found',
                message: error.message
            });
        }

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
        description,
        category_ids
    } = req.body;

    try {
        // Validate required fields
        if (!name || !club_id || !tentative_start_time || !duration_minutes) {
            return res.status(400).json({
                error: 'Bad request',
                message: 'Missing required fields: name, club_id, tentative_start_time, duration_minutes'
            });
        }

        const normalizedCategoryIds = normalizeCategoryIds(category_ids);

        let createdEvent;
        await sequelize.transaction(async (t) => {
            createdEvent = await Event.create({
                name,
                club_id,
                location_id: location_id || null,
                tentative_start_time,
                duration_minutes,
                actual_start_time: actual_start_time || null,
                description: description || null
            }, { transaction: t });

            if (normalizedCategoryIds.length > 0) {
                const rows = normalizedCategoryIds.map((categoryId) => ({
                    event_id: createdEvent.id,
                    event_category_id: categoryId
                }));

                await EventCategoryAlloted.bulkCreate(rows, { transaction: t });
            }
        });

        res.status(201).json({
            message: 'Event created successfully',
            event: createdEvent
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