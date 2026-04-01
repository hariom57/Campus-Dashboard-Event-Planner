const sql = require('../../database/connection');
const { userData } = require('../userAuth');
const { checkClubAdminForClub } = require('../clubAdminAuth');

// Event CRUD permission ID (update this with actual permission ID from admin_permission table)
const EVENT_CRUD_PERMISSION_ID = process.env.EVENT_CRUD_PERMISSION_ID || 1;

/**
 * Middleware to check if user has event CRUD permission OR is club admin of the event's club
 * Uses userData middleware to verify user, then checks admin permission or club admin status
 */
const checkEventPermission = async (req, res, next) => {
    // First run userData middleware to verify and attach user info
    userData(req, res, async () => {
        try {
            const userId = req.user.user_id;

            // Check if user has event CRUD permission in admin_permission_alloted table
            const permissionCheck = await sql`
                SELECT 1
                FROM admin_permission_alloted
                WHERE user_id = ${userId}
                AND admin_permission_id = ${EVENT_CRUD_PERMISSION_ID}
            `;

            if (permissionCheck && permissionCheck.length > 0) {
                // User has event CRUD permission, allow access
                return next();
            }

            // If no event permission, check if user is club admin for this event's club
            const { eventId } = req.params || "";

            // Get the club_id for this event
            const event = await sql`
                SELECT club_id
                FROM event
                WHERE id = ${eventId}
            `;

            if (event && event.length > 0) {
                // Set club_id in req.body for checkClubAdminForClub middleware
                req.body.club_id = event[0].club_id;
            }

            // Check if user is admin of this club
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

module.exports = { checkEventPermission, EVENT_CRUD_PERMISSION_ID };
