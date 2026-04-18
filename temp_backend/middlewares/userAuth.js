const jwt = require('jsonwebtoken');

/**
 * Middleware to check if user is authenticated
 * Verifies JWT from auth_token cookie
 */
const userLoggedIn = (req, res, next) => {
    try {
        const token = req.cookies.auth_token;

        if (!token) {
            return res.status(401).json({
                error: 'No authentication token found',
                message: 'Please login to continue'
            });
        }

        // CRITICAL FIX: Actually verify the JWT token instead of just checking presence
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        console.error('Auth error:', error);

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

        return res.status(401).json({
            error: 'Authentication error',
            message: 'Please login to continue'
        });
    }
};

/**
 * Middleware to verify user and attach user info to request
 * Verifies JWT from auth_token cookie and attaches decoded user to req.user
 * Internally uses userLoggedIn middleware
 */
const userData = (req, res, next) => {
    // First run userLoggedIn middleware
    userLoggedIn(req, res, () => {
        // If userLoggedIn succeeds, verify JWT and attach user data
        try {
            const token = req.cookies.auth_token;
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded;
            next();
        } catch (error) {
            console.error('JWT verification error:', error);
            return res.status(401).json({
                error: 'Invalid token',
                message: 'Could not verify user token'
            });
        }
    });
};

module.exports = { userLoggedIn, userData };
