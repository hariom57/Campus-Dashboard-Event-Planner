const express = require('express');
const router = express.Router();
const axios = require('axios');
const jwt = require('jsonwebtoken');
const sql = require('../database/connection');
const { userLoggedIn, userData } = require('../middlewares/userAuth');

const AUTHORIZE_URL = process.env.authoriseURL;
const CLIENT_ID = process.env.client_id;
const REDIRECT_URI = process.env.redirectURL;
const token_URL = process.env.token_URL;
const client_secret_id = process.env.client_secret_id;

// user login with Channel I OAuth
router.get('/login', async (req, res) => {
    const authURL = `${AUTHORIZE_URL}?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&state=Authorised`;
    res.redirect(authURL);
});

// route to get the access token and refresh token
// with help of access token, get the user data and store it in database if it doesn't exist. If it exists, update the user data in database. Then create a JWT with user info and store it in secure HTTP-only cookie
router.get('/token', async (req, res) => {
    try {
        const { code, state } = req.query;
        // send a POST request to token_URL to get the access token

        const response = await axios.post(token_URL, {
            client_id: CLIENT_ID,
            client_secret: client_secret_id,
            grant_type: 'authorization_code',
            redirect_uri: REDIRECT_URI,
            code: code
        }, {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
        });

        // Fetch user data directly
        const getUserDataURL = process.env.get_user_data_url;
        const userDataResponse = await axios.get(getUserDataURL, {
            headers: {
                "Authorization": `Bearer ${response.data.access_token}`,
            },
        });

        const userData = userDataResponse.data;
        console.log(`[AUTH] 👤 Fetched user data for: ${userData.person.fullName} (ID: ${userData.userId})`);

        // Insert or update user in database
        await sql`
            INSERT INTO "user" (
                user_id, 
                full_name, 
                email, 
                phone_number, 
                display_picture, 
                enrolment_number, 
                branch, 
                current_year, 
                branch_department_name,
                updated_at
            ) VALUES (
                ${Number(userData.userId)},
                ${userData.person.fullName},
                ${userData.contactInformation.instituteWebmailAddress},
                ${userData.contactInformation.primaryPhoneNumber || null},
                ${userData.person.displayPicture},
                ${userData.student.enrolmentNumber},
                ${userData.student['branch name']},
                ${userData.student.currentYear},
                ${userData.student['branch department name']},
                CURRENT_TIMESTAMP
            )
            ON CONFLICT (user_id) 
            DO UPDATE SET
                full_name = EXCLUDED.full_name,
                email = EXCLUDED.email,
                phone_number = EXCLUDED.phone_number,
                display_picture = EXCLUDED.display_picture,
                current_year = EXCLUDED.current_year,
                updated_at = CURRENT_TIMESTAMP;
        `;

        console.log(`✅ User ${userData.userId} synced to database`);

        // Create JWT with user info
        const jwtPayload = {
            user_id: userData.userId,
            enrolmentNumber: userData.student.enrolmentNumber,
            branch: userData.student['branch name'],
            currentYear: userData.student.currentYear,
            displayPicture: userData.person.displayPicture
        };

        const token = jwt.sign(jwtPayload, process.env.JWT_SECRET, {
            expiresIn: '30d'
        });

        // Store JWT in secure cookie
        const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
        res.cookie('auth_token', token, {
            httpOnly: true,
            secure: false, 
            sameSite: 'lax', // Standard for local dev
            path: '/', 
            maxAge: thirtyDaysInMs
        });

        console.log(`✅ JWT created and stored for user ${userData.userId}`);

        // Redirect back to the frontend app (cookie is already set above)
        return res.redirect('http://localhost:5173');
    } catch (error) {
        console.log(error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Could not fetch user data'
        });
    }
});

// route to get the user data
router.get('/user', userData, async (req, res) => {
    try {
        // get user data from database with the id in JWT payload
        const userDbData = await sql`
            SELECT user_id, full_name, email, phone_number, display_picture, enrolment_number, branch, current_year, branch_department_name
            FROM "user"
            WHERE user_id = ${req.user.user_id}
        `;

        if (userDbData.length === 0) {
            return res.status(404).json({
                error: 'User not found',
                message: 'No user found with this ID'
            });
        }

        const userAccount = userDbData[0];

        // Fetch clubs this user manages
        const managedClubsRaw = await sql`
            SELECT c.id, c.name
            FROM club_admin ca
            JOIN club c ON ca.club_id = c.id
            WHERE ca.user_id = ${req.user.user_id}
        `;

        userAccount.managedClubs = managedClubsRaw;
        userAccount.isAdmin = managedClubsRaw.length > 0;

        return res.json({ userData: userAccount });

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            error: 'Internal server error',
            message: 'Could not fetch user information'
        });
    }
});

// route to get the user data from the access token
// router.get('/user', async (req, res) => {
//     try {
//         // Get tokens from cookies instead of query params
//         const { access_token, refresh_token } = req.cookies;

//         if (!access_token) {
//             return res.status(401).json({ error: 'No access token found' });
//         }

//         const getUserDataURL = process.env.get_user_data_url;

//         // Fetch user data
//         const userDataResponse = await axios.get(getUserDataURL, {
//             headers: {
//                 "Authorization": `Bearer ${access_token}`,
//             },
//         });

//         return res.json({ userData: userDataResponse.data });
//     } catch (error) {
//         console.log(error);

//         // If access token is expired (401 error from API)
//         if (error.response?.status === 401) {
//             try {
//                 const { refresh_token } = req.cookies;

//                 if (!refresh_token) {
//                     return res.status(401).json({ error: 'No refresh token found' });
//                 }

//                 const response = await axios.post(token_URL, {
//                     client_id: CLIENT_ID,
//                     client_secret: client_secret_id,
//                     grant_type: 'refresh_token',
//                     refresh_token: refresh_token
//                 }, {
//                     headers: {
//                         "Content-Type": "application/x-www-form-urlencoded",
//                     },
//                 });

//                 // Update cookies with new tokens
//                 setTokenCookies(res, response.data.access_token, response.data.refresh_token);

//                 return res.json({ message: "Token refreshed", data: response.data });
//             } catch (refreshError) {
//                 console.log(refreshError);
//                 // token refresh failed- probably because refresh token is invalid/expired
//                 // Clear cookies and send error
//                 clearTokenCookies(res);
//                 return res.status(401).json({ error: 'Session expired. Please login again.' });
//             }
//         }

//         res.status(error.response?.status || 500).json({ error: error.response?.data || 'Internal Server Error' });
//     }
// });

// route to logout and clear the cookie
router.get('/logout', (req, res) => {
    res.clearCookie('auth_token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/'
    });
    return res.json({ message: 'Logged out successfully' });
});

module.exports = router;