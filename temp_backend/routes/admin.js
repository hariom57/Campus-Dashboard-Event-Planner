const express = require('express');
const router = express.Router();
// const sql = require('../database/connection');
const { User, AdminPermission, AdminPermissionAlloted, sequelize } = require('../database/schemas');
const { checkManageAdminsPermission } = require('../middlewares/permissions/manageAdmins');

const formatAdminWithPermissions = (userRecord) => {
    if (!userRecord) return null;

    const permissions = Array.isArray(userRecord.AdminPermissions)
        ? userRecord.AdminPermissions.map((permission) => ({
            id: permission.id,
            name: permission.name,
        }))
        : [];

    return {
        user_id: userRecord.user_id,
        full_name: userRecord.full_name,
        email: userRecord.email,
        enrolment_number: userRecord.enrolment_number,
        permissions,
    };
};

// Protected route to get all admins with their permissions
router.get('/all', checkManageAdminsPermission, async (req, res) => {
    try {
        const adminRows = await User.findAll({
            attributes: ['user_id', 'full_name', 'email', 'enrolment_number'],
            include: [
                {
                    model: AdminPermission,
                    attributes: ['id', 'name'],
                    through: {
                        model: AdminPermissionAlloted,
                        attributes: [],
                    },
                    required: true,
                },
            ],
            order: [['full_name', 'ASC']],
        });

        const admins = adminRows.map(formatAdminWithPermissions);

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
        const admin = await User.findByPk(userId, {
            attributes: ['user_id', 'full_name', 'email', 'enrolment_number'],
            include: [
                {
                    model: AdminPermission,
                    attributes: ['id', 'name'],
                    through: {
                        model: AdminPermissionAlloted,
                        attributes: [],
                    },
                    required: false,
                },
            ],
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

        res.json({ admin: formatAdminWithPermissions(admin) });
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
    const { user_id, enrolment_number, permission_ids } = req.body;

    try {
        if ((!user_id && !enrolment_number) || !Array.isArray(permission_ids)) {
            return res.status(400).json({
                error: 'Bad request',
                message: 'enrolment_number or user_id and permission_ids are required'
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

        const existingUser = user_id
            ? await User.findByPk(user_id, { attributes: ['user_id'] })
            : await User.findOne({
                where: { enrolment_number: String(enrolment_number).trim() },
                attributes: ['user_id']
            });

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
            where: { user_id: existingUser.user_id }
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
                    user_id: existingUser.user_id,
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
