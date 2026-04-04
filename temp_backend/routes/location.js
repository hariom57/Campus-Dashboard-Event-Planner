const express = require('express');
const router = express.Router();
const { Location } = require('../database/schemas');
const { userLoggedIn } = require('../middlewares/userAuth');
const { checkLocationPermission } = require('../middlewares/permissions/location');

// Protected route to get all locations
router.get('/all', userLoggedIn, async (req, res) => {
    try {
        const locations = await Location.findAll({
            attributes: ['id', 'name', 'location_url', 'latitude', 'longitude', 'description', 'images'],
            order: [['name', 'ASC']],
        });
        res.json({ locations });
    } catch (error) {
        console.error('Error fetching locations:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Could not fetch locations'
        });
    }
});

// Protected route to get particular location details by location ID
router.get('/:locationId', userLoggedIn, async (req, res) => {
    const { locationId } = req.params;
    try {
        const locations = await Location.findAll({
            attributes: ['id', 'name', 'location_url', 'latitude', 'longitude', 'description', 'images'],
            where: { id: locationId },
        });
        res.json({ locations });
    } catch (error) {
        console.error('Error fetching location:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Could not fetch location'
        });
    }
});

// Protected route to add a new location
router.post('/add', checkLocationPermission, async (req, res) => {
    const {
        name,
        location_url,
        latitude,
        longitude,
        description,
        images
    } = req.body;

    try {
        // Validate required fields
        if (!name) {
            return res.status(400).json({
                error: 'Bad request',
                message: 'Missing required field: name'
            });
        }

        const result = await Location.create({
            name,
            location_url: location_url || null,
            latitude: latitude || null,
            longitude: longitude || null,
            description: description || null,
            images: images || null,
        });

        res.status(201).json({
            message: 'Location created successfully',
            location: result
        });
    } catch (error) {
        console.error('Error creating location:', error);

        // Check for unique constraint violation
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({
                error: 'Conflict',
                message: 'A location with this name already exists'
            });
        }

        res.status(500).json({
            error: 'Internal server error',
            message: 'Could not create location'
        });
    }
});

// Protected route to update a location
router.patch('/:locationId', checkLocationPermission, async (req, res) => {
    const { locationId } = req.params;
    const {
        name,
        location_url,
        latitude,
        longitude,
        description,
        images
    } = req.body;

    try {
        // Build update object with only provided fields
        const updateData = {};
        if (name !== undefined) updateData.name = name;
        if (location_url !== undefined) updateData.location_url = location_url;
        if (latitude !== undefined) updateData.latitude = latitude;
        if (longitude !== undefined) updateData.longitude = longitude;
        if (description !== undefined) updateData.description = description;
        if (images !== undefined) updateData.images = images;

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({
                error: 'Bad request',
                message: 'No fields to update'
            });
        }

        const [affectedRows, updatedLocations] = await Location.update(updateData, {
            where: { id: locationId },
            returning: true,
        });

        if (affectedRows === 0) {
            return res.status(404).json({
                error: 'Not found',
                message: 'Location not found'
            });
        }

        res.json({
            message: 'Location updated successfully',
            location: updatedLocations[0]
        });
    } catch (error) {
        console.error('Error updating location:', error);

        // Check for unique constraint violation
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({
                error: 'Conflict',
                message: 'A location with this name already exists'
            });
        }

        res.status(500).json({
            error: 'Internal server error',
            message: 'Could not update location'
        });
    }
});

// Protected route to delete a location
router.delete('/:locationId', checkLocationPermission, async (req, res) => {
    const { locationId } = req.params;

    try {
        const result = await Location.findOne({ where: { id: locationId }, attributes: ['id'] });

        if (!result) {
            return res.status(404).json({
                error: 'Not found',
                message: 'Location not found'
            });
        }

        await result.destroy();

        res.json({
            message: 'Location deleted successfully',
            locationId: result.id
        });
    } catch (error) {
        console.error('Error deleting location:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Could not delete location'
        });
    }
});

module.exports = router;