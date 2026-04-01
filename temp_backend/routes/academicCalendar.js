const express = require('express');
const router = express.Router();
const academicCalendar = require('../data/academicCalendar');

/**
 * GET All Academic Calendar Events
 * Serve the hardcoded calendar data.
 */
router.get('/', (req, res) => {
    res.json({
        total: academicCalendar.length,
        data: academicCalendar,
    });
});

/**
 * GET Specific Academic Calendar Event by ID (example only)
 */
router.get('/:id', (req, res) => {
    const event = academicCalendar.find(e => e.id === req.params.id);
    if (!event) {
        return res.status(404).json({ message: 'Event not found' });
    }
    res.json(event);
});

module.exports = router;
