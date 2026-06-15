const parseJsonArray = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value !== 'string') return [];

  const trimmed = value.trim();
  if (!trimmed.startsWith('[')) return [];

  try {
    const parsed = JSON.parse(trimmed);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const getOrderItems = (order = {}) => {
  const itemSources = [order.items, order.order_items];

  for (const source of itemSources) {
    const parsed = parseJsonArray(source);
    if (parsed.length > 0) return parsed;
  }

  return [];
};

const getOptionName = (option) => {
  if (!option) return '';
  return typeof option === 'string' ? option : option.name || '';
};

export const formatOrderItem = (item) => {
  const customization = item.customization || item.customizations || {};
  const name = item.menu_item?.name || item.menuItem?.name || item.name || `Item ${item.menu_item_id || ''}`.trim();
  const quantity = Number(item.quantity || 1);
  const size = getOptionName(customization.size) || getOptionName(item.size) || item.size_name || item.selected_size || '';
  const protein = getOptionName(customization.protein) || getOptionName(item.protein) || item.selected_protein || '';
  const spice = customization.spice || item.spice_level || '';
  const addons = Array.isArray(customization.addons)
    ? customization.addons
    : (Array.isArray(item.addons) ? item.addons : []);
  const requirements = customization.requirements || item.requirements || '';
  const details = [
    size ? `Size: ${size}` : '',
    protein ? `Protein: ${protein}` : '',
    spice ? `Spice: ${spice}` : '',
    addons.length ? `Add-ons: ${addons.map((addon) => getOptionName(addon)).filter(Boolean).join(', ')}` : '',
    requirements ? `Notes: ${requirements}` : ''
  ].filter(Boolean);
  const subtotal = Number(item.subtotal ?? (Number(item.price || 0) * quantity));
  const price = Number.isFinite(subtotal) && subtotal > 0 ? ` - $${subtotal.toFixed(2)}` : '';

  return `${quantity}x ${name}${price}${details.length ? ` (${details.join('; ')})` : ''}`;
};

export const getOrderItemLines = (order = {}, fallback = 'Order items pending') => {
  const items = getOrderItems(order);
  if (items.length > 0) return items.map(formatOrderItem);

  const text = typeof order.order_items === 'string' && !order.order_items.trim().startsWith('[')
    ? order.order_items
    : (typeof order.items === 'string' ? order.items : '');

  return text
    ? text.split(/\s+\|\s+/).map((item) => item.trim()).filter(Boolean)
    : [fallback];
};
