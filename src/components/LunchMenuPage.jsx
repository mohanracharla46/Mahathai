import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Sun, Clock, Leaf, Star } from 'lucide-react';
import lunchImg from '../assets/lunchimg.png';
import CustomizeModal from './CustomizeModal';
import { loadCustomerMenuItems } from '../lib/menuApi';

export default function LunchMenuPage({ onOpenReservation, cart = {}, addToCart, removeFromCart }) {
  const [lunchItems, setLunchItems] = useState([]);
  const [customizingItem, setCustomizingItem] = useState(null);
  const [appetizer, setAppetizer] = useState('Crispy Spring Roll');
  const [entree, setEntree] = useState('Basil Fried Rice 🌶️');
  const [protein, setProtein] = useState('Vegetable');
  const [spice, setSpice] = useState('Medium');
  const [addons, setAddons] = useState({
    'Chicken': false,
    'Pork': false,
    'Beef': false,
    'Extra Shrimp': false,
    'Fried Paneer/cottage Cheese': 0,
    'Soft Paneer/cottage Cheese': 0
  });
  const [requirements, setRequirements] = useState('');

  const getSelectedAddonsList = () => {
    const list = [];
    if (addons['Chicken']) {
      list.push({ name: 'Chicken', price: 2.00 });
    }
    if (addons['Pork']) {
      list.push({ name: 'Pork', price: 2.00 });
    }
    if (addons['Beef']) {
      list.push({ name: 'Beef', price: 3.50 });
    }
    if (addons['Extra Shrimp']) {
      list.push({ name: 'Extra Shrimp', price: 4.00 });
    }
    if (addons['Fried Paneer/cottage Cheese'] > 0) {
      const qty = addons['Fried Paneer/cottage Cheese'];
      list.push({
        name: `Fried Paneer/cottage Cheese (x${qty})`,
        price: 1.50 * qty
      });
    }
    if (addons['Soft Paneer/cottage Cheese'] > 0) {
      const qty = addons['Soft Paneer/cottage Cheese'];
      list.push({
        name: `Soft Paneer/cottage Cheese (x${qty})`,
        price: 1.00 * qty
      });
    }
    return list;
  };

  const getAddonsTotal = () => {
    return getSelectedAddonsList().reduce((sum, a) => sum + a.price, 0);
  };

  const appetizers = [
    'Crispy Spring Roll',
    'Crab Rangoon (2)',
    'Fried Tofu (2)'
  ];

  const entrees = [
    'Basil Fried Rice 🌶️',
    'Thai Fried Rice',
    'Curry Fried Rice',
    'Green Curry 🌶️',
    'Red Curry 🌶️',
    'Yellow Curry',
    'Panang Curry 🌶️',
    'Caramelized Pad See Ew',
    'Pad Thai',
    'Drunken Noodles 🌶️🔥',
    'Pad Wunsen'
  ];

  const proteins = [
    { name: 'Beef', extra: 3.50 },
    { name: 'Shrimp', extra: 3.50 },
    { name: 'Seafood', extra: 6.00 },
    { name: 'No Protein', extra: 0 },
    { name: 'Chicken', extra: 2.00 },
    { name: 'Fried Tofu', extra: 0 },
    { name: 'Soft Tofu', extra: 0 },
    { name: 'Vegetable', extra: 0 },
    { name: 'Extra Vegetable', extra: 2.00 },
    { name: 'Fried Paneer/cottage Cheese', extra: 1.50 },
    { name: 'Soft Paneer/cottage Cheese', extra: 1.00 }
  ];

  // Price calculations
  const getProteinExtra = (prot) => {
    const found = proteins.find(p => p.name === prot);
    return found ? found.extra : 0;
  };

  const extra = getProteinExtra(protein);
  const addonsTotal = getAddonsTotal();
  const currentPrice = 12.99 + extra + addonsTotal;

  const sanitizeForId = (str) => str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/-+$/, '').replace(/^-+/, '');
  
  const addonList = getSelectedAddonsList();
  const addonsIdPart = addonList.length > 0
    ? `-addons-${addonList.map(a => sanitizeForId(a.name)).join('-')}`
    : '';
  const reqsIdPart = requirements
    ? `-req-${requirements.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 10)}`
    : '';
  const currentItemId = `lunch-special-${sanitizeForId(appetizer)}-${sanitizeForId(entree)}-${sanitizeForId(protein)}-spice-${spice.toLowerCase()}${addonsIdPart}${reqsIdPart}`;

  const addonNames = addonList.map(a => a.name).join(', ');
  const currentItem = {
    id: currentItemId,
    name: `Lunch Special (${appetizer}, ${entree}, ${protein}, ${spice}${addonNames ? ` + ${addonNames}` : ''})`,
    price: currentPrice,
    image: lunchImg,
    description: `Lunch Combo: ${appetizer}, Soup & Salad, ${entree} with ${protein} (${spice} Spice).${addonNames ? ` Extras: ${addonNames}.` : ''}`,
    rating: 5.0,
    customizations: {
      spice,
      addons: addonList,
      requirements: requirements || ''
    }
  };

  const cartItem = cart[currentItemId];
  const quantityInCart = cartItem ? cartItem.quantity : 0;

  useEffect(() => {
    loadCustomerMenuItems(false)
      .then((grouped) => setLunchItems((grouped.Lunch || []).filter((item) => item.availability !== false)))
      .catch((error) => console.error('Failed to load lunch menu items.', error));
  }, []);

  const handleConfirmCustomization = (customization) => {
    if (!customizingItem) return;

    const addonsTotal = (customization.addons || []).reduce((sum, addon) => sum + Number(addon.price || 0), 0);
    const addonNames = (customization.addons || []).map((addon) => addon.name).join(', ');
    const selectedSize = customization.size?.name || '';
    const selectedProtein = customization.protein?.name || '';
    const proteinPrice = customization.protein ? Number(customization.protein.price || 0) : 0;
    const basePrice = customization.size ? Number(customization.size.price || 0) : Number(customizingItem.price || 0);
    const customId = [
      customizingItem.id,
      selectedSize,
      selectedProtein,
      customization.spice,
      addonNames,
      customization.requirements
    ].filter(Boolean).join('|');

    addToCart({
      ...customizingItem,
      id: customId,
      baseId: customizingItem.id,
      price: Number((basePrice + proteinPrice + addonsTotal).toFixed(2)),
      name: `${customizingItem.name} (${[selectedSize, selectedProtein, customization.spice].filter(Boolean).join(', ')})`,
      customization
    });
    setCustomizingItem(null);
  };

  return (
    <div style={{ backgroundColor: 'var(--canvas-primary)', paddingTop: '120px' }}>
      <style>{`
        .custom-option-card {
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .custom-option-card:hover {
          border-color: var(--gold-antique) !important;
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(11,54,61,0.06);
        }
        .custom-option-card:active {
          transform: translateY(0);
        }
        .lunch-layout-wrapper {
          display: grid;
          grid-template-columns: 1fr;
          gap: 3rem;
        }
        .lunch-summary-column {
          order: 2;
        }
        .lunch-options-column {
          order: 1;
        }
        @media (min-width: 1024px) {
          .lunch-layout-wrapper {
            grid-template-columns: 5fr 7fr;
            align-items: start;
          }
          .lunch-summary-column {
            order: 1;
            position: sticky;
            top: 120px;
          }
          .lunch-options-column {
            order: 2;
          }
        }
      `}</style>

      {/* Hero Banner */}
      <section
        className="menu-page-hero"
        style={{
          position: 'relative',
          minHeight: '55vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          overflow: 'hidden',
          backgroundImage: `linear-gradient(rgba(11, 54, 61, 0.85), rgba(11, 54, 61, 0.88)), url(${lunchImg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        {/* Dot pattern */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(rgba(186,155,95,0.08) 1px, transparent 0)',
          backgroundSize: '28px 28px', zIndex: 1
        }} />

        {/* Warm radial glow */}
        <div style={{
          position: 'absolute',
          top: '30%', left: '50%', transform: 'translate(-50%,-50%)',
          width: '600px', height: '600px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(186,155,95,0.12) 0%, transparent 70%)',
          zIndex: 1
        }} />

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          style={{ position: 'relative', zIndex: 3, padding: '6rem 2rem 4rem' }}
        >
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
            <ArrowLeft size={14} />
            Back to Home
          </a>

          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: '0.75rem', marginBottom: '1.5rem'
          }}>
            <Sun size={18} style={{ color: 'var(--gold-antique)' }} />
            <span style={{
              fontFamily: 'var(--font-body)', fontSize: '0.75rem', fontWeight: 700,
              letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--gold-antique)'
            }}>
              MIDDAY OFFERINGS
            </span>
          </div>

          <h1 style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 300,
            color: 'var(--canvas-primary)', lineHeight: 1.1, marginBottom: '1.5rem'
          }}>
            Lunch Menu
          </h1>

          <div style={{
            width: '80px', height: '1px',
            background: 'linear-gradient(90deg, transparent, var(--gold-antique), transparent)',
            margin: '0 auto 1.5rem'
          }} />

          <p style={{
            fontFamily: 'var(--font-body)', fontSize: '1rem',
            color: 'rgba(255,255,255,0.7)', maxWidth: '520px',
            margin: '0 auto', lineHeight: 1.8, fontWeight: 300
          }}>
            Create your custom Lunch Experience. Select one appetizer, one soup & salad of the day, 
            and one signature entrée from the selections below.
          </p>
        </motion.div>
      </section>

      {/* Info Badges */}
      <section style={{
        padding: '3rem 2rem',
        backgroundColor: 'var(--canvas-secondary)',
        borderBottom: '1px solid var(--border-light)'
      }}>
        <div className="container menu-page-badges" style={{
          display: 'flex', justifyContent: 'center', gap: '2rem', flexWrap: 'wrap'
        }}>
          {[
            { icon: <Clock size={18} />, label: 'Served Mon - Fri, 11:00 AM – 2:00 PM' },
            { icon: <Sun size={18} />, label: 'Fresh Seasonal Plates' },
            { icon: <Leaf size={18} />, label: 'Locally Sourced Ingredients' }
          ].map((badge, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.6 }}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: '1rem 1.5rem', borderRadius: '8px',
                backgroundColor: 'var(--canvas-primary)',
                border: '1px solid var(--border-light)',
                color: 'var(--text-dark)',
                fontFamily: 'var(--font-body)', fontSize: '0.8rem',
                fontWeight: 500, letterSpacing: '0.05em'
              }}
            >
              <span style={{ color: 'var(--gold-antique)' }}>{badge.icon}</span>
              {badge.label}
            </motion.div>
          ))}
        </div>
      </section>

      {/* Interactive Customizer Section */}
      <section style={{ padding: '5rem 2rem', backgroundColor: 'var(--canvas-primary)' }}>
        <div className="container">
          <div className="lunch-layout-wrapper">
            
            {/* Summary & Add to Cart Column (Sticky on Desktop, Bottom on Mobile) */}
            <div className="lunch-summary-column">
              <div style={{
                backgroundColor: 'var(--canvas-secondary)',
                border: '1px solid var(--border-light)',
                borderRadius: '12px',
                padding: '2.25rem 2rem',
                boxShadow: 'var(--shadow-premium)'
              }}>
                <div style={{ overflow: 'hidden', borderRadius: '8px', marginBottom: '1.5rem', aspectRatio: '4/3' }}>
                  <img src={lunchImg} alt="Maha Lunch Experience" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                
                <span style={{ display: 'block', fontFamily: 'var(--font-sans)', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--gold-antique)', marginBottom: '0.5rem' }}>
                  Choice Of:
                </span>
                
                <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.8rem', fontWeight: 300, color: 'var(--text-dark)', marginBottom: '0.75rem' }}>
                  Maha Lunch Experience
                </h2>
                
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '1.25rem' }}>
                  <span style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', fontWeight: 500, color: 'var(--gold-antique)' }}>
                    ${currentPrice.toFixed(2)}
                  </span>
                  <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    / person
                  </span>
                </div>
                
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 300, lineHeight: 1.6, marginBottom: '1.5rem' }}>
                  A curated multi-course midday feast. Includes your choice of one appetizer, soup & salad of the day, and one signature entrée with your choice of protein.
                </p>

                {/* Selected Summary */}
                <div style={{ 
                  backgroundColor: 'var(--canvas-primary)', 
                  border: '1px dashed var(--border-light)', 
                  borderRadius: '8px', 
                  padding: '1.25rem',
                  marginBottom: '1.75rem',
                  fontSize: '0.85rem'
                }}>
                  <span style={{ display: 'block', fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '0.75rem', color: 'var(--text-dark)' }}>
                    Your Custom Selection:
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', color: 'var(--text-muted)', fontWeight: 300 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>• Appetizer:</span>
                      <strong style={{ color: 'var(--text-dark)', fontWeight: 500 }}>{appetizer}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>• Soup & Salad:</span>
                      <strong style={{ color: 'var(--text-dark)', fontWeight: 500 }}>Soup & Salad of the Day</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>• Entrée:</span>
                      <strong style={{ color: 'var(--text-dark)', fontWeight: 500 }}>{entree}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>• Protein:</span>
                      <strong style={{ color: 'var(--text-dark)', fontWeight: 500 }}>{protein} {extra > 0 ? `(+$${extra})` : ''}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>• Spice Level:</span>
                      <strong style={{ color: 'var(--text-dark)', fontWeight: 500 }}>{spice}</strong>
                    </div>
                    {requirements && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed var(--border-light)', paddingTop: '0.6rem', marginTop: '0.2rem' }}>
                        <span>• Special Instructions:</span>
                        <strong style={{ color: 'var(--gold-antique)', fontStyle: 'italic', maxWidth: '180px', wordBreak: 'break-word', textAlign: 'right' }}>"{requirements}"</strong>
                      </div>
                    )}
                    {addonList.length > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', flexDirection: 'column', borderTop: '1px dashed var(--border-light)', paddingTop: '0.6rem', marginTop: '0.2rem' }}>
                        <span style={{ display: 'block', fontWeight: 600, fontSize: '0.75rem', marginBottom: '0.4rem', color: 'var(--text-dark)' }}>• Extras:</span>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', paddingLeft: '0.5rem' }}>
                          {addonList.map(a => (
                            <div key={a.name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                              <span>{a.name}</span>
                              <strong style={{ color: 'var(--text-dark)', fontWeight: 500 }}>+${a.price.toFixed(2)}</strong>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Button */}
                <div style={{ display: 'flex', width: '100%' }}>
                  {quantityInCart > 0 ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', border: '1px solid var(--gold-antique)', borderRadius: '4px', padding: '0.75rem 1.25rem', backgroundColor: 'var(--canvas-primary)' }}>
                      <span style={{ fontSize: '0.8rem', fontFamily: 'var(--font-sans)', fontWeight: 600, color: 'var(--text-dark)' }}>
                        In Cart: {quantityInCart}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                        <button
                          type="button"
                          onClick={() => removeFromCart(currentItemId)}
                          style={{ border: 'none', background: 'none', color: 'var(--text-dark)', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.25rem', padding: '0 0.5rem' }}
                        >
                          -
                        </button>
                        <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-dark)' }}>{quantityInCart}</span>
                        <button
                          type="button"
                          onClick={() => addToCart(currentItem)}
                          style={{ border: 'none', background: 'none', color: 'var(--text-dark)', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.25rem', padding: '0 0.5rem' }}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => addToCart(currentItem)}
                      className="btn-filled"
                      style={{ width: '100%', justifyContent: 'center', padding: '1rem 2rem', border: '1px solid var(--text-dark)' }}
                    >
                      + Add to Cart
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Customization Options Form (Right Column) */}
            <div className="lunch-options-column">
              
              {/* Appetizer Selector */}
              <div style={{ marginBottom: '3.5rem' }}>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.35rem', color: 'var(--text-dark)', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span>1. Appetizer Choice</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 300, fontFamily: 'var(--font-sans)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Choose One</span>
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
                  {appetizers.map((app) => (
                    <OptionCard
                      key={app}
                      label={app}
                      isSelected={appetizer === app}
                      onClick={() => setAppetizer(app)}
                    />
                  ))}
                </div>
              </div>

              {/* Soup & Salad of the Day */}
              <div style={{ marginBottom: '3.5rem' }}>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.35rem', color: 'var(--text-dark)', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span>2. Soup & Salad of the Day</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 300, fontFamily: 'var(--font-sans)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Included</span>
                </h3>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '1.25rem',
                  borderRadius: '8px',
                  backgroundColor: 'var(--gold-light)',
                  border: '1px dashed var(--gold-antique)',
                  color: 'var(--text-dark)'
                }}>
                  <div
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '4px',
                      backgroundColor: 'var(--gold-antique)',
                      border: '1px solid var(--gold-antique)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--text-dark)',
                      flexShrink: 0
                    }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.9rem', fontWeight: 500 }}>
                    Soup and Salad of the day (Vegetarian Only)
                  </span>
                </div>
              </div>

              {/* Entree Selection */}
              <div style={{ marginBottom: '3.5rem' }}>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.35rem', color: 'var(--text-dark)', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span>3. Entrée Selection</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 300, fontFamily: 'var(--font-sans)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Choose One</span>
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
                  {entrees.map((ent) => (
                    <OptionCard
                      key={ent}
                      label={ent}
                      isSelected={entree === ent}
                      onClick={() => setEntree(ent)}
                    />
                  ))}
                </div>
              </div>

              {/* Protein Selection */}
              <div style={{ marginBottom: '2.5rem' }}>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.35rem', color: 'var(--text-dark)', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span>4. Choice of Protein</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 300, fontFamily: 'var(--font-sans)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Choose One</span>
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
                  {proteins.map((prot) => (
                    <OptionCard
                      key={prot.name}
                      label={prot.name}
                      priceExtra={prot.extra > 0 ? `+$${prot.extra.toFixed(2)}` : null}
                      isSelected={protein === prot.name}
                      onClick={() => setProtein(prot.name)}
                    />
                  ))}
                </div>
              </div>

              {/* Spice Level */}
              <div style={{ marginBottom: '2.5rem' }}>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.35rem', color: 'var(--text-dark)', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span>5. Spicy Level</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 300, fontFamily: 'var(--font-sans)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Choose One</span>
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '1rem' }}>
                  {['Mild', 'Medium', 'Spicy', 'More Spicy'].map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setSpice(lvl)}
                      style={{
                        padding: '0.75rem 0.5rem',
                        borderRadius: '6px',
                        border: `1.5px solid ${spice === lvl ? 'var(--gold-antique)' : 'var(--border-light)'}`,
                        backgroundColor: spice === lvl ? 'var(--gold-light)' : 'var(--canvas-secondary)',
                        color: 'var(--text-dark)',
                        fontFamily: 'var(--font-sans)',
                        fontSize: '0.85rem',
                        fontWeight: spice === lvl ? 600 : 400,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        textAlign: 'center',
                        outline: 'none'
                      }}
                      className="custom-option-card"
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Add Extra */}
              <div style={{ marginBottom: '2.5rem' }}>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.35rem', color: 'var(--text-dark)', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span>6. Add Extra.</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 300, fontFamily: 'var(--font-sans)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Optional</span>
                </h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                  {/* Checkbox extras */}
                  {[
                    { id: 'Chicken', name: 'Chicken', price: 2.00 },
                    { id: 'Pork', name: 'Pork', price: 2.00 },
                    { id: 'Beef', name: 'Beef', price: 3.50 },
                    { id: 'Extra Shrimp', name: 'Extra Shrimp', price: 4.00 }
                  ].map((addon) => {
                    const isSelected = addons[addon.id];
                    return (
                      <div
                        key={addon.id}
                        onClick={() => setAddons(prev => ({ ...prev, [addon.id]: !prev[addon.id] }))}
                        className="custom-option-card"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '1rem 1.25rem',
                          borderRadius: '8px',
                          backgroundColor: isSelected ? 'var(--gold-light)' : 'var(--canvas-secondary)',
                          border: isSelected ? '2px solid var(--gold-antique)' : '1px solid var(--border-light)',
                          cursor: 'pointer',
                          userSelect: 'none',
                          boxShadow: isSelected ? 'var(--shadow-soft)' : 'none'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '4px',
                            border: isSelected ? '1px solid var(--gold-antique)' : '1px solid var(--border-medium)',
                            backgroundColor: isSelected ? 'var(--gold-antique)' : 'transparent',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--text-dark)',
                            flexShrink: 0
                          }}>
                            {isSelected && (
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            )}
                          </div>
                          <span style={{
                            fontFamily: 'var(--font-sans)',
                            fontSize: '0.88rem',
                            fontWeight: isSelected ? 600 : 400,
                            color: 'var(--text-dark)'
                          }}>
                            {addon.name}
                          </span>
                        </div>
                        <span style={{
                          fontFamily: 'var(--font-sans)',
                          fontSize: '0.85rem',
                          fontWeight: 600,
                          color: isSelected ? 'var(--text-dark)' : 'var(--text-muted)'
                        }}>
                          +${addon.price.toFixed(2)}
                        </span>
                      </div>
                    );
                  })}

                  {/* Quantity counters */}
                  {[
                    { id: 'Fried Paneer/cottage Cheese', name: 'Fried Paneer/cottage Cheese', price: 1.50 },
                    { id: 'Soft Paneer/cottage Cheese', name: 'Soft Paneer/cottage Cheese', price: 1.00 }
                  ].map((addon) => {
                    const qty = addons[addon.id];
                    const isSelected = qty > 0;
                    return (
                      <div
                        key={addon.id}
                        className="custom-option-card"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '1rem 1.25rem',
                          borderRadius: '8px',
                          backgroundColor: isSelected ? 'var(--gold-light)' : 'var(--canvas-secondary)',
                          border: isSelected ? '2px solid var(--gold-antique)' : '1px solid var(--border-light)',
                          userSelect: 'none',
                          boxShadow: isSelected ? 'var(--shadow-soft)' : 'none'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginRight: '0.25rem' }}>
                            <button
                              type="button"
                              onClick={() => setAddons(prev => ({ ...prev, [addon.id]: Math.max(0, prev[addon.id] - 1) }))}
                              style={{
                                width: '24px',
                                height: '24px',
                                borderRadius: '50%',
                                border: '1px solid var(--border-medium)',
                                backgroundColor: 'transparent',
                                color: 'var(--text-dark)',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.85rem',
                                fontWeight: 'bold',
                                outline: 'none'
                              }}
                            >
                              -
                            </button>
                            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-dark)', minWidth: '14px', textAlign: 'center' }}>
                              {qty}
                            </span>
                            <button
                              type="button"
                              onClick={() => setAddons(prev => ({ ...prev, [addon.id]: prev[addon.id] + 1 }))}
                              style={{
                                width: '24px',
                                height: '24px',
                                borderRadius: '50%',
                                border: '1px solid var(--border-medium)',
                                backgroundColor: 'transparent',
                                color: 'var(--text-dark)',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.85rem',
                                fontWeight: 'bold',
                                outline: 'none'
                              }}
                            >
                              +
                            </button>
                          </div>
                          <span style={{
                            fontFamily: 'var(--font-sans)',
                            fontSize: '0.88rem',
                            fontWeight: isSelected ? 600 : 400,
                            color: 'var(--text-dark)'
                          }}>
                            {addon.name}
                          </span>
                        </div>
                        <span style={{
                          fontFamily: 'var(--font-sans)',
                          fontSize: '0.85rem',
                          fontWeight: 600,
                          color: isSelected ? 'var(--text-dark)' : 'var(--text-muted)'
                        }}>
                          +${addon.price.toFixed(2)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Requirements / Special Instructions */}
              <div style={{ marginBottom: '2.5rem' }}>
                <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text-dark)', marginBottom: '0.6rem' }}>
                  ANY MORE REQUIREMENTS?
                </h3>
                <textarea
                  value={requirements}
                  onChange={(e) => setRequirements(e.target.value)}
                  placeholder="e.g. Allergy details, no peanuts, extra garlic, extra sauce, etc."
                  style={{
                    width: '100%',
                    minHeight: '80px',
                    padding: '0.75rem 1rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border-medium)',
                    fontSize: '0.9rem',
                    fontFamily: 'var(--font-sans)',
                    outline: 'none',
                    resize: 'vertical',
                    color: 'var(--text-dark)',
                    backgroundColor: 'var(--canvas-primary)'
                  }}
                />
              </div>

            </div>

          </div>
        </div>
      </section>

      {lunchItems.length > 0 && (
        <section className="menu-page-section" style={{ padding: '0 2rem 5rem', backgroundColor: 'var(--canvas-primary)' }}>
          <div className="container">
            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
              <h2 style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 'clamp(1.8rem, 3vw, 2.5rem)', fontWeight: 300,
                color: 'var(--text-dark)', marginBottom: '0.5rem'
              }}>
                Lunch Menu Items
              </h2>
              <p style={{
                fontFamily: 'var(--font-body)', fontSize: '0.9rem',
                color: 'var(--text-muted)', fontWeight: 300
              }}>
                {lunchItems.length} dishes available
              </p>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                className="menu-page-grid"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                  gap: '2rem'
                }}
              >
                {lunchItems.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    whileHover={{ y: -6 }}
                    transition={{ duration: 0.4 }}
                    style={{ display: 'flex', flexDirection: 'column' }}
                  >
                    <div style={{
                      overflow: 'hidden', position: 'relative', width: '100%',
                      aspectRatio: '4/3', borderRadius: '8px', marginBottom: '1.5rem'
                    }}>
                      <img src={item.image} alt={item.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease' }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                      />
                      <div style={{
                        position: 'absolute', bottom: '0.75rem', left: '0.75rem',
                        display: 'flex', alignItems: 'center', gap: '0.25rem',
                        backgroundColor: 'rgba(255,255,255,0.95)',
                        padding: '0.25rem 0.5rem', borderRadius: '4px',
                        boxShadow: '0 2px 8px rgba(11,54,61,0.05)'
                      }}>
                        <Star size={12} fill="var(--gold-antique)" color="var(--gold-antique)" />
                        <span style={{ fontSize: '10px', color: 'var(--text-dark)', fontWeight: 'bold' }}>
                          {Number(item.rating || 4.8).toFixed(1)}
                        </span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                      <div className="menu-leader-row">
                        <h3 className="menu-leader-title">{item.name}</h3>
                        <div className="menu-leader-dots" />
                        <span className="menu-leader-price">${item.price}</span>
                      </div>
                      <p className="menu-card-desc" style={{ flexGrow: 1 }}>{item.description}</p>

                      <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'flex-start' }}>
                        {(() => {
                          const cartItem = cart[item.id];
                          const quantity = cartItem ? cartItem.quantity : 0;
                          if (quantity > 0) {
                            return (
                              <div className="qty-controls" style={{ border: '1px solid var(--gold-antique)', borderRadius: '9999px', padding: '0.25rem 0.6rem' }}>
                                <button type="button" onClick={() => removeFromCart(item.id)} className="qty-btn" style={{ border: 'none', background: 'none', color: 'var(--text-dark)', cursor: 'pointer', fontWeight: 'bold' }}>-</button>
                                <span className="qty-val" style={{ margin: '0 0.75rem', fontWeight: 700 }}>{quantity}</span>
                                <button type="button" onClick={() => setCustomizingItem(item)} className="qty-btn" style={{ border: 'none', background: 'none', color: 'var(--text-dark)', cursor: 'pointer', fontWeight: 'bold' }}>+</button>
                              </div>
                            );
                          }
                          return (
                            <button type="button" onClick={() => setCustomizingItem(item)} className="card-btn">
                              + Add to Cart
                            </button>
                          );
                        })()}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>
          </div>
        </section>
      )}

      {customizingItem && (
        <CustomizeModal
          item={customizingItem}
          cart={cart}
          onClose={() => setCustomizingItem(null)}
          onConfirm={handleConfirmCustomization}
          onAddSuggestion={addToCart}
          onRemoveSuggestion={removeFromCart}
        />
      )}

      {/* Cross-navigation to other menus */}
      <section style={{
        padding: '4rem 2rem',
        backgroundColor: 'var(--canvas-secondary)',
        borderTop: '1px solid var(--border-light)',
        borderBottom: '1px solid var(--border-light)'
      }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <span style={{
            display: 'block', fontFamily: 'var(--font-body)', fontSize: '0.7rem',
            fontWeight: 700, letterSpacing: '0.3em', textTransform: 'uppercase',
            color: 'var(--gold-antique)', marginBottom: '1rem'
          }}>
            EXPLORE MORE
          </span>
          <h3 style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 'clamp(1.4rem, 2.5vw, 2rem)', fontWeight: 300,
            color: 'var(--text-dark)', marginBottom: '2rem'
          }}>
            Browse Our Other Menus
          </h3>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            {[
              { name: 'Dinner Menu', href: '#/menu/dinner' },
              { name: 'Vegetarian Menu', href: '#/menu/vegetarian' }
            ].map((link) => (
              <a key={link.name} href={link.href} style={{
                padding: '0.85rem 2rem',
                border: '1px solid var(--border-light)',
                backgroundColor: 'var(--canvas-primary)',
                color: 'var(--text-dark)',
                fontFamily: 'var(--font-body)', fontSize: '0.75rem',
                fontWeight: 600, letterSpacing: '0.15em',
                textTransform: 'uppercase', textDecoration: 'none',
                borderRadius: '4px', transition: 'all 0.3s ease'
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
                {link.name}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Reservation CTA */}
      <section style={{
        padding: '5rem 2rem', textAlign: 'center',
        backgroundColor: 'var(--text-dark)', position: 'relative', overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(rgba(186,155,95,0.06) 1px, transparent 0)',
          backgroundSize: '24px 24px'
        }} />
        <div style={{ position: 'relative', zIndex: 2 }}>
          <h2 style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)', fontWeight: 300,
            color: 'var(--canvas-primary)', marginBottom: '1.5rem'
          }}>
            Join Us for Lunch
          </h2>
          <p style={{
            fontFamily: 'var(--font-body)', fontSize: '0.95rem',
            color: 'rgba(255,255,255,0.6)', maxWidth: '450px',
            margin: '0 auto 2.5rem', lineHeight: 1.8, fontWeight: 300
          }}>
            Secure your midday table and experience the art of Thai cuisine at its finest.
          </p>
          <button
            onClick={() => onOpenReservation && onOpenReservation('reservation')}
            style={{
              padding: '1rem 2.5rem',
              border: '1px solid var(--gold-antique)',
              backgroundColor: 'var(--gold-antique)',
              color: 'var(--text-dark)',
              fontFamily: 'var(--font-body)', fontSize: '0.75rem',
              fontWeight: 700, letterSpacing: '0.2em',
              textTransform: 'uppercase', borderRadius: '2px',
              cursor: 'pointer', transition: 'all 0.4s ease'
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
            RESERVE A TABLE
          </button>
        </div>
      </section>
    </div>
  );
}

function OptionCard({ label, priceExtra, isSelected, onClick }) {
  return (
    <div
      onClick={onClick}
      className="custom-option-card"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '1rem 1.25rem',
        borderRadius: '8px',
        backgroundColor: isSelected ? 'var(--gold-light)' : 'var(--canvas-secondary)',
        border: isSelected ? '2px solid var(--gold-antique)' : '1px solid var(--border-light)',
        cursor: 'pointer',
        userSelect: 'none',
        boxShadow: isSelected ? 'var(--shadow-soft)' : 'none'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%' }}>
        {/* Custom Checkbox */}
        <div
          style={{
            width: '20px',
            height: '20px',
            borderRadius: '4px',
            border: isSelected ? '1px solid var(--gold-antique)' : '1px solid var(--border-medium)',
            backgroundColor: isSelected ? 'var(--gold-antique)' : 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-dark)',
            flexShrink: 0,
            transition: 'all 0.2s ease'
          }}
        >
          {isSelected && (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
        </div>
        <span style={{
          fontFamily: 'var(--font-sans)',
          fontSize: '0.88rem',
          fontWeight: isSelected ? 600 : 400,
          color: 'var(--text-dark)'
        }}>
          {label}
        </span>
      </div>
      {priceExtra && (
        <span style={{
          fontFamily: 'var(--font-sans)',
          fontSize: '0.85rem',
          fontWeight: 600,
          color: isSelected ? 'var(--text-dark)' : 'var(--text-muted)',
          marginLeft: '0.5rem',
          whiteSpace: 'nowrap'
        }}>
          {priceExtra}
        </span>
      )}
    </div>
  );
}
