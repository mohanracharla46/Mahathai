import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, Users, ShieldCheck, HelpCircle, MapPin, ShoppingBag, Truck } from 'lucide-react';
import { createOrder, createReservation } from '../lib/api';

const orderableDishes = [
  {
    id: 'sig-1',
    name: 'Maha Street Pad Thai',
    price: 38,
    description: 'Aromatic wok-fired rice ribbon noodles with egg, pressed tofu, sweet turnip, and crushed peanuts in tamarind reduction.'
  },
  {
    id: 'sig-2',
    name: 'Coconut Shell Seafood (Hor Mok)',
    price: 42,
    description: 'Rich, fragrant red curry soufflé steamed inside a young coconut shell with scallops, calamari, shrimp, and fresh herbs.'
  },
  {
    id: 'sig-3',
    name: 'Northern Khao Soi',
    price: 36,
    description: 'Slow-simmered coconut curry broth with egg noodles, red shallots, and lime, topped with crispy noodles.'
  }
];

const pickupTimeOptions = Array.from({ length: ((21 * 60 + 40) - (11 * 60)) / 10 + 1 }, (_, index) => {
  const totalMinutes = 11 * 60 + index * 10;
  const hour24 = Math.floor(totalMinutes / 60);
  const minute = totalMinutes % 60;
  const value = `${String(hour24).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  const hour12 = hour24 % 12 || 12;
  const suffix = hour24 >= 12 ? 'PM' : 'AM';
  return {
    value,
    label: `${hour12}:${String(minute).padStart(2, '0')} ${suffix}`
  };
});

export default function ReservationSection({ initialTab = 'reservation', currentUser = null }) {
  const [activeTab, setActiveTab] = useState(initialTab);

  // Sync state if initialTab prop changes
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // --- RESERVATION FORM STATE ---
  const [reserveData, setReserveData] = useState({
    name: '',
    email: '',
    phone: '',
    guests: '2',
    date: '',
    time: '19:00',
    notes: ''
  });
  const [isReserveSubmitted, setIsReserveSubmitted] = useState(false);
  const [reserveError, setReserveError] = useState('');

  const handleReserveSubmit = async (e) => {
    e.preventDefault();
    setReserveError('');
    if (reserveData.name && reserveData.email && reserveData.phone && reserveData.date) {
      if (!currentUser?.id) {
        setReserveError('Please register or sign in with a backend customer account before booking.');
        return;
      }

      const booking = {
        id: 'b-' + Date.now(),
        date: new Date(reserveData.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        time: reserveData.time + ' Seating',
        guests: parseInt(reserveData.guests) || 2,
        notes: reserveData.notes || '',
        status: 'Pending',
        customerName: reserveData.name,
        customerEmail: reserveData.email,
        customerPhone: reserveData.phone
      };

      try {
        await createReservation({
          user_id: currentUser.id,
          guest_count: parseInt(reserveData.guests) || 2,
          preferred_date: reserveData.date,
          seating_time: reserveData.time,
          special_notes: reserveData.notes,
          status: 'pending'
        });
      } catch (error) {
        console.error('Failed to sync reservation with backend.', error);
        setReserveError(error.message || 'Reservation could not be saved. Please check Laravel validation.');
        return;
      }

      setIsReserveSubmitted(true);
      // Dispatch custom event to add reservation booking to history
      window.dispatchEvent(new CustomEvent('maha_add_booking', {
        detail: booking
      }));
    }
  };

  const handleReserveReset = () => {
    setReserveData({
      name: currentUser ? currentUser.name : '',
      email: currentUser ? currentUser.email : '',
      phone: currentUser ? currentUser.phone : '',
      guests: '2',
      date: '',
      time: '19:00',
      notes: ''
    });
    setIsReserveSubmitted(false);
  };

  // --- ORDER ONLINE FORM STATE ---
  const [orderServiceType, setOrderServiceType] = useState('delivery'); // 'delivery' or 'pickup'
  const [orderAddress, setOrderAddress] = useState('');
  const [orderSuite, setOrderSuite] = useState('');
  const [orderPickupTime, setOrderPickupTime] = useState('11:00');
  const [orderName, setOrderName] = useState('');
  const [orderEmail, setOrderEmail] = useState('');
  const [orderPhone, setOrderPhone] = useState('');
  const [orderQuantities, setOrderQuantities] = useState({
    'sig-1': 1, // Default with 1 Pad Thai so subtotal is active
    'sig-2': 0,
    'sig-3': 0
  });
  const [isOrderSubmitted, setIsOrderSubmitted] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setReserveData(prev => ({
        ...prev,
        name: prev.name || currentUser.name || '',
        email: prev.email || currentUser.email || '',
        phone: prev.phone || currentUser.phone || ''
      }));
      setOrderName(prev => prev || currentUser.name || '');
      setOrderEmail(prev => prev || currentUser.email || '');
      setOrderPhone(prev => prev || currentUser.phone || '');
    } else {
      setReserveData(prev => ({
        ...prev,
        name: '',
        email: '',
        phone: ''
      }));
      setOrderName('');
      setOrderEmail('');
      setOrderPhone('');
    }
  }, [currentUser]);

  const subtotal = orderableDishes.reduce((acc, dish) => {
    return acc + (orderQuantities[dish.id] || 0) * dish.price;
  }, 0);

  const handleQtyChange = (dishId, delta) => {
    setOrderQuantities(prev => {
      const currentQty = prev[dishId] || 0;
      const newQty = Math.max(0, currentQty + delta);
      return { ...prev, [dishId]: newQty };
    });
  };

  const handleOrderSubmit = async (e) => {
    e.preventDefault();
    if (subtotal === 0) return; // Prevent empty orders
    if (orderName && orderEmail && orderPhone && (orderServiceType === 'pickup' || orderAddress)) {
      const orderItems = orderableDishes
        .filter(d => orderQuantities[d.id] > 0)
        .map(d => `${orderQuantities[d.id]}x ${d.name}`)
        .join(', ');
      const order = {
        id: 'o-' + Date.now(),
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        items: orderItems,
        total: subtotal,
        type: orderServiceType === 'delivery' ? 'Delivery' : 'Pickup',
        status: 'Preparing',
        customerName: orderName,
        customerEmail: orderEmail,
        customerPhone: orderPhone,
        address: orderServiceType === 'delivery' ? orderAddress : 'Pickup'
      };

      try {
        await createOrder({
          user_id: currentUser?.id || null,
          full_name: orderName,
          name: orderName,
          email: orderEmail,
          phone_number: orderPhone,
          phone: orderPhone,
          order_type: orderServiceType,
          service_type: orderServiceType,
          pickup_time: orderServiceType === 'pickup' ? orderPickupTime : null,
          delivery_address: orderServiceType === 'delivery' ? orderAddress : null,
          suite_apt: orderSuite,
          subtotal,
          discount_amount: 0,
          total_amount: subtotal,
          total: subtotal,
          items: orderItems,
          status: 'pending'
        });
      } catch (error) {
        console.error('Failed to sync order with backend.', error);
      }

      setIsOrderSubmitted(true);
      // Dispatch custom event to add online order to history
      window.dispatchEvent(new CustomEvent('maha_add_order', {
        detail: order
      }));
    }
  };

  const handleOrderReset = () => {
    setOrderAddress('');
    setOrderSuite('');
    setOrderPickupTime('11:00');
    setOrderName('');
    setOrderEmail('');
    setOrderPhone('');
    setOrderQuantities({
      'sig-1': 1,
      'sig-2': 0,
      'sig-3': 0
    });
    setIsOrderSubmitted(false);
  };

  return (
    <div 
      id="reservations" 
      className="relative"
      style={{ backgroundColor: 'var(--canvas-primary)' }}
    >
      <div className="relative z-10" style={{ zIndex: 10 }}>
        {/* Modal Unified Tab Switcher */}
        <div className="modal-tabs">
          <button
            type="button"
            className={`modal-tab-btn ${activeTab === 'reservation' ? 'active' : ''}`}
            onClick={() => setActiveTab('reservation')}
          >
            Reservation Table
          </button>
          <button
            type="button"
            className={`modal-tab-btn ${activeTab === 'order' ? 'active' : ''}`}
            onClick={() => setActiveTab('order')}
          >
            Pickup or Delivery
          </button>
        </div>

        <div className="responsive-grid-12" style={{ gap: '2.5rem', alignItems: 'start' }}>
          {/* Left Column: Dynamic Information & Guidelines */}
          <div 
            className="lg-col-span-5 text-left mobile-order-last"
            style={{ textAlign: 'left' }}
          >
            <AnimatePresence mode="wait">
              {activeTab === 'reservation' ? (
                <motion.div
                  key="info-reserve"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.4 }}
                >
                  <span 
                    className="block font-sans text-xs font-bold tracking-[0.3em] uppercase mb-4"
                    style={{ color: 'var(--accent-jade)', display: 'block', fontSize: '0.75rem', letterSpacing: '0.3em', marginBottom: '1rem' }}
                  >
                    Private Bookings
                  </span>
                  <h2 
                    className="font-serif text-4xl md:text-5xl font-light mb-8"
                    style={{ fontSize: 'clamp(2rem, 3.5vw, 3rem)', fontWeight: 300, color: 'var(--text-dark)', marginBottom: '2rem' }}
                  >
                    Secure Your Culinary Journey
                  </h2>
                  <p 
                    className="font-sans text-sm font-light text-muted mb-8 leading-relaxed"
                    style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 300, marginBottom: '2.5rem' }}
                  >
                    To preserve the intimate and contemplative nature of the Maha Thai experience, seating is limited to 12 salon tables per seating window. We highly recommend booking 14 days in advance.
                  </p>

                  {/* Policies Detail List */}
                  <div className="space-y-6" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className="flex gap-4" style={{ display: 'flex', gap: '1rem' }}>
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: 'var(--canvas-secondary)', border: '1px solid var(--border-light)', width: '2.5rem', height: '2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', flexShrink: 0 }}
                      >
                        <ShieldCheck size={18} style={{ color: 'var(--accent-jade)' }} />
                      </div>
                      <div>
                        <h4 className="font-serif text-base font-semibold mb-1" style={{ fontSize: '1rem', color: 'var(--text-dark)', marginBottom: '0.25rem' }}>Dress Code Policy</h4>
                        <p className="font-sans text-xs font-light text-muted" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Smart casual or traditional elevated attire is requested. Shorts, athletic wear, and open-toed shoes for gentlemen are not permitted.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-4" style={{ display: 'flex', gap: '1rem' }}>
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: 'var(--canvas-secondary)', border: '1px solid var(--border-light)', width: '2.5rem', height: '2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', flexShrink: 0 }}
                      >
                        <Clock size={18} style={{ color: 'var(--gold-antique)' }} />
                      </div>
                      <div>
                        <h4 className="font-serif text-base font-semibold mb-1" style={{ fontSize: '1rem', color: 'var(--text-dark)', marginBottom: '0.25rem' }}>Punctuality & Grace</h4>
                        <p className="font-sans text-xs font-light text-muted" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          We extend a 15-minute grace period. Late arrivals may have their serving sequence adjusted to preserve course temperatures.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-4" style={{ display: 'flex', gap: '1rem' }}>
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: 'var(--canvas-secondary)', border: '1px solid var(--border-light)', width: '2.5rem', height: '2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', flexShrink: 0 }}
                      >
                        <HelpCircle size={18} style={{ color: 'var(--text-dark)' }} />
                      </div>
                      <div>
                        <h4 className="font-serif text-base font-semibold mb-1" style={{ fontSize: '1rem', color: 'var(--text-dark)', marginBottom: '0.25rem' }}>Dietary Customizations</h4>
                        <p className="font-sans text-xs font-light text-muted" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Please note vegetarian, vegan, shellfish, or nut allergies in the booking notes. We customize menus accordingly.
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="info-order"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.4 }}
                >
                  <span 
                    className="block font-sans text-xs font-bold tracking-[0.3em] uppercase mb-4"
                    style={{ color: 'var(--accent-jade)', display: 'block', fontSize: '0.75rem', letterSpacing: '0.3em', marginBottom: '1rem' }}
                  >
                    Maha At Home
                  </span>
                  <h2 
                    className="font-serif text-4xl md:text-5xl font-light mb-8"
                    style={{ fontSize: 'clamp(2rem, 3.5vw, 3rem)', fontWeight: 300, color: 'var(--text-dark)', marginBottom: '2rem' }}
                  >
                    Exquisite Flavors, Prepared for You
                  </h2>
                  <p 
                    className="font-sans text-sm font-light text-muted mb-8 leading-relaxed"
                    style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 300, marginBottom: '2.5rem' }}
                  >
                    Savor the rich culinary heritage of Maha Thai from the comfort of your home. Each signature dish is prepared fresh by our chefs and packaged in thermal containers to keep temperatures and textures pristine.
                  </p>

                  {/* Order Policies list */}
                  <div className="space-y-6" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className="flex gap-4" style={{ display: 'flex', gap: '1rem' }}>
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: 'var(--canvas-secondary)', border: '1px solid var(--border-light)', width: '2.5rem', height: '2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', flexShrink: 0 }}
                      >
                        <Truck size={18} style={{ color: 'var(--accent-jade)' }} />
                      </div>
                      <div>
                        <h4 className="font-serif text-base font-semibold mb-1" style={{ fontSize: '1rem', color: 'var(--text-dark)', marginBottom: '0.25rem' }}>Thermal Insulation Box</h4>
                        <p className="font-sans text-xs font-light text-muted" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Your delivery is securely dispatched in specialized, vacuum-sealed container systems that lock in moisture and preserve aromatic components.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-4" style={{ display: 'flex', gap: '1rem' }}>
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: 'var(--canvas-secondary)', border: '1px solid var(--border-light)', width: '2.5rem', height: '2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', flexShrink: 0 }}
                      >
                        <ShoppingBag size={18} style={{ color: 'var(--gold-antique)' }} />
                      </div>
                      <div>
                        <h4 className="font-serif text-base font-semibold mb-1" style={{ fontSize: '1rem', color: 'var(--text-dark)', marginBottom: '0.25rem' }}>Curbside Valet Hand-off</h4>
                        <p className="font-sans text-xs font-light text-muted" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Opt for pickup and our valet coordinators will place your hot order directly in your vehicle upon arrival outside the dining salon.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-4" style={{ display: 'flex', gap: '1rem' }}>
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: 'var(--canvas-secondary)', border: '1px solid var(--border-light)', width: '2.5rem', height: '2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', flexShrink: 0 }}
                      >
                        <MapPin size={18} style={{ color: 'var(--text-dark)' }} />
                      </div>
                      <div>
                        <h4 className="font-serif text-base font-semibold mb-1" style={{ fontSize: '1rem', color: 'var(--text-dark)', marginBottom: '0.25rem' }}>Express Delivery Zone</h4>
                        <p className="font-sans text-xs font-light text-muted" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          We deliver within an 8-mile radius using our dedicated in-house logistics team to ensure maximum speed and quality control.
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right Column: Reservation / Order Form Container */}
          <div className="lg-col-span-7 w-full">
            <AnimatePresence mode="wait">
              {/* --- TAB 1: RESERVATION SYSTEM --- */}
              {activeTab === 'reservation' && (
                <motion.div
                  key="reservation-tab-panel"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -30 }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                >
                  {!isReserveSubmitted ? (
                    <div 
                      className="p-8 md:p-10 border"
                      style={{
                        backgroundColor: 'var(--canvas-secondary)',
                        borderColor: 'var(--border-light)',
                        borderRadius: '12px',
                        boxShadow: 'var(--shadow-premium)'
                      }}
                    >
                      <form onSubmit={handleReserveSubmit} className="space-y-6" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {reserveError && (
                          <div style={{
                            padding: '0.85rem 1rem',
                            border: '1px solid rgba(159, 18, 57, 0.28)',
                            borderRadius: '6px',
                            backgroundColor: 'rgba(159, 18, 57, 0.06)',
                            color: '#9F1239',
                            fontFamily: 'var(--font-sans)',
                            fontSize: '0.78rem',
                            lineHeight: 1.6
                          }}>
                            {reserveError}
                          </div>
                        )}
                        {/* Guest Count Slider/Selector */}
                        <div>
                          <label 
                            className="block font-sans text-[10px] font-bold tracking-widest uppercase text-dark mb-2"
                            style={{ display: 'block', fontSize: '10px', letterSpacing: '0.15em', marginBottom: '0.5rem', color: 'var(--text-dark)' }}
                          >
                            Number of Guests
                          </label>
                          <div 
                            className="grid grid-cols-5 gap-2"
                            style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: '0.5rem' }}
                          >
                            {['1', '2', '4', '6', '8+'].map((count) => (
                              <button
                                key={count}
                                type="button"
                                onClick={() => setReserveData({ ...reserveData, guests: count })}
                                className="py-3 font-sans text-xs font-bold rounded border transition-all duration-300"
                                style={{
                                  backgroundColor: reserveData.guests === count ? 'var(--text-dark)' : 'var(--canvas-primary)',
                                  color: reserveData.guests === count ? 'var(--canvas-primary)' : 'var(--text-dark)',
                                  borderColor: reserveData.guests === count ? 'var(--text-dark)' : 'var(--border-light)',
                                  cursor: 'pointer',
                                  fontSize: '0.75rem'
                                }}
                              >
                                {count}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Date and Time Fields */}
                        <div 
                          className="grid grid-cols-1 md:grid-cols-2 gap-4"
                          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}
                        >
                          <div>
                            <label 
                              className="block font-sans text-[10px] font-bold tracking-widest uppercase text-dark mb-2"
                              style={{ display: 'block', fontSize: '10px', letterSpacing: '0.15em', marginBottom: '0.5rem', color: 'var(--text-dark)' }}
                            >
                              Preferred Date
                            </label>
                            <input
                              type="date"
                              required
                              value={reserveData.date}
                              onChange={(e) => setReserveData({ ...reserveData, date: e.target.value })}
                              className="w-full px-4 py-3 font-sans text-sm bg-white rounded border focus:outline-none transition-all"
                              style={{
                                width: '100%',
                                padding: '0.75rem 1rem',
                                fontFamily: 'var(--font-sans)',
                                fontSize: '0.875rem',
                                backgroundColor: 'white',
                                border: '1px solid var(--border-light)',
                                borderRadius: '4px',
                                outline: 'none'
                              }}
                            />
                          </div>

                          <div>
                            <label 
                              className="block font-sans text-[10px] font-bold tracking-widest uppercase text-dark mb-2"
                              style={{ display: 'block', fontSize: '10px', letterSpacing: '0.15em', marginBottom: '0.5rem', color: 'var(--text-dark)' }}
                            >
                              Seating Time
                            </label>
                            <select
                              value={reserveData.time}
                              onChange={(e) => setReserveData({ ...reserveData, time: e.target.value })}
                              className="w-full px-4 py-3 font-sans text-sm bg-white rounded border focus:outline-none transition-all"
                              style={{
                                width: '100%',
                                padding: '0.75rem 1rem',
                                fontFamily: 'var(--font-sans)',
                                fontSize: '0.875rem',
                                backgroundColor: 'white',
                                border: '1px solid var(--border-light)',
                                borderRadius: '4px',
                                outline: 'none'
                              }}
                            >
                              <option value="17:00">05:00 PM (Sunset Seating)</option>
                              <option value="18:30">06:30 PM (Evening Seating)</option>
                              <option value="19:00">07:00 PM (Prime Dinner)</option>
                              <option value="20:30">08:30 PM (Night Seating)</option>
                              <option value="21:30">09:30 PM (Late Dining)</option>
                            </select>
                          </div>
                        </div>

                        {/* Guest Contact Details */}
                        <div className="space-y-4" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                          <div>
                            <label 
                              className="block font-sans text-[10px] font-bold tracking-widest uppercase text-dark mb-2"
                              style={{ display: 'block', fontSize: '10px', letterSpacing: '0.15em', marginBottom: '0.5rem', color: 'var(--text-dark)' }}
                            >
                              Full Name
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. Alexander Hamilton"
                              value={reserveData.name}
                              onChange={(e) => setReserveData({ ...reserveData, name: e.target.value })}
                              className="w-full px-4 py-3 font-sans text-sm bg-white rounded border focus:outline-none transition-all"
                              style={{
                                width: '100%',
                                padding: '0.75rem 1rem',
                                fontFamily: 'var(--font-sans)',
                                fontSize: '0.875rem',
                                backgroundColor: 'white',
                                border: '1px solid var(--border-light)',
                                borderRadius: '4px',
                                outline: 'none'
                              }}
                            />
                          </div>

                          <div 
                            className="grid grid-cols-1 md:grid-cols-2 gap-4"
                            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}
                          >
                            <div>
                              <label 
                                className="block font-sans text-[10px] font-bold tracking-widest uppercase text-dark mb-2"
                                style={{ display: 'block', fontSize: '10px', letterSpacing: '0.15em', marginBottom: '0.5rem', color: 'var(--text-dark)' }}
                              >
                                Email Address
                              </label>
                              <input
                                type="email"
                                required
                                placeholder="alex@example.com"
                                value={reserveData.email}
                                onChange={(e) => setReserveData({ ...reserveData, email: e.target.value })}
                                className="w-full px-4 py-3 font-sans text-sm bg-white rounded border focus:outline-none transition-all"
                                style={{
                                  width: '100%',
                                  padding: '0.75rem 1rem',
                                  fontFamily: 'var(--font-sans)',
                                  fontSize: '0.875rem',
                                  backgroundColor: 'white',
                                  border: '1px solid var(--border-light)',
                                  borderRadius: '4px',
                                  outline: 'none'
                                }}
                              />
                            </div>

                            <div>
                              <label 
                                className="block font-sans text-[10px] font-bold tracking-widest uppercase text-dark mb-2"
                                style={{ display: 'block', fontSize: '10px', letterSpacing: '0.15em', marginBottom: '0.5rem', color: 'var(--text-dark)' }}
                              >
                                Phone Number
                              </label>
                              <input
                                type="tel"
                                required
                                placeholder="+1 (555) 019-2834"
                                value={reserveData.phone}
                                onChange={(e) => setReserveData({ ...reserveData, phone: e.target.value })}
                                className="w-full px-4 py-3 font-sans text-sm bg-white rounded border focus:outline-none transition-all"
                                style={{
                                  width: '100%',
                                  padding: '0.75rem 1rem',
                                  fontFamily: 'var(--font-sans)',
                                  fontSize: '0.875rem',
                                  backgroundColor: 'white',
                                  border: '1px solid var(--border-light)',
                                  borderRadius: '4px',
                                  outline: 'none'
                                }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Special Requests */}
                        <div>
                          <label 
                            className="block font-sans text-[10px] font-bold tracking-widest uppercase text-dark mb-2"
                            style={{ display: 'block', fontSize: '10px', letterSpacing: '0.15em', marginBottom: '0.5rem', color: 'var(--text-dark)' }}
                          >
                            Special Dietary Requests or Occasion Notes
                          </label>
                          <textarea
                            rows="2"
                            placeholder="Vegetarian diet, celebrating anniversary, allergies, etc."
                            value={reserveData.notes}
                            onChange={(e) => setReserveData({ ...reserveData, notes: e.target.value })}
                            className="w-full px-4 py-3 font-sans text-sm bg-white rounded border focus:outline-none transition-all"
                            style={{
                              width: '100%',
                              padding: '0.75rem 1rem',
                              fontFamily: 'var(--font-sans)',
                              fontSize: '0.875rem',
                              backgroundColor: 'white',
                              border: '1px solid var(--border-light)',
                              borderRadius: '4px',
                              outline: 'none',
                              resize: 'vertical'
                            }}
                          />
                        </div>

                        <button 
                          type="submit" 
                          className="btn-filled w-full justify-center"
                          style={{ width: '100%', display: 'flex', justifyContent: 'center', marginTop: '1rem' }}
                        >
                          Request Reservation
                        </button>
                      </form>
                    </div>
                  ) : (
                    /* Booking Success Screen */
                    <div
                      className="p-10 text-center border flex flex-col items-center justify-center"
                      style={{
                        backgroundColor: 'var(--canvas-secondary)',
                        borderColor: 'var(--gold-antique)',
                        borderRadius: '12px',
                        boxShadow: 'var(--shadow-premium)',
                        minHeight: '420px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textAlign: 'center'
                      }}
                    >
                      <div 
                        className="w-16 h-16 rounded-full flex items-center justify-center mb-6"
                        style={{
                          backgroundColor: 'var(--gold-light)',
                          border: '1px solid var(--gold-antique)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '50%',
                          marginBottom: '1.5rem',
                          color: 'var(--gold-antique)'
                        }}
                      >
                        <ShieldCheck size={32} />
                      </div>

                      <h3 
                        className="font-serif text-3xl font-light mb-4"
                        style={{ fontSize: '2rem', color: 'var(--text-dark)', fontWeight: 300, marginBottom: '1rem' }}
                      >
                        Booking Inquiry Received
                      </h3>

                      <p 
                        className="font-sans text-sm font-light text-muted mb-8 max-w-md leading-relaxed"
                        style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 300, maxWidth: '28rem', marginBottom: '2rem' }}
                      >
                        Thank you, <strong className="font-semibold text-dark">{reserveData.name}</strong>. We have registered your reservation request for <strong className="font-semibold text-dark">{reserveData.guests} guests</strong> on <strong className="font-semibold text-dark">{reserveData.date}</strong> at <strong className="font-semibold text-dark">{reserveData.time}</strong>.
                        An elegant coordinator will contact you at <strong className="font-semibold text-dark">{reserveData.phone}</strong> or email you within 2 hours to confirm table assignment.
                      </p>

                      <button 
                        onClick={handleReserveReset}
                        className="btn-filled"
                        style={{ padding: '0.75rem 2rem', fontSize: '0.75rem' }}
                      >
                        Make Another Booking
                      </button>
                    </div>
                  )}
                </motion.div>
              )}

              {/* --- TAB 2: ORDER ONLINE SYSTEM (PICK UP OR DELIVERY) --- */}
              {activeTab === 'order' && (
                <motion.div
                  key="order-tab-panel"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -30 }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                >
                  {!isOrderSubmitted ? (
                    <div 
                      className="p-8 md:p-10 border"
                      style={{
                        backgroundColor: 'var(--canvas-secondary)',
                        borderColor: 'var(--border-light)',
                        borderRadius: '12px',
                        boxShadow: 'var(--shadow-premium)'
                      }}
                    >
                      <form onSubmit={handleOrderSubmit} className="space-y-6" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        {/* Service Type Capsule Toggle */}
                        <div className="service-toggle-wrapper">
                          <div className="service-toggle">
                            <button
                              type="button"
                              className={`service-btn ${orderServiceType === 'delivery' ? 'active' : ''}`}
                              onClick={() => setOrderServiceType('delivery')}
                            >
                              Delivery
                            </button>
                            <button
                              type="button"
                              className={`service-btn ${orderServiceType === 'pickup' ? 'active' : ''}`}
                              onClick={() => setOrderServiceType('pickup')}
                            >
                              Store Pick Up
                            </button>
                          </div>
                        </div>

                        {/* Service Details (Conditional Rendering) */}
                        <AnimatePresence mode="wait">
                          {orderServiceType === 'delivery' ? (
                            <motion.div
                              key="delivery-fields"
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.3 }}
                              className="space-y-4"
                              style={{ display: 'flex', flexDirection: 'column', gap: '1rem', overflow: 'hidden' }}
                            >
                              <div 
                                className="grid grid-cols-1 md:grid-cols-4 gap-4"
                                style={{ display: 'grid', gridTemplateColumns: 'repeat(12, minmax(0, 1fr))', gap: '1rem' }}
                              >
                                <div style={{ gridColumn: 'span 8' }}>
                                  <label className="block font-sans text-[10px] font-bold tracking-widest uppercase text-dark mb-1" style={{ fontSize: '10px' }}>
                                    Delivery Address
                                  </label>
                                  <input
                                    type="text"
                                    required={orderServiceType === 'delivery'}
                                    placeholder="e.g. 1024 Sukhumvit Rd"
                                    value={orderAddress}
                                    onChange={(e) => setOrderAddress(e.target.value)}
                                    className="w-full px-4 py-3 font-sans text-sm bg-white rounded border focus:outline-none transition-all"
                                    style={{
                                      width: '100%',
                                      padding: '0.75rem 1rem',
                                      fontFamily: 'var(--font-sans)',
                                      fontSize: '0.875rem',
                                      backgroundColor: 'white',
                                      border: '1px solid var(--border-light)',
                                      borderRadius: '4px',
                                      outline: 'none'
                                    }}
                                  />
                                </div>
                                <div style={{ gridColumn: 'span 4' }}>
                                  <label className="block font-sans text-[10px] font-bold tracking-widest uppercase text-dark mb-1" style={{ fontSize: '10px' }}>
                                    Suite/Apt
                                  </label>
                                  <input
                                    type="text"
                                    placeholder="e.g. 4B"
                                    value={orderSuite}
                                    onChange={(e) => setOrderSuite(e.target.value)}
                                    className="w-full px-4 py-3 font-sans text-sm bg-white rounded border focus:outline-none transition-all"
                                    style={{
                                      width: '100%',
                                      padding: '0.75rem 1rem',
                                      fontFamily: 'var(--font-sans)',
                                      fontSize: '0.875rem',
                                      backgroundColor: 'white',
                                      border: '1px solid var(--border-light)',
                                      borderRadius: '4px',
                                      outline: 'none'
                                    }}
                                  />
                                </div>
                              </div>
                            </motion.div>
                          ) : (
                            <motion.div
                              key="pickup-fields"
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.3 }}
                              className="space-y-4"
                              style={{ display: 'flex', flexDirection: 'column', gap: '1rem', overflow: 'hidden' }}
                            >
                              <div>
                                <label className="block font-sans text-[10px] font-bold tracking-widest uppercase text-dark mb-1" style={{ fontSize: '10px' }}>
                                  Preferred Pickup Time
                                </label>
                                <select
                                  value={orderPickupTime}
                                  onChange={(e) => setOrderPickupTime(e.target.value)}
                                  className="w-full px-4 py-3 font-sans text-sm bg-white rounded border focus:outline-none transition-all"
                                  style={{
                                    width: '100%',
                                    padding: '0.75rem 1rem',
                                    fontFamily: 'var(--font-sans)',
                                    fontSize: '0.875rem',
                                    backgroundColor: 'white',
                                    border: '1px solid var(--border-light)',
                                    borderRadius: '4px',
                                    outline: 'none'
                                  }}
                                >
                                
                                  {pickupTimeOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                      {option.label}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Interactive Menu Item Selection */}
                        <div>
                          <label className="block font-sans text-[10px] font-bold tracking-widest uppercase text-dark mb-2" style={{ display: 'block', fontSize: '10px', letterSpacing: '0.15em', marginBottom: '0.5rem', color: 'var(--text-dark)' }}>
                            Select Signature Dishes
                          </label>
                          <div className="order-items-container">
                            {orderableDishes.map((dish) => {
                              const qty = orderQuantities[dish.id] || 0;
                              return (
                                <div key={dish.id} className="order-item-row">
                                  <div className="order-item-info">
                                    <h5 className="order-item-title">{dish.name}</h5>
                                    <span className="order-item-price">${dish.price}</span>
                                  </div>
                                  <div className="qty-controls">
                                    <button
                                      type="button"
                                      onClick={() => handleQtyChange(dish.id, -1)}
                                      className="qty-btn"
                                      aria-label="Decrease quantity"
                                    >
                                      -
                                    </button>
                                    <span className="qty-val">{qty}</span>
                                    <button
                                      type="button"
                                      onClick={() => handleQtyChange(dish.id, 1)}
                                      className="qty-btn"
                                      aria-label="Increase quantity"
                                    >
                                      +
                                    </button>
                                  </div>
                                </div>
                              );
                            })}

                            {/* Subtotal Row */}
                            <div className="order-subtotal-row">
                              <span className="subtotal-label">Subtotal</span>
                              <span className="subtotal-price">${subtotal}.00</span>
                            </div>
                          </div>
                          {subtotal === 0 && (
                            <p style={{ color: '#D97706', fontSize: '11px', textAlign: 'center', marginTop: '-0.5rem', fontStyle: 'italic' }}>
                              *Please select at least 1 dish to submit your order
                            </p>
                          )}
                        </div>

                        {/* Contact Information */}
                        <div className="space-y-4" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                          <div>
                            <label className="block font-sans text-[10px] font-bold tracking-widest uppercase text-dark mb-1" style={{ fontSize: '10px' }}>
                              Your Full Name
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. John Doe"
                              value={orderName}
                              onChange={(e) => setOrderName(e.target.value)}
                              className="w-full px-4 py-3 font-sans text-sm bg-white rounded border focus:outline-none transition-all"
                              style={{
                                width: '100%',
                                padding: '0.75rem 1rem',
                                fontFamily: 'var(--font-sans)',
                                fontSize: '0.875rem',
                                backgroundColor: 'white',
                                border: '1px solid var(--border-light)',
                                borderRadius: '4px',
                                outline: 'none'
                              }}
                            />
                          </div>

                          <div 
                            className="grid grid-cols-1 md:grid-cols-2 gap-4"
                            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}
                          >
                            <div>
                              <label className="block font-sans text-[10px] font-bold tracking-widest uppercase text-dark mb-1" style={{ fontSize: '10px' }}>
                                Email Address
                              </label>
                              <input
                                type="email"
                                required
                                placeholder="john@example.com"
                                value={orderEmail}
                                onChange={(e) => setOrderEmail(e.target.value)}
                                className="w-full px-4 py-3 font-sans text-sm bg-white rounded border focus:outline-none transition-all"
                                style={{
                                  width: '100%',
                                  padding: '0.75rem 1rem',
                                  fontFamily: 'var(--font-sans)',
                                  fontSize: '0.875rem',
                                  backgroundColor: 'white',
                                  border: '1px solid var(--border-light)',
                                  borderRadius: '4px',
                                  outline: 'none'
                                }}
                              />
                            </div>

                            <div>
                              <label className="block font-sans text-[10px] font-bold tracking-widest uppercase text-dark mb-1" style={{ fontSize: '10px' }}>
                                Phone Number
                              </label>
                              <input
                                type="tel"
                                required
                                placeholder="+1 (555) 000-0000"
                                value={orderPhone}
                                onChange={(e) => setOrderPhone(e.target.value)}
                                className="w-full px-4 py-3 font-sans text-sm bg-white rounded border focus:outline-none transition-all"
                                style={{
                                  width: '100%',
                                  padding: '0.75rem 1rem',
                                  fontFamily: 'var(--font-sans)',
                                  fontSize: '0.875rem',
                                  backgroundColor: 'white',
                                  border: '1px solid var(--border-light)',
                                  borderRadius: '4px',
                                  outline: 'none'
                                }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Submit Button */}
                        <button 
                          type="submit" 
                          disabled={subtotal === 0}
                          className="btn-filled w-full justify-center"
                          style={{ 
                            width: '100%', 
                            display: 'flex', 
                            justifyContent: 'center', 
                            marginTop: '1rem',
                            opacity: subtotal === 0 ? 0.4 : 1,
                            cursor: subtotal === 0 ? 'not-allowed' : 'pointer'
                          }}
                        >
                          {orderServiceType === 'delivery' ? 'Place Delivery Order' : 'Place Pickup Order'}
                        </button>
                      </form>
                    </div>
                  ) : (
                    /* Order Success Screen */
                    <div
                      className="p-10 text-center border flex flex-col items-center justify-center"
                      style={{
                        backgroundColor: 'var(--canvas-secondary)',
                        borderColor: 'var(--gold-antique)',
                        borderRadius: '12px',
                        boxShadow: 'var(--shadow-premium)',
                        minHeight: '420px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textAlign: 'center'
                      }}
                    >
                      <div 
                        className="w-16 h-16 rounded-full flex items-center justify-center mb-6"
                        style={{
                          backgroundColor: 'var(--gold-light)',
                          border: '1px solid var(--gold-antique)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '50%',
                          marginBottom: '1.5rem',
                          color: 'var(--gold-antique)'
                        }}
                      >
                        <ShieldCheck size={32} />
                      </div>

                      <h3 
                        className="font-serif text-3xl font-light mb-4"
                        style={{ fontSize: '2rem', color: 'var(--text-dark)', fontWeight: 300, marginBottom: '1rem' }}
                      >
                        Order Received!
                      </h3>

                      <p 
                        className="font-sans text-sm font-light text-muted mb-6 max-w-md leading-relaxed"
                        style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 300, maxWidth: '28rem', marginBottom: '1.5rem' }}
                      >
                        Thank you, <strong className="font-semibold text-dark">{orderName}</strong>. Your order is registered. It is being prepared fresh and will be ready for {orderServiceType === 'delivery' ? 'delivery' : 'pickup'} shortly.
                      </p>

                      {/* Itemized Receipt Summary */}
                      <div className="receipt-box">
                        <div className="receipt-header">Order Summary - #MAHA-8910</div>
                        <div className="receipt-item-row" style={{ fontSize: '11px', marginBottom: '8px', color: 'var(--text-muted)' }}>
                          <span>Type: {orderServiceType === 'delivery' ? `Delivery to ${orderAddress} ${orderSuite}` : `Pick Up at ${orderPickupTime}`}</span>
                        </div>
                        {orderableDishes.map((dish) => {
                          const qty = orderQuantities[dish.id] || 0;
                          if (qty === 0) return null;
                          return (
                            <div key={dish.id} className="receipt-item-row">
                              <span>{qty} x {dish.name}</span>
                              <span>${dish.price * qty}.00</span>
                            </div>
                          );
                        })}
                        <div className="receipt-total-row">
                          <span>Total Paid</span>
                          <span>${subtotal}.00</span>
                        </div>
                      </div>

                      <button 
                        onClick={handleOrderReset}
                        className="btn-filled"
                        style={{ padding: '0.75rem 2rem', fontSize: '0.75rem' }}
                      >
                        Place Another Order
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
