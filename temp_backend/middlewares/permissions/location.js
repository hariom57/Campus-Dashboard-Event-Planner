const sql = require('../../database/connection');
const { userData } = require('../userAuth');
const { checkClubAdmin } = require('../clubAdminAuth');

// Location CRUD permission ID (update this with actual permission ID from admin_permission table)
const LOCATION_CRUD_PERMISSION_ID = process.env.LOCATION_CRUD_PERMISSION_ID || 2;

/**
 * Middleware to check if user has location CRUD permission OR is a club admin
 * Uses userData middleware to verify user, then checks admin permission or club admin status
 */
const checkLocationPermission = async (req, res, next) => {
    // First run userData middleware to verify and attach user info
    userData(req, res, async () => {
        try {
            const userId = req.user.user_id;

            // Check if user has location CRUD permission in admin_permission_alloted table
            const permissionCheck = await sql`
                SELECT 1
                FROM admin_permission_alloted
                WHERE user_id = ${userId}
                AND admin_permission_id = ${LOCATION_CRUD_PERMISSION_ID}
            `;

            if (permissionCheck && permissionCheck.length > 0) {
                // User has location CRUD permission, allow access
                return next();
            }

            // If no location permission, check if user is club admin
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

module.exports = { checkLocationPermission, LOCATION_CRUD_PERMISSION_ID };
