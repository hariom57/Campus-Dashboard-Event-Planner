import api from './api';

const parsePermissions = (rawPermissions) => {
    if (Array.isArray(rawPermissions)) return rawPermissions;
    if (typeof rawPermissions === 'string') {
        try {
            const parsed = JSON.parse(rawPermissions);
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    }
    return [];
};

const normalizeAdmin = (admin) => ({
    ...admin,
    permissions: parsePermissions(admin?.permissions),
});

const adminsService = {
    getAllAdmins: async () => {
        const response = await api.get('/admins/all');
        const admins = Array.isArray(response.data?.admins) ? response.data.admins : [];
        return admins.map(normalizeAdmin);
    },

    getAdminByUserId: async (userId) => {
        const response = await api.get(`/admins/${userId}`);
        return normalizeAdmin(response.data?.admin || {});
    },

    addAdmin: async (payload) => {
        const response = await api.post('/admins/add', payload);
        return response.data;
    },

    updateAdminPermissions: async (userId, permissionIds) => {
        const response = await api.patch(`/admins/${userId}`, {
            permission_ids: permissionIds,
        });
        return response.data;
    },

    deleteAdmin: async (userId) => {
        const response = await api.delete(`/admins/${userId}`);
        return response.data;
    },

    getAllAdminPermissions: async () => {
        const response = await api.get('/admin-permissions/all');
        return Array.isArray(response.data?.permissions) ? response.data.permissions : [];
    },
};

export default adminsService;
