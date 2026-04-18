import React, { useEffect, useMemo, useState } from 'react';
import { Building2, ChevronDown, ChevronUp, Loader, LogOut, Mail, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import useSWR from 'swr';
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
    const { data: clubsData, isLoading: clubsLoading, error: clubsError } = useSWR(
        'all_clubs',
        () => clubsService.getAllClubs()
    );

    const { data: categoriesData, isLoading: categoriesLoading, error: categoriesError } = useSWR(
        'all_categories',
        () => miscService.getAllEventCategories()
    );

    const clubs = clubsData || [];
    const categories = categoriesData || [];
    const loading = clubsLoading || categoriesLoading;
    const error = clubsError || categoriesError ? 'Could not load preferences. Please refresh and try again.' : '';
    
    const [preferences, setPreferences] = useState(emptyPreferences);
    const [saving, setSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [clubSearch, setClubSearch] = useState('');
    const [expandedClubId, setExpandedClubId] = useState(null);

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

    const toggleClubVisibility = (id) => {
        setSaveMessage('');
        setPreferences((prev) => {
            const blocked = new Set(prev.not_preferred_clubs);
            if (blocked.has(id)) {
                blocked.delete(id); 
            } else {
                blocked.add(id); 
            }
            return { ...prev, not_preferred_clubs: Array.from(blocked) };
        });
    };

    const preferredClubSet = useMemo(() => new Set(preferences.preferred_clubs), [preferences.preferred_clubs]);
    const blockedClubSet = useMemo(() => new Set(preferences.not_preferred_clubs), [preferences.not_preferred_clubs]);
    const preferredCategorySet = useMemo(() => new Set(preferences.preferred_categories), [preferences.preferred_categories]);
    const blockedCategorySet = useMemo(() => new Set(preferences.not_preferred_categories), [preferences.not_preferred_categories]);

    const handleSavePreferences = async () => {
        if (!user) return;
        setSaving(true);
        setSaveMessage('');
        setErrorMessage('');

        try {
            const response = await userService.updatePreferences(preferences);
            if (response?.authContext) {
                updateUserPreferences(response.authContext);
            }
            setSaveMessage('Preferences saved successfully.');
        } catch (saveError) {
            console.error('Failed to update preferences', saveError);
            setErrorMessage('Could not save preferences. Please try again.');
        } finally {
            setSaving(false);
        }
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
                            <p>All clubs are enabled by default. Uncheck a club to hide its events from your feed.</p>
                            <div className="pref-search-wrap">
                                <Search size={15} className="pref-search-icon" />
                                <input
                                    type="text"
                                    className="pref-search-input"
                                    placeholder="Search clubs..."
                                    value={clubSearch}
                                    onChange={(e) => setClubSearch(e.target.value)}
                                />
                                {clubSearch && (
                                    <button className="pref-search-clear" onClick={() => setClubSearch('')}>✕</button>
                                )}
                            </div>
                            <div className="pref-ui-editor pref-ui-list">
                                {clubs
                                    .filter((club) => club.name.toLowerCase().includes(clubSearch.toLowerCase()))
                                    .map((club) => {
                                        const isHidden = preferences.not_preferred_clubs.includes(Number(club.id));
                                        const isChecked = !isHidden;
                                        const isExpanded = expandedClubId === club.id;

                                        return (
                                            <div key={club.id} className="pref-club-card-container">
                                                <div 
                                                    className={`pref-club-row ${isHidden ? 'is-hidden' : ''}`}
                                                    onClick={() => setExpandedClubId(isExpanded ? null : club.id)}
                                                >
                                                    <div className="pref-club-main">
                                                        <div className="pref-club-avatar">
                                                            {club.logo_url ? (
                                                                <img src={club.logo_url} alt="" />
                                                            ) : (
                                                                <div className="pref-club-avatar-fallback">
                                                                    <Building2 size={16} />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <span className="pref-club-name">{club.name}</span>
                                                    </div>
                                                    
                                                    <div className="pref-club-actions">
                                                        <input
                                                            type="checkbox"
                                                            checked={isChecked}
                                                            onChange={(e) => {
                                                                e.stopPropagation();
                                                                toggleClubVisibility(Number(club.id));
                                                            }}
                                                            className="pref-checkbox"
                                                        />
                                                        <div className="pref-expand-icon">
                                                            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                                        </div>
                                                    </div>
                                                </div>

                                                {isExpanded && (
                                                    <div className="pref-club-details animate-fade-in">
                                                        {club.description ? (
                                                            <p className="pref-club-desc">{club.description}</p>
                                                        ) : (
                                                            <p className="pref-club-desc-empty">No description available.</p>
                                                        )}
                                                        <a href={`mailto:${club.email}`} className="pref-club-email-link">
                                                            <Mail size={14} />
                                                            <span>{club.email}</span>
                                                        </a>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })
                                }
                                {clubs.filter((club) => club.name.toLowerCase().includes(clubSearch.toLowerCase())).length === 0 && (
                                    <p className="pref-search-empty">No clubs match your search.</p>
                                )}
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
