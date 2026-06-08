import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, Phone, Calendar, ShoppingBag, ShieldCheck, LogOut, ArrowLeft, Award, Clock, MessageSquare, Star } from 'lucide-react';
import { createConciergeInquiry, createFeedback, getConciergeInquiries, getOrders, getReservations, updateUser } from '../lib/api';

const formatProfileDate = (value) => {
  if (!value) return 'Date pending';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

const formatProfileTime = (value) => {
  if (!value) return 'Time pending';
  const [hours, minutes] = String(value).split(':');
  if (hours === undefined || minutes === undefined) return value;
  const date = new Date();
  date.setHours(Number(hours), Number(minutes), 0, 0);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit'
  });
};

const formatStatus = (value) => {
  if (!value) return 'Pending';
  return String(value).charAt(0).toUpperCase() + String(value).slice(1).toLowerCase();
};

const getOrderItemSize = (item) => {
  if (item.size?.name) return item.size.name;
  if (item.size_option?.name) return item.size_option.name;
  if (item.order_item_size?.name) return item.order_item_size.name;
  if (item.size_name || item.selected_size) return item.size_name || item.selected_size;
  const match = String(item.special_notes || '').match(/Size:\s*([^|]+)/i);
  return match ? match[1].trim() : '';
};

const formatOrderItemSummary = (item) => {
  const name = item.menu_item?.name || item.menuItem?.name || item.name || 'Menu item';
  const size = getOrderItemSize(item);
  const proteinMatch = String(item.special_notes || '').match(/Protein:\s*([^|]+)/i);
  const protein = item.protein?.name || item.selected_protein || (proteinMatch ? proteinMatch[1].trim() : '');
  const spice = item.spice_level ? `Spice: ${item.spice_level}` : '';
  const addons = Array.isArray(item.addons) && item.addons.length > 0
    ? `Add-ons: ${item.addons.map((addon) => addon.name).join(', ')}`
    : '';
  const details = [spice, protein ? `Protein: ${protein}` : '', addons, size ? `Size: ${size}` : ''].filter(Boolean).join('; ');
  return `${item.quantity || 1}x ${name}${details ? ` [${details}]` : ''}`;
};

const normalizeReservation = (booking) => ({
  id: booking.id,
  date: formatProfileDate(booking.preferred_date || booking.reservation_date || booking.date),
  time: formatProfileTime(booking.seating_time || booking.reservation_time || booking.time),
  guests: booking.guest_count || booking.guests || booking.party_size || 2,
  notes: booking.special_notes || booking.notes || '',
  status: formatStatus(booking.status),
  customerEmail: booking.email || booking.customer_email || booking.user?.email || '',
});

const formatSupportTimestamp = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
};

const getSupportSortTime = (value) => {
  if (!value) return Date.now();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? Date.now() : date.getTime();
};

const sortSupportMessagesByTime = (messages) => [...messages].sort((a, b) => {
  const timeDiff = (a.sortTime || 0) - (b.sortTime || 0);
  if (timeDiff !== 0) return timeDiff;
  return String(a.id || '').localeCompare(String(b.id || ''), undefined, { numeric: true });
});

const normalizeConciergeTicket = (ticket) => {
  const messageTime = ticket.created_at || ticket.timestamp || ticket.updated_at;
  const responseTime = ticket.updated_at || ticket.created_at || ticket.timestamp;
  const timestamp = formatSupportTimestamp(messageTime);
  const messages = [{
    id: `${ticket.id}-message`,
    ticketId: ticket.id,
    sender: 'user',
    text: ticket.message || ticket.inquiry || '',
    status: formatStatus(ticket.status),
    timestamp,
    sortTime: getSupportSortTime(messageTime)
  }];

  if (ticket.response) {
    messages.push({
      id: `${ticket.id}-response`,
      ticketId: ticket.id,
      sender: 'concierge',
      text: ticket.response,
      status: formatStatus(ticket.status),
      timestamp: formatSupportTimestamp(responseTime),
      sortTime: getSupportSortTime(responseTime) + 1
    });
  }

  return messages;
};

const PAGE_SIZE = 5;

function PaginationControls({ page, totalPages, totalItems, onPageChange }) {
  if (totalItems <= PAGE_SIZE) return null;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '1rem',
      padding: '0.85rem 1rem',
      border: '1px solid var(--border-light)',
      borderRadius: '6px',
      backgroundColor: 'var(--canvas-secondary)'
    }}>
      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'var(--font-sans)' }}>
        Showing {(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, totalItems)} of {totalItems}
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <button
          type="button"
          disabled={page === 1}
          onClick={() => onPageChange(page - 1)}
          style={{ padding: '0.45rem 0.75rem', border: '1px solid var(--border-light)', borderRadius: '4px', backgroundColor: 'var(--canvas-primary)', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.45 : 1 }}
        >
          Previous
        </button>
        <span style={{ fontSize: '0.78rem', color: 'var(--text-dark)', minWidth: '4rem', textAlign: 'center' }}>
          {page} / {totalPages}
        </span>
        <button
          type="button"
          disabled={page === totalPages}
          onClick={() => onPageChange(page + 1)}
          style={{ padding: '0.45rem 0.75rem', border: '1px solid var(--border-light)', borderRadius: '4px', backgroundColor: 'var(--canvas-primary)', cursor: page === totalPages ? 'not-allowed' : 'pointer', opacity: page === totalPages ? 0.45 : 1 }}
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default function ProfilePage({ currentUser, onSignOut, onUpdateProfile }) {
  const [activeSubTab, setActiveSubTab] = useState('bookings'); // 'bookings', 'orders', 'support', 'feedback'
  
  // Profile Inline Edit States
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(currentUser ? currentUser.name : '');
  const [editPhone, setEditPhone] = useState(currentUser ? currentUser.phone : '');
  const [profileNotice, setProfileNotice] = useState(null);
  const [freshBookings, setFreshBookings] = useState([]);
  const [freshOrders, setFreshOrders] = useState([]);
  const [bookingsTotalItems, setBookingsTotalItems] = useState(0);
  const [ordersTotalItems, setOrdersTotalItems] = useState(0);
  const [bookingsPage, setBookingsPage] = useState(1);
  const [ordersPage, setOrdersPage] = useState(1);
  const [feedbackPage, setFeedbackPage] = useState(1);

  // Support Concierge states
  const [supportMsg, setSupportMsg] = useState('');
  const [isSendingSupport, setIsSendingSupport] = useState(false);
  const [supportTickets, setSupportTickets] = useState(currentUser?.supportTickets || []);
  const [isLoadingSupportTickets, setIsLoadingSupportTickets] = useState(false);
  const supportChatRef = useRef(null);

  // Culinary Feedback states
  const [feedbackExp, setFeedbackExp] = useState('General Dining Salon');
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [hoverRating, setHoverRating] = useState(0);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  // Keep inputs synced when currentUser changes
  useEffect(() => {
    if (currentUser) {
      setEditName(currentUser.name);
      setEditPhone(currentUser.phone);
    }
  }, [currentUser]);

  useEffect(() => {
    setBookingsPage(1);
    setOrdersPage(1);
    setFeedbackPage(1);
  }, [activeSubTab]);

  useEffect(() => {
    if (!currentUser?.id && !currentUser?.email) return;

    let ignore = false;
    const loadReservations = () => {
      getReservations({
        page: bookingsPage,
        per_page: PAGE_SIZE,
        user_id: currentUser.id || undefined,
        email: currentUser.id ? undefined : currentUser.email
      })
        .then((reservations) => {
          if (ignore) return;
          const rows = reservations.data || reservations;
          const normalized = rows.map(normalizeReservation).slice(0, PAGE_SIZE);
          setFreshBookings(normalized);
          setBookingsTotalItems(reservations.total ?? normalized.length);
          if (normalized.length > 0) {
            onUpdateProfile({ bookings: normalized });
          }
        })
        .catch((error) => {
          console.error('Failed to load profile reservations.', error);
        });
    };

    loadReservations();
    const refreshTimer = window.setInterval(loadReservations, 10000);

    return () => {
      ignore = true;
      window.clearInterval(refreshTimer);
    };
  }, [currentUser?.id, currentUser?.email, bookingsPage]);

  useEffect(() => {
    if (!currentUser?.id && !currentUser?.email) return;

    let ignore = false;
    getOrders({
      page: ordersPage,
      per_page: PAGE_SIZE,
      user_id: currentUser.id || undefined,
      email: currentUser.id ? undefined : currentUser.email
    })
      .then((orders) => {
        if (ignore) return;
        const rows = orders.data || orders;
        const normalized = rows
          .map((order) => ({
            id: order.id,
            date: formatProfileDate(order.created_at || order.date),
            items: order.order_items || (
              order.items?.length
              ? order.items.map(formatOrderItemSummary).join(', ')
              : order.items || 'Order items pending'
            ),
            total: Number(order.total_amount || order.total || 0),
            type: order.service_type === 'pickup' || order.order_type === 'pickup' ? 'Pickup' : 'Delivery',
            status: formatStatus(order.status)
          }))
          .slice(0, PAGE_SIZE);
        setFreshOrders(normalized);
        setOrdersTotalItems(orders.total ?? normalized.length);
      })
      .catch((error) => {
        console.error('Failed to load profile orders.', error);
      });

    return () => {
      ignore = true;
    };
  }, [currentUser?.id, currentUser?.email, ordersPage]);

  const loadSupportTickets = async () => {
    if (!currentUser?.id) return;

    setIsLoadingSupportTickets(true);
    try {
      const inquiries = await getConciergeInquiries({ user_id: currentUser.id });
      const rows = Array.isArray(inquiries?.data) ? inquiries.data : inquiries;
      const normalizedTickets = (Array.isArray(rows) ? rows : [])
        .flatMap(normalizeConciergeTicket);
      const sortedTickets = sortSupportMessagesByTime(normalizedTickets);

      setSupportTickets(sortedTickets);
      onUpdateProfile({
        ...currentUser,
        supportTickets: sortedTickets
      });
    } catch (error) {
      console.error('Failed to load concierge support records.', error);
      setSupportTickets(currentUser.supportTickets || []);
    } finally {
      setIsLoadingSupportTickets(false);
    }
  };

  useEffect(() => {
    if (!currentUser?.id) return;

    loadSupportTickets();
  }, [currentUser?.id]);

  useEffect(() => {
    if (activeSubTab !== 'support' || !supportChatRef.current) return;

    supportChatRef.current.scrollTop = supportChatRef.current.scrollHeight;
  }, [activeSubTab, supportTickets.length, isSendingSupport]);

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil((currentUser?.feedbackReviews?.length || 0) / PAGE_SIZE));
    setFeedbackPage((page) => Math.min(page, totalPages));
  }, [currentUser?.feedbackReviews?.length]);

  if (!currentUser) {
    return (
      <div style={{ backgroundColor: 'var(--canvas-primary)', minHeight: '100vh', paddingTop: '120px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <h3 className="font-serif" style={{ fontSize: '2rem', color: 'var(--text-dark)', marginBottom: '1rem' }}>No Profile Found</h3>
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '2rem' }}>
          Please sign in to view your culinary credentials and dining history.
        </p>
        <a href="#/login" className="hero-cta-btn-gold" style={{ textDecoration: 'none' }}>SIGN IN NOW</a>
      </div>
    );
  }

  const bookingsList = freshBookings.length > 0
    ? freshBookings
    : (currentUser.bookings || []).map((booking) => ({
        ...booking,
        date: formatProfileDate(booking.preferred_date || booking.date),
        time: formatProfileTime(booking.seating_time || booking.time),
        status: formatStatus(booking.status)
      }));
  const ordersList = freshOrders.length > 0 ? freshOrders : (currentUser.orders || []);
  const bookingsTotalCount = bookingsTotalItems || bookingsList.length;
  const ordersTotalCount = ordersTotalItems || ordersList.length;
  const bookingsTotalPages = Math.max(1, Math.ceil(bookingsTotalCount / PAGE_SIZE));
  const ordersTotalPages = Math.max(1, Math.ceil(ordersTotalCount / PAGE_SIZE));
  const visibleBookings = freshBookings.length > 0 ? bookingsList : bookingsList.slice((bookingsPage - 1) * PAGE_SIZE, bookingsPage * PAGE_SIZE);
  const visibleOrders = freshOrders.length > 0 ? ordersList : ordersList.slice((ordersPage - 1) * PAGE_SIZE, ordersPage * PAGE_SIZE);
  const feedbackReviewsList = currentUser.feedbackReviews || [];
  const feedbackTotalCount = feedbackReviewsList.length;
  const feedbackTotalPages = Math.max(1, Math.ceil(feedbackTotalCount / PAGE_SIZE));
  const visibleFeedbackReviews = feedbackReviewsList.slice((feedbackPage - 1) * PAGE_SIZE, feedbackPage * PAGE_SIZE);

  const showProfileNotice = (type, message) => {
    setProfileNotice({ type, message });
    setTimeout(() => setProfileNotice(null), 4000);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (editName && editPhone) {
      if (!currentUser.id) {
        showProfileNotice('error', 'This profile is not linked to a backend user. Please login with a registered account.');
        return;
      }

      try {
        const updatedUser = await updateUser(currentUser.id, {
          full_name: editName,
          phone: editPhone
        });
        onUpdateProfile({
          name: updatedUser.full_name || editName,
          phone: updatedUser.phone || editPhone
        });
        setIsEditing(false);
        showProfileNotice('success', 'Profile updated successfully.');
      } catch (error) {
        showProfileNotice('error', error.message || 'Profile update failed.');
      }
    }
  };

  const handleSendSupport = async (e) => {
    e.preventDefault();
    if (!supportMsg.trim()) return;

    const userMsg = {
      id: 'msg-' + Date.now(),
      sender: 'user',
      text: supportMsg,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      sortTime: Date.now()
    };

    const updatedTickets = sortSupportMessagesByTime([...supportTickets, userMsg]);
    setSupportTickets(updatedTickets);
    
    // Update profile with user message
    onUpdateProfile({
      ...currentUser,
      supportTickets: updatedTickets
    });
    try {
      const savedInquiry = await createConciergeInquiry({
        user_id: currentUser.id || null,
        name: currentUser.name,
        email: currentUser.email,
        phone: currentUser.phone,
        phone_number: currentUser.phone,
        message: supportMsg,
        inquiry: supportMsg,
        status: 'open'
      });
      const savedTickets = normalizeConciergeTicket(savedInquiry);
      const syncedTickets = sortSupportMessagesByTime([
        ...supportTickets.filter((ticket) => ticket.id !== userMsg.id),
        ...savedTickets
      ]);
      setSupportTickets(syncedTickets);
      onUpdateProfile({
        ...currentUser,
        supportTickets: syncedTickets
      });
      showProfileNotice('success', 'Concierge inquiry sent successfully.');
    } catch (error) {
      console.error('Failed to sync concierge inquiry with backend.', error);
      showProfileNotice('error', error.message || 'Concierge inquiry could not be saved.');
    }
    setSupportMsg('');
    setIsSendingSupport(true);

    // Simulate luxury instant response from Siri (Concierge)
    setTimeout(() => {
      const hostMsg = {
        id: 'msg-host-' + Date.now(),
        sender: 'concierge',
        text: `Orchestrating coordinates for your inquiry. A senior court director will reach out to you shortly at ${currentUser.phone} or ${currentUser.email} to finalize your arrangements. Inquiry Code: MAHA-CON-${Math.floor(1000 + Math.random() * 9000)}.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sortTime: Date.now()
      };
      
      const hostTickets = sortSupportMessagesByTime([...updatedTickets, hostMsg]);
      onUpdateProfile({
        ...currentUser,
        supportTickets: hostTickets
      });
      setSupportTickets((tickets) => sortSupportMessagesByTime([...tickets, hostMsg]));
      setIsSendingSupport(false);
    }, 1200);
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (!feedbackComment.trim()) return;

    const newReview = {
      id: 'rev-' + Date.now(),
      experience: feedbackExp,
      rating: feedbackRating,
      comment: feedbackComment,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      customerName: currentUser.name || currentUser.email.split('@')[0],
      customerEmail: currentUser.email
    };

    const updatedReviews = [newReview, ...(currentUser.feedbackReviews || [])];
    setFeedbackPage(1);
    
    onUpdateProfile({
      ...currentUser,
      feedbackReviews: updatedReviews
    });
    try {
      await createFeedback({
        user_id: currentUser.id || null,
        dining_experience: feedbackExp,
        review_notes: feedbackComment,
        name: currentUser.name,
        customer_name: currentUser.name || currentUser.email.split('@')[0],
        email: currentUser.email,
        customer_email: currentUser.email,
        experience: feedbackExp,
        rating: feedbackRating,
        comment: feedbackComment,
        message: feedbackComment
      });
      showProfileNotice('success', 'Feedback submitted successfully.');
    } catch (error) {
      console.error('Failed to sync feedback with backend.', error);
      showProfileNotice('error', error.message || 'Feedback could not be saved.');
    }

    // Save to global feedback registry for the Admin Panel
    const globalFeedback = JSON.parse(localStorage.getItem('maha_global_feedback') || '[]');
    globalFeedback.unshift(newReview);
    localStorage.setItem('maha_global_feedback', JSON.stringify(globalFeedback));
    
    setFeedbackSubmitted(true);
    setFeedbackComment('');
    setFeedbackRating(5);
    
    setTimeout(() => {
      setFeedbackSubmitted(false);
    }, 4000);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1, 
      transition: { staggerChildren: 0.1, delayChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] }
    }
  };

  return (
    <div style={{ 
      backgroundColor: 'var(--canvas-primary)', 
      minHeight: '100vh', 
      paddingTop: '120px',
      paddingBottom: '80px',
      position: 'relative'
    }}>
      {/* Background ambient gold radial glow */}
      <div 
        style={{
          position: 'absolute',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          backgroundColor: 'var(--gold-light)',
          filter: 'blur(130px)',
          pointerEvents: 'none',
          opacity: 0.2,
          top: '-10%',
          left: '10%',
          zIndex: 0
        }}
      />

      <div className="container" style={{ position: 'relative', zIndex: 10 }}>
        {/* Back Link */}
        <div style={{ textAlign: 'left', marginBottom: '2.5rem' }}>
          <a href="#home" style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            color: 'var(--gold-antique)', textDecoration: 'none',
            fontFamily: 'var(--font-sans)', fontSize: '0.75rem',
            letterSpacing: '0.2em', textTransform: 'uppercase',
            transition: 'opacity 0.3s'
          }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.7'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
          >
            <ArrowLeft size={14} />
            Back to Home
          </a>
        </div>

        {/* Page Header */}
        <div style={{ textAlign: 'left', marginBottom: '3.5rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '1.5rem' }}>
          <span 
            className="block font-sans text-xs font-bold tracking-[0.3em] uppercase mb-3"
            style={{ color: 'var(--accent-jade)', display: 'block', fontSize: '0.75rem', letterSpacing: '0.3em' }}
          >
            Dining Member Coordinates
          </span>
          <h1 
            className="font-serif text-4xl md:text-5xl font-light"
            style={{ fontSize: 'clamp(2.2rem, 5vw, 3.5rem)', fontWeight: 300, color: 'var(--text-dark)' }}
          >
            Patron Profile
          </h1>
        </div>

        <motion.div 
          className="responsive-grid-12"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          style={{ gap: '3rem', alignItems: 'start' }}
        >
          {/* Left Column: Profile Card */}
          <motion.div 
            variants={itemVariants} 
            className="lg-col-span-5"
            style={{
              backgroundColor: 'var(--canvas-secondary)',
              border: '1px solid var(--border-light)',
              borderRadius: '12px',
              padding: 'clamp(1.25rem, 5vw, 2.5rem)',
              boxShadow: 'var(--shadow-premium)',
              textAlign: 'center',
              minWidth: 0,
              width: '100%'
            }}
          >
            {/* Avatar Circle with initials */}
            <div style={{ display: 'inline-flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                border: '2px solid var(--gold-antique)',
                backgroundColor: 'var(--gold-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-dark)',
                fontSize: '1.75rem',
                fontWeight: 'bold',
                boxShadow: 'var(--shadow-soft)'
              }}>
                {currentUser.name ? currentUser.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U'}
              </div>
            </div>

            {profileNotice && (
              <div style={{
                padding: '0.75rem 1rem',
                marginBottom: '1.25rem',
                borderRadius: '6px',
                border: profileNotice.type === 'success' ? '1px solid rgba(14,110,86,0.24)' : '1px solid rgba(159,18,57,0.24)',
                backgroundColor: profileNotice.type === 'success' ? 'rgba(14,110,86,0.08)' : 'rgba(159,18,57,0.06)',
                color: profileNotice.type === 'success' ? 'var(--accent-jade)' : '#9F1239',
                fontFamily: 'var(--font-sans)',
                fontSize: '0.78rem',
                lineHeight: 1.5
              }}>
                {profileNotice.message}
              </div>
            )}

            {!isEditing ? (
              <>
                <h3 className="font-serif" style={{ fontSize: '1.5rem', color: 'var(--text-dark)', marginBottom: '0.25rem', fontWeight: 500 }}>
                  {currentUser.name}
                </h3>
                
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', marginBottom: '2rem' }}>
                  <Award size={14} style={{ color: 'var(--gold-antique)' }} />
                  <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--gold-antique)' }}>
                    Maha Fine Patron
                  </span>
                </div>

                {/* Profile Fields */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderTop: '1px solid var(--border-light)', paddingTop: '1.5rem', marginBottom: '2rem', textAlign: 'left' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Mail size={16} style={{ color: 'var(--accent-jade)' }} />
                    <div style={{ overflow: 'hidden' }}>
                      <span style={{ display: 'block', fontSize: '9px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Email Address</span>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-dark)', wordBreak: 'break-all' }}>{currentUser.email}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Phone size={16} style={{ color: 'var(--accent-jade)' }} />
                    <div>
                      <span style={{ display: 'block', fontSize: '9px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Phone Coordinates</span>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-dark)' }}>{currentUser.phone}</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="btn-filled"
                    style={{
                      width: '100%',
                      justifyContent: 'center',
                      backgroundColor: 'transparent',
                      border: '1px solid var(--gold-antique)',
                      color: 'var(--gold-antique)',
                      padding: '0.75rem',
                      fontSize: '0.75rem'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--gold-antique)';
                      e.currentTarget.style.color = '#FFFFFF';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = 'var(--gold-antique)';
                    }}
                  >
                    <User size={14} />
                    Edit Coordinates
                  </button>
                </div>
              </>
            ) : (
              <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', borderTop: '1px solid var(--border-light)', paddingTop: '1.5rem', marginBottom: '2rem', textAlign: 'left' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '9px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 600, letterSpacing: '0.05em' }}>Full Patron Name</label>
                  <input 
                    type="text" 
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                    style={{ width: '100%', padding: '0.6rem 0.8rem', fontSize: '0.85rem', backgroundColor: 'var(--canvas-primary)', border: '1px solid var(--border-light)', borderRadius: '4px', color: 'var(--text-dark)', outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '9px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 600, letterSpacing: '0.05em' }}>Phone Coordinates</label>
                  <input 
                    type="tel" 
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    required
                    style={{ width: '100%', padding: '0.6rem 0.8rem', fontSize: '0.85rem', backgroundColor: 'var(--canvas-primary)', border: '1px solid var(--border-light)', borderRadius: '4px', color: 'var(--text-dark)', outline: 'none' }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button type="button" onClick={() => setIsEditing(false)} className="btn-filled" style={{ flex: 1, backgroundColor: 'transparent', color: 'var(--text-dark)', border: '1px solid var(--border-medium)', padding: '0.6rem', fontSize: '0.75rem', justifyContent: 'center' }}>Cancel</button>
                  <button type="submit" className="btn-filled" style={{ flex: 1, padding: '0.6rem', fontSize: '0.75rem', justifyContent: 'center' }}>Save</button>
                </div>
              </form>
            )}

            <button
              onClick={onSignOut}
              className="btn-filled"
              style={{
                width: '100%',
                justifyContent: 'center',
                backgroundColor: 'transparent',
                border: '1px solid #D97706',
                color: '#D97706',
                padding: '0.75rem',
                fontSize: '0.75rem'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#D97706';
                e.currentTarget.style.color = '#FFFFFF';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#D97706';
              }}
            >
              <LogOut size={14} />
              Sign Out Account
            </button>
          </motion.div>

          {/* Right Column: History and Activity */}
          <motion.div 
            variants={itemVariants} 
            className="lg-col-span-7"
            style={{ minWidth: 0, width: '100%' }}
          >
            {/* Switcher Tab Controls */}
            <div 
              className="profile-tabs-scroll"
              style={{ 
                display: 'flex', 
                gap: '1.5rem', 
                marginBottom: '2rem', 
                borderBottom: '1px solid var(--border-light)', 
                paddingBottom: '0.5rem',
                overflowX: 'auto',
                WebkitOverflowScrolling: 'touch',
                scrollbarWidth: 'none',
                width: '100%',
                maxWidth: '100%'
              }}
            >
              <button
                type="button"
                style={{
                  background: 'none',
                  border: 'none',
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  color: activeSubTab === 'bookings' ? 'var(--text-dark)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  paddingBottom: '0.75rem',
                  position: 'relative',
                  outline: 'none',
                  flexShrink: 0
                }}
                onClick={() => setActiveSubTab('bookings')}
              >
                Reservations
                {activeSubTab === 'bookings' && (
                  <div style={{ position: 'absolute', bottom: '-1px', left: 0, right: 0, height: '2px', backgroundColor: 'var(--gold-antique)' }} />
                )}
              </button>
              
              <button
                type="button"
                style={{
                  background: 'none',
                  border: 'none',
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  color: activeSubTab === 'orders' ? 'var(--text-dark)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  paddingBottom: '0.75rem',
                  position: 'relative',
                  outline: 'none',
                  flexShrink: 0
                }}
                onClick={() => setActiveSubTab('orders')}
              >
                Pickup & Delivery
                {activeSubTab === 'orders' && (
                  <div style={{ position: 'absolute', bottom: '-1px', left: 0, right: 0, height: '2px', backgroundColor: 'var(--gold-antique)' }} />
                )}
              </button>

              <button
                type="button"
                style={{
                  background: 'none',
                  border: 'none',
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  color: activeSubTab === 'support' ? 'var(--text-dark)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  paddingBottom: '0.75rem',
                  position: 'relative',
                  outline: 'none',
                  flexShrink: 0
                }}
                onClick={() => setActiveSubTab('support')}
              >
                Concierge Support
                {activeSubTab === 'support' && (
                  <div style={{ position: 'absolute', bottom: '-1px', left: 0, right: 0, height: '2px', backgroundColor: 'var(--gold-antique)' }} />
                )}
              </button>

              <button
                type="button"
                style={{
                  background: 'none',
                  border: 'none',
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  color: activeSubTab === 'feedback' ? 'var(--text-dark)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  paddingBottom: '0.75rem',
                  position: 'relative',
                  outline: 'none',
                  flexShrink: 0
                }}
                onClick={() => setActiveSubTab('feedback')}
              >
                Culinary Feedback
                {activeSubTab === 'feedback' && (
                  <div style={{ position: 'absolute', bottom: '-1px', left: 0, right: 0, height: '2px', backgroundColor: 'var(--gold-antique)' }} />
                )}
              </button>
            </div>

            {/* List Panel */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* 1. RESERVATIONS TAB */}
              {activeSubTab === 'bookings' && (
                bookingsList.length === 0 ? (
                  <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center', padding: '3rem', backgroundColor: 'var(--canvas-secondary)', border: '1px solid var(--border-light)', borderRadius: '8px' }}>
                    No reservation history coordinates recorded. Request a salon booking to begin your culinary journey.
                  </p>
                ) : (
                  <>
                    {visibleBookings.map((booking) => (
                      <div 
                        key={booking.id}
                        style={{
                          backgroundColor: 'var(--canvas-secondary)',
                          border: '1px solid var(--border-light)',
                          borderRadius: '8px',
                          padding: '1.5rem',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '1rem',
                          textAlign: 'left'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Calendar size={18} style={{ color: 'var(--accent-jade)' }} />
                            <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-dark)' }}>
                              Table Booking
                            </span>
                          </div>
                          <span 
                            style={{ 
                              fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
                              backgroundColor: booking.status === 'Confirmed'
                                ? 'rgba(14, 110, 86, 0.08)'
                                : booking.status === 'Cancelled'
                                  ? 'rgba(159, 18, 57, 0.08)'
                                  : 'var(--gold-light)',
                              color: booking.status === 'Confirmed'
                                ? 'var(--accent-jade)'
                                : booking.status === 'Cancelled'
                                  ? '#9F1239'
                                  : 'var(--gold-antique)',
                              padding: '0.25rem 0.6rem', borderRadius: '4px'
                            }}
                          >
                            {booking.status}
                          </span>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', borderTop: '1px solid rgba(11, 54, 61, 0.06)', paddingTop: '1rem' }}>
                          <div>
                            <span style={{ display: 'block', fontSize: '9px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.15rem' }}>Date & Seating</span>
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-dark)', fontWeight: 500 }}>{booking.date} at {booking.time}</span>
                          </div>
                          <div>
                            <span style={{ display: 'block', fontSize: '9px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.15rem' }}>Patron Headcount</span>
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-dark)', fontWeight: 500 }}>{booking.guests} Guests</span>
                          </div>
                        </div>

                        {booking.notes && (
                          <div style={{ borderTop: '1px solid rgba(11, 54, 61, 0.04)', paddingTop: '0.75rem' }}>
                            <span style={{ display: 'block', fontSize: '9px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.15rem' }}>Dietary & Seating Requests</span>
                            <p style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>"{booking.notes}"</p>
                          </div>
                        )}
                      </div>
                    ))}
                    <PaginationControls page={bookingsPage} totalPages={bookingsTotalPages} totalItems={bookingsTotalCount} onPageChange={setBookingsPage} />
                  </>
                )
              )}

              {/* 2. AT-HOME ORDERS TAB */}
              {activeSubTab === 'orders' && (
                ordersList.length === 0 ? (
                  <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center', padding: '3rem', backgroundColor: 'var(--canvas-secondary)', border: '1px solid var(--border-light)', borderRadius: '8px' }}>
                    No delivery or pickup history recorded. Explore our menu to place your selection.
                  </p>
                ) : (
                  <>
                  {visibleOrders.map((order) => (
                    <div 
                      key={order.id}
                      style={{
                        backgroundColor: 'var(--canvas-secondary)',
                        border: '1px solid var(--border-light)',
                        borderRadius: '8px',
                        padding: '1.5rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1rem',
                        textAlign: 'left'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <ShoppingBag size={18} style={{ color: 'var(--gold-antique)' }} />
                          <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-dark)' }}>
                            {order.type === 'Delivery' ? 'Delivery Order' : 'Pickup Order'}
                          </span>
                        </div>
                        <span 
                          style={{ 
                            fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
                            backgroundColor: 'rgba(204, 164, 83, 0.08)', color: 'var(--gold-antique)',
                            padding: '0.25rem 0.6rem', borderRadius: '4px'
                          }}
                        >
                          {order.status}
                        </span>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', borderTop: '1px solid rgba(11, 54, 61, 0.06)', paddingTop: '1rem' }}>
                        <div>
                          <span style={{ display: 'block', fontSize: '9px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.15rem' }}>Items Ordered</span>
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-dark)', fontWeight: 500 }}>{order.items}</span>
                        </div>
                        <div>
                          <span style={{ display: 'block', fontSize: '9px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.15rem' }}>Total Cost</span>
                          <span style={{ fontSize: '0.85rem', color: 'var(--gold-antique)', fontWeight: 600 }}>${order.total}.00</span>
                        </div>
                      </div>

                      <div style={{ borderTop: '1px solid rgba(11, 54, 61, 0.04)', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <span style={{ display: 'block', fontSize: '9px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.15rem' }}>Service Type</span>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-dark)' }}>{order.type}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          <Clock size={12} />
                          Ordered on {order.date}
                        </div>
                      </div>
                    </div>
                  ))}
                  <PaginationControls page={ordersPage} totalPages={ordersTotalPages} totalItems={ordersTotalCount} onPageChange={setOrdersPage} />
                  </>
                )
              )}

              {/* 3. CONCIERGE & SUPPORT TAB */}
              {activeSubTab === 'support' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div 
                    style={{
                      backgroundColor: 'var(--canvas-secondary)',
                      border: '1px solid var(--border-light)',
                      borderRadius: '8px',
                      padding: '1.5rem',
                      textAlign: 'left'
                    }}
                  >
                    <div style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                      <h4 className="font-serif" style={{ fontSize: '1.25rem', color: 'var(--text-dark)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <MessageSquare size={18} style={{ color: 'var(--gold-antique)' }} />
                        Grand Palace Concierge
                      </h4>
                      <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>
                        Direct coordinate link for valet scheduling, event blueprints, or table bespoke requests.
                      </p>
                    </div>

                    {/* Chat log */}
                    <div 
                      ref={supportChatRef}
                      style={{
                        minHeight: '260px',
                        maxHeight: '340px',
                        overflowY: 'auto',
                        border: '1px solid var(--border-light)',
                        borderRadius: '6px',
                        backgroundColor: 'var(--canvas-primary)',
                        padding: '1rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1rem',
                        marginBottom: '1.5rem'
                      }}
                    >
                      {/* Default Concierge Welcome Message */}
                      <div style={{ alignSelf: 'flex-start', maxWidth: '85%', backgroundColor: 'var(--canvas-secondary)', border: '1px solid var(--border-light)', padding: '0.75rem 1rem', borderRadius: '12px 12px 12px 0', fontSize: '0.85rem', color: 'var(--text-dark)', lineHeight: '1.5' }}>
                        <p style={{ margin: 0, fontStyle: 'italic', fontFamily: 'var(--font-serif)', color: 'var(--gold-antique)', fontSize: '0.7rem', textTransform: 'uppercase', tracking: '0.1em', fontWeight: 600, marginBottom: '0.25rem' }}>
                          Siri (Royal Host)
                        </p>
                        Greetings, Noble Patron. I am Siri, your dedicated Palace Concierge. How may I orchestrate your next fine dining journey today?
                      </div>

                      {/* Dynamic messages */}
                      {isLoadingSupportTickets && (
                        <div style={{ alignSelf: 'center', color: 'var(--text-muted)', fontSize: '0.75rem', fontStyle: 'italic' }}>
                          Loading concierge records...
                        </div>
                      )}

                      {supportTickets.map((msg) => (
                        <div 
                          key={msg.id}
                          style={{
                            alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                            maxWidth: '85%',
                            backgroundColor: msg.sender === 'user' ? 'rgba(204, 164, 83, 0.08)' : 'var(--canvas-secondary)',
                            border: msg.sender === 'user' ? '1px solid var(--gold-antique)' : '1px solid var(--border-light)',
                            padding: '0.75rem 1rem',
                            borderRadius: msg.sender === 'user' ? '12px 12px 0 12px' : '12px 12px 12px 0',
                            fontSize: '0.85rem',
                            color: 'var(--text-dark)',
                            lineHeight: '1.5',
                            textAlign: 'left'
                          }}
                        >
                          <p style={{ margin: 0, fontStyle: 'italic', fontFamily: 'var(--font-serif)', color: msg.sender === 'user' ? 'var(--text-dark)' : 'var(--gold-antique)', fontSize: '0.7rem', textTransform: 'uppercase', tracking: '0.1em', fontWeight: 600, marginBottom: '0.25rem' }}>
                            {msg.sender === 'user' ? 'You (Patron)' : 'Siri (Royal Host)'}
                          </p>
                          {msg.text}
                          <span style={{ display: 'block', fontSize: '8px', color: 'var(--text-muted)', textAlign: 'right', marginTop: '0.25rem' }}>
                            {msg.timestamp}
                          </span>
                        </div>
                      ))}

                      {isSendingSupport && (
                        <div style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                          <span style={{ display: 'inline-block', width: '6px', height: '6px', backgroundColor: 'var(--gold-antique)', borderRadius: '50%', animation: 'bounce 0.6s infinite alternate' }} />
                          <span style={{ display: 'inline-block', width: '6px', height: '6px', backgroundColor: 'var(--gold-antique)', borderRadius: '50%', animation: 'bounce 0.6s infinite alternate 0.2s' }} />
                          <span style={{ display: 'inline-block', width: '6px', height: '6px', backgroundColor: 'var(--gold-antique)', borderRadius: '50%', animation: 'bounce 0.6s infinite alternate 0.4s' }} />
                          <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.7rem', fontStyle: 'italic' }}>Concierge is typing...</span>
                        </div>
                      )}
                    </div>

                    {/* Chat Input form */}
                    <form onSubmit={handleSendSupport} style={{ display: 'flex', gap: '0.75rem' }}>
                      <input 
                        type="text"
                        placeholder="Inquire about valet, request table adjustments, or bespoke requests..."
                        value={supportMsg}
                        onChange={(e) => setSupportMsg(e.target.value)}
                        style={{
                          flexGrow: 1,
                          padding: '0.75rem 1rem',
                          fontFamily: 'var(--font-sans)',
                          fontSize: '0.85rem',
                          backgroundColor: 'var(--canvas-primary)',
                          border: '1px solid var(--border-light)',
                          borderRadius: '4px',
                          outline: 'none',
                          color: 'var(--text-dark)'
                        }}
                      />
                      <button 
                        type="submit"
                        className="btn-filled"
                        style={{ padding: '0.75rem 1.5rem', fontSize: '0.75rem' }}
                      >
                        Send Inquiry
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {/* 4. CULINARY FEEDBACK TAB */}
              {activeSubTab === 'feedback' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', textAlign: 'left' }}>
                  <div 
                    style={{
                      backgroundColor: 'var(--canvas-secondary)',
                      border: '1px solid var(--border-light)',
                      borderRadius: '8px',
                      padding: '2rem'
                    }}
                  >
                    <div style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                      <h4 className="font-serif" style={{ fontSize: '1.25rem', color: 'var(--text-dark)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Star size={18} style={{ color: 'var(--gold-antique)' }} />
                        Culinary Feedback Board
                      </h4>
                      <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>
                        Rate your recent flavor voyages to aid our culinary master team in maintaining absolute refinement.
                      </p>
                    </div>

                    <form onSubmit={handleFeedbackSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                      {/* Experience Selector */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '10px', textTransform: 'uppercase', fontWeight: 'bold', tracking: '0.1em', color: 'var(--text-dark)', marginBottom: '0.5rem' }}>
                            Dining Experience
                          </label>
                          <select
                            value={feedbackExp}
                            onChange={(e) => setFeedbackExp(e.target.value)}
                            style={{
                              width: '100%',
                              padding: '0.6rem',
                              fontFamily: 'var(--font-sans)',
                              fontSize: '0.85rem',
                              backgroundColor: 'var(--canvas-primary)',
                              border: '1px solid var(--border-light)',
                              borderRadius: '4px',
                              color: 'var(--text-dark)',
                              outline: 'none'
                            }}
                          >
                            <option value="General Dining Salon">General Dining Salon</option>
                            {bookingsList.map((b, i) => (
                              <option key={b.id || i} value={`Table Booking - ${b.date}`}>Table Booking ({b.date})</option>
                            ))}
                            {ordersList.map((o, i) => (
                              <option key={o.id || i} value={`Online Order - ${o.date}`}>Online Order ({o.date})</option>
                            ))}
                            <option value="Valet & Arrival Services">Valet & Arrival Services</option>
                          </select>
                        </div>

                        {/* Gold Star emblem rate */}
                        <div>
                          <label style={{ display: 'block', fontSize: '10px', textTransform: 'uppercase', fontWeight: 'bold', tracking: '0.1em', color: 'var(--text-dark)', marginBottom: '0.5rem' }}>
                            Refinement Rating
                          </label>
                          <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center', height: '36px' }}>
                            {[1, 2, 3, 4, 5].map((star) => {
                              const isFilled = star <= (hoverRating || feedbackRating);
                              return (
                                <button
                                  key={star}
                                  type="button"
                                  onClick={() => setFeedbackRating(star)}
                                  onMouseEnter={() => setHoverRating(star)}
                                  onMouseLeave={() => setHoverRating(0)}
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    padding: '0.2rem',
                                    color: isFilled ? 'var(--gold-antique)' : 'rgba(11, 54, 61, 0.15)',
                                    transition: 'color 0.2s ease, transform 0.1s'
                                  }}
                                  onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.85)'}
                                  onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                >
                                  <Star size={20} fill={isFilled ? 'var(--gold-antique)' : 'none'} strokeWidth={1.5} />
                                </button>
                              );
                            })}
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '0.5rem', fontWeight: 600 }}>
                              ({feedbackRating} / 5 Stars)
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Comments Text Area */}
                      <div>
                        <label style={{ display: 'block', fontSize: '10px', textTransform: 'uppercase', fontWeight: 'bold', tracking: '0.1em', color: 'var(--text-dark)', marginBottom: '0.5rem' }}>
                          Culinary Reviews & Notes
                        </label>
                        <textarea
                          rows="3"
                          required
                          placeholder="Rate the aromas, service attentiveness, or specific ingredient nuances..."
                          value={feedbackComment}
                          onChange={(e) => setFeedbackComment(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '0.75rem 1rem',
                            fontFamily: 'var(--font-sans)',
                            fontSize: '0.85rem',
                            backgroundColor: 'var(--canvas-primary)',
                            border: '1px solid var(--border-light)',
                            borderRadius: '4px',
                            color: 'var(--text-dark)',
                            outline: 'none',
                            resize: 'vertical'
                          }}
                        />
                      </div>

                      <button
                        type="submit"
                        className="btn-filled"
                        style={{ padding: '0.75rem 2rem', fontSize: '0.75rem', alignSelf: 'flex-start' }}
                      >
                        Submit Culinary Notes
                      </button>

                      <AnimatePresence>
                        {feedbackSubmitted && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            style={{
                              backgroundColor: 'rgba(14, 110, 86, 0.08)',
                              border: '1px solid var(--accent-jade)',
                              borderRadius: '6px',
                              padding: '0.75rem 1rem',
                              color: 'var(--accent-jade)',
                              fontSize: '0.8rem',
                              fontWeight: 500
                            }}
                          >
                            Your culinary coordinates have been logged. The master culinary team bows in gratitude for your refined notes.
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </form>
                  </div>

                  {/* Render Feedback History */}
                  <div>
                    <h4 className="font-serif" style={{ fontSize: '1.25rem', color: 'var(--text-dark)', marginBottom: '1rem' }}>
                      Your Refined Notes
                    </h4>
                    
                    {feedbackReviewsList.length === 0 ? (
                      <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        No feedback coordinates recorded yet.
                      </p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {visibleFeedbackReviews.map((rev) => (
                          <div 
                            key={rev.id}
                            style={{
                              backgroundColor: 'var(--canvas-secondary)',
                              border: '1px solid var(--border-light)',
                              borderRadius: '8px',
                              padding: '1.25rem',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '0.5rem'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--gold-antique)', tracking: '0.05em' }}>
                                {rev.experience}
                              </span>
                              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                                {rev.date}
                              </span>
                            </div>

                            <div style={{ display: 'flex', gap: '0.2rem', color: 'var(--gold-antique)' }}>
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star 
                                  key={star} 
                                  size={12} 
                                  fill={star <= rev.rating ? 'var(--gold-antique)' : 'none'} 
                                  color="var(--gold-antique)"
                                />
                              ))}
                            </div>

                            <p style={{ margin: 0, fontFamily: 'var(--font-serif)', fontSize: '0.85rem', color: 'var(--text-dark)', fontStyle: 'italic', lineHeight: '1.5' }}>
                              "{rev.comment}"
                            </p>
                          </div>
                        ))}
                        <PaginationControls page={feedbackPage} totalPages={feedbackTotalPages} totalItems={feedbackTotalCount} onPageChange={setFeedbackPage} />
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
