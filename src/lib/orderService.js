import { createOrder, createOrderItem, bulkCreateOrderItemAddons, createOrderItemSize } from './api';

const getSelectedSize = (item) => {
  const size = item.customization?.size || item.size || null;
  if (!size?.name) return null;
  return {
    name: size.name,
    price: Number(size.price || 0)
  };
};

/**
 * Creates an order with items and their addons
 * @param {Object} orderPayload - The order details
 * @param {Array} items - Array of items with addons
 * @returns {Promise<Object>} Created order with items and addons
 */
export const createOrderWithItemsAndAddons = async (orderPayload, items = []) => {
  try {
    // Create the main order
    const order = await createOrder(orderPayload);
    
    if (!order || !order.id) {
      throw new Error('Failed to create order');
    }

    const orderId = order.id;
    const itemsWithAddons = [];

    // Create order items and their addons
    for (const item of items) {
      try {
        const selectedSize = getSelectedSize(item);
        const sizeNote = selectedSize?.name ? `Size: ${selectedSize.name}` : '';
        const selectedProtein = item.customization?.protein || null;
        const proteinNote = selectedProtein?.name ? `Protein: ${selectedProtein.name}` : '';
        const requirementsNote = item.customization?.requirements || item.notes || '';
        const orderItemPayload = {
          order_id: orderId,
          menu_item_id: item.baseId || item.id,
          quantity: item.quantity || 1,
          price: item.price || 0,
          size_name: selectedSize?.name || null,
          size_price: selectedSize?.price ?? null,
          selected_size: selectedSize?.name || null,
          size: selectedSize,
          size_option: selectedSize,
          special_notes: [sizeNote, proteinNote, requirementsNote].filter(Boolean).join(' | '),
          spice_level: item.customization?.spice || 'Medium'
        };

        let createdItem;
        try {
          createdItem = await createOrderItem(orderItemPayload);
        } catch {
          const fallbackPayload = { ...orderItemPayload };
          delete fallbackPayload.size_name;
          delete fallbackPayload.size_price;
          delete fallbackPayload.selected_size;
          delete fallbackPayload.size;
          delete fallbackPayload.size_option;
          createdItem = await createOrderItem(fallbackPayload);
        }
        
        if (createdItem && createdItem.id) {
          let savedSize = null;
          if (selectedSize) {
            try {
              savedSize = await createOrderItemSize(createdItem.id, {
                size: selectedSize,
                name: selectedSize.name,
                price: selectedSize.price
              });
            } catch (sizeError) {
              console.warn(`Failed to create size for item ${createdItem.id}:`, sizeError);
            }
          }

          itemsWithAddons.push({
            ...createdItem,
            name: item.name,
            baseId: item.baseId || item.id,
            size: savedSize?.size || savedSize || selectedSize || null,
            size_name: createdItem.size_name || savedSize?.name || selectedSize?.name || null,
            size_price: createdItem.size_price ?? savedSize?.price ?? selectedSize?.price ?? null,
            protein: selectedProtein,
            addons: []
          });

          // Create addons for this item if they exist
          if (item.customization?.addons && item.customization.addons.length > 0) {
            const addonPayloads = item.customization.addons.map(addon => ({
              name: addon.name,
              price: addon.price || 0
            }));

            try {
              const addonsResult = await bulkCreateOrderItemAddons(createdItem.id, {
                addons: addonPayloads
              });
              
              if (addonsResult && Array.isArray(addonsResult)) {
                itemsWithAddons[itemsWithAddons.length - 1].addons = addonsResult;
              }
            } catch (addonError) {
              console.warn(`Failed to create addons for item ${createdItem.id}:`, addonError);
              // Continue even if addon creation fails
            }
          }
        }
      } catch (itemError) {
        console.warn(`Failed to create order item:`, itemError);
        // Continue with next item if one fails
      }
    }

    return {
      ...order,
      items: itemsWithAddons,
      itemCount: itemsWithAddons.length
    };
  } catch (error) {
    console.error('Error creating order with items and addons:', error);
    throw error;
  }
};

/**
 * Formats order items with addons for display
 * @param {Array} items - Array of order items
 * @returns {Array} Formatted items with addons
 */
export const formatOrderItemsForDisplay = (items = []) => {
  return items.map(item => ({
    ...item,
    displayName: item.name || `Item ${item.menu_item_id}`,
    addonsList: (item.addons || []).map(addon => `${addon.name} (+$${Number(addon.price || 0).toFixed(2)})`).join(', '),
    addonsTotal: (item.addons || []).reduce((sum, addon) => sum + Number(addon.price || 0), 0),
    sizeName: item.size?.name || item.size_option?.name || item.order_item_size?.name || item.size_name || item.selected_size || '',
    totalPrice: Number(item.price || 0) + ((item.addons || []).reduce((sum, addon) => sum + Number(addon.price || 0), 0))
  }));
};

/**
 * Calculates total for order with items and addons
 * @param {Array} items - Array of order items with addons
 * @returns {number} Total price
 */
export const calculateOrderTotal = (items = []) => {
  return items.reduce((total, item) => {
    const addonsCost = (item.addons || []).reduce((sum, addon) => sum + Number(addon.price || 0), 0);
    return total + Number(item.price || 0) + addonsCost;
  }, 0);
};
