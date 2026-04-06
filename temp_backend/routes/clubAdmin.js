const express = require('express');
const router = express.Router();
// const sql = require('../database/connection');
const { ClubAdmin, User } = require('../database/schemas');
const { checkManageClubAdminsPermission } = require('../middlewares/permissions/manageClubAdmins');

// Protected route to get all admins for a club
router.get('/club/:clubId', checkManageClubAdminsPermission, async (req, res) => {
    const { clubId } = req.params;

    try {
        // const admins = await sql`
        //     SELECT u.user_id, u.full_name, u.email
        //     FROM club_admin ca
        //     INNER JOIN "user" u ON u.user_id = ca.user_id
        //     WHERE ca.club_id = ${clubId}
        //     ORDER BY u.full_name ASC
        // `;

        const admins = await User.findAll({
            attributes: ['user_id', 'full_name', 'email', 'enrolment_number'],
            include: [{
                model: ClubAdmin,
                attributes: [],
                where: { club_id: clubId },
                required: true
            }],
            order: [['full_name', 'ASC']],
            raw: true,
            nest: true
        });
        console.log(admins)

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
        //  const admins = await sql`
        //     SELECT u.user_id, u.full_name, u.email
        //     FROM club_admin ca
        //     INNER JOIN "user" u ON u.user_id = ca.user_id
        //     WHERE ca.club_id = ${clubId}
        //     AND ca.user_id = ${userId}
        // `;

        // if (!admins || admins.length === 0) {
        const admin = await ClubAdmin.findOne({
            where: { club_id: clubId, user_id: userId },
            include: [{
                model: User,
                attributes: ['user_id', 'full_name', 'email', 'enrolment_number'],
            }],
        });

        if (!admin) {
            return res.status(404).json({
                error: 'Not found',
                message: 'Club admin not found'
            });
        }
        // res.json({ admin: admins[0] });

        res.json({
            admin: {
                user_id: admin.User.user_id,
                full_name: admin.User.full_name,
                email: admin.User.email,
                enrolment_number: admin.User.enrolment_number,
            }
        });
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
    const { user_id, enrolment_number } = req.body;

    try {
        if (!user_id && !enrolment_number) {
            return res.status(400).json({
                error: 'Bad request',
                message: 'user_id or enrolment_number is required'
            });
        }

        const user = user_id
            ? await User.findByPk(user_id, { attributes: ['user_id'] })
            : await User.findOne({
                where: { enrolment_number: String(enrolment_number || '').trim() },
                attributes: ['user_id']
            });

        if (!user) {
            return res.status(404).json({
                error: 'Not found',
                message: 'User not found'
            });
        }

        const resolvedUserId = user.user_id;

        // const existing = await sql`
        //     SELECT 1
        //     FROM club_admin
        //     WHERE club_id = ${clubId}
        //     AND user_id = ${user_id}
        // `;

        // if (existing && existing.length > 0) {
        //     return res.status(409).json({
        //         error: 'Conflict',
        //         message: 'User is already a club admin'
        //     });
        // }

        // await sql`
        //     INSERT INTO club_admin (club_id, user_id)
        //     VALUES (${clubId}, ${user_id})
        // `;


        const existing = await ClubAdmin.findOne({
            where: { club_id: clubId, user_id: resolvedUserId },
        });

        if (existing) {
            return res.status(409).json({
                error: 'Conflict',
                message: 'User is already a club admin'
            });
        }

        await ClubAdmin.create({ club_id: clubId, user_id: resolvedUserId });

        res.status(201).json({
            message: 'Club admin added successfully',
            user_id: resolvedUserId,
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
        const admin = await ClubAdmin.findOne({
            where: { club_id: clubId, user_id: userId },
        });

        if (!admin) {
            return res.status(404).json({
                error: 'Not found',
                message: 'Club admin not found'
            });
        }
        await admin.destroy();

        res.json({
            message: 'Club admin removed successfully',
            user_id: admin.user_id,
            // user_id: result[0].user_id
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