import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, ArrowLeft, Leaf, Heart, Sprout, Search, X } from 'lucide-react';
import { menuData } from './MenuSection';
import CustomizeModal from './CustomizeModal';
import { loadCustomerMenuItems } from '../lib/menuApi';

const PRICE_RANGES = [
  { label: 'All Prices', min: 0, max: Infinity },
  { label: 'Under $15', min: 0, max: 15 },
  { label: '$15 - $25', min: 15, max: 25 },
  { label: '$25 - $40', min: 25, max: 40 },
  { label: 'Above $40', min: 40, max: Infinity }
];

export default function VegetarianMenuPage({ onOpenReservation, cart = {}, addToCart, removeFromCart }) {
  const [items, setItems] = useState(menuData['Vegetarian'] || []);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPriceRange, setSelectedPriceRange] = useState(0);
  const [customizingItem, setCustomizingItem] = useState(null);

  useEffect(() => {
    loadCustomerMenuItems(true)
      .then((grouped) => setItems((grouped.Vegetarian || []).filter((item) => item.availability !== false)))
      .catch((error) => console.error('Failed to load vegetarian menu items.', error));
  }, []);

  const visibleItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const searchedItems = query
      ? items.filter((item) => (
        item.name?.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query)
      ))
      : items;
    const { min, max } = PRICE_RANGES[selectedPriceRange];
    return searchedItems.filter((item) => Number(item.price || 0) >= min && Number(item.price || 0) < max);
  }, [items, searchQuery, selectedPriceRange]);

  const hasActiveFilters = searchQuery.trim() || selectedPriceRange !== 0;

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedPriceRange(0);
  };

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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } }
  };

  return (
    <div style={{ backgroundColor: 'var(--canvas-primary)', paddingTop: '120px' }}>
      {/* Hero Banner — Earthy green tones */}
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
          background: 'linear-gradient(135deg, #1a2f1a 0%, #2d4a2d 50%, #1a3c2a 100%)'
        }}
      >
        {/* Dot pattern */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(rgba(186,155,95,0.06) 1px, transparent 0)',
          backgroundSize: '28px 28px', zIndex: 1
        }} />

        {/* Soft green glow */}
        <div style={{
          position: 'absolute',
          top: '35%', left: '50%', transform: 'translate(-50%,-50%)',
          width: '650px', height: '650px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(100,180,100,0.08) 0%, transparent 65%)',
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
            <Leaf size={18} style={{ color: '#8BC34A' }} />
            <span style={{
              fontFamily: 'var(--font-body)', fontSize: '0.75rem', fontWeight: 700,
              letterSpacing: '0.3em', textTransform: 'uppercase', color: '#8BC34A'
            }}>
              PLANT-BASED EXCELLENCE
            </span>
          </div>

          <h1 style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 300,
            color: '#FAFAF8', lineHeight: 1.1, marginBottom: '1.5rem'
          }}>
            Vegetarian Menu
          </h1>

          <div style={{
            width: '80px', height: '1px',
            background: 'linear-gradient(90deg, transparent, #8BC34A, transparent)',
            margin: '0 auto 1.5rem'
          }} />

          <p style={{
            fontFamily: 'var(--font-body)', fontSize: '1rem',
            color: 'rgba(255,255,255,0.65)', maxWidth: '520px',
            margin: '0 auto', lineHeight: 1.8, fontWeight: 300
          }}>
            A celebration of nature's finest produce — artfully prepared dishes that
            honour traditional Thai flavours through pure, plant-forward cuisine.
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
            { icon: <Leaf size={18} />, label: '100% Vegetarian' },
            { icon: <Heart size={18} />, label: 'Wholesome & Nourishing' },
            { icon: <Sprout size={18} />, label: 'Farm-to-Table Fresh' }
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
              <span style={{ color: '#6B9E3A' }}>{badge.icon}</span>
              {badge.label}
            </motion.div>
          ))}
        </div>
      </section>

      {/* Full Menu Grid */}
      <section className="menu-page-section" style={{ padding: '5rem 2rem', backgroundColor: 'var(--canvas-primary)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 'clamp(1.8rem, 3vw, 2.5rem)', fontWeight: 300,
              color: 'var(--text-dark)', marginBottom: '0.5rem'
            }}>
              Full Vegetarian Selection
            </h2>
            <p style={{
              fontFamily: 'var(--font-body)', fontSize: '0.9rem',
              color: 'var(--text-muted)', fontWeight: 300
            }}>
              {visibleItems.length} dishes available
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1rem',
            alignItems: 'center',
            margin: '0 auto 2.5rem',
            maxWidth: '980px',
            backgroundColor: 'var(--canvas-secondary)',
            border: '1px solid var(--border-light)',
            borderRadius: '8px',
            padding: '1rem'
          }}>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex' }}>
                <Search size={15} />
              </span>
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search vegetarian dishes..."
                style={{
                  width: '100%',
                  padding: '0.7rem 0.9rem 0.7rem 2.35rem',
                  border: '1px solid var(--border-light)',
                  borderRadius: '6px',
                  backgroundColor: 'var(--canvas-primary)',
                  color: 'var(--text-dark)',
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.85rem',
                  outline: 'none'
                }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem', flexWrap: 'wrap' }}>
              {PRICE_RANGES.map((range, index) => {
                const active = selectedPriceRange === index;
                return (
                  <button
                    key={range.label}
                    type="button"
                    onClick={() => setSelectedPriceRange(index)}
                    style={{
                      padding: '0.45rem 0.85rem',
                      borderRadius: '9999px',
                      border: `1px solid ${active ? '#6B9E3A' : 'var(--border-light)'}`,
                      backgroundColor: active ? '#6B9E3A' : 'var(--canvas-primary)',
                      color: active ? '#fff' : 'var(--text-muted)',
                      fontFamily: 'var(--font-body)',
                      fontSize: '0.72rem',
                      fontWeight: active ? 700 : 500,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {range.label}
                  </button>
                );
              })}
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    padding: '0.45rem 0.75rem',
                    borderRadius: '6px',
                    border: '1px solid #6B9E3A',
                    backgroundColor: 'rgba(107,158,58,0.1)',
                    color: '#6B9E3A',
                    fontFamily: 'var(--font-body)',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  <X size={12} /> Clear
                </button>
              )}
            </div>
          </div>

          <AnimatePresence mode="wait">
            {visibleItems.length === 0 ? (
              <motion.div key="empty-vegetarian" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ textAlign: 'center', padding: '4rem 1rem' }}>
                <p style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>No vegetarian dishes match this filter.</p>
                <button type="button" onClick={clearFilters} className="card-btn">Clear Filters</button>
              </motion.div>
            ) : (
            <motion.div
              key={`${searchQuery}-${selectedPriceRange}`}
              className="menu-page-grid"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: '2rem'
              }}
            >
              {visibleItems.map((item) => (
                <motion.div
                  key={item.id}
                  variants={itemVariants}
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
                    {/* Vegetarian Badge */}
                    <div style={{
                      position: 'absolute', top: '0.75rem', left: '0.75rem',
                      display: 'flex', alignItems: 'center', gap: '0.3rem',
                      backgroundColor: 'rgba(107,158,58,0.9)',
                      padding: '0.25rem 0.6rem', borderRadius: '4px',
                      backdropFilter: 'blur(4px)'
                    }}>
                      <Leaf size={10} color="#fff" />
                      <span style={{ fontSize: '9px', color: '#fff', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                        VEG
                      </span>
                    </div>
                    <div style={{
                      position: 'absolute', bottom: '0.75rem', left: '0.75rem',
                      display: 'flex', alignItems: 'center', gap: '0.25rem',
                      backgroundColor: 'rgba(255,255,255,0.95)',
                      padding: '0.25rem 0.5rem', borderRadius: '4px',
                      boxShadow: '0 2px 8px rgba(11,54,61,0.05)'
                    }}>
                      <Star size={12} fill="var(--gold-antique)" color="var(--gold-antique)" />
                      <span style={{ fontSize: '10px', color: 'var(--text-dark)', fontWeight: 'bold' }}>
                        {item.rating.toFixed(1)}
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
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeFromCart(item.id);
                                }}
                                className="qty-btn"
                                style={{ border: 'none', background: 'none', color: 'var(--text-dark)', cursor: 'pointer', fontWeight: 'bold' }}
                              >
                                -
                              </button>
                              <span className="qty-val" style={{ margin: '0 0.75rem', fontWeight: 700 }}>{quantity}</span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setCustomizingItem(item);
                                }}
                                className="qty-btn"
                                style={{ border: 'none', background: 'none', color: 'var(--text-dark)', cursor: 'pointer', fontWeight: 'bold' }}
                              >
                                +
                              </button>
                            </div>
                          );
                        }
                        return (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCustomizingItem(item);
                            }}
                            className="card-btn"
                          >
                            + Add to Cart
                          </button>
                        );
                      })()}
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

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

      {/* Cross-navigation */}
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
              { name: 'Lunch Menu', href: '#/menu/lunch' },
              { name: 'Dinner Menu', href: '#/menu/dinner' }
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
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          style={{ position: 'relative', zIndex: 2 }}
        >
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            fontFamily: 'var(--font-body)', fontSize: '0.7rem',
            fontWeight: 700, letterSpacing: '0.3em', textTransform: 'uppercase',
            color: '#8BC34A', marginBottom: '1rem'
          }}>
            <Leaf size={14} />
            GREEN DINING
          </span>
          <h2 style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)', fontWeight: 300,
            color: 'var(--canvas-primary)', marginBottom: '1.5rem'
          }}>
            Experience Plant-Forward Thai
          </h2>
          <p style={{
            fontFamily: 'var(--font-body)', fontSize: '0.95rem',
            color: 'rgba(255,255,255,0.6)', maxWidth: '450px',
            margin: '0 auto 2.5rem', lineHeight: 1.8, fontWeight: 300
          }}>
            Reserve your table and discover how our chefs transform pure, seasonal
            ingredients into extraordinary Thai dishes.
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
        </motion.div>
      </section>
    </div>
  );
}
