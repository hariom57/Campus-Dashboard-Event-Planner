import React, { useState, useEffect } from 'react';
import { Calendar, Filter, Loader, Grid, List } from 'lucide-react';
import EventCard from '../components/Event/EventCard';
import TodoList from '../components/Widgets/TodoList';
import eventService from '../services/events';
import './Home.css';

const Home = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Filter States
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedClub, setSelectedClub] = useState('All');
  const [selectedVenue, setSelectedVenue] = useState('All');
  const [showFilters, setShowFilters] = useState(false);

  // Derived Lists for Dropdowns
  const [uniqueCategories, setUniqueCategories] = useState([]);
  const [uniqueClubs, setUniqueClubs] = useState([]);
  const [uniqueVenues, setUniqueVenues] = useState([]);

  // Date Strip Helper: Today + 13 days
  const dates = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const data = await eventService.getAllEvents();

        // Extract all unique categories and clubs from the valid data
        const cats = new Set();
        const clubs = new Set();
        const venues = new Set();

        const formattedEvents = data.map(ev => {
          // Extract categories from comma-separated string provided by backend subquery
          // If null, default to 'General'
          const categoryString = ev.categories || 'General';
          const eventCats = categoryString.split(',').map(c => c.trim()).filter(c => c);

          eventCats.forEach(c => cats.add(c));
          if (ev.club_name) clubs.add(ev.club_name);
          if (ev.location_name) venues.add(ev.location_name);

          return {
            id: ev.id,
            title: ev.name,
            club: ev.club_name || 'Unknown Club',
            rawCategories: eventCats,
            category: eventCats[0] || 'General', // Primary for Display
            rawDate: new Date(ev.tentative_start_time),
            time: new Date(ev.tentative_start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            venue: ev.location_name || 'TBD',
            description: ev.description,
            gradient: getRandomGradient()
          };
        });

        setUniqueCategories(['All', ...Array.from(cats).sort()]);
        setUniqueClubs(['All', ...Array.from(clubs).sort()]);
        setUniqueVenues(['All', ...Array.from(venues).sort()]);
        setEvents(formattedEvents);
      } catch (error) {
        console.error("Failed to load events", error);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const getRandomGradient = () => {
    const gradients = [
      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
    ];
    return gradients[Math.floor(Math.random() * gradients.length)];
  };

  // === FILTER LOGIC ===
  const filteredEvents = events.filter(ev => {
    // 1. Date Filter (Compare Date strings to ignore time)
    const matchesDate = ev.rawDate.toDateString() === selectedDate.toDateString();

    // 2. Category Filter
    const matchesCategory = selectedCategory === 'All'
      ? true
      : ev.rawCategories.includes(selectedCategory);

    // 3. Club Filter
    const matchesClub = selectedClub === 'All'
      ? true
      : ev.club === selectedClub;

    // 4. Venue Filter
    const matchesVenue = selectedVenue === 'All'
      ? true
      : ev.venue === selectedVenue;

    return matchesDate && matchesCategory && matchesClub && matchesVenue;
  });

  return (
    <div className="utility-home">
      {/* 1. Date Strip (Sticky) */}
      <div className="date-strip-container">
        <div className="date-strip">
          {dates.map((date, index) => {
            const isSelected = date.toDateString() === selectedDate.toDateString();
            const isToday = date.toDateString() === new Date().toDateString();

            return (
              <button
                key={index}
                className={`date-chip ${isSelected ? 'active' : ''}`}
                onClick={() => setSelectedDate(date)}
              >
                <span className="day-name">
                  {isToday ? 'Today' : date.toLocaleDateString('en-US', { weekday: 'short' })}
                </span>
                <span className="day-number">{date.getDate()}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Filter Bar (Compact) */}
      <div className="filter-bar container">
        <div className="filter-row">
          <button
            className={`filter-toggle-btn ${showFilters ? 'active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={16} />
            <span>Filters</span>
          </button>

          {/* Horizontal Category Chips (Always visible if space permits, or if filters hidden) */}
          <div className="category-scroll">
            {uniqueCategories.map(cat => (
              <button
                key={cat}
                className={`chip ${selectedCategory === cat ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Expanded Filters (Club) */}
        {showFilters && (
          <div className="filter-expanded animate-slide-down">
            <div className="form-group">
              <label>Filter by Club:</label>
              <select
                value={selectedClub}
                onChange={(e) => setSelectedClub(e.target.value)}
                className="filter-select"
              >
                {uniqueClubs.map(club => (
                  <option key={club} value={club}>{club}</option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ marginTop: '1rem' }}>
              <label>Filter by Venue:</label>
              <select
                value={selectedVenue}
                onChange={(e) => setSelectedVenue(e.target.value)}
                className="filter-select"
              >
                {uniqueVenues.map(ven => (
                  <option key={ven} value={ven}>{ven}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Main Content Split Layer */}
      <div className="home-content-split container">
        {/* 3. Event Feed (Left side on Desktop) */}
        <div className="event-feed">
          <div className="feed-header">
            <div>
              <h2>{selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</h2>
              {(selectedCategory !== 'All' || selectedClub !== 'All') && (
                <span className="filter-status">
                  {selectedCategory !== 'All' && <span className="tag">{selectedCategory}</span>}
                  {selectedClub !== 'All' && <span className="tag">{selectedClub}</span>}
                </span>
              )}
            </div>
            <span className="event-count">{filteredEvents.length} Events</span>
          </div>

          {loading ? (
            <div className="loading-state">
              <Loader className="animate-spin" size={32} />
              <p>Loading Events...</p>
            </div>
          ) : (
            <div className="feed-list">
              {filteredEvents.length > 0 ? (
                filteredEvents.map(event => (
                  <EventCard key={event.id} event={event} compact={true} />
                ))
              ) : (
                <div className="empty-feed">
                  <Calendar size={48} className="text-muted" />
                  <p>No events found.</p>
                  {(selectedCategory !== 'All' || selectedClub !== 'All') ? (
                    <button
                      className="btn-link"
                      onClick={() => { setSelectedCategory('All'); setSelectedClub('All'); }}
                    >
                      Clear Filters
                    </button>
                  ) : (
                    <span className="sub-text">Take a break! Nothing scheduled for this day.</span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 4. Utilities Panel (Right side on Desktop) */}
        <div className="home-sidebar">
          <TodoList />
        </div>
      </div>
    </div>
  );
};

export default Home;
