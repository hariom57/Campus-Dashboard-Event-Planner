const express = require('express');
const router = express.Router();
const sql = require('../database/connection');
const { checkManageClubAdminsPermission } = require('../middlewares/permissions/manageClubAdmins');
const { checkClubAdmin } = require('../middlewares/clubAdminAuth');

// Route to get clubs where logged-in user is admin
router.get('/clubs', checkClubAdmin, async (req, res) => {
    try {
        const clubIds = req.club_admin.club_ids;

        const clubs = await sql`
            SELECT id, name, email, description, logo_url
            FROM club
            WHERE id = ANY(${sql.array(clubIds)}::bigint[])
            ORDER BY name ASC
        `;

        return res.json({ clubs });
    } catch (error) {
        console.error('Error fetching clubs for logged-in user:', error);
        return res.status(500).json({
            error: 'Internal server error',
            message: 'Could not fetch clubs'
        });
    }
});

// Protected route to get all admins for a club
router.get('/club/:clubId', checkManageClubAdminsPermission, async (req, res) => {
    const { clubId } = req.params;

    try {
        const admins = await sql`
            SELECT u.user_id, u.full_name, u.email
            FROM club_admin ca
            INNER JOIN "user" u ON u.user_id = ca.user_id
            WHERE ca.club_id = ${clubId}
            ORDER BY u.full_name ASC
        `;

        res.json({ admins });
    } catch (error) {
        console.error('Error fetching club admins:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Could not fetch club admins'
        });
    }
});

// Protected route to get a specific club admin by user ID
router.get('/club/:clubId/:userId', checkManageClubAdminsPermission, async (req, res) => {
    const { clubId, userId } = req.params;

    try {
        const admins = await sql`
            SELECT u.user_id, u.full_name, u.email
            FROM club_admin ca
            INNER JOIN "user" u ON u.user_id = ca.user_id
            WHERE ca.club_id = ${clubId}
            AND ca.user_id = ${userId}
        `;

        if (!admins || admins.length === 0) {
            return res.status(404).json({
                error: 'Not found',
                message: 'Club admin not found'
            });
        }

        res.json({ admin: admins[0] });
    } catch (error) {
        console.error('Error fetching club admin:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Could not fetch club admin'
        });
    }
});

// Protected route to add a club admin
router.post('/club/:clubId/add', checkManageClubAdminsPermission, async (req, res) => {
    const { clubId } = req.params;
    const { user_id } = req.body;

    try {
        if (!user_id) {
            return res.status(400).json({
                error: 'Bad request',
                message: 'user_id is required'
            });
        }

        const existing = await sql`
            SELECT 1
            FROM club_admin
            WHERE club_id = ${clubId}
            AND user_id = ${user_id}
        `;

        if (existing && existing.length > 0) {
            return res.status(409).json({
                error: 'Conflict',
                message: 'User is already a club admin'
            });
        }

        await sql`
            INSERT INTO club_admin (club_id, user_id)
            VALUES (${clubId}, ${user_id})
        `;

        res.status(201).json({
            message: 'Club admin added successfully'
        });
    } catch (error) {
        console.error('Error adding club admin:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Could not add club admin'
        });
    }
});

// Protected route to delete a club admin
router.delete('/club/:clubId/:userId', checkManageClubAdminsPermission, async (req, res) => {
    const { clubId, userId } = req.params;

    try {
        const result = await sql`
            DELETE FROM club_admin
            WHERE club_id = ${clubId}
            AND user_id = ${userId}
            RETURNING user_id
        `;

        if (!result || result.length === 0) {
            return res.status(404).json({
                error: 'Not found',
                message: 'Club admin not found'
            });
        }

        res.json({
            message: 'Club admin removed successfully',
            user_id: result[0].user_id
        });
    } catch (error) {
        console.error('Error removing club admin:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Could not remove club admin'
        });
    }
});

module.exports = router;