import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingBag } from 'lucide-react';
import Header from './components/Header';
import Hero from './components/Hero';
import PhilosophySection from './components/PhilosophySection';
import AboutUsPage from './components/AboutUsPage';
import EventsPage from './components/EventsPage';
import CateringPage from './components/CateringPage';
import LunchMenuPage from './components/LunchMenuPage';
import DinnerMenuPage from './components/DinnerMenuPage';
import VegetarianMenuPage from './components/VegetarianMenuPage';
import ContactPage from './components/ContactPage';
import CareersPage from './components/CareersPage';
import MenuSection from './components/MenuSection';
import ReservationSection from './components/ReservationSection';
import Footer from './components/Footer';
import AuthPage from './components/AuthPage';
import ProfilePage from './components/ProfilePage';
import RewardsPage from './components/RewardsPage';
import MenuPage from './components/MenuPage';
import AdminPage from './components/AdminPage';
import logoImg from './assets/mahathailogo_v2.png';
import { getOrders, getPromoCodes, getReservations, isAdminUser } from './lib/api';
import { createOrderWithItemsAndAddons } from './lib/orderService';
import { getOrderItemLines } from './lib/orderItems';

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

const formatCartItemDetails = (item) => {
  const customization = item.customization || item.customizations;
  if (!customization) return item.name;

  const details = [];
  if (customization.spice) details.push(`Spice: ${customization.spice}`);
  if (Array.isArray(customization.addons) && customization.addons.length > 0) {
    details.push(`Add-ons: ${customization.addons.map((addon) => addon.name).join(', ')}`);
  }
  if (customization.size?.name) details.push(`Size: ${customization.size.name}`);
  if (customization.requirements) details.push(`Notes: ${customization.requirements}`);

  return details.length ? `${item.name} [${details.join('; ')}]` : item.name;
};


export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [currentHash, setCurrentHash] = useState(window.location.hash);
  const [isReservationOpen, setIsReservationOpen] = useState(false);
  const [reservationTab, setReservationTab] = useState('reservation');
  const [cart, setCart] = useState({});
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [currentUser, setCurrentUser] = useState(() => {
    const activeEmail = localStorage.getItem('maha_active_user');
    if (activeEmail) {
      const savedData = localStorage.getItem(`maha_user_${activeEmail}`);
      if (savedData) return JSON.parse(savedData);
    }
    return null;
  });

  const handleLoginSuccess = async (profile) => {
    const storageKey = `maha_user_${profile.email}`;
    const savedData = localStorage.getItem(storageKey);
    let loadedUser;
    if (savedData) {
      const parsed = JSON.parse(savedData);
      loadedUser = {
        name: profile.name || parsed.name || profile.email.split('@')[0],
        id: profile.id || parsed.id,
        email: profile.email,
        phone: parsed.phone || profile.phone || '+1 (555) 019-2834',
        role: profile.role || parsed.role || 'customer',
        isAdmin: isAdminUser(profile) || parsed.isAdmin || false,
        bookings: parsed.bookings || [
          {
            id: 'mock-b1',
            date: 'May 30, 2026',
            time: '19:00 Seating Seating',
            guests: 4,
            notes: 'No gluten, celebrating promotion.',
            status: 'Confirmed'
          }
        ],
        orders: parsed.orders || [
          {
            id: 'mock-o1',
            date: 'May 24, 2026',
            items: '1x Royal Massaman Wagyu, 1x Lemongrass Lobster Soup',
            total: 82,
            type: 'Delivery',
            status: 'Delivered'
          }
        ],
        supportTickets: parsed.supportTickets || [],
        feedbackReviews: parsed.feedbackReviews || []
      };
    } else {
      loadedUser = {
        name: profile.name || profile.email.split('@')[0],
        id: profile.id,
        email: profile.email,
        phone: profile.phone || '+1 (555) 019-2834',
        role: profile.role || 'customer',
        isAdmin: isAdminUser(profile),
        bookings: [
          {
            id: 'mock-b1',
            date: 'May 30, 2026',
            time: '19:00 Seating Seating',
            guests: 4,
            notes: 'No gluten, celebrating promotion.',
            status: 'Confirmed'
          }
        ],
        orders: [
          {
            id: 'mock-o1',
            date: 'May 24, 2026',
            items: '1x Royal Massaman Wagyu, 1x Lemongrass Lobster Soup',
            total: 82,
            type: 'Delivery',
            status: 'Delivered'
          }
        ],
        supportTickets: [],
        feedbackReviews: []
      };
    }
    try {
      const [apiOrders, apiReservations] = await Promise.all([
        getOrders({ user_id: loadedUser.id || undefined, email: loadedUser.id ? undefined : loadedUser.email, per_page: 10 }).catch(() => ({ data: [] })),
        getReservations({ user_id: loadedUser.id || undefined, email: loadedUser.id ? undefined : loadedUser.email, per_page: 10 }).catch(() => ({ data: [] }))
      ]);
      const ownOrders = (apiOrders.data || apiOrders)
        .map((order) => ({
          id: order.id || `o-${Date.now()}`,
          date: order.created_at ? new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          itemLines: getOrderItemLines(order, 'Online order'),
          items: getOrderItemLines(order, 'Online order').join(' | '),
          total: Number(order.total_amount || order.total || 0),
          type: order.service_type || order.order_type || 'Delivery',
          status: order.status || 'Pending'
        }));
      const ownBookings = (apiReservations.data || apiReservations)
        .map((booking) => ({
          id: booking.id || `b-${Date.now()}`,
          date: booking.preferred_date || booking.reservation_date || booking.date || '',
          time: booking.seating_time || booking.reservation_time || booking.time || '',
          guests: booking.guest_count || booking.guests || booking.party_size || 2,
          notes: booking.special_notes || booking.notes || '',
          status: booking.status ? booking.status.charAt(0).toUpperCase() + booking.status.slice(1) : 'Pending'
        }));
      loadedUser = {
        ...loadedUser,
        orders: ownOrders.length ? ownOrders : loadedUser.orders,
        bookings: ownBookings.length ? ownBookings : loadedUser.bookings
      };
    } catch (error) {
      console.error('Failed to load customer history from backend.', error);
    }
    setCurrentUser(loadedUser);
    localStorage.setItem(storageKey, JSON.stringify(loadedUser));
    localStorage.setItem('maha_active_user', loadedUser.email);
  };

  const handleSignOut = () => {
    setCurrentUser(null);
    localStorage.removeItem('maha_active_user');
  };

  const handleUpdateProfile = (updatedDetails) => {
    if (currentUser) {
      const updated = {
        ...currentUser,
        name: updatedDetails.name || currentUser.name,
        phone: updatedDetails.phone || currentUser.phone,
        bookings: updatedDetails.bookings || currentUser.bookings,
        orders: updatedDetails.orders || currentUser.orders,
        supportTickets: updatedDetails.supportTickets || currentUser.supportTickets,
        feedbackReviews: updatedDetails.feedbackReviews || currentUser.feedbackReviews,
        redeemedPoints: updatedDetails.redeemedPoints ?? currentUser.redeemedPoints
      };
      setCurrentUser(updated);
      localStorage.setItem(`maha_user_${currentUser.email}`, JSON.stringify(updated));
    }
  };

  // Listen to custom booking and order events to sync history
  useEffect(() => {
    const handleAddBooking = (e) => {
      const newBooking = e.detail;
      if (currentUser) {
        const updated = {
          ...currentUser,
          bookings: [newBooking, ...currentUser.bookings]
        };
        setCurrentUser(updated);
        localStorage.setItem(`maha_user_${currentUser.email}`, JSON.stringify(updated));
      }
      // Store in global list for admin panel
      const globalBookings = JSON.parse(localStorage.getItem('maha_global_bookings') || '[]');
      globalBookings.unshift(newBooking);
      localStorage.setItem('maha_global_bookings', JSON.stringify(globalBookings));
    };

    const handleAddOrder = (e) => {
      const newOrder = e.detail;
      if (currentUser) {
        const updated = {
          ...currentUser,
          orders: [newOrder, ...currentUser.orders]
        };
        setCurrentUser(updated);
        localStorage.setItem(`maha_user_${currentUser.email}`, JSON.stringify(updated));
      }
      // Store in global list for admin panel
      const globalOrders = JSON.parse(localStorage.getItem('maha_global_orders') || '[]');
      globalOrders.unshift(newOrder);
      localStorage.setItem('maha_global_orders', JSON.stringify(globalOrders));
    };

    window.addEventListener('maha_add_booking', handleAddBooking);
    window.addEventListener('maha_add_order', handleAddOrder);
    return () => {
      window.removeEventListener('maha_add_booking', handleAddBooking);
      window.removeEventListener('maha_add_order', handleAddOrder);
    };
  }, [currentUser]);
  const [cartCheckoutData, setCartCheckoutData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    pickupTime: '11:00',
    serviceType: 'delivery'
  });
  const [isCartCheckedOut, setIsCartCheckedOut] = useState(false);
  const [isCartCheckoutFormOpen, setIsCartCheckoutFormOpen] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');
  const [isCheckoutSubmitting, setIsCheckoutSubmitting] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setCartCheckoutData((prev) => ({
        ...prev,
        name: currentUser.name || '',
        email: currentUser.email || '',
        phone: currentUser.phone || ''
      }));
    } else {
      setCartCheckoutData((prev) => ({
        ...prev,
        name: '',
        email: '',
        phone: ''
      }));
    }
  }, [currentUser]);

  const addToCart = (item) => {
    setIsCartCheckedOut(false);
    setIsCartCheckoutFormOpen(false);
    setCart((prevCart) => {
      const existing = prevCart[item.id];
      if (existing) {
        return {
          ...prevCart,
          [item.id]: { ...existing, quantity: existing.quantity + 1 }
        };
      }
      return {
        ...prevCart,
        [item.id]: { ...item, quantity: 1 }
      };
    });
  };

  const removeFromCart = (itemId) => {
    setCart((prevCart) => {
      const existing = prevCart[itemId];
      if (!existing) return prevCart;
      if (existing.quantity <= 1) {
        const newCart = { ...prevCart };
        delete newCart[itemId];
        return newCart;
      }
      return {
        ...prevCart,
        [itemId]: { ...existing, quantity: existing.quantity - 1 }
      };
    });
  };

  const clearCart = () => {
    setCart({});
    setIsCartCheckedOut(false);
    setIsCartCheckoutFormOpen(false);
    setCouponCode('');
    setCouponDiscount(0);
    setAppliedCoupon(null);
    setCouponError('');
  };

  const getCartCount = () => {
    return Object.values(cart).reduce((total, item) => total + item.quantity, 0);
  };

  const getCartTotal = () => {
    return Object.values(cart).reduce((total, item) => total + item.quantity * item.price, 0);
  };

  const getCartFinalTotal = () => {
    const subtotal = getCartTotal();
    return Math.max(0, subtotal - couponDiscount);
  };

  const normalizePromoCode = (promoCode) => ({
    id: promoCode.id,
    code: promoCode.code,
    type: promoCode.discount_type === 'fixed' ? 'flat' : promoCode.discount_type,
    value: Number(promoCode.discount_value || 0),
    minOrder: Number(promoCode.minimum_order_amount || 0),
    expiryDate: promoCode.end_date ? promoCode.end_date.slice(0, 10) : '',
    status: promoCode.is_active ? 'Active' : 'Inactive'
  });

  const handleApplyCoupon = async () => {
    setCouponError('');
    setCouponDiscount(0);
    setAppliedCoupon(null);

    if (!couponCode) return;

    let couponsList = [];
    const savedCoupons = JSON.parse(localStorage.getItem('maha_global_coupons') || '[]');
    const baselineCoupons = [
      { id: 'c-mock1', code: 'WELCOME10', type: 'percentage', value: 10, minOrder: 30, status: 'Active' },
      { id: 'c-mock2', code: 'MAHAFEAST', type: 'flat', value: 15, minOrder: 80, status: 'Active' }
    ];

    try {
      const apiCoupons = (await getPromoCodes()).map(normalizePromoCode);
      const mergedCoupons = [...apiCoupons];

      savedCoupons.forEach((savedCoupon) => {
        const exists = mergedCoupons.some((coupon) => (
          String(coupon.code || '').toUpperCase() === String(savedCoupon.code || '').toUpperCase()
        ));
        if (!exists) {
          mergedCoupons.push(savedCoupon);
        }
      });

      couponsList = mergedCoupons.length > 0 ? mergedCoupons : baselineCoupons;
      localStorage.setItem('maha_global_coupons', JSON.stringify(couponsList));
    } catch (error) {
      couponsList = savedCoupons.length > 0 ? savedCoupons : baselineCoupons;
    }

    const match = couponsList.find(c => c.code.toUpperCase() === couponCode.toUpperCase().trim());

    if (!match) {
      setCouponError('Invalid coupon code.');
      return;
    }

    if (match.status !== 'Active') {
      setCouponError('This coupon is no longer active.');
      return;
    }

    const subtotal = getCartTotal();
    if (subtotal < match.minOrder) {
      setCouponError(`Min order of $${match.minOrder} required.`);
      return;
    }

    let discount = 0;
    if (match.type === 'percentage') {
      discount = Math.round((subtotal * match.value) / 100);
    } else {
      discount = match.value;
    }

    setCouponDiscount(discount);
    setAppliedCoupon(match);
  };

  const openReservation = (tab = 'reservation') => {
    setReservationTab(tab);
    setIsReservationOpen(true);
  };

  useEffect(() => {
    // Premium loading delay
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleHashChange = () => {
      setCurrentHash(window.location.hash);
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const isAboutPage = currentHash === '#/about' || currentHash === '#about-page';
  const isEventsPage = currentHash === '#/events';
  const isRewardsPage = currentHash === '#/rewards';
  const isCateringPage = currentHash === '#/catering';
  const isMenuPage = currentHash.startsWith('#/menu') || currentHash === '#menu';
  const isLunchPage = currentHash === '#/menu/lunch';
  const isDinnerPage = currentHash === '#/menu/dinner';
  const isVegetarianPage = currentHash === '#/menu/vegetarian';
  const isContactPage = currentHash === '#/contact';
  const isCareersPage = currentHash === '#/careers';
  const isAuthPage = currentHash === '#/login' || currentHash === '#/signin' || currentHash === '#/auth';
  const isProfilePage = currentHash === '#/profile' || currentHash === '#profile-page';
  const isAdminPage = currentHash === '#/admin';

  useEffect(() => {
    if (isAboutPage || isEventsPage || isRewardsPage || isCateringPage || isMenuPage || isContactPage || isCareersPage || isAuthPage || isProfilePage || isAdminPage) {
      window.scrollTo(0, 0);
    } else {
      if (currentHash && currentHash !== '#/') {
        const targetId = currentHash.replace('#', '');
        const targetElement = document.getElementById(targetId);
        if (targetElement) {
          setTimeout(() => {
            targetElement.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        } else if (currentHash === '#home' || currentHash === '#/') {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }
    }
  }, [currentHash, isAboutPage, isEventsPage, isRewardsPage, isCateringPage, isMenuPage, isContactPage, isCareersPage, isAuthPage, isProfilePage, isAdminPage]);

  return (
    <>
      {/* Premium Entry Page Preloader */}
      <AnimatePresence mode="wait">
        {isLoading && (
          <motion.div
            key="preloader"
            initial={{ opacity: 1 }}
            exit={{
              opacity: 0,
              transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
            }}
            className="fixed inset-0 w-full h-screen z-50 flex flex-col items-center justify-center bg-white"
            style={{
              position: 'fixed',
              inset: 0,
              width: '100%',
              height: '100vh',
              zIndex: 9999,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'var(--canvas-primary)'
            }}
          >
            {/* Ambient Gold Radial glow */}
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '700px',
                height: '700px',
                backgroundColor: 'var(--gold-antique)',
                filter: 'blur(160px)',
                pointerEvents: 'none',
                opacity: 0.25,
                borderRadius: '50%',
                zIndex: 1
              }}
            />

            {/* Emblem Reveal */}
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                position: 'relative',
                zIndex: 2
              }}
            >
              {/* Brand Logo */}
              <div className="text-center" style={{ textAlign: 'center' }}>
                <img
                  src={logoImg}
                  alt="Maha Thai Logo"
                  style={{
                    height: '240px',
                    width: 'auto',
                    objectFit: 'contain',
                    filter: 'drop-shadow(0 8px 24px rgba(11, 54, 61, 0.18))'
                  }}
                />
              </div>

              {/* Elegant Micro-loading Indicator */}
              <div style={{ marginTop: '2.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    border: '2px solid rgba(197, 160, 89, 0.1)',
                    borderTop: '2px solid var(--gold-antique)',
                  }}
                />
                <motion.span
                  initial={{ opacity: 0.4 }}
                  animate={{ opacity: [0.4, 0.9, 0.4] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: '10px',
                    letterSpacing: '0.2em',
                    color: 'var(--gold-antique)',
                    textTransform: 'uppercase',
                    fontWeight: 500
                  }}
                >
                  Loading
                </motion.span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Website Wrapper */}
      {!isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="relative min-h-screen w-full flex flex-col"
          style={{ width: '100%', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}
        >
          {/* Sticky Header — hidden on Admin page */}
          {!isAdminPage && (
            <Header 
              onOpenReservation={openReservation} 
              cartCount={getCartCount()} 
              onOpenCart={() => setIsCartOpen(true)} 
              currentUser={currentUser}
              onSignOut={handleSignOut}
            />
          )}

          {/* Interactive Sections */}
          <main style={{ flexGrow: 1 }}>
            {isAdminPage ? (
              <AdminPage currentUser={currentUser} />
            ) : isAboutPage ? (
              <AboutUsPage />
            ) : isAuthPage ? (
              <AuthPage onLoginSuccess={handleLoginSuccess} />
            ) : isProfilePage ? (
            <ProfilePage 
                currentUser={currentUser} 
                onSignOut={handleSignOut} 
                onUpdateProfile={handleUpdateProfile} 
              />
            ) : isEventsPage ? (
              <EventsPage onOpenReservation={openReservation} />
            ) : isRewardsPage ? (
              <RewardsPage
                currentUser={currentUser}
                onOpenReservation={openReservation}
                onUpdateProfile={handleUpdateProfile}
              />
            ) : isCateringPage ? (
              <CateringPage onOpenReservation={openReservation} />
            ) : isLunchPage ? (
              <LunchMenuPage 
                onOpenReservation={openReservation} 
                cart={cart} 
                addToCart={addToCart} 
                removeFromCart={removeFromCart} 
              />
            ) : isDinnerPage ? (
              <DinnerMenuPage 
                onOpenReservation={openReservation} 
                cart={cart} 
                addToCart={addToCart} 
                removeFromCart={removeFromCart} 
              />
            ) : isVegetarianPage ? (
              <VegetarianMenuPage 
                onOpenReservation={openReservation} 
                cart={cart} 
                addToCart={addToCart} 
                removeFromCart={removeFromCart} 
              />
            ) : isMenuPage ? (
              <MenuPage 
                onOpenReservation={openReservation} 
                cart={cart} 
                addToCart={addToCart} 
                removeFromCart={removeFromCart} 
              />
            ) : isContactPage ? (
              <ContactPage onOpenReservation={openReservation} currentUser={currentUser} />
            ) : isCareersPage ? (
              <CareersPage onOpenReservation={openReservation} currentUser={currentUser} />
            ) : (
              <>
                <Hero />
                <PhilosophySection />
                <MenuSection 
                  cart={cart} 
                  addToCart={addToCart} 
                  removeFromCart={removeFromCart} 
                />

                {/* Reservation Callout Banner */}
                <section className="reservation-banner-section">
                  <div className="reservation-banner-container">
                    <h2 className="reservation-banner-title">Secure Your Journey to the East</h2>
                    <p className="reservation-banner-desc">
                      Reservations are highly recommended to ensure we can provide the full
                      Maha experience. Local door delivery and pickup options are also
                      available to enjoy our signature creations at home.
                    </p>
                    <button 
                      onClick={() => openReservation('reservation')}
                      className="hero-cta-btn-gold"
                      style={{ border: 'none' }}
                    >
                      BOOK NOW
                    </button>
                  </div>
                </section>
              </>
            )}
          </main>

          {/* Luxury Footer — hidden on Admin page */}
          {!isAdminPage && <Footer />}

          {/* Reservation Form Modal */}
          <AnimatePresence>
            {isReservationOpen && (
              <div className="luxury-modal-overlay" onClick={() => setIsReservationOpen(false)}>
                <motion.div 
                  initial={{ opacity: 0, y: 50, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 50, scale: 0.95 }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className="luxury-modal-content"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Close button */}
                  <button 
                    onClick={() => setIsReservationOpen(false)} 
                    className="luxury-modal-close"
                  >
                    <X size={24} />
                  </button>

                  {/* Policies & Booking Form (combines inside modal) */}
                  <ReservationSection initialTab={reservationTab} currentUser={currentUser} />
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Cart Drawer Overlay */}
          <AnimatePresence>
            {isCartOpen && (
              <div 
                className="luxury-modal-overlay" 
                style={{ justifyContent: 'flex-end', padding: 0 }}
                onClick={() => setIsCartOpen(false)}
              >
                <motion.div 
                  initial={{ x: '100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '100%' }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className="luxury-modal-content"
                  style={{
                    maxWidth: '450px',
                    height: '100vh',
                    maxHeight: '100vh',
                    borderRadius: 0,
                    borderTop: 'none',
                    borderBottom: 'none',
                    borderRight: 'none',
                    borderLeft: '1px solid var(--gold-antique)',
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '2rem 1.5rem',
                    boxShadow: '-10px 0 30px rgba(0,0,0,0.15)',
                    position: 'relative'
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Close button */}
                  <button 
                    onClick={() => setIsCartOpen(false)} 
                    className="luxury-modal-close"
                    style={{ top: '1.5rem', right: '1.5rem' }}
                  >
                    <X size={24} />
                  </button>

                  {/* Drawer Header */}
                  <div style={{ textAlign: 'center', marginBottom: '2rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '1rem' }}>
                    <span className="modal-subtitle" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                      <ShoppingBag size={14} />
                      Your Order Selection
                    </span>
                    <h3 className="modal-title" style={{ fontSize: '1.8rem', fontWeight: 300 }}>Maha Cart</h3>
                  </div>

                  {/* Drawer Scrollable Content */}
                  <div style={{ flexGrow: 1, overflowY: 'auto', paddingRight: '0.25rem', marginBottom: '1.5rem' }}>
                    {isCartCheckedOut ? (
                      /* Checked out Receipt State */
                      <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                        <div style={{ 
                          width: '50px', height: '50px', borderRadius: '50%', backgroundColor: 'var(--gold-light)', 
                          border: '1px solid var(--gold-antique)', display: 'inline-flex', alignItems: 'center', 
                          justifyContent: 'center', color: 'var(--gold-antique)', marginBottom: '1.5rem'
                        }}>
                          <ShoppingBag size={24} />
                        </div>
                        <h4 className="font-serif" style={{ fontSize: '1.4rem', color: 'var(--text-dark)', marginBottom: '0.5rem', fontWeight: 300 }}>
                          Order Transmitted
                        </h4>
                        <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.6', marginBottom: '1.5rem', fontWeight: 300 }}>
                          Thank you, <strong style={{ fontWeight: 600, color: 'var(--text-dark)' }}>{cartCheckoutData.name}</strong>. Your fine dining selection is being processed. 
                          {cartCheckoutData.serviceType === 'delivery' ? ' A thermal insulated delivery courier will be dispatched shortly.' : ' Your curbside pickup is secured.'}
                        </p>

                        <button 
                          onClick={clearCart} 
                          className="btn-filled"
                          style={{ width: '100%', padding: '0.75rem', fontSize: '0.75rem', justifyContent: 'center' }}
                        >
                          Place Another Order
                        </button>
                      </div>
                    ) : Object.keys(cart).length === 0 ? (
                      /* Empty Cart State */
                      <div style={{ textAlign: 'center', paddingTop: '4rem', paddingBottom: '4rem' }}>
                        <p style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: '1.1rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                          Your cart is empty.
                        </p>
                        <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.6', padding: '0 1rem', marginBottom: '2rem', fontWeight: 300 }}>
                          Begin your culinary journey by adding traditional and seasonal creations from our menu.
                        </p>
                        <button 
                          onClick={() => {
                            setIsCartOpen(false);
                            window.location.hash = '#menu';
                          }}
                          className="hero-cta-btn-gold" 
                          style={{ border: 'none', padding: '0.75rem 2rem', fontSize: '0.75rem' }}
                        >
                          EXPLORE MENU
                        </button>
                      </div>
                    ) : isCartCheckoutFormOpen ? (
                      /* Checkout Form State */
                      <div style={{ padding: '0.5rem 0' }}>
                        <h4 className="font-serif" style={{ fontSize: '1.25rem', color: 'var(--text-dark)', marginBottom: '1.5rem', fontWeight: 300, textAlign: 'center' }}>
                          Checkout Details
                        </h4>
                        <form 
                          onSubmit={async (e) => {
                            e.preventDefault();
                            const cartItems = Object.values(cart);
                            const orderedItems = cartItems.map(item => `${item.quantity}x ${formatCartItemDetails(item)}`).join(' | ');

                            setCheckoutError('');
                            setIsCheckoutSubmitting(true);

                            try {
                              const createdOrder = await createOrderWithItemsAndAddons({
                                user_id: currentUser?.id || null,
                                full_name: cartCheckoutData.name,
                                email: cartCheckoutData.email,
                                phone_number: cartCheckoutData.phone,
                                order_type: cartCheckoutData.serviceType,
                                service_type: cartCheckoutData.serviceType,
                                pickup_time: cartCheckoutData.serviceType === 'pickup' ? cartCheckoutData.pickupTime : null,
                                delivery_address: cartCheckoutData.serviceType === 'delivery' ? cartCheckoutData.address : null,
                                suite_apt: null,
                                promo_code_id: appliedCoupon?.id && !String(appliedCoupon.id).startsWith('c-') ? appliedCoupon.id : null
                              }, cartItems);

                              const newOrder = {
                                id: createdOrder.id,
                                date: new Date(createdOrder.created_at || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                                items: orderedItems,
                                total: Number(createdOrder.total_amount || 0),
                                type: cartCheckoutData.serviceType === 'delivery' ? 'Delivery' : 'Pickup',
                                status: 'Pending',
                                customerName: cartCheckoutData.name,
                                customerPhone: cartCheckoutData.phone,
                                customerEmail: cartCheckoutData.email,
                                address: cartCheckoutData.serviceType === 'delivery' ? cartCheckoutData.address : 'Pickup'
                              };

                              if (currentUser) {
                                const updated = {
                                  ...currentUser,
                                  orders: [newOrder, ...(currentUser.orders || [])]
                                };
                                setCurrentUser(updated);
                                localStorage.setItem(`maha_user_${currentUser.email}`, JSON.stringify(updated));
                              }

                              const globalOrders = JSON.parse(localStorage.getItem('maha_global_orders') || '[]');
                              globalOrders.unshift(newOrder);
                              localStorage.setItem('maha_global_orders', JSON.stringify(globalOrders));
                              setCart({});
                              setCouponCode('');
                              setCouponDiscount(0);
                              setAppliedCoupon(null);
                              setCouponError('');
                              setIsCartCheckedOut(true);
                              setIsCartCheckoutFormOpen(false);
                            } catch (error) {
                              console.error('Failed to create order.', error);
                              setCheckoutError(error.message || 'We could not place your order. Please try again.');
                            } finally {
                              setIsCheckoutSubmitting(false);
                            }
                          }}
                          style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
                        >
                          {/* Service Type Toggle inside drawer */}
                          <div className="service-toggle-wrapper" style={{ marginBottom: '0.5rem' }}>
                            <div className="service-toggle" style={{ maxWidth: '100%' }}>
                              <button
                                type="button"
                                className={`service-btn ${cartCheckoutData.serviceType === 'delivery' ? 'active' : ''}`}
                                onClick={() => {
                                  setCartCheckoutData({ ...cartCheckoutData, serviceType: 'delivery' });
                                  setCheckoutError('');
                                }}
                              >
                                Delivery
                              </button>
                              <button
                                type="button"
                                className={`service-btn ${cartCheckoutData.serviceType === 'pickup' ? 'active' : ''}`}
                                onClick={() => {
                                  setCartCheckoutData({ ...cartCheckoutData, serviceType: 'pickup' });
                                  setCheckoutError('');
                                }}
                              >
                                Pick Up
                              </button>
                            </div>
                          </div>

                          <div>
                            <label className="block font-sans text-[10px] font-bold tracking-widest uppercase text-dark mb-1" style={{ fontSize: '10px' }}>
                              Email Address
                            </label>
                            <input
                              type="email"
                              required
                              placeholder="you@example.com"
                              value={cartCheckoutData.email}
                              onChange={(e) => setCartCheckoutData({ ...cartCheckoutData, email: e.target.value })}
                              className="w-full px-4 py-2 font-sans text-sm bg-white rounded border focus:outline-none"
                              style={{ width: '100%', padding: '0.6rem 0.8rem', fontSize: '0.85rem', border: '1px solid var(--border-light)', borderRadius: '4px', outline: 'none' }}
                            />
                          </div>

                          <div>
                            <label className="block font-sans text-[10px] font-bold tracking-widest uppercase text-dark mb-1" style={{ fontSize: '10px' }}>
                              Full Name
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. Alexander Hamilton"
                              value={cartCheckoutData.name}
                              onChange={(e) => setCartCheckoutData({ ...cartCheckoutData, name: e.target.value })}
                              className="w-full px-4 py-2 font-sans text-sm bg-white rounded border focus:outline-none"
                              style={{ width: '100%', padding: '0.6rem 0.8rem', fontSize: '0.85rem', border: '1px solid var(--border-light)', borderRadius: '4px', outline: 'none' }}
                            />
                          </div>

                          <div>
                            <label className="block font-sans text-[10px] font-bold tracking-widest uppercase text-dark mb-1" style={{ fontSize: '10px' }}>
                              Phone Number
                            </label>
                            <input
                              type="tel"
                              required
                              placeholder="+1 (555) 019-2834"
                              value={cartCheckoutData.phone}
                              onChange={(e) => {
                                setCartCheckoutData({ ...cartCheckoutData, phone: e.target.value });
                              }}
                              className="w-full px-4 py-2 font-sans text-sm bg-white rounded border focus:outline-none"
                              style={{ width: '100%', padding: '0.6rem 0.8rem', fontSize: '0.85rem', border: '1px solid var(--border-light)', borderRadius: '4px', outline: 'none' }}
                            />
                          </div>

                          {cartCheckoutData.serviceType === 'delivery' && (
                            <div>
                              <label className="block font-sans text-[10px] font-bold tracking-widest uppercase text-dark mb-1" style={{ fontSize: '10px' }}>
                                Delivery Address
                              </label>
                              <input
                                type="text"
                                required
                                placeholder="Street Address, Apt / Suite"
                                value={cartCheckoutData.address}
                                onChange={(e) => {
                                  setCartCheckoutData({ ...cartCheckoutData, address: e.target.value });
                                }}
                                className="w-full px-4 py-2 font-sans text-sm bg-white rounded border focus:outline-none"
                                style={{ width: '100%', padding: '0.6rem 0.8rem', fontSize: '0.85rem', border: '1px solid var(--border-light)', borderRadius: '4px', outline: 'none' }}
                              />
                            </div>
                          )}

                          {cartCheckoutData.serviceType === 'pickup' && (
                            <div>
                              <label className="block font-sans text-[10px] font-bold tracking-widest uppercase text-dark mb-1" style={{ fontSize: '10px' }}>
                                Pickup Time
                              </label>
                              <select
                                required
                                value={cartCheckoutData.pickupTime}
                                onChange={(e) => setCartCheckoutData({ ...cartCheckoutData, pickupTime: e.target.value })}
                                className="w-full px-4 py-2 font-sans text-sm bg-white rounded border focus:outline-none"
                                style={{ width: '100%', padding: '0.6rem 0.8rem', fontSize: '0.85rem', border: '1px solid var(--border-light)', borderRadius: '4px', outline: 'none', backgroundColor: 'white' }}
                              >
                                {pickupTimeOptions.map((option) => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}

                          {/* Coupon Code Input */}
                          <div>
                            <label className="block font-sans text-[10px] font-bold tracking-widest uppercase text-dark mb-1" style={{ fontSize: '10px' }}>
                              Promo Code
                            </label>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <input
                                type="text"
                                placeholder="e.g. WELCOME10"
                                value={couponCode}
                                onChange={(e) => setCouponCode(e.target.value)}
                                className="w-full px-4 py-2 font-sans text-sm bg-white rounded border focus:outline-none"
                                style={{ flexGrow: 1, padding: '0.5rem 0.8rem', fontSize: '0.85rem', border: '1px solid var(--border-light)', borderRadius: '4px', outline: 'none' }}
                              />
                              <button
                                type="button"
                                onClick={handleApplyCoupon}
                                className="btn-filled"
                                style={{ padding: '0.5rem 1rem', fontSize: '0.75rem', height: 'fit-content' }}
                              >
                                Apply
                              </button>
                            </div>
                            {couponError && (
                              <p style={{ fontSize: '0.75rem', color: '#db4455', marginTop: '0.25rem' }}>{couponError}</p>
                            )}
                            {couponDiscount > 0 && (
                              <p style={{ fontSize: '0.75rem', color: 'var(--accent-jade)', marginTop: '0.25rem' }}>Coupon applied successfully!</p>
                            )}
                          </div>

                          {couponDiscount > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--accent-jade)', marginTop: '0.5rem', borderTop: '1px dashed var(--border-light)', paddingTop: '0.5rem' }}>
                              <span>Promo Discount ({appliedCoupon?.code})</span>
                              <span>-${couponDiscount}.00</span>
                            </div>
                          )}

                          <div className="order-subtotal-row" style={{ marginTop: '0.5rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-light)' }}>
                            <span className="subtotal-label" style={{ fontSize: '0.75rem' }}>Order Total</span>
                            <span className="subtotal-price" style={{ fontSize: '1.2rem' }}>${getCartFinalTotal().toFixed(2)}</span>
                          </div>

                          {checkoutError && (
                            <p role="alert" style={{ fontSize: '0.78rem', color: '#db4455', margin: 0 }}>{checkoutError}</p>
                          )}

                          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                            <button
                              type="button"
                              onClick={() => {
                                setIsCartCheckoutFormOpen(false);
                                setCheckoutError('');
                              }}
                              className="btn-filled"
                              style={{ flex: 1, backgroundColor: 'transparent', color: 'var(--text-dark)', border: '1px solid var(--border-medium)', padding: '0.75rem', fontSize: '0.75rem', justifyContent: 'center' }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--canvas-secondary)'}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                              Back
                            </button>
                            <button
                              type="submit"
                              disabled={isCheckoutSubmitting}
                              className="btn-filled"
                              style={{ flex: 2, padding: '0.75rem', fontSize: '0.75rem', justifyContent: 'center', opacity: isCheckoutSubmitting ? 0.65 : 1 }}
                            >
                              {isCheckoutSubmitting ? 'Please wait...' : 'Place Order'}
                            </button>
                          </div>
                        </form>
                      </div>
                    ) : (
                      /* Cart Item List State */
                      <div className="order-items-container" style={{ border: 'none', padding: 0, backgroundColor: 'transparent' }}>
                        {Object.values(cart).map((item) => (
                          <div key={item.id} className="order-item-row" style={{ padding: '0.75rem 0' }}>
                            {/* Small circular item image */}
                            <img 
                              src={item.image} 
                              alt={item.name} 
                              style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '6px', marginRight: '0.75rem', border: '1px solid var(--border-light)' }} 
                            />
                            
                            <div className="order-item-info">
                              <h5 className="order-item-title" style={{ fontSize: '0.95rem' }}>{item.name}</h5>
                              {item.customization && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', marginTop: '0.25rem', fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1.35 }}>
                                  {item.customization.spice && <span>Spice: {item.customization.spice}</span>}
                                  {Array.isArray(item.customization.addons) && item.customization.addons.length > 0 && (
                                    <span>Add-ons: {item.customization.addons.map((addon) => addon.name).join(', ')}</span>
                                  )}
                                  {item.customization.size?.name && <span>Size: {item.customization.size.name}</span>}
                                  {item.customization.requirements && <span>Notes: {item.customization.requirements}</span>}
                                </div>
                              )}
                              <span className="order-item-price" style={{ fontSize: '0.85rem' }}>${item.price}</span>
                            </div>
                            <div className="qty-controls">
                              <button
                                type="button"
                                onClick={() => removeFromCart(item.id)}
                                className="qty-btn"
                              >
                                -
                              </button>
                              <span className="qty-val">{item.quantity}</span>
                              <button
                                type="button"
                                onClick={() => addToCart(item)}
                                className="qty-btn"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Drawer Footer (Only visible when showing items and not checking out or checked out) */}
                  {!isCartCheckedOut && !isCartCheckoutFormOpen && Object.keys(cart).length > 0 && (
                    <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '1.25rem' }}>
                      <div className="order-subtotal-row" style={{ marginTop: 0, paddingTop: 0, marginBottom: '1.25rem' }}>
                        <span className="subtotal-label">Subtotal</span>
                        <span className="subtotal-price">${getCartTotal()}.00</span>
                      </div>

                      <button 
                        onClick={() => setIsCartCheckoutFormOpen(true)}
                        className="btn-filled"
                        style={{ width: '100%', justifyContent: 'center', padding: '1rem', letterSpacing: '0.2em' }}
                      >
                        PROCEED TO CHECKOUT
                      </button>
                    </div>
                  )}
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </>
  );
}
