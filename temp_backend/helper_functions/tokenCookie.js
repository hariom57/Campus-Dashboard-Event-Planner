/**
 * Sets secure HTTP-only cookies for access and refresh tokens
 * @param {Object} res - Express response object
 * @param {string} accessToken - Access token value
 * @param {string} refreshToken - Refresh token value
 */
const setTokenCookies = (res, accessToken, refreshToken) => {
    const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
    const isProduction = process.env.NODE_ENV === 'production' || process.env.RENDER === 'true';

    const cookieOptions = {
        httpOnly: true,  // Not accessible from JavaScript
        secure: isProduction,  // Required with SameSite=None in production
        sameSite: isProduction ? 'none' : 'lax',
        maxAge: thirtyDaysInMs,  // Expires after 30 days
        path: '/'
    };

    res.cookie('access_token', accessToken, cookieOptions);
    res.cookie('refresh_token', refreshToken, cookieOptions);
};

/**
 * Clears both access and refresh token cookies
 * @param {Object} res - Express response object
 */
const clearTokenCookies = (res) => {
    const isProduction = process.env.NODE_ENV === 'production' || process.env.RENDER === 'true';
    const clearOptions = {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax',
        path: '/'
    };

    res.clearCookie('access_token', clearOptions);
    res.clearCookie('refresh_token', clearOptions);
};

module.exports = {
    setTokenCookies,
    clearTokenCookies
};
