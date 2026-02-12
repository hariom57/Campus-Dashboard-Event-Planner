import React, { useState } from 'react';
import { MapPin, Navigation, Layers, Search, Info } from 'lucide-react';
import './Map.css';

const venues = [
    { id: 1, name: 'MAC Auditorium', zone: 'Academic', x: 35, y: 25, events: 3, capacity: 500 },
    { id: 2, name: 'Convocation Hall', zone: 'Cultural', x: 55, y: 40, events: 1, capacity: 2000 },
    { id: 3, name: 'LHC Complex', zone: 'Academic', x: 25, y: 45, events: 5, capacity: 300 },
    { id: 4, name: 'Cricket Ground', zone: 'Sports', x: 70, y: 30, events: 2, capacity: 1000 },
    { id: 5, name: 'Hobbies Club', zone: 'Cultural', x: 45, y: 60, events: 4, capacity: 100 },
    { id: 6, name: 'Main Building', zone: 'Academic', x: 40, y: 35, events: 0, capacity: 800 },
    { id: 7, name: 'Hockey Ground', zone: 'Sports', x: 75, y: 55, events: 1, capacity: 500 },
    { id: 8, name: 'Knowledge Centre', zone: 'Academic', x: 30, y: 70, events: 2, capacity: 250 },
    { id: 9, name: 'Swimming Pool', zone: 'Sports', x: 65, y: 70, events: 0, capacity: 200 },
    { id: 10, name: 'Open Air Theatre', zone: 'Cultural', x: 50, y: 50, events: 2, capacity: 600 },
];

const zoneColors = {
    Academic: '#667eea',
    Cultural: '#f5576c',
    Sports: '#4facfe',
};

const MapPage = () => {
    const [selectedVenue, setSelectedVenue] = useState(null);
    const [activeZone, setActiveZone] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');

    const filteredVenues = venues.filter(v => {
        const matchZone = activeZone === 'All' || v.zone === activeZone;
        const matchSearch = v.name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchZone && matchSearch;
    });

    return (
        <div className="map-page" style={{ paddingTop: '72px' }}>
            <div className="container">
                <div className="map-page-header">
                    <div>
                        <h1 className="page-title">
                            <MapPin size={28} style={{ color: 'var(--brand-blue)' }} />
                            Interactive Campus Map
                        </h1>
                        <p className="page-subtitle">Explore venues and discover events happening across campus</p>
                    </div>
                </div>

                <div className="map-controls">
                    <div className="map-search">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="Search venues..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="zone-filters">
                        {['All', 'Academic', 'Cultural', 'Sports'].map(zone => (
                            <button
                                key={zone}
                                className={`filter-btn ${activeZone === zone ? 'active' : ''}`}
                                onClick={() => setActiveZone(zone)}
                                style={zone !== 'All' && activeZone === zone ? { background: zoneColors[zone], color: 'white' } : {}}
                            >
                                {zone}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="map-layout">
                    <div className="map-canvas card">
                        <div className="campus-map">
                            {/* Campus zones */}
                            <div className="campus-zone academic-zone" style={{ top: '10%', left: '15%', width: '40%', height: '45%' }}>
                                <span>Academic Zone</span>
                            </div>
                            <div className="campus-zone sports-zone" style={{ top: '15%', left: '58%', width: '35%', height: '55%' }}>
                                <span>Sports Zone</span>
                            </div>
                            <div className="campus-zone cultural-zone" style={{ top: '50%', left: '20%', width: '40%', height: '35%' }}>
                                <span>Cultural Zone</span>
                            </div>

                            {/* Roads */}
                            <div className="campus-road" style={{ top: '48%', left: '10%', width: '80%', height: '4px' }}></div>
                            <div className="campus-road" style={{ top: '10%', left: '55%', width: '4px', height: '80%' }}></div>

                            {/* Venue pins */}
                            {filteredVenues.map(venue => (
                                <button
                                    key={venue.id}
                                    className={`map-pin ${selectedVenue?.id === venue.id ? 'selected' : ''} ${venue.events > 0 ? 'has-events' : ''}`}
                                    style={{
                                        left: `${venue.x}%`,
                                        top: `${venue.y}%`,
                                        '--pin-color': zoneColors[venue.zone],
                                    }}
                                    onClick={() => setSelectedVenue(venue)}
                                    title={venue.name}
                                >
                                    <MapPin size={20} />
                                    {venue.events > 0 && <span className="pin-badge">{venue.events}</span>}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="map-sidebar">
                        {selectedVenue ? (
                            <div className="venue-detail card animate-fade-in">
                                <div className="venue-detail-header" style={{ background: zoneColors[selectedVenue.zone] }}>
                                    <MapPin size={24} />
                                    <h3>{selectedVenue.name}</h3>
                                </div>
                                <div className="venue-detail-body">
                                    <div className="venue-info-row">
                                        <span className="venue-label">Zone</span>
                                        <span className={`tag`} style={{ background: zoneColors[selectedVenue.zone] + '20', color: zoneColors[selectedVenue.zone] }}>{selectedVenue.zone}</span>
                                    </div>
                                    <div className="venue-info-row">
                                        <span className="venue-label">Capacity</span>
                                        <span>{selectedVenue.capacity} people</span>
                                    </div>
                                    <div className="venue-info-row">
                                        <span className="venue-label">Active Events</span>
                                        <span className="venue-events-count">{selectedVenue.events}</span>
                                    </div>
                                    <button className="btn btn-yellow" style={{ width: '100%', marginTop: 'var(--space-md)' }}>
                                        <Navigation size={16} />
                                        Get Directions
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="venue-empty card">
                                <Info size={32} />
                                <h4>Select a Venue</h4>
                                <p>Click on any pin on the map to see venue details and upcoming events.</p>
                            </div>
                        )}

                        <div className="venues-list">
                            <h4 className="venues-list-title">
                                <Layers size={16} />
                                All Venues ({filteredVenues.length})
                            </h4>
                            {filteredVenues.map(venue => (
                                <button
                                    key={venue.id}
                                    className={`venue-list-item ${selectedVenue?.id === venue.id ? 'active' : ''}`}
                                    onClick={() => setSelectedVenue(venue)}
                                >
                                    <div className="venue-dot" style={{ background: zoneColors[venue.zone] }}></div>
                                    <div className="venue-list-info">
                                        <span className="venue-list-name">{venue.name}</span>
                                        <span className="venue-list-zone">{venue.zone}</span>
                                    </div>
                                    {venue.events > 0 && <span className="venue-event-badge">{venue.events}</span>}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MapPage;
