const express = require('express');
const router = express.Router();
const { UserTodo } = require('../database/schemas/index');
const { userData } = require('../middlewares/userAuth');

// GET /todos — fetch all todos for the authenticated user
router.get('/', userData, async (req, res) => {
    try {
        const userId = req.user.user_id;
        const todos = await UserTodo.findAll({
            where: { user_id: userId },
            order: [['created_at', 'DESC']],
            raw: true,
        });
        res.json({ todos });
    } catch (error) {
        console.error('Error fetching todos:', error);
        res.status(500).json({ error: 'Internal server error', message: 'Could not fetch todos' });
    }
});

// POST /todos — create a new todo
router.post('/', userData, async (req, res) => {
    try {
        const userId = req.user.user_id;
        const { text, notes, due_date, due_time, linked_event_id, linked_event_name, linked_event_club, linked_event_date } = req.body;

        if (!text || !String(text).trim()) {
            return res.status(400).json({ error: 'Bad request', message: 'Todo text is required' });
        }

        const todo = await UserTodo.create({
            user_id: userId,
            text: String(text).trim(),
            notes: notes || null,
            due_date: due_date || null,
            due_time: due_time || null,
            linked_event_id: linked_event_id || null,
            linked_event_name: linked_event_name || null,
            linked_event_club: linked_event_club || null,
            linked_event_date: linked_event_date || null,
            completed: false,
        });

        res.status(201).json({ todo: todo.toJSON() });
    } catch (error) {
        console.error('Error creating todo:', error);
        res.status(500).json({ error: 'Internal server error', message: 'Could not create todo' });
    }
});

// PATCH /todos/:id — update any todo field
router.patch('/:id', userData, async (req, res) => {
    try {
        const userId = req.user.user_id;
        const todoId = req.params.id;
        const { completed, text, notes, due_date, due_time } = req.body;

        const todo = await UserTodo.findOne({ where: { id: todoId, user_id: userId } });
        if (!todo) {
            return res.status(404).json({ error: 'Not found', message: 'Todo not found' });
        }

        const updateData = {};
        if (completed !== undefined) updateData.completed = completed;
        if (text !== undefined && String(text).trim()) updateData.text = String(text).trim();
        if (notes !== undefined) updateData.notes = notes;
        if (due_date !== undefined) updateData.due_date = due_date;
        if (due_time !== undefined) updateData.due_time = due_time;

        await todo.update(updateData);
        res.json({ todo: todo.toJSON() });
    } catch (error) {
        console.error('Error updating todo:', error);
        res.status(500).json({ error: 'Internal server error', message: 'Could not update todo' });
    }
});

// DELETE /todos/:id — delete a specific todo
router.delete('/:id', userData, async (req, res) => {
    try {
        const userId = req.user.user_id;
        const todoId = req.params.id;

        const deleted = await UserTodo.destroy({ where: { id: todoId, user_id: userId } });
        if (!deleted) {
            return res.status(404).json({ error: 'Not found', message: 'Todo not found' });
        }

        res.json({ success: true, message: 'Todo deleted' });
    } catch (error) {
        console.error('Error deleting todo:', error);
        res.status(500).json({ error: 'Internal server error', message: 'Could not delete todo' });
    }
});

module.exports = router;
