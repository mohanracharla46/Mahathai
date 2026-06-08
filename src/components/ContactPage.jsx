import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Phone, Mail, Clock, Send, ArrowLeft, MessageSquare, Globe, ChevronRight } from 'lucide-react';
import { useWebsiteContent } from '../utils/cms';
import { createContactMessage, getContactMessages } from '../lib/api';

const MESSAGES_PER_PAGE = 5;

const normalizeMatchValue = (value) => String(value || '').trim().toLowerCase();

const normalizeContactMessage = (message) => ({
  id: message.id || `contact-${Date.now()}`,
  name: message.name || message.full_name || message.user?.name || 'Guest',
  email: message.email || message.user?.email || '',
  phone: message.phone || message.phone_number || '',
  subject: message.subject || message.inquiry_type || 'Contact Message',
  message: message.message || message.notes || message.body || '',
  status: message.status
    ? String(message.status).charAt(0).toUpperCase() + String(message.status).slice(1).toLowerCase()
    : 'Pending',
  created_at: message.created_at || message.date || new Date().toISOString(),
  date: message.created_at
    ? new Date(message.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : message.date || ''
});

export default function ContactPage({ onOpenReservation, currentUser = null }) {
  const content = useWebsiteContent();
  const {
    heroSubtitle,
    heroTitle,
    heroDesc,
    card1Title,
    card1Line1,
    card1Line2,
    card2Title,
    card2Line1,
    card2Line2,
    card3Title,
    card3Line1,
    card3Line2,
    card4Title,
    card4Line1,
    card4Line2,
    formSubtitle,
    formTitle,
    formDesc
  } = content.contact;
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', subject: '', message: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [userMessages, setUserMessages] = useState([]);
  const [messagesPage, setMessagesPage] = useState(1);

  const userEmail = normalizeMatchValue(currentUser?.email);
  const userPhone = normalizeMatchValue(currentUser?.phone);

  const loadUserMessages = async () => {
    const savedMessages = JSON.parse(localStorage.getItem('maha_contact_messages') || '[]')
      .map(normalizeContactMessage);

    const matchesUser = (message) => (
      (userEmail && normalizeMatchValue(message.email) === userEmail) ||
      (userPhone && normalizeMatchValue(message.phone) === userPhone)
    );

    setUserMessages(savedMessages.filter(matchesUser));

    try {
      const apiMessages = await getContactMessages();
      const rows = apiMessages?.data || apiMessages;
      const normalizedMessages = Array.isArray(rows)
        ? rows.map(normalizeContactMessage)
        : [];
      setUserMessages(normalizedMessages.filter(matchesUser));
    } catch (error) {
      console.error('Failed to load user contact messages.', error);
    }
  };

  useEffect(() => {
    if (!currentUser) return;

    setFormData((prev) => ({
      ...prev,
      name: currentUser.name || '',
      email: currentUser.email || '',
      phone: currentUser.phone || ''
    }));
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) {
      setUserMessages([]);
      return;
    }

    loadUserMessages();

    const handleStorageUpdate = (event) => {
      if (event.key === 'maha_contact_messages') {
        loadUserMessages();
      }
    };

    window.addEventListener('storage', handleStorageUpdate);
    return () => window.removeEventListener('storage', handleStorageUpdate);
  }, [currentUser?.email, currentUser?.phone]);

  useEffect(() => {
    setMessagesPage(1);
  }, [userMessages.length]);

  const messagesTotalPages = Math.max(1, Math.ceil(userMessages.length / MESSAGES_PER_PAGE));
  const visibleMessages = userMessages.slice(
    (messagesPage - 1) * MESSAGES_PER_PAGE,
    messagesPage * MESSAGES_PER_PAGE
  );

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const localMessage = {
      id: `contact-${Date.now()}`,
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      phone_number: formData.phone,
      subject: formData.subject,
      message: formData.message,
      status: 'pending',
      created_at: new Date().toISOString()
    };

    try {
      const savedMessage = await createContactMessage({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        phone_number: formData.phone,
        subject: formData.subject,
        message: formData.message
      });
      const globalMessages = JSON.parse(localStorage.getItem('maha_contact_messages') || '[]');
      globalMessages.unshift(savedMessage?.id ? savedMessage : localMessage);
      localStorage.setItem('maha_contact_messages', JSON.stringify(globalMessages));
      setUserMessages((prev) => [normalizeContactMessage(savedMessage?.id ? savedMessage : localMessage), ...prev]);
      setMessagesPage(1);
    } catch (error) {
      console.error('Failed to sync contact message with backend.', error);
      const globalMessages = JSON.parse(localStorage.getItem('maha_contact_messages') || '[]');
      globalMessages.unshift(localMessage);
      localStorage.setItem('maha_contact_messages', JSON.stringify(globalMessages));
      setUserMessages((prev) => [normalizeContactMessage(localMessage), ...prev]);
      setMessagesPage(1);
    }
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 4000);
    setFormData({
      name: currentUser?.name || '',
      email: currentUser?.email || '',
      phone: currentUser?.phone || '',
      subject: '',
      message: ''
    });
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } }
  };

  const inputStyle = {
    width: '100%',
    padding: '1rem 1.25rem',
    border: '1px solid var(--border-light)',
    borderRadius: '6px',
    backgroundColor: 'var(--canvas-primary)',
    fontFamily: 'var(--font-body)',
    fontSize: '0.9rem',
    color: 'var(--text-dark)',
    outline: 'none',
    transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
    fontWeight: 300
  };

  const labelStyle = {
    display: 'block',
    fontFamily: 'var(--font-body)',
    fontSize: '0.7rem',
    fontWeight: 700,
    letterSpacing: '0.15em',
    textTransform: 'uppercase',
    color: 'var(--text-dark)',
    marginBottom: '0.5rem'
  };

  return (
    <div className="about-page-wrapper" style={{ backgroundColor: 'var(--canvas-primary)', minHeight: '100vh', paddingTop: '80px' }}>

      {/* ══════════════════════════════════════════════
          HERO SECTION (Private Events Style)
      ══════════════════════════════════════════════ */}
      <section className="about-hero relative overflow-hidden" style={{ backgroundColor: 'var(--canvas-secondary)', borderBottom: '1px solid var(--border-light)', padding: '8rem 0' }}>
        {/* Soft background ambient glow */}
        <div 
          className="absolute w-[500px] h-[500px] rounded-full blur-[120px] pointer-events-none opacity-25"
          style={{
            backgroundColor: 'var(--gold-light)',
            top: '-20%',
            left: '10%',
            zIndex: 0
          }}
        />
        
        <div className="container relative z-10" style={{ zIndex: 10 }}>
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            style={{ textAlign: 'center', margin: '0 auto', maxWidth: '48rem' }}
          >
            <a href="#home" className="contact-back-link" style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              color: 'var(--gold-antique)', textDecoration: 'none',
              fontFamily: 'var(--font-body)', fontSize: '0.75rem',
              letterSpacing: '0.2em', textTransform: 'uppercase',
              marginBottom: '2rem', transition: 'opacity 0.3s'
            }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '0.7'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
            >
              <ArrowLeft size={14} />
              Back to Home
            </a>

            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: '0.75rem', marginBottom: '1.5rem'
            }}>
              <MessageSquare size={18} style={{ color: 'var(--accent-jade)' }} />
              <span style={{
                fontFamily: 'var(--font-body)', fontSize: '0.75rem', fontWeight: 700,
                letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--accent-jade)'
              }}>
                {heroSubtitle}
              </span>
            </div>

            <h1 style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 'clamp(2.5rem, 5.5vw, 4.5rem)', fontWeight: 300,
              color: 'var(--text-dark)', lineHeight: 1.1, marginBottom: '1.5rem'
            }}>
              {heroTitle}
            </h1>

            <div style={{
              width: '80px', height: '1px',
              background: 'linear-gradient(90deg, transparent, var(--gold-antique), transparent)',
              margin: '0 auto 1.5rem'
            }} />

            <p style={{
              fontFamily: 'var(--font-body)', fontSize: '1.05rem',
              color: 'var(--text-muted)', maxWidth: '520px',
              margin: '0 auto', lineHeight: 1.8, fontWeight: 300
            }}>
              {heroDesc}
            </p>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          CONTACT INFO CARDS
      ══════════════════════════════════════════════ */}
      <section className="contact-info-section" style={{
        padding: '4rem 2rem',
        backgroundColor: 'var(--canvas-secondary)',
        borderBottom: '1px solid var(--border-light)'
      }}>
        <div className="container">
          <div className="contact-cards-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '1.5rem'
          }}>
            {[
              {
                icon: <MapPin size={22} />,
                title: card1Title,
                lines: [card1Line1, card1Line2],
                action: { label: 'Get Directions', href: 'https://maps.google.com' }
              },
              {
                icon: <Phone size={22} />,
                title: card2Title,
                lines: [card2Line1, card2Line2],
                action: { label: 'Call Now', href: 'tel:' + card2Line1 }
              },
              {
                icon: <Mail size={22} />,
                title: card3Title,
                lines: [card3Line1, card3Line2],
                action: { label: 'Send Email', href: 'mailto:' + card3Line1 }
              },
              {
                icon: <Clock size={22} />,
                title: card4Title,
                lines: [card4Line1, card4Line2],
                action: null
              }
            ].map((card, i) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="contact-info-card"
                style={{
                  backgroundColor: 'var(--canvas-primary)',
                  border: '1px solid var(--border-light)',
                  borderRadius: '12px',
                  padding: '2rem 1.5rem',
                  textAlign: 'center',
                  transition: 'box-shadow 0.4s ease, transform 0.4s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 16px 48px rgba(11,54,61,0.08)';
                  e.currentTarget.style.transform = 'translateY(-4px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={{
                  width: '52px', height: '52px', borderRadius: '50%',
                  backgroundColor: 'var(--gold-light)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 1.25rem', color: 'var(--gold-antique)'
                }}>
                  {card.icon}
                </div>

                <h3 style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '1.15rem', fontWeight: 500,
                  color: 'var(--text-dark)', marginBottom: '0.75rem'
                }}>
                  {card.title}
                </h3>

                {card.lines.map((line, j) => (
                  <p key={j} style={{
                    fontFamily: 'var(--font-body)', fontSize: '0.85rem',
                    color: 'var(--text-muted)', fontWeight: 300,
                    lineHeight: 1.6, margin: 0
                  }}>
                    {line}
                  </p>
                ))}

                {card.action && (
                  <a href={card.action.href} target="_blank" rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                      marginTop: '1rem',
                      fontFamily: 'var(--font-body)', fontSize: '0.7rem',
                      fontWeight: 700, letterSpacing: '0.15em',
                      textTransform: 'uppercase', textDecoration: 'none',
                      color: 'var(--gold-antique)', transition: 'opacity 0.3s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = '0.7'}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                  >
                    {card.action.label}
                    <ChevronRight size={12} />
                  </a>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          FORM + MAP SECTION
      ══════════════════════════════════════════════ */}
      <section style={{ padding: '5rem 2rem', backgroundColor: 'var(--canvas-primary)' }}>
        <div className="container">
          <div className="contact-form-map-grid" style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '3rem',
            alignItems: 'start'
          }}>
            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
              <span style={{
                display: 'block',
                fontFamily: 'var(--font-body)', fontSize: '0.7rem',
                fontWeight: 700, letterSpacing: '0.3em', textTransform: 'uppercase',
                color: 'var(--gold-antique)', marginBottom: '0.75rem'
              }}>
                {formSubtitle}
              </span>
              <h2 style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 'clamp(1.6rem, 2.5vw, 2.2rem)', fontWeight: 300,
                color: 'var(--text-dark)', marginBottom: '0.75rem'
              }}>
                {formTitle}
              </h2>
              <p style={{
                fontFamily: 'var(--font-body)', fontSize: '0.9rem',
                color: 'var(--text-muted)', fontWeight: 300,
                lineHeight: 1.7, marginBottom: '2rem'
              }}>
                {formDesc}
              </p>

              {submitted ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  style={{
                    padding: '2.5rem',
                    backgroundColor: 'var(--canvas-secondary)',
                    borderRadius: '12px',
                    border: '1px solid var(--border-light)',
                    textAlign: 'center'
                  }}
                >
                  <div style={{
                    width: '56px', height: '56px', borderRadius: '50%',
                    backgroundColor: 'var(--gold-light)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 1rem'
                  }}>
                    <Send size={22} style={{ color: 'var(--gold-antique)' }} />
                  </div>
                  <h3 style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: '1.3rem', fontWeight: 500,
                    color: 'var(--text-dark)', marginBottom: '0.5rem'
                  }}>
                    Message Sent!
                  </h3>
                  <p style={{
                    fontFamily: 'var(--font-body)', fontSize: '0.85rem',
                    color: 'var(--text-muted)', fontWeight: 300
                  }}>
                    Thank you for reaching out. Our team will get back to you within 24 hours.
                  </p>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} style={{
                  display: 'flex', flexDirection: 'column', gap: '1.25rem'
                }}>
                  {/* Name + Email Row */}
                  <div className="contact-form-row" style={{
                    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem'
                  }}>
                    <div>
                      <label style={labelStyle}>Your Name</label>
                      <input
                        type="text" name="name" required
                        value={formData.name} onChange={handleChange}
                        placeholder="Full Name"
                        style={inputStyle}
                        onFocus={(e) => {
                          e.target.style.borderColor = 'var(--gold-antique)';
                          e.target.style.boxShadow = '0 0 0 3px rgba(204,164,83,0.1)';
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = 'var(--border-light)';
                          e.target.style.boxShadow = 'none';
                        }}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Email Address</label>
                      <input
                        type="email" name="email" required
                        value={formData.email} onChange={handleChange}
                        placeholder="you@example.com"
                        style={inputStyle}
                        onFocus={(e) => {
                          e.target.style.borderColor = 'var(--gold-antique)';
                          e.target.style.boxShadow = '0 0 0 3px rgba(204,164,83,0.1)';
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = 'var(--border-light)';
                          e.target.style.boxShadow = 'none';
                        }}
                      />
                    </div>
                  </div>

                  {/* Phone + Subject Row */}
                  <div className="contact-form-row" style={{
                    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem'
                  }}>
                    <div>
                      <label style={labelStyle}>Phone (Optional)</label>
                      <input
                        type="tel" name="phone"
                        value={formData.phone} onChange={handleChange}
                        placeholder="+66 XX XXX XXXX"
                        style={inputStyle}
                        onFocus={(e) => {
                          e.target.style.borderColor = 'var(--gold-antique)';
                          e.target.style.boxShadow = '0 0 0 3px rgba(204,164,83,0.1)';
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = 'var(--border-light)';
                          e.target.style.boxShadow = 'none';
                        }}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Subject</label>
                      <select
                        name="subject" required
                        value={formData.subject} onChange={handleChange}
                        style={{
                          ...inputStyle,
                          cursor: 'pointer',
                          appearance: 'none',
                          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23577377' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
                          backgroundRepeat: 'no-repeat',
                          backgroundPosition: 'right 1rem center'
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = 'var(--gold-antique)';
                          e.target.style.boxShadow = '0 0 0 3px rgba(204,164,83,0.1)';
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = 'var(--border-light)';
                          e.target.style.boxShadow = 'none';
                        }}
                      >
                        <option value="">Select a topic</option>
                        <option value="reservation">Reservation Inquiry</option>
                        <option value="events">Private Events</option>
                        <option value="catering">Catering Services</option>
                        <option value="feedback">Feedback</option>
                        <option value="careers">Careers</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>

                  {/* Message */}
                  <div>
                    <label style={labelStyle}>Your Message</label>
                    <textarea
                      name="message" required rows={5}
                      value={formData.message} onChange={handleChange}
                      placeholder="Tell us how we can help..."
                      style={{
                        ...inputStyle,
                        resize: 'vertical',
                        minHeight: '140px'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = 'var(--gold-antique)';
                        e.target.style.boxShadow = '0 0 0 3px rgba(204,164,83,0.1)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = 'var(--border-light)';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      gap: '0.6rem',
                      padding: '1rem 2.5rem',
                      border: '1px solid var(--gold-antique)',
                      backgroundColor: 'var(--gold-antique)',
                      color: 'var(--text-dark)',
                      fontFamily: 'var(--font-body)', fontSize: '0.75rem',
                      fontWeight: 700, letterSpacing: '0.2em',
                      textTransform: 'uppercase', borderRadius: '4px',
                      cursor: 'pointer', transition: 'all 0.4s ease',
                      alignSelf: 'flex-start'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--text-dark)';
                      e.currentTarget.style.color = 'var(--gold-antique)';
                      e.currentTarget.style.borderColor = 'var(--text-dark)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--gold-antique)';
                      e.currentTarget.style.color = 'var(--text-dark)';
                      e.currentTarget.style.borderColor = 'var(--gold-antique)';
                    }}
                  >
                    <Send size={14} />
                    Send Message
                  </button>
                </form>
              )}
            </motion.div>

            {/* Map / Location Panel */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* Embedded Map */}
              <div style={{
                borderRadius: '12px',
                overflow: 'hidden',
                border: '1px solid var(--border-light)',
                marginBottom: '1.5rem',
                aspectRatio: '16/12'
              }}>
                <iframe
                  title="Maha Thai Location"
                  src="https://maps.google.com/maps?q=1901%20Long%20Prairie%20Rd%20Ste%20260,%20Flower%20Mound,%20TX%2075022&t=&z=15&ie=UTF8&iwloc=&output=embed"
                  width="100%" height="100%"
                  style={{ border: 0 }}
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>

              {/* Quick Contact Details beside map */}
              <div style={{
                backgroundColor: 'var(--canvas-secondary)',
                borderRadius: '12px',
                border: '1px solid var(--border-light)',
                padding: '1.75rem'
              }}>
                <h3 style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '1.15rem', fontWeight: 500,
                  color: 'var(--text-dark)', marginBottom: '1.25rem'
                }}>
                  Quick Information
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {[
                    { icon: <MapPin size={16} />, text: '1901 Long Prairie Rd, Ste 260, Flower Mound, TX 75022' },
                    { icon: <Phone size={16} />, text: '+1 (469) 993-1399' },
                    { icon: <Mail size={16} />, text: 'info@mahaathai.com' },
                    { icon: <Globe size={16} />, text: 'www.mahaathai.com' }
                  ].map((item, i) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: '0.75rem'
                    }}>
                      <span style={{ color: 'var(--gold-antique)', flexShrink: 0 }}>{item.icon}</span>
                      <span style={{
                        fontFamily: 'var(--font-body)', fontSize: '0.85rem',
                        color: 'var(--text-muted)', fontWeight: 300
                      }}>
                        {item.text}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Quick CTA */}
                <div style={{
                  marginTop: '1.5rem', paddingTop: '1.25rem',
                  borderTop: '1px solid var(--border-light)',
                  display: 'flex', gap: '0.75rem', flexWrap: 'wrap'
                }}>
                  <button
                    onClick={() => onOpenReservation && onOpenReservation('reservation')}
                    style={{
                      flex: 1, minWidth: '140px',
                      padding: '0.75rem 1.25rem',
                      border: '1px solid var(--gold-antique)',
                      backgroundColor: 'var(--gold-antique)',
                      color: 'var(--text-dark)',
                      fontFamily: 'var(--font-body)', fontSize: '0.7rem',
                      fontWeight: 700, letterSpacing: '0.15em',
                      textTransform: 'uppercase', borderRadius: '4px',
                      cursor: 'pointer', transition: 'all 0.3s ease',
                      textAlign: 'center'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = 'var(--gold-antique)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--gold-antique)';
                      e.currentTarget.style.color = 'var(--text-dark)';
                    }}
                  >
                    Reserve Table
                  </button>
                  <a
                    href="tel:+14699931399"
                    style={{
                      flex: 1, minWidth: '140px',
                      padding: '0.75rem 1.25rem',
                      border: '1px solid var(--border-light)',
                      backgroundColor: 'transparent',
                      color: 'var(--text-dark)',
                      fontFamily: 'var(--font-body)', fontSize: '0.7rem',
                      fontWeight: 700, letterSpacing: '0.15em',
                      textTransform: 'uppercase', borderRadius: '4px',
                      textDecoration: 'none', textAlign: 'center',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--gold-antique)';
                      e.currentTarget.style.color = 'var(--gold-antique)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border-light)';
                      e.currentTarget.style.color = 'var(--text-dark)';
                    }}
                  >
                    Call Us
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section style={{
        padding: '0 2rem 5rem',
        backgroundColor: 'var(--canvas-primary)'
      }}>
        <div className="container" style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{
            backgroundColor: 'var(--canvas-secondary)',
            border: '1px solid var(--border-light)',
            borderRadius: '12px',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '1.5rem',
              borderBottom: '1px solid var(--border-light)',
              display: 'flex',
              justifyContent: 'space-between',
              gap: '1rem',
              alignItems: 'center',
              flexWrap: 'wrap'
            }}>
              <div>
                <span style={{
                  display: 'block',
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  letterSpacing: '0.22em',
                  textTransform: 'uppercase',
                  color: 'var(--gold-antique)',
                  marginBottom: '0.35rem'
                }}>
                  MESSAGE HISTORY
                </span>
                <h3 style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '1.35rem',
                  fontWeight: 300,
                  color: 'var(--text-dark)'
                }}>
                  My Contact Messages
                </h3>
              </div>
              {currentUser && (
                <span style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.76rem',
                  color: 'var(--text-muted)'
                }}>
                  {userMessages.length} submitted
                </span>
              )}
            </div>

            {!currentUser ? (
              <div style={{ padding: '2rem', textAlign: 'center' }}>
                <p style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.9rem',
                  color: 'var(--text-muted)',
                  marginBottom: '1rem'
                }}>
                  Sign in to view your submitted contact messages.
                </p>
                <a href="#/signin" style={{
                  display: 'inline-flex',
                  padding: '0.75rem 1.5rem',
                  border: '1px solid var(--gold-antique)',
                  color: 'var(--gold-antique)',
                  textDecoration: 'none',
                  borderRadius: '4px',
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase'
                }}>
                  Sign In
                </a>
              </div>
            ) : userMessages.length === 0 ? (
              <div style={{
                padding: '2rem',
                textAlign: 'center',
                fontFamily: 'var(--font-body)',
                fontSize: '0.9rem',
                color: 'var(--text-muted)'
              }}>
                No contact messages found for your account.
              </div>
            ) : (
              <>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '760px' }}>
                    <thead>
                      <tr style={{ backgroundColor: 'var(--canvas-primary)', borderBottom: '1px solid var(--border-light)' }}>
                        <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>ID</th>
                        <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Subject</th>
                        <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Message</th>
                        <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Date</th>
                        <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleMessages.map((message) => (
                        <tr key={message.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                          <td style={{ padding: '1rem', fontFamily: 'var(--font-body)', fontSize: '0.82rem', color: 'var(--text-muted)' }}>{message.id}</td>
                          <td style={{ padding: '1rem', fontFamily: 'var(--font-body)', fontSize: '0.86rem', color: 'var(--text-dark)', fontWeight: 600, textTransform: 'capitalize' }}>{message.subject}</td>
                          <td style={{ padding: '1rem', fontFamily: 'var(--font-body)', fontSize: '0.82rem', color: 'var(--text-muted)', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{message.message}</td>
                          <td style={{ padding: '1rem', fontFamily: 'var(--font-body)', fontSize: '0.82rem', color: 'var(--text-muted)' }}>{message.date || 'N/A'}</td>
                          <td style={{ padding: '1rem' }}>
                            <span style={{
                              display: 'inline-flex',
                              padding: '0.25rem 0.6rem',
                              borderRadius: '999px',
                              backgroundColor: message.status === 'Closed' ? 'rgba(14, 110, 86, 0.1)' : 'var(--gold-light)',
                              color: message.status === 'Closed' ? 'var(--accent-jade)' : 'var(--gold-antique)',
                              fontFamily: 'var(--font-body)',
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              letterSpacing: '0.08em',
                              textTransform: 'uppercase'
                            }}>
                              {message.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div style={{
                  padding: '1rem 1.5rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '1rem',
                  flexWrap: 'wrap',
                  backgroundColor: 'var(--canvas-primary)'
                }}>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Showing {(messagesPage - 1) * MESSAGES_PER_PAGE + 1}-{Math.min(messagesPage * MESSAGES_PER_PAGE, userMessages.length)} of {userMessages.length}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button
                      type="button"
                      disabled={messagesPage === 1}
                      onClick={() => setMessagesPage((page) => Math.max(1, page - 1))}
                      style={{ padding: '0.5rem 0.85rem', border: '1px solid var(--border-light)', borderRadius: '4px', backgroundColor: 'var(--canvas-secondary)', cursor: messagesPage === 1 ? 'not-allowed' : 'pointer', opacity: messagesPage === 1 ? 0.45 : 1 }}
                    >
                      Previous
                    </button>
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.78rem', minWidth: '4rem', textAlign: 'center' }}>
                      {messagesPage} / {messagesTotalPages}
                    </span>
                    <button
                      type="button"
                      disabled={messagesPage === messagesTotalPages}
                      onClick={() => setMessagesPage((page) => Math.min(messagesTotalPages, page + 1))}
                      style={{ padding: '0.5rem 0.85rem', border: '1px solid var(--border-light)', borderRadius: '4px', backgroundColor: 'var(--canvas-secondary)', cursor: messagesPage === messagesTotalPages ? 'not-allowed' : 'pointer', opacity: messagesPage === messagesTotalPages ? 0.45 : 1 }}
                    >
                      Next
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          FAQ SECTION
      ══════════════════════════════════════════════ */}
      <section style={{
        padding: '5rem 2rem',
        backgroundColor: 'var(--canvas-secondary)',
        borderTop: '1px solid var(--border-light)'
      }}>
        <div className="container" style={{ maxWidth: '750px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <span style={{
              display: 'block',
              fontFamily: 'var(--font-body)', fontSize: '0.7rem',
              fontWeight: 700, letterSpacing: '0.3em', textTransform: 'uppercase',
              color: 'var(--gold-antique)', marginBottom: '0.75rem'
            }}>
              FREQUENTLY ASKED
            </span>
            <h2 style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 'clamp(1.6rem, 2.5vw, 2.2rem)', fontWeight: 300,
              color: 'var(--text-dark)'
            }}>
              Common Questions
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[
              {
                q: 'Do you accept walk-in guests?',
                a: 'While we welcome walk-ins, we highly recommend making a reservation to ensure the best possible experience, especially during weekends and holidays.'
              },
              {
                q: 'Can you accommodate dietary restrictions?',
                a: 'Absolutely. Our chefs are experienced in preparing dishes for various dietary needs including gluten-free, nut-free, and vegan options. Please mention your requirements when booking.'
              },
              {
                q: 'Do you offer private dining spaces?',
                a: 'Yes, we have two exclusive private dining areas — The Royal Room and The Lotus Garden — ideal for intimate gatherings and corporate events.'
              },
              {
                q: 'What is your cancellation policy?',
                a: 'We kindly ask for 24-hour notice for cancellations. For large groups of 8 or more, we require 48-hour notice.'
              },
              {
                q: 'Is parking available?',
                a: 'Complimentary valet parking is available for all dinner guests. Public parking is also available nearby.'
              }
            ].map((faq, i) => (
              <FAQItem key={i} question={faq.q} answer={faq.a} index={i} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

/* ──────────────────────────────────────────────────
   FAQ ACCORDION ITEM
────────────────────────────────────────────────── */
function FAQItem({ question, answer, index }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.06, duration: 0.5 }}
      style={{
        backgroundColor: 'var(--canvas-primary)',
        border: '1px solid var(--border-light)',
        borderRadius: '8px',
        overflow: 'hidden',
        transition: 'box-shadow 0.3s ease'
      }}
      onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 20px rgba(11,54,61,0.04)'}
      onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', padding: '1.25rem 1.5rem',
          background: 'none', border: 'none', cursor: 'pointer',
          textAlign: 'left'
        }}
      >
        <span style={{
          fontFamily: 'var(--font-heading)',
          fontSize: '1rem', fontWeight: 500,
          color: 'var(--text-dark)', paddingRight: '1rem'
        }}>
          {question}
        </span>
        <ChevronRight
          size={16}
          style={{
            color: 'var(--gold-antique)', flexShrink: 0,
            transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
            transition: 'transform 0.3s ease'
          }}
        />
      </button>

      <motion.div
        initial={false}
        animate={{
          height: isOpen ? 'auto' : 0,
          opacity: isOpen ? 1 : 0
        }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        style={{ overflow: 'hidden' }}
      >
        <div style={{
          padding: '0 1.5rem 1.25rem',
          fontFamily: 'var(--font-body)', fontSize: '0.85rem',
          color: 'var(--text-muted)', fontWeight: 300,
          lineHeight: 1.7
        }}>
          {answer}
        </div>
      </motion.div>
    </motion.div>
  );
}
