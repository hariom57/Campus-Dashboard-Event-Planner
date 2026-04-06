import api from './api';

const normalizePermissionName = (name) => String(name || '')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');

const getPermissionNames = (authContext = {}) => {
    const raw = authContext.permission_names
        || authContext.permissionNames
        || authContext.permissions
        || [];

    return Array.isArray(raw) ? raw : [];
};

const hasAnyPermission = (permissionNames, candidates) => {
    const normalized = permissionNames.map(normalizePermissionName);
    return candidates.some((candidate) => normalized.includes(normalizePermissionName(candidate)));
};

const authService = {
    // Redirects to backend OAuth login route
    login: () => {
        window.location.href = `${api.defaults.baseURL}/oauth/login`;
    },

    // Fetch current user details along with auth context (admin status, etc.)
    getCurrentUser: async () => {
        try {
            const response = await api.get('/oauth/user');
            const { userData, authContext = {} } = response.data;
            const permissionNames = getPermissionNames(authContext);

            const isAdminFromNames = permissionNames.length > 0;
            const canManageClubsFromNames = hasAnyPermission(permissionNames, [
                'manage_clubs',
                'manage-clubs',
                'manage clubs',
            ]);
            const canManageLocationsFromNames = hasAnyPermission(permissionNames, [
                'location_crud',
                'location-crud',
                'location crud',
            ]);
            const canManageEventCategoriesFromNames = hasAnyPermission(permissionNames, [
                'event_category_crud',
                'event-category-crud',
                'event category crud',
            ]);
            const canManageEventsFromNames = hasAnyPermission(permissionNames, [
                'event_crud',
                'event-crud',
                'event crud',
            ]);
            const canManageAdminsFromNames = hasAnyPermission(permissionNames, [
                'manage_admins',
                'manage-admins',
                'manage admins',
            ]);
            const canManageClubAdminsFromNames = hasAnyPermission(permissionNames, [
                'manage_club_admins',
                'manage-club-admins',
                'manage club admins',
            ]);

            return {
                ...userData,
                permissionNames,
                isAdmin: authContext.is_admin === true || isAdminFromNames,
                canManageClubs: canManageClubsFromNames,
                canManageLocations: canManageLocationsFromNames,
                canManageEventCategories: canManageEventCategoriesFromNames,
                canManageEvents: canManageEventsFromNames,
                canManageAdmins: canManageAdminsFromNames,
                canManageClubAdmins: canManageClubAdminsFromNames,
                managedClubIds: Array.isArray(authContext.club_admin_club_ids)
                    ? authContext.club_admin_club_ids.map((id) => Number(id))
                    : [],
                preferredClubs: Array.isArray(authContext.preferred_clubs)
                    ? authContext.preferred_clubs.map((id) => Number(id))
                    : [],
                notPreferredClubs: Array.isArray(authContext.not_preferred_clubs)
                    ? authContext.not_preferred_clubs.map((id) => Number(id))
                    : [],
                preferredCategories: Array.isArray(authContext.preferred_categories)
                    ? authContext.preferred_categories.map((id) => Number(id))
                    : [],
                notPreferredCategories: Array.isArray(authContext.not_preferred_categories)
                    ? authContext.not_preferred_categories.map((id) => Number(id))
                    : [],
            };
        } catch (error) {
            // If user is not logged in, this will fail - which is fine for the initial app load state.
            throw error;
        }
    },

    // Logout
    logout: async () => {
        try {
            await api.post('/oauth/logout');
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
