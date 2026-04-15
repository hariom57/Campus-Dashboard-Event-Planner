require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
// const sql = require('./database/connection.js');
const { sequelize } = require('./database/schemas');
const initializeSchema = require('./database/initializeSchema.js');

const app = express();
const PORT = process.env.PORT || 8081;

// Trust proxies (Render/Heroku/Nginx) so secure cookies work behind their load balancers
app.set('trust proxy', 1);

const normalizeOrigin = (value = '') => value.trim().replace(/\/$/, '');

const allowedOrigins = [
    ...(process.env.FRONTEND_URL || '').split(','),
    ...(process.env.CORS_ALLOWED_ORIGINS || '').split(','),
]
    .map(normalizeOrigin)
    .filter(Boolean);

const allowedOriginSet = new Set(allowedOrigins);

const allowedOriginRegexes = (process.env.CORS_ALLOWED_ORIGIN_REGEX || '')
    .split(',')
    .map((pattern) => pattern.trim())
    .filter(Boolean)
    .flatMap((pattern) => {
        try {
            return [new RegExp(pattern, 'i')];
        } catch (error) {
            console.warn(`Invalid CORS regex skipped: ${pattern}`);
            return [];
        }
    });

const allowVercelPreviews = process.env.ALLOW_VERCEL_PREVIEWS !== 'false';
const vercelPreviewRegex = /^https:\/\/[a-z0-9-]+\.vercel\.app$/i;
const localOriginRegex = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i;

const corsOptions = {
    origin: (origin, callback) => {
        // Allow requests with no origin (curl/server-to-server/health checks)
        if (!origin) return callback(null, true);

        const normalizedOrigin = normalizeOrigin(origin);

        if (localOriginRegex.test(normalizedOrigin)) {
            return callback(null, true);
        }

        if (allowVercelPreviews && vercelPreviewRegex.test(normalizedOrigin)) {
            return callback(null, true);
        }

        if (allowedOriginSet.has(normalizedOrigin)) {
            return callback(null, true);
        }

        if (allowedOriginRegexes.some((regex) => regex.test(normalizedOrigin))) {
            return callback(null, true);
        }

        return callback(new Error(`Not allowed by CORS: ${normalizedOrigin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(
    bodyParser.urlencoded({
        extended: true,
    })
);

// Initialize database schema on startup
initializeSchema().catch(err => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
});

// routes
// oauth routes
app.use('/oauth', require('./routes/auth.js'));
//events routes
app.use('/events', require('./routes/event.js'));
// user routes
app.use('/user', require('./routes/user.js'));
// location routes
app.use('/locations', require('./routes/location.js'));
// event category routes
app.use('/event-categories', require('./routes/eventCategory.js'));
// admin routes
app.use('/admins', require('./routes/admin.js'));
// club admin routes
app.use('/club-admins', require('./routes/clubAdmin.js'));
// admin permission routes
app.use('/admin-permissions', require('./routes/adminPermissions.js'));
// academic calendar routes
app.use('/academic-calendar', require('./routes/academicCalendar.js'));
// Clubs routes
app.use('/clubs', require('./routes/club.js'));
// Personal todo routes
app.use('/todos', require('./routes/todo.js'));

app.get('/', async (_, res) => {

    // const response = await sql`SELECT version();`;
    // console.log(response);

    // res.json({ version: response[0].version });

    try {
        const response = await sequelize.query('SELECT version();');
        console.log(response);

        res.json({ version: response[0][0].version });
    } catch (error) {
        console.error('Error checking database version:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Could not fetch database version'
        });
    }
});

app.listen(PORT, () => {
    console.log(`Listening to Port:${PORT}`);
});