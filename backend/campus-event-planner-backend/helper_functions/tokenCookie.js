/**
 * Sets secure HTTP-only cookies for access and refresh tokens
 * @param {Object} res - Express response object
 * @param {string} accessToken - Access token value
 * @param {string} refreshToken - Refresh token value
 */
const setTokenCookies = (res, accessToken, refreshToken) => {
    const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;

    const cookieOptions = {
        httpOnly: true,  // Not accessible from JavaScript
        secure: process.env.NODE_ENV === 'production',  // Only sent over HTTPS in production
        sameSite: 'lax',  // Allow cross-origin requests from frontend
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
    res.clearCookie('access_token', { path: '/' });
    res.clearCookie('refresh_token', { path: '/' });
};

module.exports = {
    setTokenCookies,
    clearTokenCookies
};
