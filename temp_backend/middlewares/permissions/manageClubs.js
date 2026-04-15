const { AdminPermissionAlloted, ClubAdmin } = require('../../database/schemas');
const { userData } = require('../userAuth');

const MANAGE_CLUBS_PERMISSION_ID = process.env.MANAGE_CLUBS_PERMISSION_ID || 7;

/**
 * Middleware to check if user has manage clubs permission
 * Uses userData middleware to verify user, then checks admin permission
 */
const checkManageClub = async (req, res, next) => {
    userData(req, res, async () => {
        try {
            const userId = req.user.user_id;

            const permissionCheck = await AdminPermissionAlloted.findOne({
                where: { user_id: userId, admin_permission_id: MANAGE_CLUBS_PERMISSION_ID },
                attributes: ['user_id']
            });

            if (!permissionCheck) {
                // If this is an update request for a specific club, check if the user is a club admin
                const targetClubId = req.params.id;
                if (req.method === 'PATCH' && targetClubId) {
                    const clubAdminCheck = await ClubAdmin.findOne({
                        where: { user_id: userId, club_id: targetClubId },
                        attributes: ['user_id']
                    });
                    
                    if (clubAdminCheck) {
                        return next();
                    }
                }

                return res.status(403).json({
                    error: 'Permission denied',
                    message: 'You do not have permission to manage this club'
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

module.exports = { checkManageClub, MANAGE_CLUBS_PERMISSION_ID };
