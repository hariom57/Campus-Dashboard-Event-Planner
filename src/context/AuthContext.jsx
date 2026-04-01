import React, { createContext, useState, useEffect, useContext } from 'react';
import authService from '../services/auth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [notifications, setNotifications] = useState([]);

    useEffect(() => {
        // Load notifications from local storage if available
        const savedNotifs = localStorage.getItem('iitr_notifications');
        if (savedNotifs) {
            try { setNotifications(JSON.parse(savedNotifs)); } catch (e) { }
        }

        // Check if user is logged in
        const checkAuth = async () => {
            try {
                // 1. Initial Identity Check
                const userData = await authService.getCurrentUser();
                
                // 2. Fetch Privilege Details (if identity is confirmed)
                let isAdmin = false;
                let managedClubs = [];

                if (userData) {
                    try {
                        isAdmin = await authService.getIsAdmin();
                        if (isAdmin) {
                            managedClubs = await authService.getManagedClubs();
                        }
                    } catch (privError) {
                        // Suppress privilege fetch errors if not fully logged in or permission issue
                    }
                }

                setUser({ ...userData, isAdmin, managedClubs });
            } catch (error) {
                // Identity fetch failed (401) is the expected path for logged-out users
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        checkAuth();
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

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, notifications, toggleNotification }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
