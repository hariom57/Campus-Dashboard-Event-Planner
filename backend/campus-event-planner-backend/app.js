require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
const sql = require('./database/connection.js');
const initializeSchema = require('./database/initializeSchema.js');

const app = express();
const PORT = process.env.PORT || 8081;

const allowedOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173'];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(
    bodyParser.urlencoded({
        extended: true,
    })
);

// Initialize database schema on startup (non-fatal — tables likely already exist)
initializeSchema().catch(err => {
    console.error('⚠️ Schema initialization failed (tables may already exist):', err.message);
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

app.get('/', async (_, res) => {
    const response = await sql`SELECT version();`;
    console.log(response);

    res.json({ version: response[0].version });
});

app.listen(PORT, () => {
    console.log(`Listening to http://localhost:${PORT}`);
});