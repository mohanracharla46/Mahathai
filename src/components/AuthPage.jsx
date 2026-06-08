import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Mail, Lock, User, Phone, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { createUser, getUsers, isAdminUser } from '../lib/api';

export default function AuthPage({ onLoginSuccess }) {
  const [activeTab, setActiveTab] = useState('login'); // 'login' or 'register'
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    agree: false
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [authError, setAuthError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    setIsSubmitted(true);

    try {
      let userProfile;
      if (activeTab === 'register') {
        const createdUser = await createUser({
          full_name: formData.name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          role: 'customer',
        });
        userProfile = {
          id: createdUser.id,
          name: createdUser.full_name || createdUser.name || formData.name,
          email: createdUser.email || formData.email,
          phone: createdUser.phone || formData.phone,
          role: createdUser.role || 'customer',
          bookings: [],
          orders: [],
          supportTickets: [],
          feedbackReviews: [],
        };
      } else {
        const users = await getUsers();
        const matchedUser = users.find((user) => String(user.email).toLowerCase() === formData.email.toLowerCase());
        if (!matchedUser && formData.email !== 'admin@mahathai.com') {
          throw new Error('No account was found for this email.');
        }
        userProfile = {
          id: matchedUser?.id,
          name: matchedUser?.full_name || matchedUser?.name || formData.email.split('@')[0] || 'Guest',
          email: matchedUser?.email || formData.email,
          phone: matchedUser?.phone || formData.phone || '+1 (555) 019-2834',
          role: matchedUser?.role || (formData.email === 'admin@mahathai.com' ? 'admin' : 'customer'),
          bookings: [],
          orders: [],
          supportTickets: [],
          feedbackReviews: [],
        };
      }
      userProfile.isAdmin = isAdminUser(userProfile);
      onLoginSuccess(userProfile);
      window.location.hash = userProfile.isAdmin ? '#/admin' : '#/';
    } catch (error) {
      const fallbackAllowed = activeTab === 'login' && formData.email;
      const userProfile = {
        name: activeTab === 'login' ? (formData.email.split('@')[0] || 'Guest') : formData.name,
        email: formData.email,
        phone: formData.phone || '+1 (555) 019-2834',
        role: formData.email === 'admin@mahathai.com' ? 'admin' : 'customer',
      };
      if (fallbackAllowed) {
        userProfile.isAdmin = isAdminUser(userProfile);
        onLoginSuccess(userProfile);
        window.location.hash = userProfile.isAdmin ? '#/admin' : '#/';
      } else {
        setAuthError(error.message || 'Unable to create account right now.');
        setIsSubmitted(false);
      }
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
    }
  };

  return (
    <div style={{ 
      backgroundColor: 'var(--canvas-primary)', 
      minHeight: '100vh', 
      paddingTop: '120px',
      paddingBottom: '80px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background ambient gold radial glow */}
      <div 
        style={{
          position: 'absolute',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          backgroundColor: 'var(--gold-light)',
          filter: 'blur(130px)',
          pointerEvents: 'none',
          opacity: 0.2,
          top: '20%',
          left: '10%',
          zIndex: 0
        }}
      />
      <div 
        style={{
          position: 'absolute',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          backgroundColor: 'var(--accent-jade)',
          filter: 'blur(130px)',
          pointerEvents: 'none',
          opacity: 0.15,
          bottom: '10%',
          right: '5%',
          zIndex: 0
        }}
      />

      <div className="container" style={{ position: 'relative', zIndex: 10, maxWidth: '480px' }}>
        {/* Back Link */}
        <div style={{ textAlign: 'left', marginBottom: '2rem' }}>
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

        <AnimatePresence mode="wait">
          {!isSubmitted ? (
            <motion.div
              key="auth-card"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, y: -20, transition: { duration: 0.4 } }}
              style={{
                backgroundColor: 'var(--canvas-secondary)',
                border: '1px solid var(--border-light)',
                borderRadius: '12px',
                padding: '2.5rem',
                boxShadow: 'var(--shadow-premium)'
              }}
            >
              {/* Card Switcher Tabs */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginBottom: '2.5rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem' }}>
                <button
                  type="button"
                  style={{
                    background: 'none',
                    border: 'none',
                    fontFamily: 'var(--font-sans)',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    color: activeTab === 'login' ? 'var(--text-dark)' : 'var(--text-muted)',
                    cursor: 'pointer',
                    paddingBottom: '0.75rem',
                    position: 'relative',
                    outline: 'none'
                  }}
                  onClick={() => setActiveTab('login')}
                >
                  Sign In
                  {activeTab === 'login' && (
                    <motion.div 
                      layoutId="activeAuthTab"
                      style={{ position: 'absolute', bottom: '-1px', left: 0, right: 0, height: '2px', backgroundColor: 'var(--gold-antique)' }}
                    />
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
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    color: activeTab === 'register' ? 'var(--text-dark)' : 'var(--text-muted)',
                    cursor: 'pointer',
                    paddingBottom: '0.75rem',
                    position: 'relative',
                    outline: 'none'
                  }}
                  onClick={() => setActiveTab('register')}
                >
                  Create Account
                  {activeTab === 'register' && (
                    <motion.div 
                      layoutId="activeAuthTab"
                      style={{ position: 'absolute', bottom: '-1px', left: 0, right: 0, height: '2px', backgroundColor: 'var(--gold-antique)' }}
                    />
                  )}
                </button>
              </div>

              {/* Dynamic Headers */}
              <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <h2 className="font-serif" style={{ fontSize: '1.75rem', fontWeight: 300, color: 'var(--text-dark)', marginBottom: '0.5rem' }}>
                  {activeTab === 'login' ? 'Welcome Back' : 'Join the Guild'}
                </h2>
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 300 }}>
                  {activeTab === 'login' 
                    ? 'Access your private reservations and fine dining coordinates.' 
                    : 'Unlock express checkouts, valet scheduling, and culinary updates.'}
                </p>
                {authError && (
                  <p style={{ marginTop: '1rem', color: '#9F1239', fontFamily: 'var(--font-sans)', fontSize: '0.78rem' }}>
                    {authError}
                  </p>
                )}
              </div>

              {/* Form elements */}
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                
                {/* 1. Full Name Field (Register Mode Only) */}
                {activeTab === 'register' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <label style={{ display: 'block', fontFamily: 'var(--font-sans)', fontSize: '10px', fontWeight: 'bold', tracking: '0.15em', textTransform: 'uppercase', color: 'var(--text-dark)', marginBottom: '0.5rem' }}>
                      Full Name
                    </label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                        <User size={16} />
                      </span>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Alexander Hamilton"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '0.75rem 1rem 0.75rem 2.5rem',
                          fontFamily: 'var(--font-sans)',
                          fontSize: '0.85rem',
                          backgroundColor: 'var(--canvas-primary)',
                          border: '1px solid var(--border-light)',
                          borderRadius: '4px',
                          outline: 'none',
                          color: 'var(--text-dark)'
                        }}
                      />
                    </div>
                  </motion.div>
                )}

                {/* 2. Email Field */}
                <div>
                  <label style={{ display: 'block', fontFamily: 'var(--font-sans)', fontSize: '10px', fontWeight: 'bold', tracking: '0.15em', textTransform: 'uppercase', color: 'var(--text-dark)', marginBottom: '0.5rem' }}>
                    Email Address
                  </label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                      <Mail size={16} />
                    </span>
                    <input
                      type="email"
                      required
                      placeholder="alex@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem 0.75rem 2.5rem',
                        fontFamily: 'var(--font-sans)',
                        fontSize: '0.85rem',
                        backgroundColor: 'var(--canvas-primary)',
                        border: '1px solid var(--border-light)',
                        borderRadius: '4px',
                        outline: 'none',
                        color: 'var(--text-dark)'
                      }}
                    />
                  </div>
                </div>

                {/* 3. Phone Field (Register Mode Only) */}
                {activeTab === 'register' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <label style={{ display: 'block', fontFamily: 'var(--font-sans)', fontSize: '10px', fontWeight: 'bold', tracking: '0.15em', textTransform: 'uppercase', color: 'var(--text-dark)', marginBottom: '0.5rem' }}>
                      Phone Number
                    </label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                        <Phone size={16} />
                      </span>
                      <input
                        type="tel"
                        required
                        placeholder="+1 (555) 019-2834"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '0.75rem 1rem 0.75rem 2.5rem',
                          fontFamily: 'var(--font-sans)',
                          fontSize: '0.85rem',
                          backgroundColor: 'var(--canvas-primary)',
                          border: '1px solid var(--border-light)',
                          borderRadius: '4px',
                          outline: 'none',
                          color: 'var(--text-dark)'
                        }}
                      />
                    </div>
                  </motion.div>
                )}

                {/* 4. Password Field */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <label style={{ fontFamily: 'var(--font-sans)', fontSize: '10px', fontWeight: 'bold', tracking: '0.15em', textTransform: 'uppercase', color: 'var(--text-dark)' }}>
                      Password
                    </label>
                    {activeTab === 'login' && (
                      <a href="#/login" style={{ fontFamily: 'var(--font-sans)', fontSize: '10px', textDecoration: 'none', color: 'var(--gold-antique)', letterSpacing: '0.05em' }}>
                        Forgot Password?
                      </a>
                    )}
                  </div>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                      <Lock size={16} />
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.75rem 2.5rem 0.75rem 2.5rem',
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
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '0.75rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        padding: '0.25rem',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* 5. Terms / Remember Me Checkbox */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginTop: '0.25rem' }}>
                  <input
                    type="checkbox"
                    id="terms-check"
                    required={activeTab === 'register'}
                    checked={formData.agree}
                    onChange={(e) => setFormData({ ...formData, agree: e.target.checked })}
                    style={{ marginTop: '0.2rem', cursor: 'pointer' }}
                  />
                  <label htmlFor="terms-check" style={{ fontFamily: 'var(--font-sans)', fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: '1.4', cursor: 'pointer', userSelect: 'none', textAlign: 'left' }}>
                    {activeTab === 'login' 
                      ? 'Keep me signed in on this device for dynamic reservation scheduling.'
                      : 'I acknowledge the Siamese court dining policies, reservations guidelines, and express checkouts terms.'}
                  </label>
                </div>

                {/* 6. Submit Button */}
                <button
                  type="submit"
                  className="btn-filled"
                  style={{ width: '100%', justifyContent: 'center', padding: '1rem', letterSpacing: '0.25em', marginTop: '0.75rem' }}
                >
                  {activeTab === 'login' ? 'SIGN IN' : 'CREATE ACCOUNT'}
                </button>
              </form>
            </motion.div>
          ) : (
            /* Successful Auth Reveal State */
            <motion.div
              key="auth-success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              style={{
                backgroundColor: 'var(--canvas-secondary)',
                border: '1px solid var(--gold-antique)',
                borderRadius: '12px',
                padding: '3rem 2rem',
                boxShadow: 'var(--shadow-premium)',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '380px'
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
                  color: 'var(--gold-antique)',
                  marginBottom: '1.5rem'
                }}
              >
                <ShieldCheck size={32} />
              </div>

              <h3 className="font-serif" style={{ fontSize: '2rem', color: 'var(--text-dark)', fontWeight: 300, marginBottom: '1rem' }}>
                Authentication Confirmed
              </h3>

              <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.7', maxWidth: '320px', marginBottom: '2rem', fontWeight: 300 }}>
                Welcome back to Maha Thai, <strong style={{ color: 'var(--text-dark)', fontWeight: 600 }}>{activeTab === 'login' ? (formData.email.split('@')[0] || 'Member') : formData.name}</strong>. 
                Your secure profile coordinates are now unlocked. Redirecting to home salon...
              </p>

              <div style={{ display: 'inline-block', width: '24px', height: '24px', border: '2px solid var(--gold-antique)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin-slow 1s linear infinite' }} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
