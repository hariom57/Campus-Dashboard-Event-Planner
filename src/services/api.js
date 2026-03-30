import axios from 'axios';

// Backend URL from environment variable (VITE_API_URL must be set in .env.local)
// Dynamically falls back to production Render backend when deployed, or localhost:8081 locally.
const isProd = import.meta.env.PROD;
const API_URL = import.meta.env.VITE_API_URL || (isProd ? 'https://campus-event-planner-backend.onrender.com' : 'http://127.0.0.1:8081');

const api = axios.create({
    baseURL: API_URL,
    withCredentials: true, // Important for handling HTTP-only cookies (JWT)
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a response interceptor to handle 401 errors (expired session)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // Only warn if it's NOT the initial user check (which naturally returns 401 if logged out)
            if (!error.config.url.endsWith('/oauth/user')) {
                console.warn('Unauthorized access - session might be expired');
            }
        }
        return Promise.reject(error);
    }
);

export default api;
