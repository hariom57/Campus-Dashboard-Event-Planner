import React, { useState } from 'react';
import {
  MapPin, Calendar, Clock, Bookmark, Bell, Users, ExternalLink,
  Filter, ChevronDown, Star, Megaphone, ArrowRight, Sparkles,
  TrendingUp, Flame, ChevronRight, BookOpen, MessageSquare,
  Image as ImageIcon, HelpCircle, Send
} from 'lucide-react';
import EventCard from '../components/Event/EventCard';
import './Home.css';

// Mock Data
const mockEvents = [
  {
    id: 1, title: 'Cogni Hackathon 2026', club: 'Technical Society',
    category: 'Technical', date: 'Feb 15, 2026', time: '9:00 AM - 9:00 PM',
    venue: 'MAC Auditorium', attendees: 234, isLive: false,
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  },
  {
    id: 2, title: 'Thomso Cultural Night', club: 'Cultural Council',
    category: 'Cultural', date: 'Feb 18, 2026', time: '6:00 PM - 11:00 PM',
    venue: 'Convocation Hall', attendees: 890, isLive: true,
    gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
  },
  {
    id: 3, title: 'Inter-Branch Cricket', club: 'Sports Council',
    category: 'Sports', date: 'Feb 20, 2026', time: '4:00 PM - 7:00 PM',
    venue: 'Cricket Ground', attendees: 156, isLive: false,
    gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
  },
  {
    id: 4, title: 'E-Summit Keynote', club: 'E-Cell IITR',
    category: 'Technical', date: 'Feb 22, 2026', time: '10:00 AM - 1:00 PM',
    venue: 'LHC 101', attendees: 412, isLive: false,
    gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'
  },
  {
    id: 5, title: 'Fashion Show Auditions', club: 'Fashionista',
    category: 'Cultural', date: 'Feb 24, 2026', time: '5:00 PM - 8:00 PM',
    venue: 'Main Building', attendees: 78, isLive: false,
    gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
  },
  {
    id: 6, title: 'Guest Lecture: AI & Ethics', club: 'CSE Department',
    category: 'Academic', date: 'Feb 25, 2026', time: '2:00 PM - 4:00 PM',
    venue: 'LHC 301', attendees: 198, isLive: false,
    gradient: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)'
  },
];

const announcements = [
  { id: 1, title: 'MTE Schedule Released', desc: 'Mid-Term Exams start March 10. Check your slot.', type: 'Academic', urgent: true },
  { id: 2, title: 'Thomso 2026 Registrations Open', desc: 'Register your team before Feb 28.', type: 'Fest', urgent: false },
  { id: 3, title: 'Library Timings Extended', desc: 'Library open till 2 AM during exam season.', type: 'Notice', urgent: false },
];

const campusDiaries = [
  { id: 1, title: 'The Night of Infinite Stars', author: 'Arjun M.', snippet: 'Standing at the rooftop of Rajendra Bhawan, watching the campus light up during Thomso...', likes: 45, date: '2 days ago' },
  { id: 2, title: 'My First Hackathon', author: 'Priya S.', snippet: 'It was 3 AM, our code was breaking, but the energy in MAC was electric...', likes: 89, date: '5 days ago' },
  { id: 3, title: 'Hidden Spots on Campus', author: 'Rahul K.', snippet: 'Behind the ECE department theres a small garden most people dont know about...', likes: 123, date: '1 week ago' },
];

const filters = ['All', 'Technical', 'Cultural', 'Sports', 'Academic', 'Fest'];
const visualKeys = [
  { color: '#667eea', label: 'Technical' },
  { color: '#f5576c', label: 'Cultural' },
  { color: '#4facfe', label: 'Sports' },
  { color: '#f0c040', label: 'Academic' },
  { color: '#ef4444', label: 'Fest' },
];

const faqs = [
  { q: 'How do I RSVP for an event?', a: 'Click the "RSVP Now" button on any event card. You will receive a confirmation and a reminder before the event.' },
  { q: 'Can I post events as a club head?', a: 'Yes! Log in through the "Club Login" button and use the admin panel to create and manage your events.' },
  { q: 'How do I set reminders?', a: 'Click the bell icon on any event card to set a reminder. You will be notified 1 hour before the event.' },
  { q: 'Is the campus map interactive?', a: 'Yes, the map shows all venues with clickable hotspots. You can see which events are happening at each location.' },
];

const Home = () => {
  const [activeFilter, setActiveFilter] = useState('All');
  const [openFaq, setOpenFaq] = useState(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackSent, setFeedbackSent] = useState(false);

  const filteredEvents = activeFilter === 'All'
    ? mockEvents
    : mockEvents.filter(e => e.category === activeFilter);

  return (
    <div className="home-page">
      {/* === HERO === */}
      <section className="hero">
        <div className="hero-bg"></div>
        <div className="container hero-content">
          <div className="hero-text animate-fade-in">
            <div className="hero-badge">
              <Sparkles size={14} />
              <span>IITR&apos;s Event Hub</span>
            </div>
            <h1 className="hero-title">
              Never Miss a<br />
              <span className="hero-highlight">Campus Moment</span>
            </h1>
            <p className="hero-subtitle">
              Discover events, explore venues, and stay connected with everything happening at IIT Roorkee — all in one place.
            </p>
            <div className="hero-actions">
              <a href="#events" className="btn btn-yellow btn-lg">
                <Flame size={18} />
                Explore Events
              </a>
              <a href="#map-section" className="btn btn-outline btn-lg">
                <MapPin size={18} />
                View Campus Map
              </a>
            </div>
            <div className="hero-stats">
              <div className="hero-stat">
                <span className="stat-number">50+</span>
                <span className="stat-label">Active Clubs</span>
              </div>
              <div className="hero-stat-divider"></div>
              <div className="hero-stat">
                <span className="stat-number">200+</span>
                <span className="stat-label">Events/Year</span>
              </div>
              <div className="hero-stat-divider"></div>
              <div className="hero-stat">
                <span className="stat-number">8K+</span>
                <span className="stat-label">Students</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* === ANNOUNCEMENTS === */}
      <section className="section announcements-section">
        <div className="container">
          <div className="section-header">
            <div>
              <h2 className="section-title">
                <Megaphone size={24} style={{ color: 'var(--brand-accent)' }} />
                Announcements
              </h2>
              <p className="section-subtitle">Important updates and notices for the campus</p>
            </div>
          </div>
          <div className="announcements-grid stagger">
            {announcements.map(a => (
              <div key={a.id} className={`announcement-card card animate-fade-in ${a.urgent ? 'urgent' : ''}`}>
                {a.urgent && <div className="urgent-strip">URGENT</div>}
                <div className="announcement-type">
                  <span className={`tag ${a.type === 'Academic' ? 'tag-blue' : a.type === 'Fest' ? 'tag-red' : 'tag-yellow'}`}>{a.type}</span>
                </div>
                <h4 className="announcement-title">{a.title}</h4>
                <p className="announcement-desc">{a.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* === FILTERS & VISUAL KEYS === */}
      <section className="section" id="events">
        <div className="container">
          <div className="section-header">
            <div>
              <h2 className="section-title">
                <Flame size={24} style={{ color: 'var(--brand-red)' }} />
                Upcoming Events
              </h2>
              <p className="section-subtitle">All the events you need to know about</p>
            </div>
            <div className="visual-keys">
              {visualKeys.map(vk => (
                <div key={vk.label} className="visual-key">
                  <div className="vk-dot" style={{ background: vk.color }}></div>
                  <span>{vk.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="filter-bar">
            <Filter size={18} className="filter-icon" />
            {filters.map(f => (
              <button
                key={f}
                className={`filter-btn ${activeFilter === f ? 'active' : ''}`}
                onClick={() => setActiveFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="events-grid grid-3 stagger">
            {filteredEvents.map(event => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>

          {filteredEvents.length === 0 && (
            <div className="empty-state">
              <Calendar size={48} />
              <h3>No events found</h3>
              <p>Try a different category filter</p>
            </div>
          )}
        </div>
      </section>

      {/* === INTERACTIVE MAP SECTION === */}
      <section className="section map-section" id="map-section">
        <div className="container">
          <div className="section-header">
            <div>
              <h2 className="section-title">
                <MapPin size={24} style={{ color: 'var(--brand-blue)' }} />
                Interactive Campus Map
              </h2>
              <p className="section-subtitle">Explore venues, find events, and navigate the campus</p>
            </div>
            <a href="/map" className="btn btn-outline">
              Full Map <ArrowRight size={16} />
            </a>
          </div>
          <div className="map-preview card">
            <div className="map-placeholder">
              <div className="map-grid">
                {/* Simplified campus map with hotspots */}
                <div className="map-zone zone-academic">
                  <span className="zone-label">Academic Zone</span>
                  <div className="hotspot" style={{ top: '30%', left: '40%' }} title="LHC">
                    <div className="hotspot-ping"></div>
                    <span>LHC</span>
                  </div>
                  <div className="hotspot" style={{ top: '60%', left: '70%' }} title="Main Building">
                    <div className="hotspot-ping"></div>
                    <span>Main Bldg</span>
                  </div>
                </div>
                <div className="map-zone zone-sports">
                  <span className="zone-label">Sports Zone</span>
                  <div className="hotspot active" style={{ top: '40%', left: '50%' }} title="Cricket Ground">
                    <div className="hotspot-ping"></div>
                    <span>🏏 Cricket</span>
                  </div>
                </div>
                <div className="map-zone zone-cultural">
                  <span className="zone-label">Cultural Zone</span>
                  <div className="hotspot" style={{ top: '50%', left: '30%' }} title="Convocation Hall">
                    <div className="hotspot-ping"></div>
                    <span>Conv. Hall</span>
                  </div>
                </div>
                <div className="map-zone zone-hostel">
                  <span className="zone-label">Hostel Zone</span>
                </div>
              </div>
              <div className="map-legend">
                <div className="legend-item"><div className="legend-dot active"></div> Active Event</div>
                <div className="legend-item"><div className="legend-dot"></div> Venue</div>
                <div className="legend-item"><div className="legend-dot hot"></div> Trending</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* === CAMPUS DIARIES === */}
      <section className="section diaries-section">
        <div className="container">
          <div className="section-header">
            <div>
              <h2 className="section-title">
                <BookOpen size={24} style={{ color: 'var(--brand-purple)' }} />
                Campus Diaries
              </h2>
              <p className="section-subtitle">Stories, memories, and experiences from fellow students</p>
            </div>
          </div>
          <div className="diaries-grid stagger">
            {campusDiaries.map(diary => (
              <div key={diary.id} className="diary-card card animate-fade-in">
                <div className="diary-header">
                  <div className="diary-avatar">{diary.author.charAt(0)}</div>
                  <div>
                    <span className="diary-author">{diary.author}</span>
                    <span className="diary-date">{diary.date}</span>
                  </div>
                </div>
                <h4 className="diary-title">{diary.title}</h4>
                <p className="diary-snippet">{diary.snippet}</p>
                <div className="diary-footer">
                  <button className="btn btn-ghost diary-like">
                    <Star size={14} /> {diary.likes}
                  </button>
                  <button className="btn btn-ghost">Read More <ChevronRight size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* === GALLERY === */}
      <section className="section gallery-section">
        <div className="container">
          <div className="section-header">
            <div>
              <h2 className="section-title">
                <ImageIcon size={24} style={{ color: 'var(--brand-green)' }} />
                Gallery
              </h2>
              <p className="section-subtitle">Relive the best moments from past events</p>
            </div>
          </div>
          <div className="gallery-grid">
            {[
              { gradient: 'linear-gradient(135deg, #667eea, #764ba2)', label: 'Cogni 2024' },
              { gradient: 'linear-gradient(135deg, #f093fb, #f5576c)', label: 'Thomso Night' },
              { gradient: 'linear-gradient(135deg, #4facfe, #00f2fe)', label: 'Sports Day' },
              { gradient: 'linear-gradient(135deg, #43e97b, #38f9d7)', label: 'E-Summit' },
              { gradient: 'linear-gradient(135deg, #fa709a, #fee140)', label: 'Fashion Show' },
              { gradient: 'linear-gradient(135deg, #a18cd1, #fbc2eb)', label: 'Guest Lecture' },
            ].map((item, i) => (
              <div key={i} className="gallery-item" style={{ background: item.gradient }}>
                <div className="gallery-overlay">
                  <span>{item.label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* === SUMMARY === */}
      <section className="section summary-section">
        <div className="container">
          <h2 className="section-title" style={{ textAlign: 'center' }}>
            <TrendingUp size={24} style={{ color: 'var(--brand-blue)' }} />
            At a Glance
          </h2>
          <div className="summary-cards grid-4 stagger">
            <div className="summary-card card animate-fade-in">
              <div className="summary-icon" style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)' }}>
                <Calendar size={24} />
              </div>
              <h3>12</h3>
              <p>Events This Week</p>
            </div>
            <div className="summary-card card animate-fade-in">
              <div className="summary-icon" style={{ background: 'linear-gradient(135deg, #f093fb, #f5576c)' }}>
                <Users size={24} />
              </div>
              <h3>1,240</h3>
              <p>Total RSVPs</p>
            </div>
            <div className="summary-card card animate-fade-in">
              <div className="summary-icon" style={{ background: 'linear-gradient(135deg, #43e97b, #38f9d7)' }}>
                <Star size={24} />
              </div>
              <h3>4.8</h3>
              <p>Avg. Rating</p>
            </div>
            <div className="summary-card card animate-fade-in">
              <div className="summary-icon" style={{ background: 'linear-gradient(135deg, #fa709a, #fee140)' }}>
                <Flame size={24} />
              </div>
              <h3>Thomso</h3>
              <p>Trending Now</p>
            </div>
          </div>
        </div>
      </section>

      {/* === FAQ === */}
      <section className="section faq-section">
        <div className="container">
          <div className="section-header" style={{ justifyContent: 'center', textAlign: 'center' }}>
            <div>
              <h2 className="section-title" style={{ justifyContent: 'center' }}>
                <HelpCircle size={24} style={{ color: 'var(--brand-accent)' }} />
                Frequently Asked Questions
              </h2>
              <p className="section-subtitle" style={{ margin: '0 auto var(--space-2xl) auto' }}>Got questions? We have answers.</p>
            </div>
          </div>
          <div className="faq-list">
            {faqs.map((faq, i) => (
              <div key={i} className={`faq-item card ${openFaq === i ? 'open' : ''}`}>
                <button className="faq-question" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                  <span>{faq.q}</span>
                  <ChevronDown size={20} className={`faq-chevron ${openFaq === i ? 'rotated' : ''}`} />
                </button>
                {openFaq === i && (
                  <div className="faq-answer animate-fade-in">
                    <p>{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* === FEEDBACK === */}
      <section className="section feedback-section">
        <div className="container">
          <div className="feedback-card card">
            <div className="feedback-content">
              <h2 className="section-title">
                <MessageSquare size={24} style={{ color: 'var(--brand-blue)' }} />
                Share Your Feedback
              </h2>
              <p className="section-subtitle">Help us make campus life even better</p>
              {!feedbackSent ? (
                <div className="feedback-form">
                  <textarea
                    className="feedback-textarea"
                    placeholder="Tell us what you think, suggest improvements, or report an issue..."
                    value={feedbackText}
                    onChange={e => setFeedbackText(e.target.value)}
                    rows={4}
                  />
                  <button
                    className="btn btn-yellow"
                    onClick={() => { if (feedbackText.trim()) setFeedbackSent(true); }}
                  >
                    <Send size={16} />
                    Submit Feedback
                  </button>
                </div>
              ) : (
                <div className="feedback-success animate-fade-in">
                  <Sparkles size={32} style={{ color: 'var(--brand-yellow)' }} />
                  <h3>Thank you!</h3>
                  <p>Your feedback has been submitted successfully.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* === RULES === */}
      <section className="section rules-section">
        <div className="container">
          <h2 className="section-title" style={{ textAlign: 'center', justifyContent: 'center' }}>
            📋 Campus Event Rules
          </h2>
          <div className="rules-grid grid-2">
            <div className="rule-card card">
              <span className="rule-number">01</span>
              <h4>Prior Permission Required</h4>
              <p>All events must be approved by the Dean of Students Welfare at least 7 days in advance.</p>
            </div>
            <div className="rule-card card">
              <span className="rule-number">02</span>
              <h4>Venue Booking</h4>
              <p>Venues must be booked through the official channel. No unauthorized use of campus spaces.</p>
            </div>
            <div className="rule-card card">
              <span className="rule-number">03</span>
              <h4>Noise & Timing</h4>
              <p>Events must end by 10 PM on weekdays and 11 PM on weekends. Amplified sound requires special permission.</p>
            </div>
            <div className="rule-card card">
              <span className="rule-number">04</span>
              <h4>Safety & Conduct</h4>
              <p>Organizers are responsible for participant safety. Emergency contacts must be displayed at all venues.</p>
            </div>
          </div>
        </div>
      </section>

      {/* === RESOURCES === */}
      <section className="section resources-section">
        <div className="container">
          <h2 className="section-title" style={{ textAlign: 'center', justifyContent: 'center' }}>
            <BookOpen size={24} style={{ color: 'var(--brand-green)' }} />
            Resources
          </h2>
          <div className="resources-grid grid-3 stagger">
            {[
              { icon: '📋', title: 'Event Proposal Template', desc: 'Download the official format for submitting event proposals.' },
              { icon: '🗺️', title: 'Venue Directory', desc: 'Complete list of all bookable venues with capacities and facilities.' },
              { icon: '📞', title: 'Important Contacts', desc: 'DSW office, security, medical emergency, and club coordinator numbers.' },
              { icon: '💰', title: 'Sponsorship Guidelines', desc: 'Rules and templates for seeking event sponsorships.' },
              { icon: '📝', title: 'Post-Event Report', desc: 'Template for submitting event reports and feedback summaries.' },
              { icon: '🔗', title: 'Club Registration', desc: 'Steps to register a new student club or society at IITR.' },
            ].map((res, i) => (
              <div key={i} className="resource-card card animate-fade-in">
                <span className="resource-icon">{res.icon}</span>
                <h4>{res.title}</h4>
                <p>{res.desc}</p>
                <button className="btn btn-ghost" style={{ marginTop: 'auto' }}>
                  View <ArrowRight size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* === FOOTER === */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-brand">
              <div className="footer-logo">
                <div className="logo-icon" style={{ background: 'var(--brand-yellow)', color: 'var(--grey-900)' }}>I</div>
                <span className="logo-title" style={{ color: 'white' }}>IITR Connect</span>
              </div>
              <p>Your one-stop platform for everything happening on campus. Built with ❤️ by students, for students.</p>
            </div>
            <div className="footer-links">
              <h4>Quick Links</h4>
              <a href="#events">Events</a>
              <a href="/map">Campus Map</a>
              <a href="/calendar">Calendar</a>
              <a href="/resources">Resources</a>
            </div>
            <div className="footer-links">
              <h4>For Clubs</h4>
              <a href="/admin">Admin Login</a>
              <a href="#">Post an Event</a>
              <a href="#">Analytics</a>
            </div>
            <div className="footer-links">
              <h4>Support</h4>
              <a href="#">Contact Us</a>
              <a href="#">Report Bug</a>
              <a href="#">Privacy Policy</a>
            </div>
          </div>
          <div className="footer-bottom">
            <p>© 2026 IITR Connect. Made for IIT Roorkee Campus.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
