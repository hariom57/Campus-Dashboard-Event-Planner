import React, { useState, useEffect } from 'react';
import {
    LayoutDashboard, Plus, Calendar, Settings, Users,
    X, Check, Loader, Edit, Trash2, ShieldAlert, MapPin, Tags
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import miscService from '../services/misc';
import eventService from '../services/events';
import clubsService from '../services/clubs';
import adminsService from '../services/admins';
import clubAdminsService from '../services/clubAdmins';
import { useSWRConfig } from 'swr';
import './Admin.css';
import { uploadImageToCDN } from '../services/upload';

const pad2 = (value) => String(value).padStart(2, '0');

const formatDateInputLocal = (date) => {
    return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
};

const formatTimeInputLocal = (date) => {
    return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
};

const buildDateTimeWithOffset = (datePart, timePart) => {
    const localDate = new Date(`${datePart}T${timePart}`);
    if (Number.isNaN(localDate.getTime())) return null;

    const offsetMinutes = -localDate.getTimezoneOffset();
    const sign = offsetMinutes >= 0 ? '+' : '-';
    const absOffset = Math.abs(offsetMinutes);
    const offsetHours = Math.floor(absOffset / 60);
    const offsetMins = absOffset % 60;

    return `${datePart}T${timePart}:00${sign}${pad2(offsetHours)}:${pad2(offsetMins)}`;
};

const Admin = () => {
    const { user, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const { mutate } = useSWRConfig();

    const [activeTab, setActiveTab] = useState('events');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [locations, setLocations] = useState([]);
    const [categories, setCategories] = useState([]);
    const [events, setEvents] = useState([]);
    const [managedClubs, setManagedClubs] = useState([]);
    const [editingEventId, setEditingEventId] = useState(null);
    const [showLocationModal, setShowLocationModal] = useState(false);
    const [editingLocationId, setEditingLocationId] = useState(null);
    const [locationSaving, setLocationSaving] = useState(false);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [editingCategoryId, setEditingCategoryId] = useState(null);
    const [categorySaving, setCategorySaving] = useState(false);
    const [admins, setAdmins] = useState([]);
    const [adminPermissions, setAdminPermissions] = useState([]);
    const [showAdminModal, setShowAdminModal] = useState(false);
    const [editingAdminId, setEditingAdminId] = useState(null);
    const [adminSaving, setAdminSaving] = useState(false);
    const [selectedClubAdminClubId, setSelectedClubAdminClubId] = useState('');
    const [clubAdmins, setClubAdmins] = useState([]);
    const [newClubAdminEnrollment, setNewClubAdminEnrollment] = useState('');
    const [clubAdminsLoading, setClubAdminsLoading] = useState(false);
    const [clubAdminSaving, setClubAdminSaving] = useState(false);
    const [showClubModal, setShowClubModal] = useState(false);
    const [editingClubId, setEditingClubId] = useState(null);
    const [clubSaving, setClubSaving] = useState(false);
    const [clubForm, setClubForm] = useState({
        name: '',
        email: '',
        description: '',
        logo_url: ''
    });

    // Build managed clubs from JWT club ids + public clubs list
    const clubs = managedClubs;
    const managedClubIds = user?.managedClubIds || [];
    const isAdmin = user?.isAdmin || false;
    const canManageLocations = user?.canManageLocations || false;
    const canManageEventCategories = user?.canManageEventCategories || false;
    const canManageEvents = (user?.canManageEvents || false) || managedClubIds.length > 0;
    const hasGlobalEventCrud = user?.canManageEvents === true;
    const canManageAdmins = user?.canManageAdmins || false;
    const canManageClubAdmins = user?.canManageClubAdmins || false;
    const canManageClubs = user?.canManageClubs || false;
    const canManageSomeClubs = canManageClubs || managedClubIds.length > 0;
    const hasAdminPanelAccess = isAdmin || managedClubIds.length > 0;

    const [newEvent, setNewEvent] = useState({
        name: '',
        club_id: '',
        location_id: '',
        date: '',
        endDate: '',
        time: '',
        isAllDay: false,
        isMultiDay: false,
        duration_minutes: 60,
        description: '',
        category_ids: [], 
        image_url: ''
    });

    const [locationForm, setLocationForm] = useState({
        name: '',
        location_url: '',
        latitude: '',
        longitude: '',
        description: '',
        images_text: ''
    });
    const [categoryForm, setCategoryForm] = useState({
        name: ''
    });
    const [adminForm, setAdminForm] = useState({
        enrolment_number: '',
        permission_ids: []
    });

    useEffect(() => {
        fetchLocations();
        fetchCategories();
        fetchEvents();
    }, []);

    useEffect(() => {
        const fetchManagedClubs = async () => {
            if (authLoading || !user) return;

            const hasClubScopedAccess = Array.isArray(managedClubIds) && managedClubIds.length > 0;
            const hasGlobalClubAdminAccess = canManageClubAdmins;
            if (!hasGlobalEventCrud && !hasClubScopedAccess && !hasGlobalClubAdminAccess) return;

            try {
                const allClubs = await clubsService.getAllClubs();
                let filtered = [];
                if (hasGlobalEventCrud || hasGlobalClubAdminAccess) {
                    filtered = allClubs;
                } else {
                    const allowedClubIds = new Set((managedClubIds || []).map((id) => Number(id)));
                    filtered = allClubs.filter((club) => allowedClubIds.has(Number(club.id)));
                }
                setManagedClubs(filtered);

                // Auto-select if only one club available
                if (filtered.length === 1 && !newEvent.club_id) {
                    setNewEvent(prev => ({ ...prev, club_id: String(filtered[0].id) }));
                }
            } catch (error) {
                console.error('Failed to fetch managed clubs', error);
                setManagedClubs([]);
            }
        };

        fetchManagedClubs();
    }, [authLoading, user, managedClubIds, hasGlobalEventCrud, canManageClubAdmins]);

    useEffect(() => {
        if (locations.length === 1 && !newEvent.location_id) {
            setNewEvent(prev => ({ ...prev, location_id: String(locations[0].id) }));
        }
    }, [locations]);

    useEffect(() => {
        if (!isAdmin || !canManageAdmins) return;
        fetchAdmins();
        fetchAdminPermissions();
    }, [isAdmin, canManageAdmins]);

    useEffect(() => {
        const availableTabs = [];
        if (canManageEvents) availableTabs.push('events');
        if (canManageLocations) availableTabs.push('locations');
        if (canManageEventCategories) availableTabs.push('categories');
        if (canManageAdmins) availableTabs.push('admins');
        if (canManageClubAdmins) availableTabs.push('club-admins');
        if (canManageSomeClubs) availableTabs.push('manage-clubs');

        if (availableTabs.length === 0) return;
        if (!availableTabs.includes(activeTab)) {
            setActiveTab(availableTabs[0]);
        }
    }, [
        activeTab,
        canManageEvents,
        canManageLocations,
        canManageEventCategories,
        canManageAdmins,
        canManageClubAdmins,
    ]);

    useEffect(() => {
        if (!canManageClubAdmins) return;
        if (!selectedClubAdminClubId && clubs.length > 0) {
            setSelectedClubAdminClubId(String(clubs[0].id));
        }
    }, [canManageClubAdmins, clubs, selectedClubAdminClubId]);

    useEffect(() => {
        if (!canManageClubAdmins) return;
        if (!selectedClubAdminClubId) {
            setClubAdmins([]);
            return;
        }
        fetchClubAdmins(selectedClubAdminClubId);
    }, [canManageClubAdmins, selectedClubAdminClubId]);

    const fetchEvents = async () => {
        try {
            const data = await eventService.getAdminEvents(1, 100);
            setEvents(data);
        } catch (error) {
            console.error("Failed to fetch events", error);
        }
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            setLoading(true)
            const imageUrl = await uploadImageToCDN(file);
            setNewEvent(prev => ({ ...prev, image_url: imageUrl }));
            alert("Image uploaded successfully!");
        } catch (err) {
            alert("Failed to upload image. Please try again.");
        } finally {
            setLoading(false)
        }
    };

    const fetchLocations = async () => {
        try {
            const data = await miscService.getAllLocations();
            setLocations(data);
        } catch (error) {
            console.error("Failed to fetch locations", error);
        }
    };

    const fetchCategories = async () => {
        try {
            const data = await miscService.getAllEventCategories();
            setCategories(data);
        } catch (error) {
            console.error('Failed to fetch categories', error);
            setCategories([]);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setNewEvent(prev => ({ 
            ...prev, 
            [name]: type === 'checkbox' ? checked : value 
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const timeToUse = newEvent.isAllDay ? '00:00' : newEvent.time;
        const tentativeStartTime = buildDateTimeWithOffset(newEvent.date, timeToUse);
        console.log('[DEBUG] Tentative Start Time:', tentativeStartTime);

        if (!tentativeStartTime) {
            alert('Please enter a valid date and time.');
            return;
        }

        setLoading(true);
        try {
            let calculatedDuration = parseInt(newEvent.duration_minutes);

            if (newEvent.isMultiDay && newEvent.endDate) {
                const start = new Date(`${newEvent.date}T${timeToUse}`);
                const endTime = newEvent.isAllDay ? '23:59' : newEvent.time;
                const end = new Date(`${newEvent.endDate}T${endTime}`);

                if (end <= start) {
                    alert('End date must be after start date.');
                    return;
                }
                calculatedDuration = Math.round((end.getTime() - start.getTime()) / (1000 * 60));
            } else if (newEvent.isAllDay) {
                calculatedDuration = 1440;
            }

            const payload = {
                name: newEvent.name,
                club_id: parseInt(newEvent.club_id),
                location_id: parseInt(newEvent.location_id),
                tentative_start_time: tentativeStartTime,
                duration_minutes: calculatedDuration,
                description: newEvent.description,
                category_ids: Array.isArray(newEvent.category_ids) ? newEvent.category_ids : [],
                image_url: newEvent.image_url,
                is_all_day: newEvent.isAllDay
            };

            const response = editingEventId 
                ? await eventService.updateEvent(editingEventId, payload)
                : await eventService.createEvent(payload);
            
            console.log('[DEBUG] Server Response:', response);
            alert(`Event "${payload.name}" ${editingEventId ? 'updated' : 'created'} successfully!`);

            setLoading(false);
            setShowCreateModal(false);
            setEditingEventId(null);
            setNewEvent({
                name: '', club_id: '', location_id: '', date: '', endDate: '', time: '',
                isAllDay: false, isMultiDay: false, duration_minutes: 60,
                description: '', category_ids: [], image_url: ''
            });

            // Invalidate global SWR caches for all users currently on the app
            mutate(key => typeof key === 'string' && key.includes('dynamic_events_page_'));
            mutate('cal_dynamic');
            
            fetchEvents();
        } catch (error) {
            console.error("Failed to save event", error);
            const msg = error.response?.data?.message || 'Please check your permissions or try again.';
            alert(`Failed to save event: ${msg}`);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = async (event) => {
        if (!event?.id) return;
        setLoading(true);
        const dateObj = new Date(event.tentative_start_time);

        let categoryIds = [];
        let detailed = null;
        try {
            detailed = await eventService.getEventById(event.id);
            categoryIds = Array.isArray(detailed?.category_ids)
                ? detailed.category_ids.map((id) => Number(id))
                : [];
        } catch (error) {
            console.error('Failed to fetch event categories for edit', error);
        }

        const normalizeId = (value) => {
            const parsed = Number(value);
            return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
        };

        const normalizeName = (value) => String(value || '').trim().toLowerCase();
        const eventClubName =
            event?.club_name
            ?? event?.['Club.club_name']
            ?? detailed?.club_name
            ?? detailed?.['Club.club_name']
            ?? detailed?.Club?.club_name
            ?? '';

        const fallbackClubByName = clubs.find((c) => normalizeName(c?.name) === normalizeName(eventClubName));

        const resolvedClubId = normalizeId(
            event?.club_id
            ?? event?.['Club.id']
            ?? detailed?.club_id
            ?? detailed?.Club?.id
            ?? fallbackClubByName?.id
        );

        const resolvedLocationId = normalizeId(
            event?.location_id
            ?? event?.['Location.location_id']
            ?? event?.['Location.id']
            ?? detailed?.location_id
            ?? detailed?.Location?.location_id
            ?? detailed?.Location?.id
        );

        const isAllDay = event.is_all_day || detailed?.is_all_day || (event.duration_minutes % 1440 === 0 && dateObj.getHours() === 0 && dateObj.getMinutes() === 0);
        const isMultiDay = event.duration_minutes >= 1440;
        
        let endDate = '';
        if (isMultiDay) {
            const endDateObj = new Date(dateObj.getTime() + event.duration_minutes * 60000);
            endDate = formatDateInputLocal(endDateObj);
        }

        setNewEvent({
            name: event.name,
            club_id: resolvedClubId ? String(resolvedClubId) : '',
            location_id: resolvedLocationId ? String(resolvedLocationId) : '',
            date: formatDateInputLocal(dateObj),
            endDate: endDate,
            time: formatTimeInputLocal(dateObj),
            isAllDay: isAllDay,
            isMultiDay: isMultiDay,
            duration_minutes: event.duration_minutes,
            description: event.description || '',
            category_ids: categoryIds,
            image_url: event.image_url
        });
        setEditingEventId(event.id);
        setShowCreateModal(true);
        setLoading(false);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this event?")) return;
        try {
            await eventService.deleteEvent(id);
            setEvents(events.filter(e => e.id !== id));

            // Invalidate global SWR caches for all users
            mutate(key => typeof key === 'string' && key.includes('dynamic_events_page_'));
            mutate('cal_dynamic');

            alert('Event deleted successfully!');
        } catch (err) {
            console.error("Failed to delete event", err);
            alert("Failed to delete event.");
        }
    };

    const openCreateModal = () => {
        if (!canManageEvents) return;
        setEditingEventId(null);
        setNewEvent({
            name: '', club_id: '', location_id: '', date: '', endDate: '', time: '',
            isAllDay: false, isMultiDay: false, duration_minutes: 60,
            description: '', category_ids: [], image_url: ''
        });
        setShowCreateModal(true);
    };

    const toggleEventCategory = (categoryId) => {
        setNewEvent((prev) => {
            const selected = Array.isArray(prev.category_ids) ? prev.category_ids : [];
            const exists = selected.includes(categoryId);
            return {
                ...prev,
                category_ids: exists
                    ? selected.filter((id) => id !== categoryId)
                    : [...selected, categoryId]
            };
        });
    };

    const openCreateLocationModal = () => {
        if (!canManageLocations) return;
        setEditingLocationId(null);
        setLocationForm({
            name: '',
            location_url: '',
            latitude: '',
            longitude: '',
            description: '',
            images_text: ''
        });
        setShowLocationModal(true);
    };

    const openEditLocationModal = (location) => {
        if (!canManageLocations) return;
        setEditingLocationId(location.id);
        setLocationForm({
            name: location.name || '',
            location_url: location.location_url || '',
            latitude: location.latitude ?? '',
            longitude: location.longitude ?? '',
            description: location.description || '',
            images_text: Array.isArray(location.images)
                ? location.images.join(', ')
                : (location.images || '')
        });
        setShowLocationModal(true);
    };

    const handleLocationInputChange = (e) => {
        const { name, value } = e.target;
        setLocationForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleLocationSubmit = async (e) => {
        e.preventDefault();
        if (!canManageLocations) return;
        setLocationSaving(true);

        try {
            const images = locationForm.images_text
                ? locationForm.images_text.split(',').map((item) => item.trim()).filter(Boolean)
                : null;

            const payload = {
                name: locationForm.name,
                location_url: locationForm.location_url || null,
                latitude: locationForm.latitude !== '' ? Number(locationForm.latitude) : null,
                longitude: locationForm.longitude !== '' ? Number(locationForm.longitude) : null,
                description: locationForm.description || null,
                images,
            };

            if (editingLocationId) {
                await miscService.updateLocation(editingLocationId, payload);
                alert('Location updated successfully!');
            } else {
                await miscService.createLocation(payload);
                alert('Location created successfully!');
            }

            await fetchLocations();
            setShowLocationModal(false);
            setEditingLocationId(null);
        } catch (error) {
            console.error('Failed to save location', error);
            alert('Failed to save location. Please check your permissions and fields.');
        } finally {
            setLocationSaving(false);
        }
    };

    const handleDeleteLocation = async (locationId, locationName) => {
        if (!canManageLocations) return;
        if (!window.confirm(`Delete location ${locationName}?`)) return;

        try {
            await miscService.deleteLocation(locationId);
            setLocations((prev) => prev.filter((loc) => loc.id !== locationId));
            alert('Location deleted successfully!');
        } catch (error) {
            console.error('Failed to delete location', error);
            alert('Failed to delete location.');
        }
    };

    const openCreateCategoryModal = () => {
        if (!canManageEventCategories) return;
        setEditingCategoryId(null);
        setCategoryForm({ name: '' });
        setShowCategoryModal(true);
    };

    const openEditCategoryModal = (category) => {
        if (!canManageEventCategories) return;
        setEditingCategoryId(category.id);
        setCategoryForm({ name: category.name || '' });
        setShowCategoryModal(true);
    };

    const handleCategoryInputChange = (e) => {
        const { name, value } = e.target;
        setCategoryForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleCategorySubmit = async (e) => {
        e.preventDefault();
        if (!canManageEventCategories) return;
        setCategorySaving(true);

        try {
            const payload = { name: categoryForm.name.trim() };

            if (editingCategoryId) {
                await miscService.updateEventCategory(editingCategoryId, payload);
                alert('Category updated successfully!');
            } else {
                await miscService.createEventCategory(payload);
                alert('Category created successfully!');
            }

            await fetchCategories();
            setShowCategoryModal(false);
            setEditingCategoryId(null);
            setCategoryForm({ name: '' });
        } catch (error) {
            console.error('Failed to save category', error);
            alert('Failed to save category. Please check your permissions and fields.');
        } finally {
            setCategorySaving(false);
        }
    };

    const handleDeleteCategory = async (categoryId, categoryName) => {
        if (!canManageEventCategories) return;
        if (!window.confirm(`Delete category ${categoryName}?`)) return;

        try {
            await miscService.deleteEventCategory(categoryId);
            setCategories((prev) => prev.filter((cat) => cat.id !== categoryId));
            alert('Category deleted successfully!');
        } catch (error) {
            console.error('Failed to delete category', error);
            alert('Failed to delete category.');
        }
    };

    const fetchAdmins = async () => {
        try {
            const data = await adminsService.getAllAdmins();
            setAdmins(data);
        } catch (error) {
            console.error('Failed to fetch admins', error);
            setAdmins([]);
        }
    };

    const fetchAdminPermissions = async () => {
        try {
            const data = await adminsService.getAllAdminPermissions();
            setAdminPermissions(data);
        } catch (error) {
            console.error('Failed to fetch admin permissions', error);
            setAdminPermissions([]);
        }
    };

    const fetchClubAdmins = async (clubId) => {
        setClubAdminsLoading(true);
        try {
            const data = await clubAdminsService.getClubAdmins(clubId);
            setClubAdmins(data);
        } catch (error) {
            console.error('Failed to fetch club admins', error);
            setClubAdmins([]);
        } finally {
            setClubAdminsLoading(false);
        }
    };

    const handleAddClubAdmin = async () => {
        if (!canManageClubAdmins || !selectedClubAdminClubId) return;

        const enrollment = String(newClubAdminEnrollment || '').trim();
        if (!enrollment) {
            alert('Please enter a valid enrollment number.');
            return;
        }

        setClubAdminSaving(true);
        try {
            await clubAdminsService.addClubAdmin(selectedClubAdminClubId, enrollment);
            setNewClubAdminEnrollment('');
            await fetchClubAdmins(selectedClubAdminClubId);
            alert('Club admin added successfully!');
        } catch (error) {
            console.error('Failed to add club admin', error);
            alert('Failed to add club admin. Please verify enrollment number.');
        } finally {
            setClubAdminSaving(false);
        }
    };

    const handleRemoveClubAdmin = async (admin) => {
        if (!canManageClubAdmins || !selectedClubAdminClubId) return;
        if (!window.confirm(`Remove admin access for ${admin.full_name}?`)) return;

        try {
            await clubAdminsService.removeClubAdmin(selectedClubAdminClubId, admin.user_id);
            setClubAdmins((prev) => prev.filter((item) => String(item.user_id) !== String(admin.user_id)));
            alert('Club admin removed successfully!');
        } catch (error) {
            console.error('Failed to remove club admin', error);
            alert('Failed to remove club admin.');
        }
    };

    const openCreateAdminModal = () => {
        if (!canManageAdmins) return;
        setEditingAdminId(null);
        setAdminForm({
            enrolment_number: '',
            permission_ids: []
        });
        setShowAdminModal(true);
    };

    const openEditAdminModal = async (admin) => {
        if (!canManageAdmins) return;

        try {
            const adminData = await adminsService.getAdminByUserId(admin.user_id);
            const selectedPermissions = Array.isArray(adminData.permissions)
                ? adminData.permissions.map((p) => Number(p.id)).filter((id) => Number.isFinite(id))
                : [];

            setEditingAdminId(admin.user_id);
            setAdminForm({
                enrolment_number: String(adminData?.enrolment_number || admin?.enrolment_number || ''),
                permission_ids: selectedPermissions,
            });
            setShowAdminModal(true);
        } catch (error) {
            console.error('Failed to fetch admin details', error);
            alert('Failed to load admin details.');
        }
    };

    const toggleAdminPermission = (permissionId) => {
        setAdminForm((prev) => {
            const current = Array.isArray(prev.permission_ids) ? prev.permission_ids : [];
            const exists = current.includes(permissionId);
            return {
                ...prev,
                permission_ids: exists
                    ? current.filter((id) => id !== permissionId)
                    : [...current, permissionId],
            };
        });
    };

    const handleAdminInputChange = (e) => {
        const { name, value } = e.target;
        setAdminForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleAdminSubmit = async (e) => {
        e.preventDefault();
        if (!canManageAdmins) return;

        const payloadPermissionIds = Array.isArray(adminForm.permission_ids)
            ? adminForm.permission_ids.map((id) => Number(id)).filter((id) => Number.isFinite(id))
            : [];

        if (!editingAdminId && !String(adminForm.enrolment_number).trim()) {
            alert('Please enter a valid enrollment number.');
            return;
        }

        setAdminSaving(true);
        try {
            if (editingAdminId) {
                await adminsService.updateAdminPermissions(editingAdminId, payloadPermissionIds);
                alert('Admin permissions updated successfully!');
            } else {
                await adminsService.addAdmin({
                    enrolment_number: String(adminForm.enrolment_number).trim(),
                    permission_ids: payloadPermissionIds,
                });
                alert('Admin added successfully!');
            }

            await fetchAdmins();
            setShowAdminModal(false);
            setEditingAdminId(null);
            setAdminForm({ enrolment_number: '', permission_ids: [] });
        } catch (error) {
            console.error('Failed to save admin', error);
            alert('Failed to save admin. Please verify enrollment number and permissions.');
        } finally {
            setAdminSaving(false);
        }
    };

    const handleDeleteAdmin = async (admin) => {
        if (!canManageAdmins) return;
        if (!window.confirm(`Remove admin access for ${admin.full_name}?`)) return;

        try {
            await adminsService.deleteAdmin(admin.user_id);
            setAdmins((prev) => prev.filter((item) => String(item.user_id) !== String(admin.user_id)));
            alert('Admin removed successfully!');
        } catch (error) {
            console.error('Failed to delete admin', error);
            alert('Failed to remove admin access.');
        }
    };

    const handleClubInputChange = (e) => {
        const { name, value } = e.target;
        setClubForm(prev => ({ ...prev, [name]: value }));
    };

    const handleClubLogoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            setClubSaving(true);
            const logoUrl = await uploadImageToCDN(file);
            setClubForm(prev => ({ ...prev, logo_url: logoUrl }));
            alert("Logo uploaded successfully!");
        } catch (err) {
            alert("Failed to upload logo. Please try again.");
        } finally {
            setClubSaving(false);
        }
    };

    const openEditClubModal = (club) => {
        setEditingClubId(club.id);
        setClubForm({
            name: club.name || '',
            email: club.email || '',
            description: club.description || '',
            logo_url: club.logo_url || ''
        });
        setShowClubModal(true);
    };

    const handleClubSubmit = async (e) => {
        e.preventDefault();
        setClubSaving(true);
        try {
            if (editingClubId) {
                await clubsService.updateClub(editingClubId, clubForm);
                alert('Club updated successfully!');
            } else {
                await clubsService.createClub(clubForm);
                alert('Club created successfully!');
            }
            
            mutate('all_clubs');

            setShowClubModal(false);
            // Refresh clubs list
            const allClubs = await clubsService.getAllClubs();
            let filtered = [];
            if (canManageClubs || canManageClubAdmins) {
                filtered = allClubs;
            } else {
                const allowedClubIds = new Set((managedClubIds || []).map((id) => Number(id)));
                filtered = allClubs.filter((club) => allowedClubIds.has(Number(club.id)));
            }
            setManagedClubs(filtered);
            setShowClubModal(false);
        } catch (error) {
            console.error('Failed to save club', error);
            alert('Failed to save club.');
        } finally {
            setClubSaving(false);
        }
    };

    if (authLoading) {
        return (
            <div className="admin-page flex-center">
                <Loader className="spin" size={32} color="var(--brand-purple)" />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="admin-page flex-center">
                <div className="card text-center" style={{ padding: '3rem', maxWidth: '400px' }}>
                    <ShieldAlert size={48} color="var(--brand-purple)" style={{ margin: '0 auto 1rem' }} />
                    <h2>Admin Access Required</h2>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Please log in to access the Club Admin panel.</p>
                </div>
            </div>
        );
    }

    if (!hasAdminPanelAccess) {
        return (
            <div className="admin-page flex-center">
                <div className="card text-center" style={{ padding: '3rem', maxWidth: '400px' }}>
                    <ShieldAlert size={48} color="var(--red)" style={{ margin: '0 auto 1rem' }} />
                    <h2>Access Denied</h2>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>You do not have club administrator privileges.</p>
                    <button className="btn btn-outline" onClick={() => navigate('/')}>Return to Dashboard</button>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-page">
            <div className="container">
                <div className="admin-header">
                    <div>
                        <h1 className="page-title">Club Admin</h1>
                        <p className="page-subtitle">Manage your club events</p>
                    </div>
                    <div className="admin-header-actions">
                        {canManageEvents && (
                            <button 
                                className={`btn ${activeTab === 'events' ? 'btn-yellow' : 'btn-outline'}`} 
                                onClick={() => setActiveTab('events')}
                            >
                                <Calendar size={18} />
                                Manage Events
                            </button>
                        )}
                        {canManageLocations && (
                            <button 
                                className={`btn ${activeTab === 'locations' ? 'btn-yellow' : 'btn-outline'}`} 
                                onClick={() => setActiveTab('locations')}
                            >
                                <MapPin size={18} />
                                Manage Locations
                            </button>
                        )}
                        {canManageEventCategories && (
                            <button 
                                className={`btn ${activeTab === 'categories' ? 'btn-yellow' : 'btn-outline'}`} 
                                onClick={() => setActiveTab('categories')}
                            >
                                <Tags size={18} />
                                Manage Categories
                            </button>
                        )}
                        {canManageAdmins && (
                            <button 
                                className={`btn ${activeTab === 'admins' ? 'btn-yellow' : 'btn-outline'}`} 
                                onClick={() => setActiveTab('admins')}
                            >
                                <Users size={18} />
                                Manage Admins
                            </button>
                        )}
                        {canManageClubAdmins && (
                            <button 
                                className={`btn ${activeTab === 'club-admins' ? 'btn-yellow' : 'btn-outline'}`} 
                                onClick={() => setActiveTab('club-admins')}
                            >
                                <Users size={18} />
                                Manage Club Admins
                            </button>
                        )}
                        {canManageSomeClubs && (
                            <button 
                                className={`btn ${activeTab === 'manage-clubs' ? 'btn-yellow' : 'btn-outline'}`} 
                                onClick={() => setActiveTab('manage-clubs')}
                            >
                                <LayoutDashboard size={18} />
                                Manage Clubs
                            </button>
                        )}
                    </div>
                </div>

                {/* Stats Row (Mocked / Placeholder) */}
                <div className="stats-grid grid-4 stagger">
                    <div className="stat-card card animate-fade-in">
                        <div className="stat-icon" style={{ background: 'rgba(113, 51, 100, 0.1)', color: 'var(--brand-purple)' }}>
                            <Calendar size={24} />
                        </div>
                        <div>
                            <h3>{events.length}</h3>
                            <p>Events Managed</p>
                        </div>
                    </div>
                </div>

                {activeTab === 'events' && canManageEvents && (
                    <div className="events-table-container card animate-fade-in">
                        <div className="admin-locations-header">
                            <h3>Event Management</h3>
                            <button className="btn btn-yellow" onClick={openCreateModal}>
                                <Plus size={16} />
                                Post New Event
                            </button>
                        </div>

                        {events.length > 0 ? (
                            <div style={{ overflowX: 'auto' }}>
                                <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '1px solid var(--grey-200)', background: 'var(--brand-purple-pale)' }}>
                                            <th style={{ padding: '1rem', fontWeight: 600 }}>Event Name</th>
                                            <th style={{ padding: '1rem', fontWeight: 600 }}>Club</th>
                                            <th style={{ padding: '1rem', fontWeight: 600 }}>Date & Time</th>
                                            <th style={{ padding: '1rem', fontWeight: 600 }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {events.map((ev) => (
                                            <tr key={ev.id} style={{ borderBottom: '1px solid var(--grey-100)' }}>
                                                <td style={{ padding: '1rem', fontWeight: 500, color: 'var(--text-primary)' }}>{ev.name}</td>
                                                <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{ev.club_name}</td>
                                                <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>
                                                    {new Date(ev.tentative_start_time).toLocaleString('en-US', { disable12Hour: true })}
                                                </td>
                                                <td style={{ padding: '1rem' }}>
                                                    <button className="btn-icon" style={{ display: 'inline-flex', marginRight: '0.5rem', color: 'var(--grey-500)' }} onClick={() => handleEdit(ev)} title="Edit Event">
                                                        <Edit size={16} />
                                                    </button>
                                                    <button className="btn-icon" style={{ display: 'inline-flex', color: 'var(--brand-red)' }} onClick={() => handleDelete(ev.id)} title="Delete Event">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="empty-state" style={{ padding: '3rem', textAlign: 'center' }}>
                                <Calendar size={48} style={{ color: 'var(--grey-300)', margin: '0 auto 1rem auto' }} />
                                <p style={{ color: 'var(--grey-500)' }}>Use the button above to post your first event.</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'locations' && canManageLocations && (
                    <div className="events-table-container card animate-fade-in">
                        <div className="admin-locations-header">
                            <h3>Location Management</h3>
                            <button className="btn btn-yellow" onClick={openCreateLocationModal}>
                                <Plus size={16} />
                                Add Location
                            </button>
                        </div>

                        {locations.length > 0 ? (
                            <div style={{ overflowX: 'auto' }}>
                                <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '1px solid var(--grey-200)', background: 'var(--brand-purple-pale)' }}>
                                            <th style={{ padding: '1rem', fontWeight: 600 }}>Name</th>
                                            <th style={{ padding: '1rem', fontWeight: 600 }}>Map URL</th>
                                            <th style={{ padding: '1rem', fontWeight: 600 }}>Coordinates</th>
                                            <th style={{ padding: '1rem', fontWeight: 600 }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {locations.map((loc) => (
                                            <tr key={loc.id} style={{ borderBottom: '1px solid var(--grey-100)' }}>
                                                <td style={{ padding: '1rem', fontWeight: 500, color: 'var(--text-primary)' }}>{loc.name}</td>
                                                <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>
                                                    {loc.location_url ? (
                                                        <a href={loc.location_url} target="_blank" rel="noreferrer">Open Map</a>
                                                    ) : (
                                                        '-'
                                                    )}
                                                </td>
                                                <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>
                                                    {loc.latitude && loc.longitude ? `${loc.latitude}, ${loc.longitude}` : '-'}
                                                </td>
                                                <td style={{ padding: '1rem' }}>
                                                    <button className="btn-icon" style={{ display: 'inline-flex', marginRight: '0.5rem', color: 'var(--grey-500)' }} onClick={() => openEditLocationModal(loc)} title="Edit Location">
                                                        <Edit size={16} />
                                                    </button>
                                                    <button className="btn-icon" style={{ display: 'inline-flex', color: 'var(--brand-red)' }} onClick={() => handleDeleteLocation(loc.id, loc.name)} title="Delete Location">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="empty-state" style={{ padding: '3rem', textAlign: 'center' }}>
                                <MapPin size={48} style={{ color: 'var(--grey-300)', margin: '0 auto 1rem auto' }} />
                                <p style={{ color: 'var(--grey-500)' }}>No locations yet. Create your first location.</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'categories' && canManageEventCategories && (
                    <div className="events-table-container card animate-fade-in">
                        <div className="admin-locations-header">
                            <h3>Event Category Management</h3>
                            <button className="btn btn-yellow" onClick={openCreateCategoryModal}>
                                <Plus size={16} />
                                Add Category
                            </button>
                        </div>

                        {categories.length > 0 ? (
                            <div style={{ overflowX: 'auto' }}>
                                <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '1px solid var(--grey-200)', background: 'var(--brand-purple-pale)' }}>
                                            <th style={{ padding: '1rem', fontWeight: 600 }}>Category Name</th>
                                            <th style={{ padding: '1rem', fontWeight: 600 }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {categories.map((cat) => (
                                            <tr key={cat.id} style={{ borderBottom: '1px solid var(--grey-100)' }}>
                                                <td style={{ padding: '1rem', fontWeight: 500, color: 'var(--text-primary)' }}>{cat.name}</td>
                                                <td style={{ padding: '1rem' }}>
                                                    <button className="btn-icon" style={{ display: 'inline-flex', marginRight: '0.5rem', color: 'var(--grey-500)' }} onClick={() => openEditCategoryModal(cat)} title="Edit Category">
                                                        <Edit size={16} />
                                                    </button>
                                                    <button className="btn-icon" style={{ display: 'inline-flex', color: 'var(--brand-red)' }} onClick={() => handleDeleteCategory(cat.id, cat.name)} title="Delete Category">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="empty-state" style={{ padding: '3rem', textAlign: 'center' }}>
                                <Tags size={48} style={{ color: 'var(--grey-300)', margin: '0 auto 1rem auto' }} />
                                <p style={{ color: 'var(--grey-500)' }}>No categories yet. Create your first event category.</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'admins' && canManageAdmins && (
                    <div className="events-table-container card animate-fade-in">
                        <div className="admin-locations-header">
                            <h3>Admin Management</h3>
                            <button className="btn btn-yellow" onClick={openCreateAdminModal}>
                                <Plus size={16} />
                                Add Admin
                            </button>
                        </div>

                        {admins.length > 0 ? (
                            <div style={{ overflowX: 'auto' }}>
                                <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '1px solid var(--grey-200)', background: 'var(--brand-purple-pale)' }}>
                                            <th style={{ padding: '1rem', fontWeight: 600 }}>Name</th>
                                            <th style={{ padding: '1rem', fontWeight: 600 }}>Enrollment Number</th>
                                            <th style={{ padding: '1rem', fontWeight: 600 }}>Email</th>
                                            <th style={{ padding: '1rem', fontWeight: 600 }}>Permissions</th>
                                            <th style={{ padding: '1rem', fontWeight: 600 }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {admins.map((admin) => (
                                            <tr key={admin.user_id} style={{ borderBottom: '1px solid var(--grey-100)' }}>
                                                <td style={{ padding: '1rem', fontWeight: 500, color: 'var(--text-primary)' }}>{admin.full_name}</td>
                                                <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{admin.enrolment_number || '-'}</td>
                                                <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{admin.email || '-'}</td>
                                                <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>
                                                    <div className="admin-permission-chip-wrap">
                                                        {Array.isArray(admin.permissions) && admin.permissions.length > 0 ? (
                                                            admin.permissions.map((permission) => (
                                                                <span key={`${admin.user_id}-${permission.id}`} className="admin-permission-chip">
                                                                    {permission.name}
                                                                </span>
                                                            ))
                                                        ) : (
                                                            <span className="category-chip-empty">No permissions</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td style={{ padding: '1rem' }}>
                                                    <button className="btn-icon" style={{ display: 'inline-flex', marginRight: '0.5rem', color: 'var(--grey-500)' }} onClick={() => openEditAdminModal(admin)} title="Edit Admin Permissions">
                                                        <Edit size={16} />
                                                    </button>
                                                    <button className="btn-icon" style={{ display: 'inline-flex', color: 'var(--brand-red)' }} onClick={() => handleDeleteAdmin(admin)} title="Remove Admin">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="empty-state" style={{ padding: '3rem', textAlign: 'center' }}>
                                <Users size={48} style={{ color: 'var(--grey-300)', margin: '0 auto 1rem auto' }} />
                                <p style={{ color: 'var(--grey-500)' }}>No admins assigned yet.</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'club-admins' && canManageClubAdmins && (
                    <div className="events-table-container card animate-fade-in">
                        <div className="admin-locations-header">
                            <h3>Club Admin Management</h3>
                        </div>

                        <div className="event-form" style={{ paddingBottom: '0.5rem' }}>
                            <div className="form-group">
                                <label>Select Club</label>
                                <select
                                    value={selectedClubAdminClubId}
                                    onChange={(e) => setSelectedClubAdminClubId(e.target.value)}
                                >
                                    <option value="">Select Club</option>
                                    {clubs.map((club) => (
                                        <option key={club.id} value={String(club.id)}>{club.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Add Club Admin (Enrollment Number)</label>
                                    <input
                                        value={newClubAdminEnrollment}
                                        onChange={(e) => setNewClubAdminEnrollment(e.target.value)}
                                        placeholder="Enter enrollment number"
                                        disabled={!selectedClubAdminClubId || clubAdminSaving}
                                    />
                                </div>
                                <div className="form-group" style={{ justifyContent: 'flex-end' }}>
                                    <button
                                        type="button"
                                        className="btn btn-yellow"
                                        onClick={handleAddClubAdmin}
                                        disabled={!selectedClubAdminClubId || clubAdminSaving}
                                    >
                                        {clubAdminSaving ? <Loader size={16} className="animate-spin" /> : 'Add Admin'}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {!selectedClubAdminClubId ? (
                            <div className="empty-state" style={{ padding: '2rem', textAlign: 'center' }}>
                                <p style={{ color: 'var(--grey-500)' }}>Select a club to manage its admins.</p>
                            </div>
                        ) : clubAdminsLoading ? (
                            <div className="empty-state" style={{ padding: '2rem', textAlign: 'center' }}>
                                <Loader size={24} className="spin" />
                            </div>
                        ) : clubAdmins.length > 0 ? (
                            <div style={{ overflowX: 'auto' }}>
                                <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '1px solid var(--grey-200)', background: 'var(--brand-purple-pale)' }}>
                                            <th style={{ padding: '1rem', fontWeight: 600 }}>Name</th>
                                            <th style={{ padding: '1rem', fontWeight: 600 }}>Enrollment Number</th>
                                            <th style={{ padding: '1rem', fontWeight: 600 }}>Email</th>
                                            <th style={{ padding: '1rem', fontWeight: 600 }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {clubAdmins.map((admin) => (
                                            <tr key={`${selectedClubAdminClubId}-${admin.user_id}`} style={{ borderBottom: '1px solid var(--grey-100)' }}>
                                                <td style={{ padding: '1rem', fontWeight: 500, color: 'var(--text-primary)' }}>{admin.full_name}</td>
                                                <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{admin.enrolment_number || '-'}</td>
                                                <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{admin.email || '-'}</td>
                                                <td style={{ padding: '1rem' }}>
                                                    <button className="btn-icon" style={{ display: 'inline-flex', color: 'var(--brand-red)' }} onClick={() => handleRemoveClubAdmin(admin)} title="Remove Club Admin">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="empty-state" style={{ padding: '2rem', textAlign: 'center' }}>
                                <p style={{ color: 'var(--grey-500)' }}>No admins assigned for this club yet.</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'manage-clubs' && canManageSomeClubs && (
                    <div className="events-table-container card animate-fade-in">
                        <div className="admin-locations-header">
                            <h3>Club Management</h3>
                            {canManageClubs && (
                                <button className="btn btn-yellow" onClick={() => {
                                    setEditingClubId(null);
                                    setClubForm({ name: '', email: '', description: '', logo_url: '' });
                                    setShowClubModal(true);
                                }}>
                                    <Plus size={16} />
                                    Add New Club
                                </button>
                            )}
                        </div>

                        {managedClubs.length > 0 ? (
                            <div style={{ overflowX: 'auto' }}>
                                <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '1px solid var(--grey-200)', background: 'var(--brand-purple-pale)' }}>
                                            <th style={{ padding: '1rem', fontWeight: 600 }}>Club Name</th>
                                            <th style={{ padding: '1rem', fontWeight: 600 }}>Email</th>
                                            <th style={{ padding: '1rem', fontWeight: 600 }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {managedClubs.map((club) => (
                                            <tr key={club.id} style={{ borderBottom: '1px solid var(--grey-100)' }}>
                                                <td style={{ padding: '1rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                        {club.logo_url ? (
                                                            <img src={club.logo_url} alt="" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
                                                        ) : (
                                                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--grey-100)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                <Users size={16} color="var(--grey-400)" />
                                                            </div>
                                                        )}
                                                        {club.name}
                                                    </div>
                                                </td>
                                                <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{club.email}</td>
                                                <td style={{ padding: '1rem' }}>
                                                    <button className="btn-icon" style={{ display: 'inline-flex', marginRight: '0.5rem', color: 'var(--grey-500)' }} onClick={() => openEditClubModal(club)} title="Edit Club">
                                                        <Edit size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="empty-state" style={{ padding: '3rem', textAlign: 'center' }}>
                                <LayoutDashboard size={48} style={{ color: 'var(--grey-300)', margin: '0 auto 1rem auto' }} />
                                <p style={{ color: 'var(--grey-500)' }}>No clubs available for management.</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Create Modal */}
                {showCreateModal && (
                    <div className="modal-overlay animate-fade-in">
                        <div className="modal-content card">
                            <div className="modal-header">
                                <h2>{editingEventId ? 'Edit Event' : 'Post New Event'}</h2>
                                <button className="btn-icon" onClick={() => setShowCreateModal(false)}>
                                    <X size={20} />
                                </button>
                            </div>
                            <form onSubmit={handleSubmit} className="event-form">
                                <div className="form-group">
                                    <label>Event Banner Image</label>
                                    <div className="image-upload-input-group">
                                        <div className="file-upload-cell">
                                            <input 
                                                type="file" 
                                                accept="image/*" 
                                                onChange={handleImageUpload} 
                                                className="file-input-elegant"
                                            />
                                        </div>
                                        <div className="upload-or-divider">
                                            <span>OR</span>
                                        </div>
                                        <div className="url-upload-cell">
                                            <input
                                                type="text"
                                                name="image_url"
                                                value={newEvent.image_url || ''}
                                                onChange={handleInputChange}
                                                placeholder="Paste Image URL"
                                                className="url-input-field"
                                            />
                                        </div>
                                    </div>
                                    {newEvent.image_url && (
                                        <div className="image-preview-container">
                                            <img src={newEvent.image_url} alt="Preview" />
                                        </div>
                                    )}
                                </div>

                                <div className="form-group">
                                    <label>Event Name</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={newEvent.name}
                                        onChange={handleInputChange}
                                        placeholder="e.g. Tinkerquest 2.0"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Club</label>
                                    <select
                                        name="club_id"
                                        value={newEvent.club_id}
                                        onChange={handleInputChange}
                                        required
                                    >
                                        <option value="">Select Club</option>
                                        {clubs.map(c => (
                                            <option key={c.id} value={String(c.id)}>{c.name}</option>
                                        ))}
                                    </select>
                                    <small style={{ color: 'var(--grey-500)', fontSize: '0.75rem', marginTop: '4px' }}>
                                        * You must be an admin of the selected club to post.
                                    </small>
                                </div>

                                <div className="form-row date-time-options">
                                    <div className="checkbox-options">
                                        <label className="checkbox-item">
                                            <input
                                                type="checkbox"
                                                name="isAllDay"
                                                checked={newEvent.isAllDay}
                                                onChange={handleInputChange}
                                            />
                                            All Day Event
                                        </label>
                                        <label className="checkbox-item">
                                            <input
                                                type="checkbox"
                                                name="isMultiDay"
                                                checked={newEvent.isMultiDay}
                                                onChange={handleInputChange}
                                            />
                                            Spans multiple dates
                                        </label>
                                    </div>
                                </div>

                                <div className="form-row date-inputs">
                                    <div className="form-group">
                                        <label>{newEvent.isMultiDay ? 'Start Date' : 'Date'}</label>
                                        <input
                                            type="date"
                                            name="date"
                                            value={newEvent.date}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>
                                    {newEvent.isMultiDay && (
                                        <div className="form-group">
                                            <label>End Date</label>
                                            <input
                                                type="date"
                                                name="endDate"
                                                value={newEvent.endDate}
                                                onChange={handleInputChange}
                                                required
                                            />
                                        </div>
                                    )}
                                    {!newEvent.isAllDay && (
                                        <div className="form-group">
                                            <label>Time</label>
                                            <input
                                                type="time"
                                                name="time"
                                                value={newEvent.time}
                                                onChange={handleInputChange}
                                                required
                                            />
                                        </div>
                                    )}
                                </div>

                                {!newEvent.isAllDay && !newEvent.isMultiDay && (
                                    <div className="form-group">
                                        <label>Duration (minutes)</label>
                                        <input
                                            type="number"
                                            name="duration_minutes"
                                            value={newEvent.duration_minutes}
                                            onChange={handleInputChange}
                                            min="15"
                                            step="15"
                                            required
                                        />
                                    </div>
                                )}

                                <div className="form-group">
                                    <label>Venue</label>
                                    <select
                                        name="location_id"
                                        value={newEvent.location_id}
                                        onChange={handleInputChange}
                                        required
                                    >
                                        <option value="">Select Venue</option>
                                        {locations.map(loc => (
                                            <option key={loc.id} value={loc.id}>{loc.name}</option>
                                        ))}
                                    </select>
                                    {canManageLocations && (
                                        <small style={{ color: 'var(--brand-purple)', fontSize: '0.75rem', marginTop: '4px' }}>
                                            Need a new venue? <button type="button" className="btn-link-inline" onClick={() => { setShowCreateModal(false); setActiveTab('locations'); }}>Manage Locations</button>
                                        </small>
                                    )}
                                </div>

                                <div className="form-group">
                                    <label>Event Category</label>
                                    <div className="category-chip-wrap">
                                        {categories.length > 0 ? (
                                            categories.map((cat) => {
                                                const active = (newEvent.category_ids || []).includes(Number(cat.id));
                                                return (
                                                    <button
                                                        key={cat.id}
                                                        type="button"
                                                        className={`category-chip ${active ? 'active' : ''}`}
                                                        onClick={() => toggleEventCategory(Number(cat.id))}
                                                    >
                                                        {cat.name}
                                                    </button>
                                                );
                                            })
                                        ) : (
                                            <span className="category-chip-empty">No categories available.</span>
                                        )}
                                    </div>
                                    {canManageEventCategories && (
                                        <small style={{ color: 'var(--brand-purple)', fontSize: '0.75rem', marginTop: '4px' }}>
                                            Need a new category? <button type="button" className="btn-link-inline" onClick={() => { setShowCreateModal(false); setActiveTab('categories'); }}>Manage Categories</button>
                                        </small>
                                    )}
                                </div>

                                <div className="form-group">
                                    <label>Description</label>
                                    <textarea
                                        name="description"
                                        value={newEvent.description}
                                        onChange={handleInputChange}
                                        rows={4}
                                        placeholder="Event details..."
                                    />
                                </div>

                                <div className="modal-actions">
                                    <button type="button" className="btn btn-outline" onClick={() => setShowCreateModal(false)}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn btn-yellow" disabled={loading}>
                                        {loading ? <Loader size={16} className="animate-spin" /> : (editingEventId ? 'Save Changes' : 'Create Event')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {showLocationModal && canManageLocations && (
                    <div className="modal-overlay animate-fade-in">
                        <div className="modal-content card">
                            <div className="modal-header">
                                <h2>{editingLocationId ? 'Edit Location' : 'Create Location'}</h2>
                                <button className="btn-icon" onClick={() => setShowLocationModal(false)}>
                                    <X size={20} />
                                </button>
                            </div>
                            <form onSubmit={handleLocationSubmit} className="event-form">
                                <div className="form-group">
                                    <label>Location Name</label>
                                    <input name="name" value={locationForm.name} onChange={handleLocationInputChange} required />
                                </div>

                                <div className="form-group">
                                    <label>Map URL</label>
                                    <input name="location_url" value={locationForm.location_url} onChange={handleLocationInputChange} placeholder="https://maps.google.com/..." />
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Latitude</label>
                                        <input name="latitude" value={locationForm.latitude} onChange={handleLocationInputChange} placeholder="29.864" />
                                    </div>
                                    <div className="form-group">
                                        <label>Longitude</label>
                                        <input name="longitude" value={locationForm.longitude} onChange={handleLocationInputChange} placeholder="77.896" />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Description</label>
                                    <textarea name="description" value={locationForm.description} onChange={handleLocationInputChange} rows={3} />
                                </div>

                                <div className="form-group">
                                    <label>Images (comma-separated URLs)</label>
                                    <input name="images_text" value={locationForm.images_text} onChange={handleLocationInputChange} placeholder="https://..., https://..." />
                                </div>

                                <div className="modal-actions">
                                    <button type="button" className="btn btn-outline" onClick={() => setShowLocationModal(false)}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn btn-yellow" disabled={locationSaving}>
                                        {locationSaving ? <Loader size={16} className="animate-spin" /> : (editingLocationId ? 'Save Location' : 'Create Location')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {showCategoryModal && canManageEventCategories && (
                    <div className="modal-overlay animate-fade-in">
                        <div className="modal-content card">
                            <div className="modal-header">
                                <h2>{editingCategoryId ? 'Edit Category' : 'Create Category'}</h2>
                                <button className="btn-icon" onClick={() => setShowCategoryModal(false)}>
                                    <X size={20} />
                                </button>
                            </div>
                            <form onSubmit={handleCategorySubmit} className="event-form">
                                <div className="form-group">
                                    <label>Category Name</label>
                                    <input name="name" value={categoryForm.name} onChange={handleCategoryInputChange} required />
                                </div>

                                <div className="modal-actions">
                                    <button type="button" className="btn btn-outline" onClick={() => setShowCategoryModal(false)}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn btn-yellow" disabled={categorySaving}>
                                        {categorySaving ? <Loader size={16} className="animate-spin" /> : (editingCategoryId ? 'Save Category' : 'Create Category')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {showAdminModal && canManageAdmins && (
                    <div className="modal-overlay animate-fade-in">
                        <div className="modal-content card">
                            <div className="modal-header">
                                <h2>{editingAdminId ? 'Edit Admin Permissions' : 'Add New Admin'}</h2>
                                <button className="btn-icon" onClick={() => setShowAdminModal(false)}>
                                    <X size={20} />
                                </button>
                            </div>
                            <form onSubmit={handleAdminSubmit} className="event-form">
                                <div className="form-group">
                                    <label>Enrollment Number</label>
                                    <input
                                        name="enrolment_number"
                                        value={adminForm.enrolment_number}
                                        onChange={handleAdminInputChange}
                                        placeholder="Enter enrollment number"
                                        required
                                        disabled={Boolean(editingAdminId)}
                                    />
                                    {editingAdminId && (
                                        <small style={{ color: 'var(--grey-500)', fontSize: '0.75rem', marginTop: '4px' }}>
                                            {admins.find((item) => String(item.user_id) === String(editingAdminId))?.full_name || 'Selected user'}
                                        </small>
                                    )}
                                </div>

                                <div className="form-group">
                                    <label>Permissions</label>
                                    <div className="category-chip-wrap">
                                        {adminPermissions.length > 0 ? (
                                            adminPermissions.map((permission) => {
                                                const active = (adminForm.permission_ids || []).includes(Number(permission.id));
                                                return (
                                                    <button
                                                        key={permission.id}
                                                        type="button"
                                                        className={`category-chip ${active ? 'active' : ''}`}
                                                        onClick={() => toggleAdminPermission(Number(permission.id))}
                                                    >
                                                        {permission.name}
                                                    </button>
                                                );
                                            })
                                        ) : (
                                            <span className="category-chip-empty">No admin permissions found.</span>
                                        )}
                                    </div>
                                </div>

                                <div className="modal-actions">
                                    <button type="button" className="btn btn-outline" onClick={() => setShowAdminModal(false)}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn btn-yellow" disabled={adminSaving}>
                                        {adminSaving ? <Loader size={16} className="animate-spin" /> : (editingAdminId ? 'Save Admin' : 'Create Admin')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {showClubModal && (
                    <div className="modal-overlay animate-fade-in">
                        <div className="modal-content card">
                            <div className="modal-header">
                                <h2>{editingClubId ? 'Edit Club' : 'Create Club'}</h2>
                                <button className="btn-icon" onClick={() => setShowClubModal(false)}>
                                    <X size={20} />
                                </button>
                            </div>
                            <form onSubmit={handleClubSubmit} className="event-form">
                                <div className="form-group">
                                    <label>Club Name</label>
                                    <input name="name" value={clubForm.name} onChange={handleClubInputChange} required />
                                </div>
                                <div className="form-group">
                                    <label>Email</label>
                                    <input name="email" type="email" value={clubForm.email} onChange={handleClubInputChange} required />
                                </div>
                                <div className="form-group">
                                    <label>Description</label>
                                    <textarea name="description" value={clubForm.description} onChange={handleClubInputChange} rows={4} />
                                </div>
                                <div className="form-group">
                                    <label>Club Logo</label>
                                    <div className="image-upload-input-group">
                                        <div className="file-upload-cell">
                                            <input 
                                                type="file" 
                                                accept="image/*" 
                                                onChange={handleClubLogoUpload} 
                                                className="file-input-elegant"
                                            />
                                        </div>
                                        <div className="upload-or-divider">
                                            <span>OR</span>
                                        </div>
                                        <div className="url-upload-cell">
                                            <input 
                                                name="logo_url" 
                                                value={clubForm.logo_url || ''} 
                                                onChange={handleClubInputChange} 
                                                placeholder="Paste Logo URL"
                                                className="url-input-field"
                                            />
                                        </div>
                                    </div>
                                    {clubForm.logo_url && <img src={clubForm.logo_url} alt="Logo Preview" style={{ marginTop: '10px', width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover' }} />}
                                </div>
                                <div className="modal-actions">
                                    <button type="button" className="btn btn-outline" onClick={() => setShowClubModal(false)}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn btn-yellow" disabled={clubSaving}>
                                        {clubSaving ? <Loader size={16} className="animate-spin" /> : (editingClubId ? 'Save Club' : 'Create Club')}
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

export default Admin;
