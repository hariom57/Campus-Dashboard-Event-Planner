import React from 'react';
import { BookOpen, Download, FileText, Phone, DollarSign, Link2, ArrowRight, ExternalLink } from 'lucide-react';
import './Resources.css';

const resources = [
    { icon: <FileText size={28} />, title: 'Event Proposal Template', desc: 'Official format for submitting event proposals to the DSW office. Includes budget allocation and venue preference sections.', color: '#667eea', tag: 'Template' },
    { icon: <BookOpen size={28} />, title: 'Venue Directory', desc: 'Complete list of all bookable venues on campus with capacities, available AV equipment, and booking procedures.', color: '#f5576c', tag: 'Directory' },
    { icon: <Phone size={28} />, title: 'Important Contacts', desc: 'Contact numbers for DSW office, campus security, medical emergency, hostel wardens, and club coordinators.', color: '#4facfe', tag: 'Contacts' },
    { icon: <DollarSign size={28} />, title: 'Sponsorship Guidelines', desc: 'Rules, templates, and best practices for seeking event sponsorships. Includes MOU templates.', color: '#43e97b', tag: 'Guide' },
    { icon: <FileText size={28} />, title: 'Post-Event Report Template', desc: 'Template for submitting event reports with attendance, expenses, and feedback summary sections.', color: '#fa709a', tag: 'Template' },
    { icon: <Link2 size={28} />, title: 'Club Registration Guide', desc: 'Step-by-step guide to registering a new student club or society at IIT Roorkee.', color: '#a18cd1', tag: 'Guide' },
];

const quickLinks = [
    { label: 'IITR Website', url: '#' },
    { label: 'IMG Channel', url: '#' },
    { label: 'DSW Office', url: '#' },
    { label: 'Student Senate', url: '#' },
    { label: 'Cultural Council', url: '#' },
    { label: 'Technical Council', url: '#' },
];

const Resources = () => (
    <div className="resources-page" style={{ paddingTop: '72px' }}>
        <div className="container">
            <div className="map-page-header">
                <h1 className="page-title">
                    <BookOpen size={28} style={{ color: 'var(--brand-green)' }} />
                    Resources
                </h1>
                <p className="page-subtitle">Templates, guides, and important links for event organizers and students</p>
            </div>

            <div className="resources-layout">
                <div className="resources-main">
                    <div className="res-grid stagger">
                        {resources.map((res, i) => (
                            <div key={i} className="res-card card animate-fade-in">
                                <div className="res-icon-wrap" style={{ background: res.color + '15', color: res.color }}>
                                    {res.icon}
                                </div>
                                <div className="res-content">
                                    <div className="res-top">
                                        <h3>{res.title}</h3>
                                        <span className="tag" style={{ background: res.color + '15', color: res.color }}>{res.tag}</span>
                                    </div>
                                    <p>{res.desc}</p>
                                    <div className="res-actions">
                                        <button className="btn btn-yellow" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}>
                                            <Download size={14} />
                                            Download
                                        </button>
                                        <button className="btn btn-ghost" style={{ fontSize: '0.8rem' }}>
                                            <ExternalLink size={14} />
                                            Preview
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="res-sidebar">
                    <div className="card" style={{ padding: 'var(--space-lg)' }}>
                        <h3 style={{ fontSize: '1rem', marginBottom: 'var(--space-md)' }}>🔗 Quick Links</h3>
                        <div className="quick-links">
                            {quickLinks.map((link, i) => (
                                <a key={i} href={link.url} className="quick-link">
                                    <span>{link.label}</span>
                                    <ArrowRight size={14} />
                                </a>
                            ))}
                        </div>
                    </div>

                    <div className="card res-help">
                        <h3>Need Help?</h3>
                        <p>Can't find what you're looking for? Contact the DSW office or reach out to your club coordinator.</p>
                        <button className="btn btn-outline" style={{ width: '100%' }}>
                            Contact Support
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
);

export default Resources;
