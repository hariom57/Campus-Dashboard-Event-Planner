const sql = require('../../database/connection');
const { userData } = require('../userAuth');

// Admin permissions manage ID (update this with actual permission ID from admin_permission table)
const ADMIN_PERMISSIONS_MANAGE_ID = process.env.ADMIN_PERMISSIONS_MANAGE_ID || 6;

/**
 * Middleware to check if user has admin-permissions-manage permission
 * Uses userData middleware to verify user, then checks admin permission
 */
const checkAdminPermissionsManage = async (req, res, next) => {
    // First run userData middleware to verify and attach user info
    userData(req, res, async () => {
        try {
            const userId = req.user.user_id;

            const permissionCheck = await sql`
                SELECT 1
                FROM admin_permission_alloted
                WHERE user_id = ${userId}
                AND admin_permission_id = ${ADMIN_PERMISSIONS_MANAGE_ID}
            `;

            if (!permissionCheck || permissionCheck.length === 0) {
                return res.status(403).json({
                    error: 'Permission denied',
                    message: 'You do not have permission to perform this action'
                });
            }

            next();
        } catch (error) {
            console.error('Permission check error:', error);
            return res.status(500).json({
                error: 'Permission check failed',
                message: 'Could not verify permissions'
            });
        }
    });
};

module.exports = { checkAdminPermissionsManage, ADMIN_PERMISSIONS_MANAGE_ID };
