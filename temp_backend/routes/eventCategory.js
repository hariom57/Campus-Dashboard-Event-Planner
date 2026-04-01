const express = require('express');
const router = express.Router();
const sql = require('../database/connection');
const { userLoggedIn } = require('../middlewares/userAuth');
const { checkEventCategoryPermission } = require('../middlewares/permissions/eventCategory');

// Protected route to get all event categories
router.get('/all', userLoggedIn, async (req, res) => {
    try {
        const categories = await sql`
            SELECT id, name
            FROM event_category
            ORDER BY name ASC
        `;
        res.json({ categories });
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Could not fetch categories'
        });
    }
});

// Protected route to get a particular event category by ID
router.get('/:categoryId', userLoggedIn, async (req, res) => {
    const { categoryId } = req.params;
    try {
        const categories = await sql`
            SELECT id, name
            FROM event_category
            WHERE id = ${categoryId}
        `;
        res.json({ categories });
    } catch (error) {
        console.error('Error fetching category:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Could not fetch category'
        });
    }
});

// Protected route to add a new event category
router.post('/add', checkEventCategoryPermission, async (req, res) => {
    const { name } = req.body;

    try {
        if (!name) {
            return res.status(400).json({
                error: 'Bad request',
                message: 'Missing required field: name'
            });
        }

        const result = await sql`
            INSERT INTO event_category (name)
            VALUES (${name})
            RETURNING *
        `;

        res.status(201).json({
            message: 'Category created successfully',
            category: result[0]
        });
    } catch (error) {
        console.error('Error creating category:', error);

        if (error.code === '23505') {
            return res.status(409).json({
                error: 'Conflict',
                message: 'A category with this name already exists'
            });
        }

        res.status(500).json({
            error: 'Internal server error',
            message: 'Could not create category'
        });
    }
});

// Protected route to update an event category
router.patch('/:categoryId', checkEventCategoryPermission, async (req, res) => {
    const { categoryId } = req.params;
    const { name } = req.body;

    try {
        if (!name) {
            return res.status(400).json({
                error: 'Bad request',
                message: 'Missing required field: name'
            });
        }

        const result = await sql`
            UPDATE event_category
            SET name = ${name}
            WHERE id = ${categoryId}
            RETURNING *
        `;

        if (!result || result.length === 0) {
            return res.status(404).json({
                error: 'Not found',
                message: 'Category not found'
            });
        }

        res.json({
            message: 'Category updated successfully',
            category: result[0]
        });
    } catch (error) {
        console.error('Error updating category:', error);

        if (error.code === '23505') {
            return res.status(409).json({
                error: 'Conflict',
                message: 'A category with this name already exists'
            });
        }

        res.status(500).json({
            error: 'Internal server error',
            message: 'Could not update category'
        });
    }
});

// Protected route to delete an event category
router.delete('/:categoryId', checkEventCategoryPermission, async (req, res) => {
    const { categoryId } = req.params;

    try {
        const result = await sql`
            DELETE FROM event_category
            WHERE id = ${categoryId}
            RETURNING id
        `;

        if (!result || result.length === 0) {
            return res.status(404).json({
                error: 'Not found',
                message: 'Category not found'
            });
        }

        res.json({
            message: 'Category deleted successfully',
            categoryId: result[0].id
        });
    } catch (error) {
        console.error('Error deleting category:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Could not delete category'
        });
    }
});

module.exports = router;
