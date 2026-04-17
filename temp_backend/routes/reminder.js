const express = require('express');
const { Op } = require('sequelize');
const { Reminder, Event, Club, Location, sequelize } = require('../database/schemas');
const { userData } = require('../middlewares/userAuth');

const router = express.Router();

const normalizeOffsetsMinutes = (offsets) => {
    if (!Array.isArray(offsets)) return [];

    const normalized = offsets
        .map((value) => Number(value))
        .filter((value) => Number.isFinite(value) && value > 0)
        .map((value) => Math.floor(value));

    return Array.from(new Set(normalized)).sort((a, b) => b - a);
};

const parseEventId = (value) => {
    if (!/^\d+$/.test(String(value))) return null;
    const parsed = Number.parseInt(String(value), 10);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const buildReminderTime = (eventStart, offsetMinutes) => {
    const startMs = new Date(eventStart).getTime();
    if (!Number.isFinite(startMs)) return null;

    return new Date(startMs - offsetMinutes * 60 * 1000);
};

router.get('/', userData, async (req, res) => {
    try {
        const userId = req.user.user_id;

        const rows = await Reminder.findAll({
            where: { user_id: userId },
            include: [
                {
                    model: Event,
                    required: true,
                    include: [
                        { model: Club, required: false, attributes: ['name'] },
                        { model: Location, required: false, attributes: ['name'] },
                    ],
                    attributes: ['id', 'name', 'tentative_start_time'],
                },
            ],
            order: [[Event, 'tentative_start_time', 'ASC'], ['offset_minutes', 'DESC']],
        });

        const grouped = new Map();

        rows.forEach((row) => {
            const event = row.Event;
            if (!event) return;

            const eventId = String(event.id);
            const existing = grouped.get(eventId) || {
                id: eventId,
                name: event.name,
                tentative_start_time: event.tentative_start_time,
                location_name: event.Location?.name || 'Campus',
                club_name: event.Club?.name || 'IITR Campus',
                offsetsMinutes: [],
            };

            existing.offsetsMinutes.push(Number(row.offset_minutes));
            grouped.set(eventId, existing);
        });

        const reminders = Array.from(grouped.values()).map((entry) => ({
            ...entry,
            offsetsMinutes: normalizeOffsetsMinutes(entry.offsetsMinutes),
        }));

        res.json({ reminders });
    } catch (error) {
        console.error('Error fetching reminders:', error);
        res.status(500).json({ error: 'Internal server error', message: 'Could not fetch reminders' });
    }
});

router.put('/:eventId', userData, async (req, res) => {
    const eventId = parseEventId(req.params.eventId);
    if (!eventId) {
        return res.status(400).json({ error: 'Bad request', message: 'Invalid event id' });
    }

    const offsetsMinutes = normalizeOffsetsMinutes(req.body?.offsetsMinutes);
    if (offsetsMinutes.length === 0) {
        return res.status(400).json({ error: 'Bad request', message: 'At least one reminder offset is required' });
    }

    try {
        const userId = req.user.user_id;

        const event = await Event.findByPk(eventId, {
            include: [
                { model: Club, required: false, attributes: ['name'] },
                { model: Location, required: false, attributes: ['name'] },
            ],
            attributes: ['id', 'name', 'tentative_start_time'],
        });

        if (!event) {
            return res.status(404).json({ error: 'Not found', message: 'Event not found' });
        }

        const eventStart = new Date(event.tentative_start_time).getTime();
        if (!Number.isFinite(eventStart) || eventStart <= Date.now()) {
            return res.status(400).json({ error: 'Bad request', message: 'Event has already started' });
        }

        await sequelize.transaction(async (transaction) => {
            await Reminder.destroy({ where: { event_id: eventId, user_id: userId }, transaction });

            const rows = offsetsMinutes
                .map((offset) => {
                    const reminderTime = buildReminderTime(event.tentative_start_time, offset);
                    if (!reminderTime) return null;
                    return {
                        event_id: eventId,
                        user_id: userId,
                        offset_minutes: offset,
                        reminder_time: reminderTime,
                    };
                })
                .filter(Boolean);

            if (rows.length > 0) {
                await Reminder.bulkCreate(rows, { transaction });
            }
        });

        res.json({
            reminder: {
                id: String(event.id),
                name: event.name,
                tentative_start_time: event.tentative_start_time,
                location_name: event.Location?.name || 'Campus',
                club_name: event.Club?.name || 'IITR Campus',
                offsetsMinutes,
            },
        });
    } catch (error) {
        console.error('Error upserting reminders:', error);
        res.status(500).json({ error: 'Internal server error', message: 'Could not update reminders' });
    }
});

router.delete('/:eventId', userData, async (req, res) => {
    const eventId = parseEventId(req.params.eventId);
    if (!eventId) {
        return res.status(400).json({ error: 'Bad request', message: 'Invalid event id' });
    }

    try {
        const userId = req.user.user_id;
        await Reminder.destroy({
            where: {
                event_id: eventId,
                user_id: userId,
            },
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting reminder:', error);
        res.status(500).json({ error: 'Internal server error', message: 'Could not delete reminder' });
    }
});

router.delete('/', userData, async (req, res) => {
    try {
        const userId = req.user.user_id;
        const eventIds = Array.isArray(req.body?.eventIds)
            ? req.body.eventIds.map(parseEventId).filter(Boolean)
            : [];

        if (eventIds.length === 0) {
            return res.status(400).json({ error: 'Bad request', message: 'eventIds is required' });
        }

        await Reminder.destroy({
            where: {
                user_id: userId,
                event_id: { [Op.in]: eventIds },
            },
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting reminders:', error);
        res.status(500).json({ error: 'Internal server error', message: 'Could not delete reminders' });
    }
});

module.exports = router;
