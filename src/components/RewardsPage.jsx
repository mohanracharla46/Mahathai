import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Crown, Award, Gem, ArrowLeft, Sparkles, Gift, Coins } from 'lucide-react';
import { getUserRewards, redeemReward } from '../lib/api';

export default function RewardsPage({ currentUser, onOpenReservation, onUpdateProfile }) {
  const [estimateSpend, setEstimateSpend] = useState(150);
  const [rewardSummary, setRewardSummary] = useState(null);
  const [rewardsError, setRewardsError] = useState('');
  const [redeemedCode, setRedeemedCode] = useState('');
  const [copyMessage, setCopyMessage] = useState('');

  useEffect(() => {
    if (!currentUser?.id) {
      setRewardSummary(null);
      return;
    }

    getUserRewards(currentUser.id)
      .then(setRewardSummary)
      .catch((error) => {
        console.error('Failed to load rewards.', error);
        setRewardsError('Could not load live reward points. Showing local estimate.');
      });
  }, [currentUser?.id]);

  // Dynamic Points Tally for Logged In User
  const orders = currentUser?.orders || [];
  const bookings = currentUser?.bookings || [];
  const bookingsCount = bookings.filter(b => b.status === 'Confirmed').length;

  const basePoints = 100; // Sign-up bonus
  const orderPoints = orders.length * 10;
  const bookingPoints = bookingsCount * 50;
  const fallbackEarnedPoints = basePoints + orderPoints + bookingPoints;
  const liveBalance = rewardSummary?.balance;
  const totalEarnedPoints = liveBalance?.lifetime_points ?? fallbackEarnedPoints;
  const redeemedPoints = liveBalance?.redeemed_points ?? currentUser?.redeemedPoints ?? 0;
  const currentPoints = liveBalance?.current_points ?? Math.max(0, totalEarnedPoints - redeemedPoints);
  const rewardTransactions = rewardSummary?.transactions || [];

  // Determine Tier
  const getTier = (points) => {
    if (points >= 1500) return { name: 'Royal Diamond', color: '#B5C6E0', perk: '1.5x Multiplier, Private Tastings, Free Delivery' };
    if (points >= 500) return { name: 'Gold Tier', color: 'var(--gold-antique)', perk: '1.2x Multiplier, Priority Chef Seating' };
    return { name: 'Jade Tier', color: 'var(--accent-jade)', perk: '1x Points Multiplier, Complimentary Birthday Dessert' };
  };

  const userTier = getTier(currentPoints);

  // Points progress details
  const getNextTierDetails = (points) => {
    if (points >= 1500) return { next: 'Maximum Level Achieved', needed: 0, percentage: 100 };
    if (points >= 500) {
      const needed = 1500 - points;
      const percentage = Math.round(((points - 500) / 1000) * 100);
      return { next: 'Royal Diamond', needed, percentage };
    } else {
      const needed = 500 - points;
      const percentage = Math.round((points / 500) * 100);
      return { next: 'Gold Tier', needed, percentage };
    }
  };

  const nextTierInfo = getNextTierDetails(currentPoints);

  // Estimate rewards unlocks for slider
  const getUnlockedRewards = (spend) => {
    const pts = Math.floor(spend / 10);
    return [
      { id: 'rew-1', name: 'Complimentary Siam Appetizer', cost: 100, unlocked: pts >= 100 },
      { id: 'rew-2', name: 'Complimentary Royal Dessert', cost: 250, unlocked: pts >= 250 },
      { id: 'rew-3', name: '$15 Dining Credit', cost: 500, unlocked: pts >= 500 },
      { id: 'rew-4', name: 'Chef\'s Table Tasting for Two', cost: 1200, unlocked: pts >= 1200 }
    ];
  };

  const unlockedList = getUnlockedRewards(estimateSpend);

  // Available rewards for redemption
  const redeemableRewards = [
    { id: 'dining-credit', name: 'Dining Credit', cost: 100, discount: 1, minOrder: 0 }
  ];

  const formatMoney = (value) => Number(value || 0).toFixed(Number.isInteger(Number(value)) ? 0 : 2);

  const handleRedeem = async (reward) => {
    if (currentPoints < reward.cost) return;

    if (window.confirm(`Redeem "${reward.name}" for ${reward.cost} points? This will generate a coupon code.`)) {
      if (currentUser?.id) {
        try {
          const updatedSummary = await redeemReward(currentUser.id, {
            points: reward.cost,
            description: reward.name,
            reward_id: reward.id,
            discount_value: reward.discount,
            minimum_order_amount: reward.minOrder
          });
          setRewardSummary(updatedSummary);
          const generatedCode = updatedSummary?.promo_code?.code || '';
          setRedeemedCode(generatedCode);
          setCopyMessage('');
          setRewardsError('');
          alert(generatedCode ? `Success! Reward redeemed. Use promo code: ${generatedCode} at checkout.` : 'Success! Reward redeemed.');
        } catch (error) {
          console.error('Failed to redeem reward.', error);
          alert(error.message || 'Could not redeem reward points.');
          return;
        }
      } else {
        onUpdateProfile({
          redeemedPoints: redeemedPoints + reward.cost
        });
        alert('Success! Reward redeemed.');
      }
    }
  };

  return (
    <div style={{ backgroundColor: 'var(--canvas-primary)', minHeight: '100vh', paddingBottom: '6rem' }}>
      <style>{`
        .reward-card-interactive {
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .reward-card-interactive:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 30px rgba(11,54,61,0.08);
        }
        .estimate-slider {
          -webkit-appearance: none;
          width: 100%;
          height: 6px;
          border-radius: 9999px;
          background: var(--border-medium);
          outline: none;
          transition: background 0.3s;
        }
        .estimate-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: var(--gold-antique);
          border: 2px solid var(--text-dark);
          cursor: pointer;
          transition: transform 0.2s;
        }
        .estimate-slider::-webkit-slider-thumb:hover {
          transform: scale(1.15);
        }
      `}</style>

      {/* 1. Hero Section */}
      <section style={{
        position: 'relative',
        minHeight: '48vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        backgroundColor: 'var(--text-dark)',
        padding: '6rem 2rem 4rem 2rem',
        overflow: 'hidden'
      }}>
        {/* Radial Gold Glow */}
        <div style={{
          position: 'absolute',
          top: '40%', left: '50%', transform: 'translate(-50%, -50%)',
          width: '700px', height: '700px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(204,164,83,0.12) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />

        <div style={{ position: 'relative', zIndex: 10, maxWidth: '800px', margin: '0 auto' }}>
          <a href="#home" style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            color: 'var(--gold-antique)', textDecoration: 'none',
            fontFamily: 'var(--font-body)', fontSize: '0.75rem',
            letterSpacing: '0.2em', textTransform: 'uppercase',
            marginBottom: '2rem', transition: 'opacity 0.3s'
          }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.7'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
          >
            <ArrowLeft size={14} /> Back to Home
          </a>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Crown size={20} style={{ color: 'var(--gold-antique)' }} />
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--gold-antique)' }}>
              MAHA ROYAL CIRCLE
            </span>
          </div>

          <h1 style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 'clamp(2.5rem, 5.5vw, 4.5rem)',
            fontWeight: 300,
            color: 'var(--canvas-primary)',
            lineHeight: 1.15,
            marginBottom: '1.5rem'
          }}>
            Loyalty & Rewards
          </h1>

          <div style={{
            width: '80px', height: '1px',
            background: 'linear-gradient(90deg, transparent, var(--gold-antique), transparent)',
            margin: '0 auto 1.5rem'
          }} />

          <p style={{
            fontFamily: 'var(--font-body)', fontSize: '1rem',
            color: 'rgba(255,255,255,0.75)', maxWidth: '520px',
            margin: '0 auto', lineHeight: 1.8, fontWeight: 300
          }}>
            Indulge in Siamese culinary excellence, ascend through membership ranks, 
            and unlock exceptional dining privileges.
          </p>
        </div>
      </section>

      {/* 2. Core Rewards Panel (Dynamic States) */}
      <section style={{ marginTop: '-3rem', position: 'relative', zIndex: 20 }}>
        <div className="container">

          {currentUser ? (
            /* ==========================================================================
               LOGGED IN STATE: MEMBER DASHBOARD
               ========================================================================== */
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
              
              {/* Points Progress Dashboard (Full Width) */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                style={{
                  backgroundColor: 'var(--canvas-secondary)',
                  border: '1px solid var(--border-light)',
                  borderRadius: '16px',
                  padding: '2.5rem 2rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: 'var(--shadow-soft)'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1.5rem' }}>
                    <div>
                      <span style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--gold-antique)', fontFamily: 'var(--font-sans)' }}>
                        Active Balance
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                        <Coins size={22} style={{ color: 'var(--gold-antique)' }} />
                        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.4rem', fontWeight: 500, color: 'var(--text-dark)' }}>
                          {currentPoints} <span style={{ fontSize: '1.1rem', fontWeight: 300, color: 'var(--text-muted)' }}>Points</span>
                        </h2>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>Total Lifetime Earned</span>
                      <strong style={{ fontSize: '1rem', color: 'var(--text-dark)' }}>{totalEarnedPoints} pts</strong>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div style={{ marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.5rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Tier progress to <strong>{nextTierInfo.next}</strong></span>
                      {nextTierInfo.needed > 0 && <span style={{ color: 'var(--gold-antique)', fontWeight: 600 }}>{nextTierInfo.needed} pts needed</span>}
                    </div>
                    <div style={{ width: '100%', height: '10px', backgroundColor: 'rgba(11,54,61,0.08)', borderRadius: '9999px', overflow: 'hidden', border: '1px solid var(--border-light)' }}>
                      <div style={{ width: `${nextTierInfo.percentage}%`, height: '100%', backgroundColor: 'var(--gold-antique)', borderRadius: '9999px', transition: 'width 1s ease' }} />
                    </div>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '1.25rem' }}>
                  <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text-dark)', marginBottom: '0.5rem' }}>
                    Your Account Perks (Based on lifetime points)
                  </span>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0, fontWeight: 300 }}>
                    Current status includes: <strong style={{ color: 'var(--text-dark)' }}>{userTier.perk}</strong>. Points are accrued automatically with every online order ($10 earns 1 point). Rewards can be redeemed after 100 points.{' '}
                    <button
                      onClick={() => onOpenReservation('reservation')}
                      style={{ background: 'none', border: 'none', color: 'var(--gold-antique)', cursor: 'pointer', fontWeight: 600, padding: 0, fontSize: '0.85rem', textDecoration: 'underline', fontFamily: 'var(--font-sans)' }}
                    >
                      Book a Seating Now
                    </button>
                  </p>
                </div>
              </motion.div>

              {rewardsError && (
                <div style={{ padding: '0.9rem 1rem', border: '1px solid rgba(159,18,57,0.2)', borderRadius: '8px', backgroundColor: 'rgba(159,18,57,0.05)', color: '#9F1239', fontSize: '0.85rem', fontWeight: 600 }}>
                  {rewardsError}
                </div>
              )}

              {rewardTransactions.length > 0 && (
                <div style={{ backgroundColor: 'var(--canvas-secondary)', border: '1px solid var(--border-light)', borderRadius: '12px', padding: '1.5rem', boxShadow: 'var(--shadow-soft)' }}>
                  <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', fontWeight: 300, color: 'var(--text-dark)', marginBottom: '1rem' }}>
                    Recent Points Activity
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {rewardTransactions.slice(0, 6).map((entry) => (
                      <div key={entry.id} style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', padding: '0.85rem 1rem', backgroundColor: 'var(--canvas-primary)', border: '1px solid var(--border-light)', borderRadius: '8px' }}>
                        <div>
                          <strong style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-dark)' }}>{entry.description || (entry.type === 'earned' ? 'Order reward' : 'Reward redeemed')}</strong>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            {entry.created_at ? new Date(entry.created_at).toLocaleString() : 'Reward activity'}
                          </span>
                        </div>
                        <span style={{ fontSize: '0.9rem', fontWeight: 700, color: entry.points >= 0 ? 'var(--accent-jade)' : '#9F1239' }}>
                          {entry.points >= 0 ? '+' : ''}{entry.points} pts
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}


              {/* Redeemable Rewards Panel */}
              <div style={{ marginTop: '2.5rem' }}>
                {redeemedCode && (
                  <div style={{ marginBottom: '1.5rem', padding: '1rem 1.25rem', border: '1px solid var(--gold-antique)', borderRadius: '8px', backgroundColor: 'var(--gold-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                    <div>
                      <span style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--gold-antique)' }}>Latest Reward Code</span>
                      <strong style={{ fontSize: '1.1rem', color: 'var(--text-dark)', letterSpacing: '0.08em' }}>{redeemedCode}</strong>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard?.writeText(redeemedCode);
                        setCopyMessage('Code copied');
                        window.setTimeout(() => setCopyMessage(''), 2500);
                      }}
                      style={{ padding: '0.6rem 1rem', border: '1px solid var(--text-dark)', backgroundColor: 'var(--text-dark)', color: 'var(--canvas-primary)', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer' }}
                    >
                      Copy Code
                    </button>
                    {copyMessage && (
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent-jade)' }}>
                        {copyMessage}
                      </span>
                    )}
                  </div>
                )}
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.8rem', fontWeight: 300, color: 'var(--text-dark)', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem' }}>
                  Unleash Your Points
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                  {redeemableRewards.map((reward) => {
                    const canClaim = currentPoints >= reward.cost;
                    return (
                      <div
                        key={reward.id}
                        className="reward-card-interactive"
                        style={{
                          backgroundColor: 'var(--canvas-secondary)',
                          border: '1px solid var(--border-light)',
                          borderRadius: '12px',
                          padding: '1.75rem',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          opacity: canClaim ? 1 : 0.7
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <div style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: 'var(--gold-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold-antique)' }}>
                              <Gift size={20} />
                            </div>
                            <span style={{
                              fontFamily: 'var(--font-sans)', fontSize: '0.75rem', fontWeight: 700,
                              padding: '0.25rem 0.6rem', borderRadius: '9999px',
                              backgroundColor: canClaim ? 'var(--gold-light)' : 'rgba(0,0,0,0.06)',
                              color: canClaim ? 'var(--gold-antique)' : 'var(--text-muted)',
                              border: `1px solid ${canClaim ? 'var(--gold-antique)' : 'transparent'}`
                            }}>
                              {reward.cost} Points
                            </span>
                          </div>
                          <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', color: 'var(--text-dark)', marginBottom: '0.5rem', fontWeight: 500 }}>
                            {reward.name}
                          </h4>
                          <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 300, lineHeight: 1.5, marginBottom: '1.5rem' }}>
                            Redeem to get a custom promo code offering a flat <strong style={{ color: 'var(--text-dark)' }}>${formatMoney(reward.discount)} discount</strong>.
                          </p>
                        </div>

                        <button
                          onClick={() => handleRedeem(reward)}
                          disabled={!canClaim}
                          style={{
                            width: '100%',
                            padding: '0.75rem',
                            border: canClaim ? '1px solid var(--text-dark)' : '1px solid var(--border-medium)',
                            backgroundColor: canClaim ? 'var(--text-dark)' : 'transparent',
                            color: canClaim ? 'var(--canvas-primary)' : 'var(--text-muted)',
                            fontFamily: 'var(--font-sans)',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            letterSpacing: '0.15em',
                            textTransform: 'uppercase',
                            borderRadius: '4px',
                            cursor: canClaim ? 'pointer' : 'default',
                            transition: 'all 0.3s'
                          }}
                        >
                          {canClaim ? 'REDEEM NOW' : 'INSUFFICIENT POINTS'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            /* ==========================================================================
               GUEST STATE: TEASER & INTERACTIVE CALCULATOR
               ========================================================================== */
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '3rem' }}>
              
              {/* Interactive Point Estimator Simulator */}
              <div style={{
                backgroundColor: 'var(--canvas-secondary)',
                border: '1px solid var(--border-light)',
                borderRadius: '16px',
                padding: '2.5rem 2rem',
                boxShadow: 'var(--shadow-premium)'
              }}>
                <div style={{ textAlign: 'center', marginBottom: '2.5rem', maxWidth: '600px', margin: '0 auto 2.5rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--gold-antique)', display: 'block', marginBottom: '0.5rem' }}>
                    EXPERIENCE SIMULATOR
                  </span>
                  <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', fontWeight: 300, color: 'var(--text-dark)' }}>
                    Estimate Your Privileges
                  </h2>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 300, marginTop: '0.5rem' }}>
                    Drag the slider to adjust your estimated monthly dining spend at Maha Thai. See your points accumulation and the rewards you would unlock.
                  </p>
                </div>

                <div style={{ maxWidth: '650px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                  {/* Slider Control */}
                  <div style={{ backgroundColor: 'var(--canvas-primary)', border: '1px solid var(--border-light)', borderRadius: '12px', padding: '1.75rem 2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-dark)' }}>Estimated Spend:</span>
                      <span style={{ fontFamily: 'var(--font-heading)', fontSize: '1.8rem', fontWeight: 500, color: 'var(--gold-antique)' }}>
                        ${estimateSpend} <span style={{ fontSize: '0.85rem', fontWeight: 300, color: 'var(--text-muted)' }}>/ month</span>
                      </span>
                    </div>
                    
                    <input
                      type="range"
                      min="30"
                      max="600"
                      step="10"
                      value={estimateSpend}
                      onChange={(e) => setEstimateSpend(parseInt(e.target.value))}
                      className="estimate-slider"
                    />

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.75rem' }}>
                      <span>$30</span>
                      <span>$300</span>
                      <span>$600+</span>
                    </div>
                  </div>

                  {/* Calculated Points & Tier Display */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: '1.5rem',
                    backgroundColor: 'var(--canvas-primary)',
                    border: '1px dashed var(--border-light)',
                    borderRadius: '12px',
                    padding: '1.5rem'
                  }}>
                    <div style={{ textAlign: 'center', padding: '1rem' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Simulated Monthly Points</span>
                      <strong style={{ fontSize: '2.2rem', fontFamily: 'var(--font-heading)', color: 'var(--gold-antique)', fontWeight: 500, display: 'block', marginTop: '0.25rem' }}>
                        {Math.floor(estimateSpend / 10)}
                      </strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Live rewards add 1 point for every $10 spent</span>
                    </div>

                    <div style={{ textAlign: 'center', padding: '1rem', borderLeft: '1px solid var(--border-light)' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Projected Membership Tier</span>
                      <strong style={{ fontSize: '1.5rem', fontFamily: 'var(--font-heading)', color: getTier(Math.floor(estimateSpend / 10)).color, fontWeight: 500, display: 'block', marginTop: '0.75rem' }}>
                        {getTier(Math.floor(estimateSpend / 10)).name}
                      </strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{getTier(Math.floor(estimateSpend / 10)).perk.split(',')[0]}</span>
                    </div>
                  </div>

                  {/* Unlocked List */}
                  <div>
                    <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text-dark)', marginBottom: '0.75rem' }}>
                      Unlocked Rewards Progress:
                    </span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {unlockedList.map((reward) => (
                        <div
                          key={reward.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '1rem 1.25rem',
                            borderRadius: '8px',
                            backgroundColor: reward.unlocked ? 'var(--gold-light)' : 'rgba(0,0,0,0.03)',
                            border: `1px solid ${reward.unlocked ? 'var(--gold-antique)' : 'var(--border-light)'}`,
                            opacity: reward.unlocked ? 1 : 0.65,
                            transition: 'all 0.3s'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{
                              width: '20px', height: '20px', borderRadius: '50%',
                              backgroundColor: reward.unlocked ? 'var(--gold-antique)' : 'rgba(0,0,0,0.1)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              color: reward.unlocked ? 'var(--text-dark)' : 'var(--canvas-primary)'
                            }}>
                              {reward.unlocked ? (
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              ) : (
                                <span style={{ fontSize: '9px', fontWeight: 'bold' }}>?</span>
                              )}
                            </div>
                            <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.88rem', fontWeight: reward.unlocked ? 600 : 300, color: 'var(--text-dark)' }}>
                              {reward.name}
                            </span>
                          </div>
                          <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                            {reward.cost} pts
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              </div>

              {/* Tiers Overview */}
              <div>
                <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--gold-antique)', display: 'block', marginBottom: '0.5rem' }}>
                    MEMBERSHIP RANKS
                  </span>
                  <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', fontWeight: 300, color: 'var(--text-dark)' }}>
                    Ascend Through the Tiers
                  </h2>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                  {[
                    {
                      name: 'Jade Member',
                      points: '0 – 499 Points',
                      desc: 'Begin your culinary ascension. Accrue base points and receive classic privileges.',
                      perks: ['$10 spent earns 1 point', 'Redeem rewards after 100 points', 'Complimentary sweet treat on your birthday'],
                      icon: <Award size={24} />,
                      color: 'var(--accent-jade)'
                    },
                    {
                      name: 'Gold Elite',
                      points: '500 – 1,499 Points',
                      desc: 'A higher state of dining privileges, designed for our regular culinary connoisseurs.',
                      perks: ['1.2x points multiplier on all orders', 'Access to priority bookings during peak periods', 'Complimentary appetizer reward vouchers'],
                      icon: <Gem size={24} />,
                      color: 'var(--gold-antique)'
                    },
                    {
                      name: 'Royal Diamond',
                      points: '1,500+ Points',
                      desc: 'The ultimate culinary inner circle. Experience bespoke, high-luxury Siamese dining benefits.',
                      perks: ['1.5x points multiplier on all orders', 'Personal invitations to private Chef Tastings', 'Waived home delivery courier charges', 'Unlimited concierge booking priority'],
                      icon: <Crown size={24} />,
                      color: '#B5C6E0'
                    }
                  ].map((tier) => (
                    <div
                      key={tier.name}
                      style={{
                        backgroundColor: 'var(--canvas-secondary)',
                        border: '1px solid var(--border-light)',
                        borderRadius: '12px',
                        padding: '2.25rem 2rem',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        boxShadow: 'var(--shadow-soft)'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                          <div style={{ width: '46px', height: '46px', borderRadius: '50%', backgroundColor: 'var(--canvas-primary)', border: `1.5px solid ${tier.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: tier.color }}>
                            {tier.icon}
                          </div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>{tier.points}</span>
                        </div>
                        <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', color: 'var(--text-dark)', marginBottom: '0.5rem', fontWeight: 500 }}>
                          {tier.name}
                        </h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 300, lineHeight: 1.5, marginBottom: '1.5rem' }}>
                          {tier.desc}
                        </p>
                        
                        <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '1.25rem' }}>
                          <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text-dark)', marginBottom: '0.75rem' }}>
                            Rank Privileges:
                          </span>
                          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {tier.perks.map((perk, pIdx) => (
                              <li key={pIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 300 }}>
                                <Sparkles size={12} style={{ color: tier.color, flexShrink: 0, marginTop: '3px' }} />
                                <span>{perk}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Call to Action Banner */}
              <div style={{
                backgroundColor: 'var(--text-dark)',
                borderRadius: '16px',
                padding: '4rem 2rem',
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden',
                color: '#FFFFFF'
              }}>
                {/* Dot background */}
                <div style={{
                  position: 'absolute', inset: 0,
                  backgroundImage: 'radial-gradient(rgba(186,155,95,0.06) 1px, transparent 0)',
                  backgroundSize: '24px 24px'
                }} />
                
                <div style={{ position: 'relative', zIndex: 10 }}>
                  <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.2rem', fontWeight: 300, color: 'var(--canvas-primary)', marginBottom: '1rem' }}>
                    Begin Your Culinary Ascent
                  </h2>
                  <p style={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.65)', maxWidth: '500px', margin: '0 auto 2.5rem', lineHeight: 1.7, fontWeight: 300 }}>
                    Create an account today to enroll in the Maha Royal Circle rewards program. 
                    Start earning points with every online order and redeem rewards after 100 points.
                  </p>
                  
                  <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <a
                      href="#/login"
                      className="hero-cta-btn-gold"
                      style={{ border: 'none', padding: '1rem 2.5rem', fontSize: '0.75rem', textDecoration: 'none' }}
                    >
                      REGISTER NOW
                    </a>
                    <a
                      href="#/login"
                      style={{
                        padding: '1rem 2.5rem',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        backgroundColor: 'transparent',
                        color: '#FFFFFF',
                        fontFamily: 'var(--font-sans)', fontSize: '0.75rem',
                        fontWeight: 700, letterSpacing: '0.25em',
                        textTransform: 'uppercase', textDecoration: 'none',
                        transition: 'all 0.3s'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#FFFFFF'; e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)'; e.currentTarget.style.backgroundColor = 'transparent'; }}
                    >
                      SIGN IN
                    </a>
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>
      </section>
    </div>
  );
}
