// const sql = require('../../database/connection');
const { AdminPermissionAlloted } = require('../../database/schemas');
const { userData } = require('../userAuth');
const { checkClubAdmin } = require('../clubAdminAuth');

// Manage admins permission ID (update this with actual permission ID from admin_permission table)
const MANAGE_ADMINS_PERMISSION_ID = process.env.MANAGE_ADMINS_PERMISSION_ID || 4;

/**
 * Middleware to check if user has manage admins permission OR is a club admin
 * Uses userData middleware to verify user, then checks admin permission or club admin status
 */
const checkManageAdminsPermission = async (req, res, next) => {
    // First run userData middleware to verify and attach user info
    userData(req, res, async () => {
        try {
            const userId = req.user.user_id;

            // const permissionCheck = await sql`
            //     SELECT 1
            //     FROM admin_permission_alloted
            //     WHERE user_id = ${userId}
            //     AND admin_permission_id = ${MANAGE_ADMINS_PERMISSION_ID}
            // `;

            // if (permissionCheck && permissionCheck.length > 0) {
            //     // User has manage admins permission, allow access
            //     return next();
            // }

            // Check if user has manage admins permission in admin_permission_alloted table
            const permissionCheck = await AdminPermissionAlloted.findOne({
                where: { user_id: userId, admin_permission_id: MANAGE_ADMINS_PERMISSION_ID },
                attributes: ['user_id']
            });

            if (permissionCheck) {
                // User has manage admins permission, allow access
                return next();
            }

            // If no manage admins permission return unauthorized
            return res.status(403).json({
                error: 'Unauthorized',
                message: 'You do not have permission to manage admins'
            });
        } catch (error) {
            console.error('Permission check error:', error);
            return res.status(500).json({
                error: 'Permission check failed',
                message: 'Could not verify permissions'
            });
        }
    });
};

module.exports = { checkManageAdminsPermission, MANAGE_ADMINS_PERMISSION_ID };
