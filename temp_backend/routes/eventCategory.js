const express = require('express');
const router = express.Router();
const { EventCategory } = require('../database/schemas');
const { userLoggedIn } = require('../middlewares/userAuth');
const { checkEventCategoryPermission } = require('../middlewares/permissions/eventCategory');

// Protected route to get all event categories
router.get('/all', userLoggedIn, async (req, res) => {
    try {
        const categories = await EventCategory.findAll({
            attributes: ['id', 'name'],
            order: [['name', 'ASC']],
        });
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
        const categories = await EventCategory.findAll({
            attributes: ['id', 'name'],
            where: { id: categoryId },
        });
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

        const category = await EventCategory.create({ name });

        res.status(201).json({
            message: 'Category created successfully',
            category,
        });
    } catch (error) {
        console.error('Error creating category:', error);

        if (error.name === 'SequelizeUniqueConstraintError') {
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

        const [affectedRows, updatedCategories] = await EventCategory.update(
            { name },
            { where: { id: categoryId }, returning: true }
        );

        if (affectedRows === 0) {
            return res.status(404).json({
                error: 'Not found',
                message: 'Category not found'
            });
        }

        res.json({
            message: 'Category updated successfully',
            category: updatedCategories[0],
        });
    } catch (error) {
        console.error('Error updating category:', error);

        if (error.name === 'SequelizeUniqueConstraintError') {
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
        const category = await EventCategory.findOne({ where: { id: categoryId }, attributes: ['id'] });

        if (!category) {
            return res.status(404).json({
                error: 'Not found',
                message: 'Category not found'
            });
        }

        await category.destroy();

        res.json({
            message: 'Category deleted successfully',
            categoryId: category.id,
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