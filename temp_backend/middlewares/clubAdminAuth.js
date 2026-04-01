const jwt = require('jsonwebtoken');
const sql = require('../database/connection');

const MANAGE_CLUB_ADMINS_PERMISSION_ID = process.env.MANAGE_CLUB_ADMINS_PERMISSION_ID || 5;

/**
 * Middleware to check if user is a club admin
 * Verifies JWT and checks if user is admin of any club
 * Sets req.club_admin with club_ids array
 */
const checkClubAdmin = async (req, res, next) => {
    try {
        const token = req.cookies.auth_token;

        if (!token) {
            return res.status(401).json({
                error: 'No authentication token found',
                message: 'Please login to continue'
            });
        }

        // Verify JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.user_id;

        const permissionCheck = await sql`
            SELECT 1
            FROM admin_permission_alloted
            WHERE user_id = ${userId}
            AND admin_permission_id = ${MANAGE_CLUB_ADMINS_PERMISSION_ID}
            LIMIT 1
        `;

        if (permissionCheck && permissionCheck.length > 0) {
            const allClubs = await sql`
                SELECT id AS club_id
                FROM club
                ORDER BY id ASC
            `;

            req.user = decoded;
            req.club_admin = {
                user_id: userId,
                club_ids: allClubs.map(record => record.club_id)
            };

            return next();
        }

        // Check if user is admin of any club
        const clubAdminRecords = await sql`
            SELECT club_id
            FROM club_admin
            WHERE user_id = ${userId}
        `;

        if (!clubAdminRecords || clubAdminRecords.length === 0) {
            return res.status(403).json({
                error: 'Permission denied',
                message: 'You need to be a club admin to perform this action'
            });
        }

        // Attach user info and club admin info to request
        req.club_admin = {
            club_ids: clubAdminRecords.map(record => record.club_id)
        };

        next();
    } catch (error) {
        console.error('Club admin check error:', error);

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                error: 'Token expired',
                message: 'Your session has expired. Please login again'
            });
        }

        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                error: 'Invalid token',
                message: 'Authentication failed'
            });
        }

        return res.status(500).json({
            error: 'Permission check failed',
            message: 'Could not verify club admin permissions'
        });
    }
};

/**
 * Middleware to check if user is admin of a specific club
 * Expects clubId in req.params or req.body
 */
const checkClubAdminForClub = async (req, res, next) => {
    try {
        const token = req.cookies.auth_token;

        if (!token) {
            return res.status(401).json({
                error: 'No authentication token found',
                message: 'Please login to continue'
            });
        }

        // Verify JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.user_id;

        const permissionCheck = await sql`
            SELECT 1
            FROM admin_permission_alloted
            WHERE user_id = ${userId}
            AND admin_permission_id = ${MANAGE_CLUB_ADMINS_PERMISSION_ID}
            LIMIT 1
        `;

        if (permissionCheck && permissionCheck.length > 0) {
            req.user = decoded;
            return next();
        }

        // Get club_id from params or body
        const clubId = req.params.clubId || req.body?.club_id;

        if (!clubId) {
            return res.status(400).json({
                error: 'Bad request',
                message: 'Club ID is required'
            });
        }

        // Check if user is admin of this specific club
        const clubAdminRecord = await sql`
            SELECT club_id
            FROM club_admin
            WHERE user_id = ${userId}
            AND club_id = ${clubId}
        `;

        if (!clubAdminRecord || clubAdminRecord.length === 0) {
            return res.status(403).json({
                error: 'Permission denied',
                message: 'You are not an admin of this club'
            });
        }

        // Attach user info and club admin info to request
        next();
    } catch (error) {
        console.error('Club admin check error:', error);

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                error: 'Token expired',
                message: 'Your session has expired. Please login again'
            });
        }

        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                error: 'Invalid token',
                message: 'Authentication failed'
            });
        }

        return res.status(500).json({
            error: 'Permission check failed',
            message: 'Could not verify club admin permissions'
        });
    }
};

module.exports = { checkClubAdmin, checkClubAdminForClub };
