import api from './api';

const authService = {
    // Redirects to backend OAuth login route
    login: () => {
        window.location.href = `${api.defaults.baseURL}/oauth/login`;
    },

    // Fetch current user details
    getCurrentUser: async () => {
        try {
            const response = await api.get('/oauth/user');
            return response.data.userData;
        } catch (error) {
            // If user is not logged in, this will fail - which is fine for the initial app load state.
            throw error;
        }
    },

    // Check admin privilege from backend source of truth
    getIsAdmin: async () => {
        const response = await api.get('/admins/is-admin');
        return response.data?.is_admin === true;
    },

    // Logout
    logout: async () => {
        try {
            await api.get('/oauth/logout');
            // Redirect to home or login page after successful logout
            window.location.href = '/';
        } catch (error) {
            console.error('Logout failed:', error);
            // Even if call fails, we might want to clear local state/redirect
            window.location.href = '/';
        }
    }
};

export default authService;
