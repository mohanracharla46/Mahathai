import { createOrder } from './api';

const normalizeCustomization = (item) => {
  const customization = item.customization || item.customizations || {};

  return {
    size: customization.size?.name ? { name: customization.size.name } : null,
    protein: customization.protein?.name ? { name: customization.protein.name } : null,
    spice: customization.spice || null,
    addons: Array.isArray(customization.addons)
      ? customization.addons.map((addon) => ({ name: addon.name }))
      : [],
    requirements: customization.requirements || item.notes || null
  };
};

export const createOrderWithItemsAndAddons = async (orderPayload, items = []) => (
  createOrder({
    ...orderPayload,
    items: items.map((item) => ({
      menu_item_id: Number(item.baseId || item.menu_item_id || item.id),
      quantity: Number(item.quantity || 1),
      customization: normalizeCustomization(item)
    }))
  })
);

export const formatOrderItemsForDisplay = (items = []) => items;

export const calculateOrderTotal = (items = []) => (
  items.reduce((total, item) => total + (Number(item.price || 0) * Number(item.quantity || 1)), 0)
);
