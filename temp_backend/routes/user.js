const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const {
    sequelize,
    UserPreferredClub,
    UserNotPreferredClub,
    UserPreferredCategory,
    UserNotPreferredCategory
} = require('../database/schemas');
const { userData } = require('../middlewares/userAuth');

const toUniqueIds = (value) => {
    if (!Array.isArray(value)) return [];

    const ids = value
        .map((id) => Number.parseInt(id, 10))
        .filter((id) => Number.isInteger(id) && id > 0);

    return Array.from(new Set(ids));
};

const buildUpdatedJwtPayload = (claims, preferences) => {
    const {
        exp,
        iat,
        nbf,
        jti,
        preferred_clubs,
        not_preferred_clubs,
        preferred_categories,
        not_preferred_categories,
        ...safeClaims
    } = claims || {};

    return {
        ...safeClaims,
        preferred_clubs: preferences.preferred_clubs,
        not_preferred_clubs: preferences.not_preferred_clubs,
        preferred_categories: preferences.preferred_categories,
        not_preferred_categories: preferences.not_preferred_categories,
    };
};

router.patch('/preferences', userData, async (req, res) => {
    const {
        preferred_clubs,
        not_preferred_clubs,
        preferred_categories,
        not_preferred_categories
    } = req.body;

    const userId = req.user.user_id;
    const preferredClubIds = toUniqueIds(preferred_clubs);
    const notPreferredClubIds = toUniqueIds(not_preferred_clubs);
    const preferredCategoryIds = toUniqueIds(preferred_categories);
    const notPreferredCategoryIds = toUniqueIds(not_preferred_categories);

    try {
        await sequelize.transaction(async (t) => {

            const deleteOptions = { where: { user_id: userId }, transaction: t };

            // Run transaction queries sequentially on a single connection to avoid pg concurrency warnings.
            await UserPreferredClub.destroy(deleteOptions);
            await UserNotPreferredClub.destroy(deleteOptions);
            await UserPreferredCategory.destroy(deleteOptions);
            await UserNotPreferredCategory.destroy(deleteOptions);


            if (preferredClubIds.length > 0) {
                const clubData = preferredClubIds.map(id => ({ user_id: userId, club_id: id }));
                await UserPreferredClub.bulkCreate(clubData, { transaction: t });
            }

            if (notPreferredClubIds.length > 0) {
                const notClubData = notPreferredClubIds.map(id => ({ user_id: userId, club_id: id }));
                await UserNotPreferredClub.bulkCreate(notClubData, { transaction: t });
            }

            if (preferredCategoryIds.length > 0) {
                const catData = preferredCategoryIds.map(id => ({ user_id: userId, event_category_id: id }));
                await UserPreferredCategory.bulkCreate(catData, { transaction: t });
            }

            if (notPreferredCategoryIds.length > 0) {
                const notCatData = notPreferredCategoryIds.map(id => ({ user_id: userId, event_category_id: id }));
                await UserNotPreferredCategory.bulkCreate(notCatData, { transaction: t });
            }
        });

        const nextPreferences = {
            preferred_clubs: preferredClubIds,
            not_preferred_clubs: notPreferredClubIds,
            preferred_categories: preferredCategoryIds,
            not_preferred_categories: notPreferredCategoryIds,
        };

        const updatedPayload = buildUpdatedJwtPayload(req.user, nextPreferences);

        const token = jwt.sign(updatedPayload, process.env.JWT_SECRET, {
            expiresIn: '30d'
        });

        const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
        const isProduction = process.env.NODE_ENV === 'production' || process.env.RENDER === 'true';
        res.cookie('auth_token', token, {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? 'none' : 'lax',
            maxAge: thirtyDaysInMs,
            path: '/'
        });

        res.json({
            message: 'Preferences updated successfully',
            authContext: {
                ...nextPreferences,
            }
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