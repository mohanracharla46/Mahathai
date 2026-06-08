import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ChevronDown, ShoppingBag, User, LogOut, ShieldAlert } from 'lucide-react';
import logoImg from '../assets/mahathailogo_v2.png';
import { isAdminUser } from '../lib/api';

const navLinks = [
  { name: 'Home', href: '#home' },
  { name: 'About Us', href: '#/about' },
  {
    name: 'Menu',
    href: '#menu',
    dropdown: [
      { name: 'Lunch', href: '#/menu/lunch' },
      { name: 'Dinner', href: '#/menu/dinner' },
      { name: 'Vegetarian', href: '#/menu/vegetarian' }
    ]
  },
  { name: 'Private Events', href: '#/events' },
  { name: 'Rewards', href: '#/rewards' },
  { name: 'Catering', href: '#/catering' },
  { name: 'Careers', href: '#/careers' },
  { name: 'Contact', href: '#/contact' }
];

export default function Header({ onOpenReservation, cartCount = 0, onOpenCart, currentUser = null, onSignOut }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [mobileDropdowns, setMobileDropdowns] = useState({});

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const menuVariants = {
    closed: {
      opacity: 0,
      y: '-100%',
      transition: {
        duration: 0.5,
        ease: [0.16, 1, 0.3, 1],
        when: 'afterChildren'
      }
    },
    open: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.16, 1, 0.3, 1],
        when: 'beforeChildren',
        staggerChildren: 0.08
      }
    }
  };

  const itemVariants = {
    closed: { opacity: 0, y: 20, transition: { type: 'spring', stiffness: 300, damping: 30 } },
    open: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  const toggleMobileDropdown = (name) => {
    setMobileDropdowns(prev => ({
      ...prev,
      [name]: !prev[name]
    }));
  };

  return (
    <>
      <header className={`header-main ${isScrolled ? 'scrolled' : ''}`}>
        <div className="container header-container">
          {/* Logo */}
          <a href="#home" className="header-logo">
            <img src={logoImg} alt="Maha Thai Logo" className="header-logo-image" />
          </a>

          {/* Desktop Navigation */}
          <nav className="nav-desktop">
            {navLinks.map((link) => {
              const hasDropdown = !!link.dropdown;
              return (
                <div
                  key={link.name}
                  className="nav-link-item"
                  onMouseEnter={() => hasDropdown && setActiveDropdown(link.name)}
                  onMouseLeave={() => hasDropdown && setActiveDropdown(null)}
                >
                  {link.isAction ? (
                    <button
                      onClick={() => onOpenReservation('reservation')}
                      className="nav-link"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                    >
                      {link.name}
                    </button>
                  ) : (
                    <a href={link.href} className="nav-link">
                      {link.name}
                      {hasDropdown && (
                        <ChevronDown
                          size={12}
                          className="transition-transform duration-300"
                          style={{
                            transform: activeDropdown === link.name ? 'rotate(180deg)' : 'rotate(0deg)',
                            color: 'var(--text-muted)'
                          }}
                        />
                      )}
                    </a>
                  )}

                  {/* Dropdown Menu Container */}
                  {hasDropdown && (
                    <AnimatePresence>
                      {activeDropdown === link.name && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          transition={{ duration: 0.2, ease: 'easeOut' }}
                          className="dropdown-container"
                        >
                          <div className="dropdown-arrow" />
                          {link.dropdown.map((subItem) => {
                            if (subItem.isAction) {
                              return (
                                <button
                                  key={subItem.name}
                                  onClick={() => {
                                    setActiveDropdown(null);
                                    onOpenReservation('reservation');
                                  }}
                                  className="dropdown-link"
                                  style={{ background: 'none', border: 'none', cursor: 'pointer', width: '100%', display: 'block', textAlign: 'center' }}
                                >
                                  {subItem.name}
                                </button>
                              );
                            }
                            return (
                              <a
                                key={subItem.name}
                                href={subItem.href}
                                onClick={() => {
                                  if (link.name === 'Menu') {
                                    const event = new CustomEvent('changeMenuCategory', { detail: subItem.name });
                                    window.dispatchEvent(event);
                                  }
                                }}
                                className="dropdown-link"
                              >
                                {subItem.name}
                              </a>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Desktop Reservation CTA & Shopping Cart & User Profile */}
          <div className="nav-desktop-cta">
            <button
              onClick={() => {
                window.location.hash = '#/menu';
              }}
              className="btn-filled"
              style={{
                textDecoration: 'none',
                padding: '0.75rem 1.75rem',
                fontSize: '0.75rem',
                border: '1px solid var(--gold-antique)',
                backgroundColor: 'transparent',
                color: 'var(--text-dark)',
                letterSpacing: '0.15em',
                fontWeight: 600,
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--gold-antique)';
                e.currentTarget.style.color = '#FFFFFF';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'var(--text-dark)';
              }}
            >
              ORDER NOW
            </button>

            {/* Shopping Cart Icon (Desktop) */}
            <button
              onClick={onOpenCart}
              className="relative"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-dark)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0.5rem',
                position: 'relative',
                transition: 'color 0.3s ease'
              }}
              aria-label="View Cart"
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--gold-antique)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-dark)'}
            >
              <ShoppingBag size={22} />
              {cartCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-2px',
                    right: '-2px',
                    backgroundColor: 'var(--gold-antique)',
                    color: 'white',
                    fontSize: '10px',
                    fontWeight: 'bold',
                    borderRadius: '50%',
                    width: '18px',
                    height: '18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                  }}
                >
                  {cartCount}
                </span>
              )}
            </button>

            {/* User Profile Dropdown or Sign In link */}
            {currentUser ? (
              <div 
                style={{ position: 'relative' }}
                onMouseEnter={() => setActiveDropdown('user')}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <button
                  onClick={() => window.location.hash = '#/profile'}
                  style={{
                    background: 'none',
                    border: '1px solid var(--gold-antique)',
                    borderRadius: '50%',
                    width: '34px',
                    height: '34px',
                    cursor: 'pointer',
                    color: 'var(--text-dark)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    fontSize: '0.75rem',
                    backgroundColor: 'var(--gold-light)'
                  }}
                  aria-label="User Profile"
                >
                  {currentUser.name ? currentUser.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U'}
                </button>

                <AnimatePresence>
                  {activeDropdown === 'user' && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.2 }}
                      className="dropdown-container"
                      style={{ right: 0, left: 'auto', width: '220px', padding: '1rem 0' }}
                    >
                      <div className="dropdown-arrow" style={{ right: '12px', left: 'auto' }} />
                      <div style={{ padding: '0 1.25rem 0.75rem 1.25rem', borderBottom: '1px solid var(--border-light)', marginBottom: '0.5rem', textAlign: 'left' }}>
                        <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dark)', margin: 0 }}>
                          {currentUser.name}
                        </p>
                        <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.65rem', color: 'var(--text-muted)', margin: '0.15rem 0 0 0', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {currentUser.email}
                        </p>
                      </div>
                      <a
                        href="#/profile"
                        onClick={() => setActiveDropdown(null)}
                        className="dropdown-link"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.5rem',
                          fontFamily: 'var(--font-sans)',
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          letterSpacing: '0.15em',
                          color: 'var(--text-dark)',
                          textDecoration: 'none',
                          padding: '0.6rem 1.5rem',
                          borderBottom: '1px solid var(--border-light)'
                        }}
                      >
                        <User size={12} style={{ color: 'var(--gold-antique)' }} />
                        View Profile
                      </a>
                      {isAdminUser(currentUser) && (
                        <a
                          href="#/admin"
                          onClick={() => setActiveDropdown(null)}
                          className="dropdown-link"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            fontFamily: 'var(--font-sans)',
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            letterSpacing: '0.15em',
                            color: 'var(--accent-jade)',
                            textDecoration: 'none',
                            padding: '0.6rem 1.5rem',
                            borderBottom: '1px solid var(--border-light)'
                          }}
                        >
                          <ShieldAlert size={12} style={{ color: 'var(--gold-antique)' }} />
                          Admin Portal
                        </a>
                      )}
                      <button
                        onClick={onSignOut}
                        className="dropdown-link"
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.5rem',
                          color: '#D97706',
                          padding: '0.6rem 1.5rem',
                          fontFamily: 'var(--font-sans)',
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          letterSpacing: '0.15em'
                        }}
                      >
                        <LogOut size={12} />
                        Sign Out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <a
                href="#/login"
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.18em',
                  color: 'var(--text-dark)',
                  textDecoration: 'none',
                  transition: 'color 0.3s ease',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--gold-antique)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-dark)'}
              >
                <User size={16} />
                Sign In
              </a>
            )}
          </div>

          {/* Mobile Cart and Hamburger triggers */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} className="nav-mobile-wrapper">
            {/* Shopping Cart Icon (Mobile) - Styled to show/hide appropriately */}
            <button
              onClick={onOpenCart}
              className="nav-mobile-cart-trigger"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-dark)',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0.5rem',
                position: 'relative'
              }}
              aria-label="View Cart"
            >
              <ShoppingBag size={22} />
              {cartCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-2px',
                    right: '-2px',
                    backgroundColor: 'var(--gold-antique)',
                    color: 'white',
                    fontSize: '10px',
                    fontWeight: 'bold',
                    borderRadius: '50%',
                    width: '18px',
                    height: '18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                  }}
                >
                  {cartCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setIsOpen(!isOpen)}
              className="nav-mobile-trigger"
              aria-label="Toggle Menu"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial="closed"
            animate="open"
            exit="closed"
            variants={menuVariants}
            className="mobile-nav-overlay"
            style={{
              backgroundColor: 'var(--canvas-primary)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-start',
              alignItems: 'center',
              padding: '8rem 2rem 4rem 2rem',
              overflowY: 'auto'
            }}
          >
            {/* Background elements */}
            <div
              className="mobile-nav-bg"
              style={{
                backgroundImage: 'radial-gradient(var(--text-dark) 1px, transparent 0)',
                backgroundSize: '24px 24px'
              }}
            />

            <nav
              className="flex flex-col items-center w-full max-w-[280px]"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1.25rem',
                textAlign: 'center',
                zIndex: 10
              }}
            >
              {navLinks.map((link) => {
                const hasDropdown = !!link.dropdown;
                const isExpanded = !!mobileDropdowns[link.name];
                return (
                  <motion.div key={link.name} variants={itemVariants} style={{ width: '100%' }}>
                    {hasDropdown ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <button
                          onClick={() => toggleMobileDropdown(link.name)}
                          className="font-serif font-medium tracking-wide"
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: isExpanded ? 'var(--accent-jade)' : 'var(--text-dark)',
                            fontSize: '2rem',
                            padding: '0.25rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem'
                          }}
                        >
                          {link.name}
                          <ChevronDown
                            size={20}
                            style={{
                              transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                              transition: 'transform 0.3s ease',
                              color: 'var(--gold-antique)'
                            }}
                          />
                        </button>

                        {/* Mobile Dropdown Submenus */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3, ease: 'easeInOut' }}
                              style={{
                                overflow: 'hidden',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.75rem',
                                backgroundColor: 'var(--canvas-secondary)',
                                borderRadius: '8px',
                                padding: '0.75rem 1.5rem',
                                width: '100%',
                                marginTop: '0.5rem',
                                border: '1px solid var(--border-light)'
                              }}
                            >
                              {link.dropdown.map((subItem) => {
                                if (subItem.isAction) {
                                  return (
                                    <button
                                      key={subItem.name}
                                      onClick={() => {
                                        setIsOpen(false);
                                        onOpenReservation('reservation');
                                      }}
                                      className="font-sans text-xs font-bold uppercase tracking-widest"
                                      style={{
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        color: 'var(--text-dark)',
                                        letterSpacing: '0.15em',
                                        padding: '0.25rem 0',
                                        display: 'block',
                                        width: '100%',
                                        textAlign: 'center'
                                      }}
                                    >
                                      {subItem.name}
                                    </button>
                                  );
                                }
                                return (
                                  <a
                                    key={subItem.name}
                                    href={subItem.href}
                                    onClick={() => {
                                      setIsOpen(false);
                                      if (link.name === 'Menu') {
                                        const event = new CustomEvent('changeMenuCategory', { detail: subItem.name });
                                        window.dispatchEvent(event);
                                      }
                                    }}
                                    className="font-sans text-xs font-bold uppercase tracking-widest"
                                    style={{
                                      color: 'var(--text-dark)',
                                      textDecoration: 'none',
                                      letterSpacing: '0.15em',
                                      padding: '0.25rem 0',
                                      display: 'block'
                                    }}
                                  >
                                    {subItem.name}
                                  </a>
                                );
                              })}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ) : (
                      <>
                        {link.isAction ? (
                          <button
                            onClick={() => {
                              setIsOpen(false);
                              onOpenReservation('reservation');
                            }}
                            className="font-serif font-medium tracking-wide transition-colors"
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              color: 'var(--text-dark)',
                              fontSize: '2rem',
                              display: 'block',
                              width: '100%',
                              textAlign: 'center',
                              padding: '0.25rem'
                            }}
                          >
                            {link.name}
                          </button>
                        ) : (
                          <a
                            href={link.href}
                            onClick={() => setIsOpen(false)}
                            className="font-serif font-medium tracking-wide transition-colors"
                            style={{
                              color: 'var(--text-dark)',
                              textDecoration: 'none',
                              fontSize: '2rem',
                              display: 'block',
                              padding: '0.25rem'
                            }}
                          >
                            {link.name}
                          </a>
                        )}
                      </>
                    )}
                  </motion.div>
                );
              })}

              {/* Dynamic Authentication item inside mobile links */}
              <motion.div variants={itemVariants} style={{ width: '100%', borderTop: '1px solid var(--border-light)', paddingTop: '1.25rem', marginTop: '0.5rem' }}>
                {currentUser ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ 
                        width: '38px', height: '38px', borderRadius: '50%', backgroundColor: 'var(--gold-light)',
                        border: '1px solid var(--gold-antique)', display: 'flex', alignItems: 'center', justifyContext: 'center',
                        fontWeight: 'bold', fontSize: '0.8rem', color: 'var(--text-dark)'
                      }}>
                        {currentUser.name ? currentUser.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U'}
                      </div>
                      <div style={{ textAlign: 'left' }}>
                        <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-dark)', margin: 0 }}>
                          {currentUser.name}
                        </p>
                        <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.65rem', color: 'var(--text-muted)', margin: 0 }}>
                          {currentUser.email}
                        </p>
                      </div>
                    </div>
                    
                    <a
                      href="#/profile"
                      onClick={() => setIsOpen(false)}
                      style={{
                        textDecoration: 'none',
                        fontFamily: 'var(--font-sans)',
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        color: 'var(--gold-antique)',
                        border: '1px solid var(--gold-antique)',
                        borderRadius: '4px',
                        padding: '0.5rem 1.5rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        marginTop: '0.25rem'
                      }}
                    >
                      <User size={12} />
                      View Profile
                    </a>
                    <button
                      onClick={() => {
                        setIsOpen(false);
                        onSignOut();
                      }}
                      style={{
                        background: 'none',
                        border: '1px solid #D97706',
                        borderRadius: '4px',
                        color: '#D97706',
                        fontFamily: 'var(--font-sans)',
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        padding: '0.5rem 1.5rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        marginTop: '0.5rem'
                      }}
                    >
                      <LogOut size={12} />
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <a
                    href="#/login"
                    onClick={() => setIsOpen(false)}
                    className="font-serif font-medium tracking-wide transition-colors"
                    style={{
                      color: 'var(--text-dark)',
                      textDecoration: 'none',
                      fontSize: '2rem',
                      display: 'block',
                      padding: '0.25rem'
                    }}
                  >
                    Sign In
                  </a>
                )}
              </motion.div>

              <motion.div variants={itemVariants} style={{ marginTop: '1rem', width: '100%' }}>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    window.location.hash = '#/menu';
                  }}
                  className="btn-filled"
                  style={{
                    textDecoration: 'none',
                    display: 'flex',
                    width: '100%',
                    justifyContent: 'center',
                    border: '1px solid var(--gold-antique)',
                    backgroundColor: 'transparent',
                    color: 'var(--text-dark)',
                    letterSpacing: '0.15em',
                    fontWeight: 600,
                    cursor: 'pointer',
                    padding: '1rem'
                  }}
                >
                  ORDER NOW
                </button>
              </motion.div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
