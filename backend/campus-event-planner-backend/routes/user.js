const express = require('express');
const router = express.Router();
const sql = require('../database/connection');
const { userData } = require('../middlewares/userAuth');

// Protected route to update user preferences
router.patch('/preferences', userData, async (req, res) => {
    const {
        preferred_clubs,
        not_preferred_clubs,
        preferred_categories,
        not_preferred_categories
    } = req.body;

    try {
        const userId = req.user.user_id;

        // Use transaction for atomic operation
        await sql.begin(async sql => {
            // Delete existing preferences
            await sql`DELETE FROM user_preferred_club WHERE user_id = ${userId}`;
            await sql`DELETE FROM user_not_preferred_club WHERE user_id = ${userId}`;
            await sql`DELETE FROM user_preferred_category WHERE user_id = ${userId}`;
            await sql`DELETE FROM user_not_preferred_category WHERE user_id = ${userId}`;

            // Insert new preferred clubs
            if (preferred_clubs && preferred_clubs.length > 0) {
                await sql`
                    INSERT INTO user_preferred_club (user_id, club_id)
                    SELECT ${userId}, club_id
                    FROM unnest(${sql.array(preferred_clubs)}::bigint[]) AS club_id
                `;
            }

            // Insert new not preferred clubs
            if (not_preferred_clubs && not_preferred_clubs.length > 0) {
                await sql`
                    INSERT INTO user_not_preferred_club (user_id, club_id)
                    SELECT ${userId}, club_id
                    FROM unnest(${sql.array(not_preferred_clubs)}::bigint[]) AS club_id
                `;
            }

            // Insert new preferred categories
            if (preferred_categories && preferred_categories.length > 0) {
                await sql`
                    INSERT INTO user_preferred_category (user_id, event_category_id)
                    SELECT ${userId}, category_id
                    FROM unnest(${sql.array(preferred_categories)}::integer[]) AS category_id
                `;
            }

            // Insert new not preferred categories
            if (not_preferred_categories && not_preferred_categories.length > 0) {
                await sql`
                    INSERT INTO user_not_preferred_category (user_id, event_category_id)
                    SELECT ${userId}, category_id
                    FROM unnest(${sql.array(not_preferred_categories)}::integer[]) AS category_id
                `;
            }
        });

        res.json({
            message: 'Preferences updated successfully'
        });
    } catch (error) {
        console.error('Error updating preferences:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Could not update preferences'
        });
    }
});

module.exports = router;