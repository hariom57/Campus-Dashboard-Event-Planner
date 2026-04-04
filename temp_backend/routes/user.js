const express = require('express');
const router = express.Router();
const { 
    sequelize, 
    UserPreferredClub, 
    UserNotPreferredClub, 
    UserPreferredCategory, 
    UserNotPreferredCategory 
} = require('../database/schemas'); 
const { userData } = require('../middlewares/userAuth');

router.patch('/preferences', userData, async (req, res) => {
    const {
        preferred_clubs,
        not_preferred_clubs,
        preferred_categories,
        not_preferred_categories
    } = req.body;

    const userId = req.user.user_id;

    try {
        await sequelize.transaction(async (t) => {
            
            const deleteOptions = { where: { user_id: userId }, transaction: t };
            
            await Promise.all([
                UserPreferredClub.destroy(deleteOptions),
                UserNotPreferredClub.destroy(deleteOptions),
                UserPreferredCategory.destroy(deleteOptions),
                UserNotPreferredCategory.destroy(deleteOptions)
            ]);

            
            if (preferred_clubs?.length > 0) {
                const clubData = preferred_clubs.map(id => ({ user_id: userId, club_id: id }));
                await UserPreferredClub.bulkCreate(clubData, { transaction: t });
            }

            if (not_preferred_clubs?.length > 0) {
                const notClubData = not_preferred_clubs.map(id => ({ user_id: userId, club_id: id }));
                await UserNotPreferredClub.bulkCreate(notClubData, { transaction: t });
            }

            if (preferred_categories?.length > 0) {
                const catData = preferred_categories.map(id => ({ user_id: userId, event_category_id: id }));
                await UserPreferredCategory.bulkCreate(catData, { transaction: t });
            }

            if (not_preferred_categories?.length > 0) {
                const notCatData = not_preferred_categories.map(id => ({ user_id: userId, event_category_id: id }));
                await UserNotPreferredCategory.bulkCreate(notCatData, { transaction: t });
            }
        });

        res.json({ message: 'Preferences updated successfully' });

    } catch (error) {
        console.error('Error updating preferences:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Could not update preferences'
        });
    }
});

module.exports = router;