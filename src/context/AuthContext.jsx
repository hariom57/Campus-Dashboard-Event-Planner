import React, { createContext, useState, useEffect, useContext } from 'react';
import authService from '../services/auth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [notifications, setNotifications] = useState([]);
    const [backendSlow, setBackendSlow] = useState(false);

    useEffect(() => {
        // Load notifications from local storage if available
        const savedNotifs = localStorage.getItem('iitr_notifications');
        if (savedNotifs) {
            try { setNotifications(JSON.parse(savedNotifs)); } catch (e) { }
        }

        // Track if component is mounted to prevent state updates after unmount
        let isMounted = true;

        // Check if user is logged in
        const checkAuth = async () => {
            // Show a "backend is waking up" hint after 8 seconds
            const slowTimer = setTimeout(() => {
                if (isMounted) setBackendSlow(true);
            }, 8000);

            try {
                // 1. Identity Check - includes admin status and other privileges from JWT
                const userData = await authService.getCurrentUser();
                if (isMounted) {
                    setUser({
                        ...userData,
                        managedClubIds: Array.isArray(userData?.managedClubIds) ? userData.managedClubIds : [],
                        canManageClubs: userData?.canManageClubs === true,
                        canManageLocations: userData?.canManageLocations === true,
                        canManageEventCategories: userData?.canManageEventCategories === true,
                        canManageEvents: userData?.canManageEvents === true,
                        canManageAdmins: userData?.canManageAdmins === true,
                        canManageClubAdmins: userData?.canManageClubAdmins === true,
                        preferredClubs: Array.isArray(userData?.preferredClubs) ? userData.preferredClubs : [],
                        notPreferredClubs: Array.isArray(userData?.notPreferredClubs) ? userData.notPreferredClubs : [],
                        preferredCategories: Array.isArray(userData?.preferredCategories) ? userData.preferredCategories : [],
                        notPreferredCategories: Array.isArray(userData?.notPreferredCategories) ? userData.notPreferredCategories : [],
                    });
                }
            } catch (error) {
                // Identity fetch failed (401) is the expected path for logged-out users
                if (isMounted) {
                    setUser(null);
                }
            } finally {
                clearTimeout(slowTimer);
                if (isMounted) {
                    setBackendSlow(false);
                    setLoading(false);
                }
            }
        };

        checkAuth();

        // Cleanup function to mark component as unmounted
        return () => {
            isMounted = false;
        };
    }, []);

    // Effect to auto-save notifications when changed
    useEffect(() => {
        localStorage.setItem('iitr_notifications', JSON.stringify(notifications));
    }, [notifications]);

    const toggleNotification = (event) => {
        setNotifications(prev => {
            const exists = prev.find(n => n.id === event.id);
            if (exists) {
                return prev.filter(n => n.id !== event.id);
            } else {
                return [...prev, {
                    id: event.id,
                    title: event.title,
                    time: event.time,
                    date: event.date || new Date().toLocaleDateString(),
                    addedAt: new Date().toISOString()
                }];
            }
        });
    };

    const login = () => {
        authService.login();
    };

    const logout = () => {
        authService.logout();
        setUser(null);
    };

    const updateUserPreferences = (nextPrefs) => {
        setUser((prev) => {
            if (!prev) return prev;
            return {
                ...prev,
                preferredClubs: Array.isArray(nextPrefs?.preferred_clubs) ? nextPrefs.preferred_clubs : prev.preferredClubs,
                notPreferredClubs: Array.isArray(nextPrefs?.not_preferred_clubs) ? nextPrefs.not_preferred_clubs : prev.notPreferredClubs,
                preferredCategories: Array.isArray(nextPrefs?.preferred_categories) ? nextPrefs.preferred_categories : prev.preferredCategories,
                notPreferredCategories: Array.isArray(nextPrefs?.not_preferred_categories) ? nextPrefs.not_preferred_categories : prev.notPreferredCategories,
            };
        });
    };

    return (
        <AuthContext.Provider value={{ user, loading, backendSlow, login, logout, notifications, toggleNotification, updateUserPreferences }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
