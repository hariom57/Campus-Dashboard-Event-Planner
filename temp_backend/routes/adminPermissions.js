const express = require('express');
const router = express.Router();
const sql = require('../database/connection');
const { checkAdminPermissionsManage } = require('../middlewares/permissions/adminPermissionsManage');

// Protected route to get all admin permissions
router.get('/all', checkAdminPermissionsManage, async (req, res) => {
    try {
        const permissions = await sql`
            SELECT id, name
            FROM admin_permission
            ORDER BY id ASC
        `;

        res.json({ permissions });
    } catch (error) {
        console.error('Error fetching permissions:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Could not fetch permissions'
        });
    }
});

// Protected route to get a specific admin permission by ID
router.get('/:permissionId', checkAdminPermissionsManage, async (req, res) => {
    const { permissionId } = req.params;

    try {
        const permissions = await sql`
            SELECT id, name
            FROM admin_permission
            WHERE id = ${permissionId}
        `;

        if (!permissions || permissions.length === 0) {
            return res.status(404).json({
                error: 'Not found',
                message: 'Permission not found'
            });
        }

        res.json({ permission: permissions[0] });
    } catch (error) {
        console.error('Error fetching permission:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Could not fetch permission'
        });
    }
});

// Protected route to update an admin permission by ID
router.patch('/:permissionId', checkAdminPermissionsManage, async (req, res) => {
    const { permissionId } = req.params;
    const { name } = req.body;

    try {
        if (!name) {
            return res.status(400).json({
                error: 'Bad request',
                message: 'Missing required field: name'
            });
        }

        const result = await sql`
            UPDATE admin_permission
            SET name = ${name}
            WHERE id = ${permissionId}
            RETURNING *
        `;

        if (!result || result.length === 0) {
            return res.status(404).json({
                error: 'Not found',
                message: 'Permission not found'
            });
        }

        res.json({
            message: 'Permission updated successfully',
            permission: result[0]
        });
    } catch (error) {
        console.error('Error updating permission:', error);

        if (error.code === '23505') {
            return res.status(409).json({
                error: 'Conflict',
                message: 'A permission with this name already exists'
            });
        }

        res.status(500).json({
            error: 'Internal server error',
            message: 'Could not update permission'
        });
    }
});

// Protected route to delete an admin permission by ID
router.delete('/:permissionId', checkAdminPermissionsManage, async (req, res) => {
    const { permissionId } = req.params;

    try {
        const result = await sql`
            DELETE FROM admin_permission
            WHERE id = ${permissionId}
            RETURNING id
        `;

        if (!result || result.length === 0) {
            return res.status(404).json({
                error: 'Not found',
                message: 'Permission not found'
            });
        }

        res.json({
            message: 'Permission deleted successfully',
            permissionId: result[0].id
        });
    } catch (error) {
        console.error('Error deleting permission:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Could not delete permission'
        });
    }
});

module.exports = router;
