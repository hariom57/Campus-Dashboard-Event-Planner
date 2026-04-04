// const sql = require('../../database/connection');
const { AdminPermissionAlloted } = require('../../database/schemas');
const { userData } = require('../userAuth');
const { checkClubAdmin } = require('../clubAdminAuth');

// Event category CRUD permission ID (update this with actual permission ID from admin_permission table)
const EVENT_CATEGORY_CRUD_PERMISSION_ID = process.env.EVENT_CATEGORY_CRUD_PERMISSION_ID || 3;

/**
 * Middleware to check if user has event category CRUD permission OR is a club admin
 * Uses userData middleware to verify user, then checks admin permission or club admin status
 */
const checkEventCategoryPermission = async (req, res, next) => {
    // First run userData middleware to verify and attach user info
    userData(req, res, async () => {
        try {
            const userId = req.user.user_id;

            // const permissionCheck = await sql`
            //     SELECT 1
            //     FROM admin_permission_alloted
            //     WHERE user_id = ${userId}
            //     AND admin_permission_id = ${EVENT_CATEGORY_CRUD_PERMISSION_ID}
            // `;

            // if (permissionCheck && permissionCheck.length > 0) {
            //     // User has event category CRUD permission, allow access
            //     return next();
            // }

            // Check if user has event category CRUD permission in admin_permission_alloted table
            const permissionCheck = await AdminPermissionAlloted.findOne({
                where: { user_id: userId, admin_permission_id: EVENT_CATEGORY_CRUD_PERMISSION_ID },
                attributes: ['user_id']
            });

            if (permissionCheck) {
                // User has event category CRUD permission, allow access
                return next();
            }

            // If no event category permission, check if user is club admin
            checkClubAdmin(req, res, next);
        } catch (error) {
            console.error('Permission check error:', error);
            return res.status(500).json({
                error: 'Permission check failed',
                message: 'Could not verify permissions'
            });
        }
    });
};

module.exports = { checkEventCategoryPermission, EVENT_CATEGORY_CRUD_PERMISSION_ID };
