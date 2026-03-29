import React, { useState, useEffect } from 'react';
import { MapPin, Search, ExternalLink, Loader, Navigation } from 'lucide-react';
import miscService from '../services/misc';
import './Map.css';

const MapPage = () => {
    const [venues, setVenues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const fetchVenues = async () => {
            try {
                const data = await miscService.getAllLocations();
                setVenues(data);
            } catch (error) {
                console.error("Failed to fetch locations", error);
            } finally {
                setLoading(false);
            }
        };

        fetchVenues();
    }, []);

    const filteredVenues = venues.filter(v =>
        v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (v.description && v.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const openMap = (venue) => {
        if (venue.location_url) {
            window.open(venue.location_url, '_blank');
        } else if (venue.latitude && venue.longitude) {
            window.open(`https://www.google.com/maps/search/?api=1&query=${venue.latitude},${venue.longitude}`, '_blank');
        }
    };

    return (
        <div className="map-page">
            <div className="container">
                <div className="map-page-header">
                    <h1 className="page-title">
                        <MapPin size={28} className="text-brand" />
                        Campus Venues
                    </h1>
                    <p className="page-subtitle">Find locations for events and club activities.</p>
                </div>

                {/* Search */}
                <div className="map-controls">
                    <div className="search-box">
                        <Search size={18} className="search-icon" />
                        <input
                            type="text"
                            placeholder="Search venues..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="loading-state">
                        <Loader size={32} className="animate-spin text-brand" />
                        <p>Loading venues...</p>
                    </div>
                ) : (
                    <div className="venues-grid">
                        {filteredVenues.length > 0 ? (
                            filteredVenues.map(venue => (
                                <div key={venue.id} className="venue-card">
                                    <div className="venue-icon">
                                        <MapPin size={24} />
                                    </div>
                                    <div className="venue-info">
                                        <h3>{venue.name}</h3>
                                        {venue.description && <p className="venue-desc">{venue.description}</p>}

                                        <div className="venue-actions">
                                            {(venue.location_url || (venue.latitude && venue.longitude)) ? (
                                                <button
                                                    className="btn btn-sm btn-outline"
                                                    onClick={() => openMap(venue)}
                                                >
                                                    <Navigation size={14} />
                                                    Get Directions
                                                </button>
                                            ) : (
                                                <span className="no-loc-text">Location details unavailable</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="empty-state">
                                <p>No venues found matching "{searchQuery}"</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MapPage;
