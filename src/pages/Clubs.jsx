import React, { useMemo, useState } from 'react';
import { Building2, Edit, Loader, Mail, Plus, Search, ShieldAlert, Save, Trash2, Users, X } from 'lucide-react';
import useSWR from 'swr';
import { useAuth } from '../context/AuthContext';
import clubsService from '../services/clubs';
import './Clubs.css';
import { uploadImageToCDN } from '../services/upload';

const emptyForm = {
    name: '',
    email: '',
    description: '',
    logo_url: ''
};

const ClubsPage = () => {
    const { user, loading: authLoading } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingClubId, setEditingClubId] = useState(null);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState(emptyForm);

    const isGlobalAdmin = user?.canManageClubs || false;
    const managedClubIds = user?.managedClubIds || [];

    const canEditClub = (club) => {
        if (isGlobalAdmin) return true;
        return club && managedClubIds.includes(Number(club.id));
    };

    const { data: clubsData, isLoading, mutate } = useSWR(
        (!authLoading && user) ? 'all_clubs' : null,
        () => clubsService.getAllClubs()
    );

    const clubs = clubsData || [];
    const loading = isLoading;

    const filteredClubs = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        if (!query) return clubs;

        return clubs.filter((club) => {
            return [club.name, club.email, club.description]
                .filter(Boolean)
                .some((value) => value.toLowerCase().includes(query));
        });
    }, [clubs, searchQuery]);

    const handleLogoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            const logoUrl = await uploadImageToCDN(file);
            setFormData(prev => ({ ...prev, logo_url: logoUrl }));
            alert("Logo uploaded successfully!");
        } catch (err) {
            alert("Failed to upload logo. Please try again.");
        }
    };

    const openCreateModal = () => {
        if (!isGlobalAdmin) return;
        setEditingClubId(null);
        setFormData(emptyForm);
        setShowForm(true);
    };

    const openEditModal = (club) => {
        if (!canEditClub(club)) return;
        setEditingClubId(club.id);
        setFormData({
            name: club.name || '',
            email: club.email || '',
            description: club.description || '',
            logo_url: club.logo_url || ''
        });
        setShowForm(true);
    };

    const closeModal = () => {
        setShowForm(false);
        setEditingClubId(null);
        setFormData(emptyForm);
    };

    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const refreshClubs = async () => {
        await mutate();
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        
        // Final permission check before submit
        const isEditing = !!editingClubId;
        const targetClub = isEditing ? clubs.find(c => c.id === editingClubId) : null;
        
        if (isEditing) {
            if (!canEditClub(targetClub)) return;
        } else {
            if (!isGlobalAdmin) return;
        }

        setSaving(true);

        try {
            if (editingClubId) {
                await clubsService.updateClub(editingClubId, formData);
            } else {
                await clubsService.createClub(formData);
            }

            await refreshClubs();
            closeModal();
        } catch (error) {
            console.error('Failed to save club', error);
            alert('Club save failed. Please check the form and permissions.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (club) => {
        if (!isGlobalAdmin) return;
        if (!window.confirm(`Delete ${club.name}?`)) return;

        try {
            await clubsService.deleteClub(club.id);
            mutate(clubs.filter((item) => item.id !== club.id), false);
        } catch (error) {
            console.error('Failed to delete club', error);
            alert('Club delete failed.');
        }
    };

    if (authLoading) {
        return (
            <div className="clubs-page flex-center">
                <Loader className="spin" size={32} color="var(--brand-purple)" />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="clubs-page clubs-access-state flex-center">
                <div className="card clubs-access-card text-center">
                    <ShieldAlert size={48} color="var(--brand-purple)" style={{ margin: '0 auto 1rem' }} />
                    <h2>Club Access Required</h2>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: 0 }}>
                        Please log in to view clubs.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="clubs-page">
            <div className="page-header-bar">
                <div className="clubs-header-copy">
                    <h1>Clubs</h1>
                    <p className="clubs-page-subtitle">Browse every club available to all logged-in users.</p>
                </div>

                <div className="clubs-header-actions">
                    <div className="clubs-header-stat">
                        <Users size={18} />
                        <span>{clubs.length} Clubs</span>
                    </div>

                    {isGlobalAdmin && (
                        <button className="btn btn-yellow clubs-add-btn" onClick={openCreateModal}>
                            <Plus size={18} />
                            Add Club
                        </button>
                    )}
                </div>
            </div>

            <div className="clubs-content">
                <div className="clubs-search card">
                    <Search size={18} className="clubs-search-icon" />
                    <input
                        type="text"
                        placeholder="Search clubs by name, email, or description"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                {loading ? (
                    <div className="clubs-loading card">
                        <Loader className="spin" size={28} color="var(--brand-purple)" />
                        <p>Loading clubs...</p>
                    </div>
                ) : (
                    <div className="clubs-grid">
                        {filteredClubs.length > 0 ? (
                            filteredClubs.map((club) => (
                                <article key={club.id} className="club-card card">
                                    {(isGlobalAdmin || canEditClub(club)) && (
                                        <div className="club-card-actions">
                                            <button className="btn-icon club-action-btn" onClick={() => openEditModal(club)} title="Edit Club">
                                                <Edit size={16} />
                                            </button>
                                            {isGlobalAdmin && (
                                                <button className="btn-icon club-action-btn danger" onClick={() => handleDelete(club)} title="Delete Club">
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                    )}

                                    <div className="club-card-top">
                                        <div className="club-avatar-wrap">
                                            {club.logo_url ? (
                                                <img src={club.logo_url} alt={club.name} className="club-logo" />
                                            ) : (
                                                <div className="club-logo-fallback">
                                                    <Building2 size={22} />
                                                </div>
                                            )}
                                        </div>

                                        <div className="club-meta">
                                            <h2>{club.name}</h2>
                                            <a className="club-email" href={`mailto:${club.email}`}>
                                                <Mail size={14} />
                                                <span>{club.email}</span>
                                            </a>
                                        </div>
                                    </div>

                                    {club.description ? (
                                        <p className="club-description">{club.description}</p>
                                    ) : (
                                        <p className="club-description club-description-empty">No description available.</p>
                                    )}
                                </article>
                            ))
                        ) : (
                            <div className="clubs-empty card">
                                <Building2 size={40} color="var(--grey-300)" />
                                <p>No clubs match your search.</p>
                            </div>
                        )}
                    </div>
                )}

                {showForm && (isGlobalAdmin || (editingClubId && canEditClub(clubs.find(c => c.id === editingClubId)))) && (
                    <div className="modal-overlay animate-fade-in">
                        <div className="modal-content card clubs-modal">
                            <div className="modal-header clubs-modal-header">
                                <h2>{editingClubId ? 'Edit Club' : 'Add Club'}</h2>
                                <button className="btn-icon" onClick={closeModal}>
                                    <X size={20} />
                                </button>
                            </div>

                            <form className="clubs-form" onSubmit={handleSubmit}>
                                <div className="form-grid">
                                    <div className="form-group full-width">
                                        <label>Club Name</label>
                                        <input name="name" value={formData.name} onChange={handleChange} required />
                                    </div>

                                    <div className="form-group full-width">
                                        <label>Email</label>
                                        <input name="email" type="email" value={formData.email} onChange={handleChange} required />
                                    </div>

                                    <div className="form-group full-width">
                                        <label>Description</label>
                                        <textarea name="description" rows="4" value={formData.description} onChange={handleChange} />
                                    </div>

                                    <div className="form-group full-width">
                                        <label>Club Logo</label>
                                    <div className="image-upload-input-group">
                                        <div className="file-upload-cell">
                                            <input 
                                                type="file" 
                                                accept="image/*" 
                                                onChange={handleLogoUpload} 
                                                className="file-input-elegant"
                                            />
                                        </div>
                                        <div className="upload-or-divider">
                                            <span>OR</span>
                                        </div>
                                        <div className="url-upload-cell">
                                            <input 
                                                name="logo_url" 
                                                value={formData.logo_url || ''} 
                                                onChange={handleChange} 
                                                placeholder="Paste Logo URL"
                                                className="url-input-field"
                                            />
                                        </div>
                                    </div>
                                        {formData.logo_url && <img src={formData.logo_url} alt="Logo Preview" style={{ marginTop: '10px', width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover' }} />}
                                    </div>
                                </div>

                                <div className="form-actions">
                                    <button type="button" className="btn btn-outline" onClick={closeModal}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn btn-primary" disabled={saving}>
                                        <Save size={16} />
                                        {saving ? 'Saving...' : 'Save Club'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ClubsPage;