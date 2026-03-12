const sql = require('../../database/connection');
const { userData } = require('../userAuth');
const { checkClubAdminForClub } = require('../clubAdminAuth');

// Manage club admins permission ID (update this with actual permission ID from admin_permission table)
const MANAGE_CLUB_ADMINS_PERMISSION_ID = process.env.MANAGE_CLUB_ADMINS_PERMISSION_ID || 5;

/**
 * Middleware to check if user has manage club admins permission OR is club admin of provided club_id
 * Uses userData middleware to verify user, then checks admin permission or club admin status
 */
const checkManageClubAdminsPermission = async (req, res, next) => {
    // First run userData middleware to verify and attach user info
    userData(req, res, async () => {
        try {
            const userId = req.user.user_id;

            // Check if user has manage club admins permission in admin_permission_alloted table
            const permissionCheck = await sql`
                SELECT 1
                FROM admin_permission_alloted
                WHERE user_id = ${userId}
                AND admin_permission_id = ${MANAGE_CLUB_ADMINS_PERMISSION_ID}
            `;

            if (permissionCheck && permissionCheck.length > 0) {
                // User has manage club admins permission, allow access
                return next();
            }

            // If no manage club admins permission, check if user is admin of this club
            checkClubAdminForClub(req, res, next);
        } catch (error) {
            console.error('Permission check error:', error);
            return res.status(500).json({
                error: 'Permission check failed',
                message: 'Could not verify permissions'
            });
        }
    });
};

module.exports = { checkManageClubAdminsPermission, MANAGE_CLUB_ADMINS_PERMISSION_ID };
