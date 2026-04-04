const express = require('express');
const router = express.Router();
// const sql = require('../database/connection');
const { User, AdminPermission, AdminPermissionAlloted, sequelize } = require('../database/schemas');
const { checkManageAdminsPermission } = require('../middlewares/permissions/manageAdmins');
const { userData } = require('../middlewares/userAuth');

// Route to check if current user is admin
router.get('/is-admin', userData, async (req, res) => {
    try {
        const userId = req.user.user_id;

        // const result = await sql`
        //     SELECT EXISTS(
        //         SELECT 1 FROM admin_permission_alloted
        //         WHERE user_id = ${userId}
        //     ) as is_admin
        // `;

        // const isAdmin = result[0].is_admin;

        const result = await AdminPermissionAlloted.findOne({
            where: { user_id: userId },
            attributes: ['user_id']
        });

        const isAdmin = !!result;

        res.json({ is_admin: isAdmin });
    } catch (error) {
        console.error('Error checking admin status:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Could not check admin status'
        });
    }
});

// Protected route to get all admins with their permissions
router.get('/all', checkManageAdminsPermission, async (req, res) => {
    try {
        // const admins = await sql`
		// 	SELECT
		// 		u.user_id,
		// 		u.full_name,
		// 		u.email,
		// 		COALESCE(
		// 			json_agg(
		// 				json_build_object(
		// 					'id', ap.id,
		// 					'name', ap.name
		// 				)
		// 			) FILTER (WHERE ap.id IS NOT NULL),
		// 			'[]'::json
		// 		) AS permissions
		// 	FROM "user" u
		// 	INNER JOIN admin_permission_alloted apa ON apa.user_id = u.user_id
		// 	LEFT JOIN admin_permission ap ON ap.id = apa.admin_permission_id
		// 	GROUP BY u.user_id, u.full_name, u.email
		// 	ORDER BY u.full_name ASC
		// `;

        const admins = await User.findAll({
            attributes: [
                'user_id',
                'full_name',
                'email',
                [
                    sequelize.literal(`
                        COALESCE(
                            json_agg(
                                json_build_object(
                                    'id', "AdminPermissions"."id",
                                    'name', "AdminPermissions"."name"
                                )
                            ) FILTER (WHERE "AdminPermissions"."id" IS NOT NULL),
                            '[]'::json
                        )
                    `),
                    'permissions'
                ],
            ],
            include: [
                {
                    model: AdminPermission,
                    attributes: [],
                    through: {
                        model: AdminPermissionAlloted,
                        attributes: [],
                    },
                    required: true,
                },
            ],
            group: ['User.user_id', 'User.full_name', 'User.email'],
            order: [[sequelize.literal('"User"."full_name"'), 'ASC']],
            raw: true,
        });

        res.json({ admins });
    } catch (error) {
        console.error('Error fetching admins:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Could not fetch admins'
        });
    }
});

// Protected route to get a specific admin with permissions
router.get('/:userId', checkManageAdminsPermission, async (req, res) => {
    const { userId } = req.params;

    try {
        // const admins = await sql`
		// 	SELECT
		// 		u.user_id,
		// 		u.full_name,
		// 		u.email,
		// 		COALESCE(
		// 			json_agg(
		// 				json_build_object(
		// 					'id', ap.id,
		// 					'name', ap.name
		// 				)
		// 			) FILTER (WHERE ap.id IS NOT NULL),
		// 			'[]'::json
		// 		) AS permissions
		// 	FROM "user" u
		// 	LEFT JOIN admin_permission_alloted apa ON apa.user_id = u.user_id
		// 	LEFT JOIN admin_permission ap ON ap.id = apa.admin_permission_id
		// 	WHERE u.user_id = ${userId}
		// 	GROUP BY u.user_id, u.full_name, u.email
		// `;

        const admin = await User.findByPk(userId, {
            attributes: [
                'user_id',
                'full_name',
                'email',
                [
                    sequelize.literal(`
                        COALESCE(
                            json_agg(
                                json_build_object(
                                    'id', "AdminPermissions"."id",
                                    'name', "AdminPermissions"."name"
                                )
                            ) FILTER (WHERE "AdminPermissions"."id" IS NOT NULL),
                            '[]'::json
                        )
                    `),
                    'permissions'
                ],
            ],
            include: [
                {
                    model: AdminPermission,
                    attributes: [],
                    through: {
                        model: AdminPermissionAlloted,
                        attributes: [],
                    },
                    required: false,
                },
            ],
            group: ['User.user_id'],
            raw: true,
        });

        // if (!admins || admins.length === 0) {
        //     return res.status(404).json({
        //         error: 'Not found',
        //         message: 'Admin not found'
        //     });
        // }

        // res.json({ admin: admins[0] });

        if (!admin) {
            return res.status(404).json({
                error: 'Not found',
                message: 'Admin not found'
            });
        }

        res.json({ admin });
    } catch (error) {
        console.error('Error fetching admin:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Could not fetch admin'
        });
    }
});

// Protected route to update an admin's permissions
router.patch('/:userId', checkManageAdminsPermission, async (req, res) => {
    const { userId } = req.params;
    const { permission_ids } = req.body;

    try {
        if (!Array.isArray(permission_ids)) {
            return res.status(400).json({
                error: 'Bad request',
                message: 'permission_ids must be an array'
            });
        }

        // await sql.begin(async sql => {
        //     await sql`
		// 		DELETE FROM admin_permission_alloted
		// 		WHERE user_id = ${userId}
		// 	`;

        //     if (permission_ids.length > 0) {
        //         await sql`
		// 			INSERT INTO admin_permission_alloted (user_id, admin_permission_id)
		// 			SELECT ${userId}, permission_id
		// 			FROM unnest(${sql.array(permission_ids)}::integer[]) AS permission_id
		// 		`;
        //     }
        // });

        await sequelize.transaction(async (t) => {
            // Delete existing permissions
            await AdminPermissionAlloted.destroy({
                where: { user_id: userId },
                transaction: t
            });

            // Add new permissions
            if (permission_ids.length > 0) {
                const permissionData = permission_ids.map(id => ({
                    user_id: userId,
                    admin_permission_id: id
                }));
                await AdminPermissionAlloted.bulkCreate(permissionData, { transaction: t });
            }
        });

        res.json({
            message: 'Admin permissions updated successfully'
        });
    } catch (error) {
        console.error('Error updating admin permissions:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Could not update admin permissions'
        });
    }
});

// Protected route to add a new admin with permissions
router.post('/add', checkManageAdminsPermission, async (req, res) => {
    const { user_id, permission_ids } = req.body;

    try {
        if (!user_id || !Array.isArray(permission_ids)) {
            return res.status(400).json({
                error: 'Bad request',
                message: 'user_id and permission_ids are required'
            });
        }

        // const existingUser = await sql`
        //     SELECT user_id
        //     FROM "user"
        //     WHERE user_id = ${user_id}
        // `;

        // if (!existingUser || existingUser.length === 0) {
        //     return res.status(404).json({
        //         error: 'Not found',
        //         message: 'User not found'
        //     });
        // }

        // Check if user exists
        const existingUser = await User.findByPk(user_id, { attributes: ['user_id'] });

        if (!existingUser) {
            return res.status(404).json({
                error: 'Not found',
                message: 'User not found'
            });
        }

        // const existingAdmin = await sql`
        //     SELECT 1
        //     FROM admin_permission_alloted
        //     WHERE user_id = ${user_id}
        // `;

        // if (existingAdmin && existingAdmin.length > 0) {
        //     return res.status(409).json({
        //         error: 'Conflict',
        //         message: 'User is already an admin'
        //     });
        // }

        // await sql.begin(async sql => {
        //     if (permission_ids.length > 0) {
        //         await sql`
        //             INSERT INTO admin_permission_alloted (user_id, admin_permission_id)
        //             SELECT ${user_id}, permission_id
        //             FROM unnest(${sql.array(permission_ids)}::integer[]) AS permission_id
        //         `;
        //     }
        // });

        // Check if user is already an admin
        const existingAdmin = await AdminPermissionAlloted.findOne({
            where: { user_id: user_id }
        });

        if (existingAdmin) {
            return res.status(409).json({
                error: 'Conflict',
                message: 'User is already an admin'
            });
        }

        await sequelize.transaction(async (t) => {
            if (permission_ids.length > 0) {
                const permissionData = permission_ids.map(id => ({
                    user_id: user_id,
                    admin_permission_id: id
                }));
                await AdminPermissionAlloted.bulkCreate(permissionData, { transaction: t });
            }
        });

        res.status(201).json({
            message: 'Admin created successfully'
        });
    } catch (error) {
        console.error('Error creating admin:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Could not create admin'
        });
    }
});

// Protected route to delete an admin (remove all permissions)
router.delete('/:userId', checkManageAdminsPermission, async (req, res) => {
    const { userId } = req.params;

    try {

        // const result = await sql`
		// 	DELETE FROM admin_permission_alloted
		// 	WHERE user_id = ${userId}
		// 	RETURNING user_id
		// `;

        // if (!result || result.length === 0) {
        //     return res.status(404).json({
        //         error: 'Not found',
        //         message: 'Admin not found'
        //     });
        // }

        // res.json({
        //     message: 'Admin removed successfully',
        //     user_id: result[0].user_id
        // });

        const result = await AdminPermissionAlloted.destroy({
            where: { user_id: userId }
        });

        if (result === 0) {
            return res.status(404).json({
                error: 'Not found',
                message: 'Admin not found'
            });
        }

        res.json({
            message: 'Admin removed successfully',
            user_id: userId
        });
    } catch (error) {
        console.error('Error deleting admin:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Could not delete admin'
        });
    }
});

module.exports = router;
