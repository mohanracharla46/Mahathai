import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ShoppingBag, Clock, MapPin, User, Phone, Mail } from 'lucide-react';

export default function OrderDetailsTable({ orders = [], showCustomerInfo = false, isAdmin = false }) {
  const [expandedOrders, setExpandedOrders] = useState({});

  const toggleOrderExpansion = (orderId) => {
    setExpandedOrders(prev => ({
      ...prev,
      [orderId]: !prev[orderId]
    }));
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const calculateItemTotal = (item) => {
    const addonsCost = (item.addons || []).reduce((sum, addon) => sum + Number(addon.price || 0), 0);
    return Number(item.price || 0) + addonsCost;
  };

  const getOrderItemSize = (item) => {
    if (item.size?.name) return item.size.name;
    if (item.size_option?.name) return item.size_option.name;
    if (item.order_item_size?.name) return item.order_item_size.name;
    if (item.size_name || item.selected_size) return item.size_name || item.selected_size;
    const match = String(item.special_notes || '').match(/Size:\s*([^|]+)/i);
    return match ? match[1].trim() : '';
  };

  const getOrderItemProtein = (item) => {
    if (item.protein?.name) return item.protein.name;
    if (item.selected_protein) return item.selected_protein;
    const match = String(item.special_notes || '').match(/Protein:\s*([^|]+)/i);
    return match ? match[1].trim() : '';
  };

  const getSpecialNotesWithoutSize = (item) => (
    String(item.special_notes || '')
      .split('|')
      .map((part) => part.trim())
      .filter((part) => part && !/^Size:/i.test(part) && !/^Protein:/i.test(part))
      .join(' | ')
  );

  const calculateOrderTotal = (items) => {
    return items.reduce((total, item) => total + calculateItemTotal(item), 0);
  };

  const getAddonsDisplay = (addons) => {
    if (!addons || addons.length === 0) return 'No addons';
    return addons.map(addon => `${addon.name} (+$${Number(addon.price || 0).toFixed(2)})`).join(', ');
  };

  const getStatusBadgeColor = (status) => {
    const statusLower = (status || '').toLowerCase();
    if (statusLower === 'delivered' || statusLower === 'completed') return '#6B9E3A';
    if (statusLower === 'preparing') return '#BA9B5F';
    if (statusLower === 'pending') return '#FF9800';
    if (statusLower === 'cancelled') return '#E74C3C';
    return '#95A5A6';
  };

  return (
    <div style={{ width: '100%', overflow: 'x' }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: isAdmin 
          ? '1fr 1.2fr 1fr 1.2fr 1fr 0.8fr'
          : '1fr 1.2fr 1fr 1fr 0.8fr',
        gap: '1rem',
        padding: '1rem',
        backgroundColor: 'var(--canvas-secondary)',
        borderRadius: '8px',
        marginBottom: '1rem',
        borderBottom: '2px solid var(--border-light)',
        fontWeight: 600,
        fontSize: '0.85rem',
        textTransform: 'uppercase',
        color: 'var(--text-muted)',
        letterSpacing: '0.05em'
      }}>
        {isAdmin && showCustomerInfo ? (
          <>
            <div>Customer</div>
            <div>Order ID</div>
            <div>Date</div>
            <div>Items Summary</div>
            <div>Total</div>
            <div>Status</div>
          </>
        ) : (
          <>
            <div>Order ID</div>
            <div>Date</div>
            <div>Items Summary</div>
            <div>Total</div>
            <div>Status</div>
          </>
        )}
      </div>

      <AnimatePresence>
        {orders.map((order, idx) => {
          const isExpanded = expandedOrders[order.id];
          const items = order.items || [];
          const orderTotal = calculateOrderTotal(items);

          return (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, delay: idx * 0.05 }}
            >
              {/* Main Order Row */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: isAdmin 
                    ? '1fr 1.2fr 1fr 1.2fr 1fr 0.8fr'
                    : '1fr 1.2fr 1fr 1fr 0.8fr',
                  gap: '1rem',
                  padding: '1rem',
                  backgroundColor: 'var(--canvas-primary)',
                  borderRadius: '8px',
                  marginBottom: '0.5rem',
                  border: '1px solid var(--border-light)',
                  alignItems: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  hoverBackgroundColor: 'var(--canvas-secondary)'
                }}
                onClick={() => toggleOrderExpansion(order.id)}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--canvas-secondary)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--canvas-primary)'}
              >
                {isAdmin && showCustomerInfo && (
                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-dark)' }}>
                      {order.customerName || order.customer_name || 'N/A'}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                      {order.customerEmail || order.customer_email || ''}
                    </div>
                  </div>
                )}

                <div style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--gold-antique)' }}>
                  #{order.id?.toString().slice(-8) || 'N/A'}
                </div>

                <div style={{ fontSize: '0.85rem', color: 'var(--text-dark)' }}>
                  {formatDate(order.created_at || order.date)}
                </div>

                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  {items.length} item{items.length !== 1 ? 's' : ''}
                </div>

                <div style={{ fontSize: '0.85rem', color: 'var(--text-dark)' }}>
                  {items.slice(0, 2).map(item => item.name || `Item ${item.menu_item_id}`).join(', ')}
                  {items.length > 2 && `... +${items.length - 2} more`}
                </div>

                <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-dark)' }}>
                  ${orderTotal.toFixed(2)}
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.5rem'
                }}>
                  <span
                    style={{
                      padding: '0.4rem 0.8rem',
                      backgroundColor: getStatusBadgeColor(order.status),
                      color: '#fff',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      textTransform: 'uppercase'
                    }}
                  >
                    {order.status || 'Pending'}
                  </span>
                  <ChevronDown
                    size={18}
                    style={{
                      transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.3s ease',
                      color: 'var(--text-muted)'
                    }}
                  />
                </div>
              </div>

              {/* Expanded Details */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    style={{
                      overflow: 'hidden',
                      backgroundColor: 'var(--canvas-secondary)',
                      borderLeft: '2px solid var(--gold-antique)',
                      borderRight: '1px solid var(--border-light)',
                      borderBottom: '1px solid var(--border-light)',
                      borderRadius: '0 0 8px 8px',
                      marginBottom: '1rem',
                      marginTop: '-0.5rem'
                    }}
                  >
                    <div style={{ padding: '1.5rem' }}>
                      {/* Customer Info */}
                      {isAdmin && (
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(2, 1fr)',
                          gap: '1rem',
                          marginBottom: '1.5rem',
                          paddingBottom: '1.5rem',
                          borderBottom: '1px solid var(--border-light)'
                        }}>
                          <div>
                            <div style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                              Customer Name
                            </div>
                            <div style={{ fontSize: '0.9rem', color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <User size={16} />
                              {order.customerName || order.customer_name || 'N/A'}
                            </div>
                          </div>

                          <div>
                            <div style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                              Email
                            </div>
                            <div style={{ fontSize: '0.9rem', color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <Mail size={16} />
                              {order.customerEmail || order.customer_email || 'N/A'}
                            </div>
                          </div>

                          <div>
                            <div style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                              Phone
                            </div>
                            <div style={{ fontSize: '0.9rem', color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <Phone size={16} />
                              {order.customerPhone || order.customer_phone || 'N/A'}
                            </div>
                          </div>

                          <div>
                            <div style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                              Type
                            </div>
                            <div style={{ fontSize: '0.9rem', color: 'var(--text-dark)' }}>
                              {order.type || 'Delivery'}
                            </div>
                          </div>

                          {(order.address || order.delivery_address) && (
                            <div style={{ gridColumn: '1 / -1' }}>
                              <div style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                                Address
                              </div>
                              <div style={{ fontSize: '0.9rem', color: 'var(--text-dark)', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                                <MapPin size={16} style={{ marginTop: '0.2rem', flexShrink: 0 }} />
                                {order.address || order.delivery_address || 'N/A'}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Order Items */}
                      <div style={{ marginBottom: '1rem' }}>
                        <h4 style={{
                          fontSize: '0.85rem',
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          color: 'var(--text-dark)',
                          marginBottom: '1rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}>
                          <ShoppingBag size={16} />
                          Order Items
                        </h4>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          {items.map((item, itemIdx) => (
                            <div
                              key={itemIdx}
                              style={{
                                backgroundColor: 'var(--canvas-primary)',
                                padding: '0.75rem',
                                borderRadius: '6px',
                                border: '1px solid var(--border-light)'
                              }}
                            >
                              <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'flex-start',
                                marginBottom: '0.5rem'
                              }}>
                                <div>
                                  <div style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-dark)' }}>
                                    {item.name || `Item ${item.menu_item_id}`}
                                  </div>
                                  {item.spice_level && (
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                                      Spice: {item.spice_level}
                                    </div>
                                  )}
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                  <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-dark)' }}>
                                    ${Number(item.price || 0).toFixed(2)}
                                  </div>
                                  {(item.quantity || 1) > 1 && (
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                      qty: {item.quantity || 1}
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Addons */}
                              {item.addons && item.addons.length > 0 && (
                                <div style={{
                                  fontSize: '0.8rem',
                                  color: 'var(--gold-antique)',
                                  paddingTop: '0.5rem',
                                  borderTop: '1px solid var(--border-light)',
                                  marginTop: '0.5rem'
                                }}>
                                  <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Addons:</div>
                                  <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
                                    {item.addons.map((addon, addonIdx) => (
                                      <li key={addonIdx} style={{ margin: '0.2rem 0' }}>
                                        {addon.name} +${Number(addon.price || 0).toFixed(2)}
                                      </li>
                                    ))}
                                  </ul>
                                  <div style={{
                                    marginTop: '0.5rem',
                                    fontWeight: 600,
                                    color: 'var(--text-dark)'
                                  }}>
                                    Item Total: ${calculateItemTotal(item).toFixed(2)}
                                  </div>
                                </div>
                              )}

                              {getOrderItemSize(item) && (
                                <div style={{
                                  fontSize: '0.8rem',
                                  color: 'var(--text-muted)',
                                  marginTop: '0.5rem',
                                  paddingTop: '0.5rem',
                                  borderTop: '1px solid var(--border-light)'
                                }}>
                                  Size: {getOrderItemSize(item)}
                                </div>
                              )}

                              {getOrderItemProtein(item) && (
                                <div style={{
                                  fontSize: '0.8rem',
                                  color: 'var(--text-muted)',
                                  marginTop: '0.5rem',
                                  paddingTop: '0.5rem',
                                  borderTop: '1px solid var(--border-light)'
                                }}>
                                  Protein: {getOrderItemProtein(item)}
                                </div>
                              )}

                              {getSpecialNotesWithoutSize(item) && (
                                <div style={{
                                  fontSize: '0.8rem',
                                  color: 'var(--text-muted)',
                                  marginTop: '0.5rem',
                                  paddingTop: '0.5rem',
                                  borderTop: '1px solid var(--border-light)',
                                  fontStyle: 'italic'
                                }}>
                                  Special Notes: {getSpecialNotesWithoutSize(item)}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Order Summary */}
                      <div style={{
                        paddingTop: '1rem',
                        borderTop: '1px solid var(--border-light)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <div style={{
                          display: 'flex',
                          gap: '1.5rem',
                          fontSize: '0.85rem'
                        }}>
                          <div>
                            <div style={{ color: 'var(--text-muted)' }}>Items</div>
                            <div style={{ fontWeight: 600, color: 'var(--text-dark)' }}>{items.length}</div>
                          </div>
                          <div>
                            <div style={{ color: 'var(--text-muted)' }}>Subtotal</div>
                            <div style={{ fontWeight: 600, color: 'var(--text-dark)' }}>
                              ${items.reduce((sum, item) => sum + Number(item.price || 0), 0).toFixed(2)}
                            </div>
                          </div>
                          <div>
                            <div style={{ color: 'var(--text-muted)' }}>Addons</div>
                            <div style={{ fontWeight: 600, color: 'var(--gold-antique)' }}>
                              +${items.reduce((sum, item) => sum + (item.addons || []).reduce((addonSum, addon) => addonSum + Number(addon.price || 0), 0), 0).toFixed(2)}
                            </div>
                          </div>
                        </div>
                        <div style={{
                          fontSize: '1.2rem',
                          fontWeight: 600,
                          color: 'var(--gold-antique)',
                          backgroundColor: 'var(--canvas-primary)',
                          padding: '0.5rem 1rem',
                          borderRadius: '6px',
                          border: '1px solid var(--gold-antique)'
                        }}>
                          Total: ${orderTotal.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {orders.length === 0 && (
        <div style={{
          padding: '2rem',
          textAlign: 'center',
          color: 'var(--text-muted)',
          backgroundColor: 'var(--canvas-secondary)',
          borderRadius: '8px',
          border: '1px dashed var(--border-light)'
        }}>
          <ShoppingBag size={32} style={{ margin: '0 auto 0.5rem', opacity: 0.5 }} />
          <p>No orders found</p>
        </div>
      )}
    </div>
  );
}
