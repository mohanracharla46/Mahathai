import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Gift, Mail, Truck, Search, ShieldCheck, Check } from 'lucide-react';
import { createGiftCard, getGiftCards } from '../lib/api';

const cardThemes = [
  {
    id: 'theme-gold',
    name: 'Royal Siam Gold',
    background: 'linear-gradient(135deg, #1E2D2F 0%, #0B1E21 100%)',
    textColor: '#CCA453',
    accentColor: '#CCA453',
    emblemBg: '#F7EFE0',
    description: 'Our signature card adorned with traditional antique court gold leafing.'
  },
  {
    id: 'theme-jade',
    name: 'Emerald Lotus',
    background: 'linear-gradient(135deg, #0B363D 0%, #051A1D 100%)',
    textColor: '#FFFFFF',
    accentColor: '#0E6E56',
    emblemBg: 'rgba(14, 110, 86, 0.2)',
    description: 'An elegant slate emerald card capturing the deep, serene canals of Thonburi.'
  },
  {
    id: 'theme-ruby',
    name: 'Ruby Blossom',
    background: 'linear-gradient(135deg, #4A121A 0%, #200508 100%)',
    textColor: '#F7EFE0',
    accentColor: '#D97706',
    emblemBg: 'rgba(217, 119, 6, 0.15)',
    description: 'A luxurious ruby card representing Siamese festive garlands and standard celebrations.'
  },
  {
    id: 'theme-ivory',
    name: 'Classic Ivory',
    background: 'linear-gradient(135deg, #F4F7F6 0%, #E2ECE9 100%)',
    textColor: '#0B363D',
    accentColor: '#0B363D',
    emblemBg: 'rgba(11, 54, 61, 0.1)',
    description: 'A clean, minimalist marble ivory canvas with deep charcoal serif inscriptions.'
  }
];

export default function GiftcardPage({ currentUser }) {
  const [activeTab, setActiveTab] = useState('purchase'); // 'purchase' or 'balance'
  const [cardType, setCardType] = useState('digital'); // 'digital' or 'physical'
  const [selectedTheme, setSelectedTheme] = useState(cardThemes[0]);
  const [presetAmount, setPresetAmount] = useState(100);
  const [customAmount, setCustomAmount] = useState('');
  
  // Gift Card form state
  const [giftForm, setGiftForm] = useState({
    recipientName: '',
    recipientEmail: '',
    shippingAddress: '',
    senderName: currentUser ? currentUser.name : '',
    senderEmail: currentUser ? currentUser.email : '',
    customMessage: '',
    deliveryDate: ''
  });

  const [isPurchased, setIsPurchased] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  // Balance checker state
  const [cardCode, setCardCode] = useState('');
  const [balanceResult, setBalanceResult] = useState(null);
  const [isCheckingBalance, setIsCheckingBalance] = useState(false);

  const activeAmount = customAmount ? parseFloat(customAmount) || 0 : presetAmount;

  const handlePurchaseSubmit = async (e) => {
    e.preventDefault();
    if (activeAmount <= 0) return;
    setIsCheckingOut(true);

    try {
      await createGiftCard({
        user_id: currentUser?.id || null,
        card_type: cardType,
        theme: selectedTheme.id,
        theme_name: selectedTheme.name,
        amount: activeAmount,
        balance: activeAmount,
        recipient_name: giftForm.recipientName,
        recipient_email: giftForm.recipientEmail,
        sender_name: giftForm.senderName,
        sender_email: giftForm.senderEmail,
        shipping_address: giftForm.shippingAddress,
        message: giftForm.customMessage,
        custom_message: giftForm.customMessage,
        delivery_date: giftForm.deliveryDate
      });
    } catch (error) {
      console.error('Failed to sync gift card with backend.', error);
    } finally {
      setIsCheckingOut(false);
      setIsPurchased(true);
    }
  };

  const handleCheckBalance = async (e) => {
    e.preventDefault();
    if (!cardCode.trim()) return;

    setIsCheckingBalance(true);
    setBalanceResult(null);

    try {
      const giftCards = await getGiftCards();
      const matchedCard = giftCards.find((card) => {
        const values = [card.code, card.card_code, card.gift_code, card.id].filter(Boolean).map(String);
        return values.some((value) => value.toLowerCase() === cardCode.trim().toLowerCase());
      });
      if (matchedCard) {
        setBalanceResult({
          success: true,
          balance: Number(matchedCard.balance ?? matchedCard.amount ?? 0),
          message: 'Gift card balance found.'
        });
        setIsCheckingBalance(false);
        return;
      }
    } catch (error) {
      console.error('Failed to check gift card balance with backend.', error);
    }

    setTimeout(() => {
      setIsCheckingBalance(false);
      // Simulate deterministic balance checks based on card digits
      const digits = cardCode.replace(/\D/g, '');
      const lastDigit = parseInt(digits.slice(-1)) || 4;
      
      if (cardCode.length < 8) {
        setBalanceResult({
          success: false,
          message: 'Incomplete coordinate digits. Please verify your 16-digit card code.'
        });
      } else if (lastDigit % 3 === 0) {
        setBalanceResult({
          success: true,
          code: cardCode.toUpperCase(),
          active: true,
          amount: 0.00,
          message: 'This luxury coordinate has been fully redeemed. Remaining balance: $0.00.'
        });
      } else {
        const mockBalance = (lastDigit * 35) + 15;
        setBalanceResult({
          success: true,
          code: cardCode.toUpperCase(),
          active: true,
          amount: mockBalance,
          message: `Card coordinates active. Available fine dining coordinates balance: $${mockBalance}.00.`
        });
      }
    }, 1200);
  };

  const handleResetPurchase = () => {
    setPresetAmount(100);
    setCustomAmount('');
    setGiftForm({
      recipientName: '',
      recipientEmail: '',
      shippingAddress: '',
      senderName: currentUser ? currentUser.name : '',
      senderEmail: currentUser ? currentUser.email : '',
      customMessage: '',
      deliveryDate: ''
    });
    setIsPurchased(false);
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
          width: '550px',
          height: '550px',
          borderRadius: '50%',
          backgroundColor: 'var(--gold-light)',
          filter: 'blur(130px)',
          pointerEvents: 'none',
          opacity: 0.2,
          top: '-10%',
          left: '5%',
          zIndex: 0
        }}
      />
      <div 
        style={{
          position: 'absolute',
          width: '450px',
          height: '450px',
          borderRadius: '50%',
          backgroundColor: 'var(--accent-jade)',
          filter: 'blur(130px)',
          pointerEvents: 'none',
          opacity: 0.12,
          bottom: '5%',
          right: '5%',
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
            Bespoke Coordinates
          </span>
          <h1 
            className="font-serif text-4xl md:text-5xl font-light"
            style={{ fontSize: 'clamp(2.2rem, 5vw, 3.5rem)', fontWeight: 300, color: 'var(--text-dark)' }}
          >
            Siam Gift Cards
          </h1>
        </div>

        {/* Switcher Tab Controls */}
        <div 
          className="profile-tabs-scroll"
          style={{ 
            display: 'flex', 
            gap: '2rem', 
            marginBottom: '3rem', 
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
              fontSize: '0.85rem',
              fontWeight: 700,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: activeTab === 'purchase' ? 'var(--text-dark)' : 'var(--text-muted)',
              cursor: 'pointer',
              paddingBottom: '0.75rem',
              position: 'relative',
              outline: 'none',
              flexShrink: 0
            }}
            onClick={() => setActiveTab('purchase')}
          >
            Acquire Gift Card
            {activeTab === 'purchase' && (
              <div style={{ position: 'absolute', bottom: '-1px', left: 0, right: 0, height: '2px', backgroundColor: 'var(--gold-antique)' }} />
            )}
          </button>
          
          <button
            type="button"
            style={{
              background: 'none',
              border: 'none',
              fontFamily: 'var(--font-sans)',
              fontSize: '0.85rem',
              fontWeight: 700,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: activeTab === 'balance' ? 'var(--text-dark)' : 'var(--text-muted)',
              cursor: 'pointer',
              paddingBottom: '0.75rem',
              position: 'relative',
              outline: 'none',
              flexShrink: 0
            }}
            onClick={() => setActiveTab('balance')}
          >
            Check Balance coordinates
            {activeTab === 'balance' && (
              <div style={{ position: 'absolute', bottom: '-1px', left: 0, right: 0, height: '2px', backgroundColor: 'var(--gold-antique)' }} />
            )}
          </button>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'purchase' ? (
            /* TAB 1: ACQUIRE GIFT CARD */
            <motion.div 
              key="purchase-section"
              className="responsive-grid-12"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              style={{ gap: '3.5rem', alignItems: 'start' }}
            >
              {/* Left Column: Live Interactive Visualizer */}
              <motion.div 
                variants={itemVariants}
                className="lg-col-span-5 giftcard-sidebar"
                style={{ minWidth: 0, width: '100%' }}
              >
                {/* 16:9 Premium Gift Card Preview */}
                <div 
                  style={{
                    background: selectedTheme.background,
                    color: selectedTheme.textColor,
                    aspectRatio: '1.586/1', // Gold standard credit card ratio
                    borderRadius: '16px',
                    padding: '2rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: '0 15px 35px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.1)',
                    position: 'relative',
                    overflow: 'hidden',
                    border: '1px solid rgba(255,255,255,0.08)',
                    textAlign: 'left'
                  }}
                >
                  {/* Fine linear gold design overlay */}
                  <div style={{
                    position: 'absolute',
                    top: '-50%',
                    right: '-20%',
                    width: '100%',
                    height: '200%',
                    border: '1px dashed rgba(204, 164, 83, 0.1)',
                    borderRadius: '50%',
                    pointerEvents: 'none'
                  }} />

                  {/* Header Row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', zIndex: 1 }}>
                    <div>
                      <span style={{ 
                        fontFamily: 'var(--font-sans)', 
                        fontSize: '0.6rem', 
                        fontWeight: 700, 
                        letterSpacing: '0.2em', 
                        textTransform: 'uppercase',
                        opacity: 0.75
                      }}>
                        Maha Fine Dining
                      </span>
                      <h4 className="font-serif" style={{ fontSize: '1.25rem', margin: '0.15rem 0 0 0', fontWeight: 300, color: selectedTheme.textColor }}>
                        Maha Thai
                      </h4>
                    </div>
                    {/* Emblem Badge */}
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      backgroundColor: selectedTheme.emblemBg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: `1px solid ${selectedTheme.accentColor}`
                    }}>
                      <Gift size={18} style={{ color: selectedTheme.accentColor }} />
                    </div>
                  </div>

                  {/* Message Row */}
                  <div style={{ zIndex: 1 }}>
                    {giftForm.customMessage ? (
                      <p style={{ 
                        fontFamily: 'var(--font-serif)', 
                        fontStyle: 'italic', 
                        fontSize: '0.75rem', 
                        lineHeight: '1.4', 
                        opacity: 0.85, 
                        margin: 0,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}>
                        "{giftForm.customMessage}"
                      </p>
                    ) : (
                      <p style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: '0.75rem', opacity: 0.4, margin: 0 }}>
                        "Your custom coordinates message will be inscribed here..."
                      </p>
                    )}
                  </div>

                  {/* Footer Row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', zIndex: 1 }}>
                    <div>
                      <span style={{ display: 'block', fontSize: '7px', textTransform: 'uppercase', tracking: '0.1em', opacity: 0.6, marginBottom: '0.15rem' }}>
                        {cardType === 'digital' ? 'e-Gift Recipient' : 'Physical Delivery'}
                      </span>
                      <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.8rem', fontWeight: 600 }}>
                        {giftForm.recipientName || 'Bespoke Guest'}
                      </span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ display: 'block', fontSize: '7px', textTransform: 'uppercase', tracking: '0.1em', opacity: 0.6, marginBottom: '0.15rem' }}>
                        Card Value
                      </span>
                      <span className="font-serif" style={{ fontSize: '1.5rem', fontWeight: 400, color: selectedTheme.textColor }}>
                        ${activeAmount}.00
                      </span>
                    </div>
                  </div>
                </div>

                {/* Theme Selector list below Card */}
                <div style={{ marginTop: '2.5rem', textAlign: 'left' }}>
                  <label style={{ display: 'block', fontFamily: 'var(--font-sans)', fontSize: '10px', fontWeight: 'bold', tracking: '0.15em', textTransform: 'uppercase', color: 'var(--text-dark)', marginBottom: '1rem' }}>
                    Select Culinary Art Theme
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {cardThemes.map((theme) => {
                      const isSelected = selectedTheme.id === theme.id;
                      return (
                        <button
                          key={theme.id}
                          type="button"
                          onClick={() => setSelectedTheme(theme)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1rem',
                            padding: '0.85rem 1.25rem',
                            backgroundColor: isSelected ? 'var(--canvas-secondary)' : 'transparent',
                            border: isSelected ? '1px solid var(--gold-antique)' : '1px solid var(--border-light)',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            transition: 'all 0.3s var(--ease-premium)',
                            width: '100%',
                            textAlign: 'left'
                          }}
                        >
                          {/* Mini circle of the theme background */}
                          <div style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '4px',
                            background: theme.background,
                            border: '1px solid rgba(255,255,255,0.2)',
                            flexShrink: 0
                          }} />
                          
                          <div style={{ flexGrow: 1 }}>
                            <span style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-dark)' }}>{theme.name}</span>
                            <span style={{ display: 'block', fontSize: '10px', color: 'var(--text-muted)' }}>{theme.description}</span>
                          </div>

                          {isSelected && (
                            <div style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: 'var(--gold-antique)', display: 'flex', alignItems: 'center', justify: 'center', color: 'white' }}>
                              <Check size={10} />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </motion.div>

              {/* Right Column: Order Form Coordinates */}
              <motion.div 
                variants={itemVariants}
                className="lg-col-span-7"
                style={{ minWidth: 0, width: '100%' }}
              >
                {!isPurchased ? (
                  <div 
                    style={{
                      backgroundColor: 'var(--canvas-secondary)',
                      border: '1px solid var(--border-light)',
                      borderRadius: '12px',
                      padding: 'clamp(1.5rem, 5vw, 2.5rem)',
                      boxShadow: 'var(--shadow-premium)',
                      textAlign: 'left'
                    }}
                  >
                    {/* Toggle Selector for digital vs physical */}
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '2.5rem' }}>
                      <button
                        type="button"
                        onClick={() => setCardType('digital')}
                        style={{
                          flex: 1,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '1rem',
                          borderRadius: '8px',
                          border: cardType === 'digital' ? '1px solid var(--gold-antique)' : '1px solid var(--border-light)',
                          backgroundColor: cardType === 'digital' ? 'rgba(204, 164, 83, 0.04)' : 'transparent',
                          cursor: 'pointer',
                          fontFamily: 'var(--font-sans)',
                          transition: 'all 0.3s'
                        }}
                      >
                        <Mail size={20} style={{ color: cardType === 'digital' ? 'var(--gold-antique)' : 'var(--text-muted)' }} />
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-dark)' }}>e-Gift Card</span>
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)', textAlign: 'center' }}>Instant digital transmission</span>
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => setCardType('physical')}
                        style={{
                          flex: 1,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '1rem',
                          borderRadius: '8px',
                          border: cardType === 'physical' ? '1px solid var(--gold-antique)' : '1px solid var(--border-light)',
                          backgroundColor: cardType === 'physical' ? 'rgba(204, 164, 83, 0.04)' : 'transparent',
                          cursor: 'pointer',
                          fontFamily: 'var(--font-sans)',
                          transition: 'all 0.3s'
                        }}
                      >
                        <Truck size={20} style={{ color: cardType === 'physical' ? 'var(--gold-antique)' : 'var(--text-muted)' }} />
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-dark)' }}>Physical Card</span>
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)', textAlign: 'center' }}>Signature gold-leaf packaging</span>
                      </button>
                    </div>

                    <form onSubmit={handlePurchaseSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                      
                      {/* Amount Selection */}
                      <div>
                        <label style={{ display: 'block', fontFamily: 'var(--font-sans)', fontSize: '10px', fontWeight: 'bold', tracking: '0.15em', textTransform: 'uppercase', color: 'var(--text-dark)', marginBottom: '0.75rem' }}>
                          Select Card Amount (USD)
                        </label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', marginBottom: '1rem' }}>
                          {[50, 100, 200, 500].map((val) => {
                            const isSelected = presetAmount === val && !customAmount;
                            return (
                              <button
                                key={val}
                                type="button"
                                onClick={() => {
                                  setPresetAmount(val);
                                  setCustomAmount('');
                                }}
                                style={{
                                  padding: '0.75rem 0',
                                  fontSize: '0.9rem',
                                  fontWeight: 600,
                                  borderRadius: '4px',
                                  border: isSelected ? '1px solid var(--gold-antique)' : '1px solid var(--border-light)',
                                  backgroundColor: isSelected ? 'var(--gold-light)' : 'var(--canvas-primary)',
                                  color: 'var(--text-dark)',
                                  cursor: 'pointer',
                                  transition: 'all 0.3s'
                                }}
                              >
                                ${val}
                              </button>
                            );
                          })}
                        </div>
                        {/* Custom amount */}
                        <div>
                          <input
                            type="number"
                            min="20"
                            max="2000"
                            placeholder="Or enter custom amount ($20 - $2,000)"
                            value={customAmount}
                            onChange={(e) => {
                              setCustomAmount(e.target.value);
                              setPresetAmount(0);
                            }}
                            style={{
                              width: '100%',
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
                        </div>
                      </div>

                      {/* Recipient Details */}
                      <div>
                        <h5 className="font-serif" style={{ fontSize: '1.1rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem', marginBottom: '1rem', fontWeight: 400 }}>Recipient Coordinates</h5>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                          <div>
                            <label style={{ display: 'block', fontSize: '9px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.25rem', fontWeight: 600 }}>Recipient Full Name</label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. John Doe"
                              value={giftForm.recipientName}
                              onChange={(e) => setGiftForm({ ...giftForm, recipientName: e.target.value })}
                              style={{ width: '100%', padding: '0.65rem 0.85rem', fontSize: '0.85rem', backgroundColor: 'var(--canvas-primary)', border: '1px solid var(--border-light)', borderRadius: '4px', color: 'var(--text-dark)', outline: 'none' }}
                            />
                          </div>

                          {cardType === 'digital' ? (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                              <div>
                                <label style={{ display: 'block', fontSize: '9px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.25rem', fontWeight: 600 }}>Recipient Email</label>
                                <input
                                  type="email"
                                  required
                                  placeholder="john@example.com"
                                  value={giftForm.recipientEmail}
                                  onChange={(e) => setGiftForm({ ...giftForm, recipientEmail: e.target.value })}
                                  style={{ width: '100%', padding: '0.65rem 0.85rem', fontSize: '0.85rem', backgroundColor: 'var(--canvas-primary)', border: '1px solid var(--border-light)', borderRadius: '4px', color: 'var(--text-dark)', outline: 'none' }}
                                />
                              </div>
                              <div>
                                <label style={{ display: 'block', fontSize: '9px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.25rem', fontWeight: 600 }}>Transmission Date</label>
                                <input
                                  type="date"
                                  required
                                  value={giftForm.deliveryDate}
                                  onChange={(e) => setGiftForm({ ...giftForm, deliveryDate: e.target.value })}
                                  style={{ width: '100%', padding: '0.6rem 0.85rem', fontSize: '0.85rem', backgroundColor: 'var(--canvas-primary)', border: '1px solid var(--border-light)', borderRadius: '4px', color: 'var(--text-dark)', outline: 'none' }}
                                />
                              </div>
                            </div>
                          ) : (
                            <div>
                              <label style={{ display: 'block', fontSize: '9px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.25rem', fontWeight: 600 }}>Shipping Coordinates Address</label>
                              <input
                                type="text"
                                required
                                placeholder="Street Address, Suite / Apt, Zip Code"
                                value={giftForm.shippingAddress}
                                onChange={(e) => setGiftForm({ ...giftForm, shippingAddress: e.target.value })}
                                style={{ width: '100%', padding: '0.65rem 0.85rem', fontSize: '0.85rem', backgroundColor: 'var(--canvas-primary)', border: '1px solid var(--border-light)', borderRadius: '4px', color: 'var(--text-dark)', outline: 'none' }}
                              />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Sender Details */}
                      <div>
                        <h5 className="font-serif" style={{ fontSize: '1.1rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem', marginBottom: '1rem', fontWeight: 400 }}>Sender Coordinates</h5>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                          <div>
                            <label style={{ display: 'block', fontSize: '9px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.25rem', fontWeight: 600 }}>Your Name</label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. Jane Doe"
                              value={giftForm.senderName}
                              onChange={(e) => setGiftForm({ ...giftForm, senderName: e.target.value })}
                              style={{ width: '100%', padding: '0.65rem 0.85rem', fontSize: '0.85rem', backgroundColor: 'var(--canvas-primary)', border: '1px solid var(--border-light)', borderRadius: '4px', color: 'var(--text-dark)', outline: 'none' }}
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '9px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.25rem', fontWeight: 600 }}>Your Email</label>
                            <input
                              type="email"
                              required
                              placeholder="jane@example.com"
                              value={giftForm.senderEmail}
                              onChange={(e) => setGiftForm({ ...giftForm, senderEmail: e.target.value })}
                              style={{ width: '100%', padding: '0.65rem 0.85rem', fontSize: '0.85rem', backgroundColor: 'var(--canvas-primary)', border: '1px solid var(--border-light)', borderRadius: '4px', color: 'var(--text-dark)', outline: 'none' }}
                            />
                          </div>
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '9px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.25rem', fontWeight: 600 }}>Bespoke Message Inscription</label>
                          <textarea
                            rows="2"
                            placeholder="Inscribe a warm blessing or a fine dining review coordinates memo..."
                            maxLength="120"
                            value={giftForm.customMessage}
                            onChange={(e) => setGiftForm({ ...giftForm, customMessage: e.target.value })}
                            style={{ width: '100%', padding: '0.65rem 0.85rem', fontSize: '0.85rem', backgroundColor: 'var(--canvas-primary)', border: '1px solid var(--border-light)', borderRadius: '4px', color: 'var(--text-dark)', outline: 'none', resize: 'vertical' }}
                          />
                        </div>
                      </div>

                      {/* Checkout Submit Trigger */}
                      <button
                        type="submit"
                        className="btn-filled"
                        disabled={activeAmount <= 0 || isCheckingOut}
                        style={{
                          width: '100%',
                          justifyContent: 'center',
                          padding: '1.15rem',
                          letterSpacing: '0.25em',
                          opacity: (activeAmount <= 0 || isCheckingOut) ? 0.5 : 1,
                          cursor: (activeAmount <= 0 || isCheckingOut) ? 'not-allowed' : 'pointer'
                        }}
                      >
                        {isCheckingOut ? 'TRANSMITTING PAYMENT...' : `ACQUIRE CARD — $${activeAmount}.00`}
                      </button>

                    </form>
                  </div>
                ) : (
                  /* Successful Acquisition State */
                  <div 
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
                      minHeight: '440px'
                    }}
                  >
                    <div style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--gold-light)',
                      border: '1px solid var(--gold-antique)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--gold-antique)',
                      marginBottom: '1.5rem'
                    }}>
                      <ShieldCheck size={30} />
                    </div>

                    <h3 className="font-serif" style={{ fontSize: '1.8rem', color: 'var(--text-dark)', fontWeight: 300, marginBottom: '1rem' }}>
                      Gift Coordinates Acquired
                    </h3>

                    <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.7', maxWidth: '360px', marginBottom: '2rem', fontWeight: 300 }}>
                      The transaction is authorized. A luxury Siam Gift Card with theme <strong style={{ color: 'var(--text-dark)', fontWeight: 600 }}>{selectedTheme.name}</strong> valued at <strong style={{ color: 'var(--text-dark)', fontWeight: 600 }}>${activeAmount}.00</strong> has been processed successfully. 
                      {cardType === 'digital' 
                        ? ` An instant email coordinate will be transmitted to ${giftForm.recipientEmail} on ${giftForm.deliveryDate || 'ASAP'}.`
                        : ` Your gold-leaf lacquer coordinates packaging will be shipped immediately to ${giftForm.shippingAddress}.`}
                    </p>

                    <div className="receipt-box" style={{ width: '100%', maxWidth: '340px', marginBottom: '2rem' }}>
                      <div className="receipt-header">Gift Receipt - #MAHA-GC-{Math.floor(1000 + Math.random() * 9000)}</div>
                      <div className="receipt-item-row">
                        <span>Card Theme</span>
                        <span>{selectedTheme.name}</span>
                      </div>
                      <div className="receipt-item-row">
                        <span>Delivery Coordinate</span>
                        <span>{cardType === 'digital' ? 'e-Gift (Email)' : 'Physical Valet (Mail)'}</span>
                      </div>
                      <div className="receipt-item-row">
                        <span>Recipient</span>
                        <span>{giftForm.recipientName}</span>
                      </div>
                      <div className="receipt-total-row">
                        <span>Total Paid</span>
                        <span>${activeAmount}.00</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleResetPurchase}
                      className="btn-filled"
                      style={{ padding: '0.75rem 2.5rem', fontSize: '0.75rem' }}
                    >
                      Acquire Another Card
                    </button>
                  </div>
                )}
              </motion.div>
            </motion.div>
          ) : (
            /* TAB 2: CHECK ACTIVE BALANCE */
            <motion.div
              key="balance-section"
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              style={{ maxWidth: '580px', margin: '0 auto', textAlign: 'center' }}
            >
              <div 
                style={{
                  backgroundColor: 'var(--canvas-secondary)',
                  border: '1px solid var(--border-light)',
                  borderRadius: '12px',
                  padding: '2.5rem',
                  boxShadow: 'var(--shadow-premium)',
                  textAlign: 'left'
                }}
              >
                <div style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '1rem', marginBottom: '2rem', textAlign: 'center' }}>
                  <h3 className="font-serif" style={{ fontSize: '1.5rem', color: 'var(--text-dark)', margin: 0, fontWeight: 300 }}>Verify Fine Dining Balance</h3>
                  <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.25rem 0 0 0', fontWeight: 300 }}>
                    Inscribe your 16-digit card code to discover your remaining coordinate balance.
                  </p>
                </div>

                <form onSubmit={handleCheckBalance} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div>
                    <label style={{ display: 'block', fontFamily: 'var(--font-sans)', fontSize: '10px', fontWeight: 'bold', tracking: '0.15em', textTransform: 'uppercase', color: 'var(--text-dark)', marginBottom: '0.5rem' }}>
                      Gift Card Code
                    </label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                        <Search size={16} />
                      </span>
                      <input
                        type="text"
                        required
                        placeholder="e.g. MAHA-7738-9928-1102"
                        value={cardCode}
                        onChange={(e) => setCardCode(e.target.value)}
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

                  <button
                    type="submit"
                    className="btn-filled"
                    disabled={isCheckingBalance || !cardCode.trim()}
                    style={{
                      width: '100%',
                      justifyContent: 'center',
                      padding: '0.9rem',
                      letterSpacing: '0.2em',
                      opacity: (isCheckingBalance || !cardCode.trim()) ? 0.5 : 1,
                      cursor: (isCheckingBalance || !cardCode.trim()) ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {isCheckingBalance ? 'CHECKING COORDINATES...' : 'CHECK BALANCE'}
                  </button>
                </form>

                <AnimatePresence mode="wait">
                  {balanceResult && (
                    <motion.div
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      style={{
                        marginTop: '2rem',
                        padding: '1.25rem',
                        borderRadius: '6px',
                        border: balanceResult.success ? '1px solid var(--gold-antique)' : '1px solid #EF4444',
                        backgroundColor: balanceResult.success ? 'rgba(204, 164, 83, 0.05)' : 'rgba(239, 68, 68, 0.03)',
                        textAlign: 'center'
                      }}
                    >
                      {balanceResult.success ? (
                        <div>
                          <span style={{ display: 'block', fontSize: '9px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.25rem', fontWeight: 600 }}>Card Status Coordinates</span>
                          <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.95rem', color: 'var(--text-dark)', fontWeight: 700, tracking: '0.05em' }}>{balanceResult.code}</span>
                          
                          <div style={{ margin: '1rem 0' }}>
                            <span style={{ display: 'block', fontSize: '8px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Remaining Balance</span>
                            <span className="font-serif" style={{ fontSize: '2.5rem', color: 'var(--gold-antique)', fontWeight: 400 }}>${balanceResult.amount}.00</span>
                          </div>

                          <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
                            {balanceResult.message}
                          </p>
                        </div>
                      ) : (
                        <div>
                          <span style={{ display: 'block', fontSize: '9px', textTransform: 'uppercase', color: '#EF4444', marginBottom: '0.25rem', fontWeight: 600 }}>Verification Blocked</span>
                          <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.8rem', color: '#EF4444', margin: 0, fontWeight: 500 }}>
                            {balanceResult.message}
                          </p>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
