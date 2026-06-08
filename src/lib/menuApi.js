import { getMenuCategories, getMenuItems } from './api';
import { menuData } from '../components/MenuSection';

export const customerMenuCategories = ['Lunch', 'Dinner', 'Vegetarian'];
export const dinnerSubcategories = ['Appetizers', 'Salads', 'Soups & Claypots', 'Noodle Bar', 'Curry Kitchen', 'Rice & Wok', 'Street Kitchen', 'From the Sea', 'Chef’s Table', 'Plant-Based', 'Sweet Endings', 'Beverages & Sides'];

const fallbackMenuImage = 'https://images.unsplash.com/photo-1559314809-0d155014e29e?auto=format&fit=crop&q=80&w=600';
const resolveDinnerSubcategory = (value) => {
  const normalized = String(value || '').trim();
  return dinnerSubcategories.includes(normalized) ? normalized : '';
};

export const resolveCustomerMenuCategory = (categoryName) => {
  const normalized = String(categoryName || '').trim().toLowerCase();
  if (normalized === 'lunch') return 'Lunch';
  if (normalized === 'vegetarian' || normalized === 'plant-based' || normalized === 'plant based') return 'Vegetarian';
  return 'Dinner';
};

export const resolveMenuImage = (value, fallback = fallbackMenuImage) => {
  if (!value) return fallback;
  if (/^(https?:|data:|\/)/i.test(value)) return value;
  return fallback;
};

const normalizeOptionArray = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return value
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
          const [namePart, pricePart] = line.split(':');
          const name = String(namePart || '').trim();
          const price = Number(String(pricePart || '0').trim());
          return name ? { name, price: Number.isFinite(price) ? price : 0 } : null;
        })
        .filter(Boolean);
    }
  }
  return [];
};

export const normalizeMenuItem = (item, categoryName, subCategory = '') => ({
  id: item.id,
  name: item.name || item.title || 'Menu item',
  price: Number(item.price || 0),
  description: item.description || '',
  rating: Number(item.rating || 4.8),
  image: resolveMenuImage(item.image || item.image_url),
  availability: item.is_available ?? item.availability ?? true,
  addon_options: normalizeOptionArray(item.addon_options),
  protein_choice: normalizeOptionArray(item.protein_choice),
  spice_options: normalizeOptionArray(item.spice_options),
  size_options: normalizeOptionArray(item.size_options),
  sub_category: item.sub_category || subCategory,
  suggested_item_ids: normalizeOptionArray(item.suggested_item_ids),
  suggested_items: normalizeOptionArray(item.suggested_items)
    .map((suggestedItem) => ({
        id: suggestedItem.id,
        name: suggestedItem.name || suggestedItem.title || 'Menu item',
        price: Number(suggestedItem.price || 0),
        description: suggestedItem.description || '',
        rating: Number(suggestedItem.rating || 4.8),
        image: resolveMenuImage(suggestedItem.image || suggestedItem.image_url),
        availability: suggestedItem.is_available ?? suggestedItem.availability ?? true,
        addon_options: normalizeOptionArray(suggestedItem.addon_options),
        protein_choice: normalizeOptionArray(suggestedItem.protein_choice),
        spice_options: normalizeOptionArray(suggestedItem.spice_options),
        size_options: normalizeOptionArray(suggestedItem.size_options),
        sub_category: suggestedItem.sub_category || ''
      })),
  category: categoryName
});

export const groupCustomerMenuItems = (apiCategories, apiItems, includeFallback = true) => {
  const categoryNamesById = new Map(apiCategories.map((category) => [
    category.id,
    category.name || category.title || category.slug || 'Menu'
  ]));

  const grouped = includeFallback
    ? {
        Lunch: [...(menuData.Lunch || [])],
        Dinner: [...(menuData.Dinner || [])],
        Vegetarian: [...(menuData.Vegetarian || [])]
      }
    : { Lunch: [], Dinner: [], Vegetarian: [] };

  apiItems.forEach((item) => {
    const rawCategoryName = item.category?.name || item.menu_category?.name || categoryNamesById.get(item.category_id) || categoryNamesById.get(item.menu_category_id);
    const legacySubcategory = resolveDinnerSubcategory(rawCategoryName);
    const categoryName = resolveCustomerMenuCategory(rawCategoryName);
    grouped[categoryName] = [
      ...(grouped[categoryName] || []).filter((existing) => String(existing.id) !== String(item.id)),
      normalizeMenuItem(item, categoryName, legacySubcategory)
    ];
  });

  return grouped;
};

export const loadCustomerMenuItems = async (includeFallback = true) => {
  const [apiCategories, apiItems] = await Promise.all([
    getMenuCategories().catch(() => []),
    getMenuItems().catch(() => [])
  ]);

  return groupCustomerMenuItems(apiCategories, apiItems, includeFallback);
};
