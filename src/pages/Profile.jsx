import React, { useEffect, useMemo, useState } from 'react';
import { Loader, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import tinkeringLogo from '../assets/tinkering_logo.png';
import clubsService from '../services/clubs';
import miscService from '../services/misc';
import userService from '../services/user';
import './Profile.css';

const emptyPreferences = {
    preferred_clubs: [],
    not_preferred_clubs: [],
    preferred_categories: [],
    not_preferred_categories: [],
};

const ProfilePage = () => {
    const navigate = useNavigate();
    const { user, logout, updateUserPreferences } = useAuth();
    const [clubs, setClubs] = useState([]);
    const [categories, setCategories] = useState([]);
    const [preferences, setPreferences] = useState(emptyPreferences);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        let active = true;

        const loadData = async () => {
            setLoading(true);
            setError('');

            try {
                const [clubData, categoryData] = await Promise.all([
                    clubsService.getAllClubs(),
                    miscService.getAllEventCategories(),
                ]);

                if (!active) return;
                setClubs(clubData || []);
                setCategories(categoryData || []);
            } catch (loadError) {
                console.error('Failed to load profile preferences', loadError);
                if (active) setError('Could not load preferences. Please refresh and try again.');
            } finally {
                if (active) setLoading(false);
            }
        };

        loadData();
        return () => { active = false; };
    }, []);

    useEffect(() => {
        setPreferences({
            preferred_clubs: Array.isArray(user?.preferredClubs) ? user.preferredClubs.map(Number) : [],
            not_preferred_clubs: Array.isArray(user?.notPreferredClubs) ? user.notPreferredClubs.map(Number) : [],
            preferred_categories: Array.isArray(user?.preferredCategories) ? user.preferredCategories.map(Number) : [],
            not_preferred_categories: Array.isArray(user?.notPreferredCategories) ? user.notPreferredCategories.map(Number) : [],
        });
    }, [
        user?.preferredClubs,
        user?.notPreferredClubs,
        user?.preferredCategories,
        user?.notPreferredCategories,
    ]);

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    const toggleSelection = (targetKey, oppositeKey, id) => {
        setSaveMessage('');
        setPreferences((prev) => {
            const target = new Set(prev[targetKey]);
            const opposite = new Set(prev[oppositeKey]);

            if (target.has(id)) {
                target.delete(id);
            } else {
                target.add(id);
                opposite.delete(id);
            }

            return {
                ...prev,
                [targetKey]: Array.from(target),
                [oppositeKey]: Array.from(opposite),
            };
        });
    };

    const preferredClubSet = useMemo(() => new Set(preferences.preferred_clubs), [preferences.preferred_clubs]);
    const blockedClubSet = useMemo(() => new Set(preferences.not_preferred_clubs), [preferences.not_preferred_clubs]);
    const preferredCategorySet = useMemo(() => new Set(preferences.preferred_categories), [preferences.preferred_categories]);
    const blockedCategorySet = useMemo(() => new Set(preferences.not_preferred_categories), [preferences.not_preferred_categories]);

    const handleSavePreferences = async () => {
        setSaving(true);
        setSaveMessage('');
        setError('');

        try {
            const response = await userService.updatePreferences(preferences);
            if (response?.authContext) {
                updateUserPreferences(response.authContext);
            }
            setSaveMessage('Preferences saved successfully.');
        } catch (saveError) {
            console.error('Failed to update preferences', saveError);
            setError('Could not save preferences. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const renderDualChoiceChip = (item, preferredSet, blockedSet, onPreferredToggle, onBlockedToggle) => {
        const itemId = Number(item.id);
        const preferred = preferredSet.has(itemId);
        const blocked = blockedSet.has(itemId);

        return (
            <div key={item.id} className="pref-choice-card">
                <span className="pref-choice-name">{item.name}</span>
                <div className="pref-choice-actions">
                    <button
                        type="button"
                        className={`pref-chip positive ${preferred ? 'active' : ''}`}
                        onClick={onPreferredToggle}
                    >
                        Preferred
                    </button>
                    <button
                        type="button"
                        className={`pref-chip negative ${blocked ? 'active' : ''}`}
                        onClick={onBlockedToggle}
                    >
                        Not Preferred
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="alerts-page">
            <div className="page-header-bar">
                <h1>Profile</h1>
            </div>

            {user && (
                <div className="alerts-profile-card">
                    <div className="alerts-profile-main">
                        {user.display_picture ? (
                            <img
                                src={"https://channeli.in" + user.display_picture}
                                alt={user.full_name}
                                className="alerts-avatar"
                            />
                        ) : (
                            <div className="alerts-avatar-placeholder">
                                {(user.full_name || 'U').charAt(0).toUpperCase()}
                            </div>
                        )}
                        <div className="alerts-profile-info">
                            <span className="alerts-profile-name">{user.full_name}</span>
                            <span className="alerts-profile-sub">{user.enrolment_number || user.branch || ''}</span>
                        </div>
                    </div>
                    <button type="button" className="profile-logout-btn" onClick={handleLogout}>
                        <LogOut size={16} />
                        <span>Logout</span>
                    </button>
                </div>
            )}

            <div className="alerts-section">
                <div className="alerts-section-header">
                    <h2>Feed Preferences</h2>
                    <button className="btn-save-prefs" onClick={handleSavePreferences} disabled={loading || saving}>
                        {saving ? (
                            <>
                                <Loader size={14} className="spin" />
                                Saving...
                            </>
                        ) : 'Save Preferences'}
                    </button>
                </div>

                {loading ? (
                    <div className="prefs-loading card">
                        <Loader size={26} className="spin" />
                        <p>Loading your preferences...</p>
                    </div>
                ) : (
                    <div className="prefs-editor card">
                        {error && <p className="prefs-error-text">{error}</p>}
                        {saveMessage && <p className="prefs-success-text">{saveMessage}</p>}

                        <section className="prefs-block">
                            <h3>Clubs</h3>
                            <p>Mark each club as preferred or not preferred to personalize your feed.</p>
                            <div className="pref-choice-grid">
                                {clubs.map((club) => renderDualChoiceChip(
                                    club,
                                    preferredClubSet,
                                    blockedClubSet,
                                    () => toggleSelection('preferred_clubs', 'not_preferred_clubs', Number(club.id)),
                                    () => toggleSelection('not_preferred_clubs', 'preferred_clubs', Number(club.id)),
                                ))}
                            </div>
                        </section>

                        <section className="prefs-block">
                            <h3>Categories</h3>
                            <p>Choose categories you want more of and categories you want less of.</p>
                            <div className="pref-choice-grid">
                                {categories.map((category) => renderDualChoiceChip(
                                    category,
                                    preferredCategorySet,
                                    blockedCategorySet,
                                    () => toggleSelection('preferred_categories', 'not_preferred_categories', Number(category.id)),
                                    () => toggleSelection('not_preferred_categories', 'preferred_categories', Number(category.id)),
                                ))}
                            </div>
                        </section>
                    </div>
                )}
            </div>

            <div className="alerts-footer">
                <div className="alerts-footer-logos">
                    <img src={tinkeringLogo} alt="Tinkering Labs" className="footer-tl-logo" />
                </div>
                <p>Made with <span className="heart">❤</span> by Tinkering Lab</p>
            </div>
        </div>
    );
};

export default ProfilePage;
