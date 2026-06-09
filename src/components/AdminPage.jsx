import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, 
  DollarSign, 
  Briefcase,
  ShoppingBag, 
  Calendar, 
  Users, 
  Edit,
  Trash2, 
  Plus, 
  LogOut, 
  CheckCircle,
  Clock,
  X, 
  Menu, 
  Lock, 
  Mail, 
  ShieldAlert, 
  Search, 
  Filter, 
  Check,
  AlertCircle,
  Eye,
  FileText,
  Tag,
  Cpu,
  Star,
  Bell,
  MessageSquare,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Coins
} from 'lucide-react';
import { getWebsiteContent, updateWebsiteContent, defaultWebsiteContent } from '../utils/cms';
import {
  createMenuCategory,
  createMenuItem,
  createPromoCode,
  deleteMenuItem,
  getCareerApplications,
  getConciergeInquiries,
  getContactMessages,
  getFeedback,
  getMenuCategories,
  getMenuItems,
  getOrders,
  getPromoCodes,
  getReservations,
  getRewards,
  getUsers,
  isAdminUser,
  updateCareerApplication,
  updateConciergeInquiry,
  updateContactMessage,
  updateMenuItem,
  updateReservation,
  uploadMenuItemImage
} from '../lib/api';

// Initial Mock Orders if none in localStorage
const defaultMockOrders = [
  {
    id: 'o-mock1',
    date: 'May 24, 2026',
    customerName: 'John Doe',
    customerEmail: 'john@example.com',
    customerPhone: '+1 (555) 123-4567',
    items: '1x Royal Massaman Wagyu, 1x Lemongrass Lobster Soup',
    total: 82,
    type: 'Delivery',
    address: '123 Jade St, Apt 4B',
    status: 'Delivered'
  },
  {
    id: 'o-mock2',
    date: 'May 25, 2026',
    customerName: 'Sarah Connor',
    customerEmail: 'sarah@example.com',
    customerPhone: '+1 (555) 987-6543',
    items: '2x Maha Street Pad Thai, 1x Thai Iced Tea',
    total: 53,
    type: 'Pickup',
    address: 'Pickup Curbside',
    status: 'Preparing'
  },
  {
    id: 'o-mock3',
    date: 'May 25, 2026',
    customerName: 'Bruce Wayne',
    customerEmail: 'bruce@waynecorp.com',
    customerPhone: '+1 (555) 000-1939',
    items: '1x Coconut Shell Seafood (Hor Mok), 2x Northern Khao Soi',
    total: 92,
    type: 'Delivery',
    address: '1007 Mountain Drive, Gotham',
    status: 'Pending'
  }
];

// Initial Mock Bookings if none in localStorage
const defaultMockBookings = [
  {
    id: 'b-mock1',
    date: 'May 30, 2026',
    time: '19:00 Seating',
    guests: 4,
    notes: 'Gluten allergy in party. Celebrating a promotion.',
    customerName: 'Alice Smith',
    customerEmail: 'alice@example.com',
    customerPhone: '+1 (555) 555-0199',
    status: 'Pending'
  },
  {
    id: 'b-mock2',
    date: 'Jun 02, 2026',
    time: '20:30 Seating',
    guests: 2,
    notes: 'Anniversary dinner. Quiet corner table requested.',
    customerName: 'Bob Jones',
    customerEmail: 'bob@gmail.com',
    customerPhone: '+1 (555) 444-3322',
    status: 'Pending'
  },
  {
    id: 'b-mock3',
    date: 'May 24, 2026',
    time: '18:00 Seating',
    guests: 6,
    notes: 'Chef\'s Table tasting menu.',
    customerName: 'VIP Patron',
    customerEmail: 'vip@mahathai.com',
    customerPhone: '+1 (555) 999-8888',
    status: 'Pending'
  }
];

// Initial Mock Coupons if none in localStorage
const defaultMockCoupons = [
  {
    id: 'c-mock1',
    code: 'WELCOME10',
    type: 'percentage',
    value: 10,
    minOrder: 30,
    expiryDate: '2026-12-31',
    status: 'Active'
  },
  {
    id: 'c-mock2',
    code: 'MAHAFEAST',
    type: 'flat',
    value: 15,
    minOrder: 80,
    expiryDate: '2026-09-30',
    status: 'Active'
  },
  {
    id: 'c-mock3',
    code: 'SIAMVIP25',
    type: 'percentage',
    value: 25,
    minOrder: 120,
    expiryDate: '2026-06-30',
    status: 'Inactive'
  }
];

const normalizeApiOrder = (order) => ({
  id: order.id,
  userId: order.user_id || order.user?.id || null,
  createdAt: order.created_at || order.order_date || order.date || '',
  date: formatAdminDate(order.created_at || order.order_date || order.date),
  customerName: order.full_name || order.name || order.customer_name || order.user?.full_name || order.user?.name || 'Guest',
  customerEmail: order.email || order.customer_email || order.user?.email || 'guest@example.com',
  customerPhone: order.phone || order.phone_number || order.user?.phone || 'N/A',
  items: order.order_items || (
    order.items?.length
    ? order.items.map(formatApiOrderItemSummary).join(', ')
    : 'Order items pending'
  ),
  total: Number(order.total_amount || 0),
  type: order.service_type === 'pickup' || order.order_type === 'pickup' ? 'Pickup' : 'Delivery',
  address: order.delivery_address || 'Pickup',
  status: order.status ? order.status.charAt(0).toUpperCase() + order.status.slice(1) : 'Pending',
});

const getOrderItemSize = (item) => {
  if (item.size?.name) return item.size.name;
  if (item.size_option?.name) return item.size_option.name;
  if (item.order_item_size?.name) return item.order_item_size.name;
  if (item.size_name || item.selected_size) return item.size_name || item.selected_size;
  const match = String(item.special_notes || '').match(/Size:\s*([^|]+)/i);
  return match ? match[1].trim() : '';
};

const formatApiOrderItemSummary = (item) => {
  const name = item.menu_item?.name || item.menuItem?.name || item.name || 'Menu item';
  const size = getOrderItemSize(item);
  const proteinMatch = String(item.special_notes || '').match(/Protein:\s*([^|]+)/i);
  const protein = item.protein?.name || item.selected_protein || (proteinMatch ? proteinMatch[1].trim() : '');
  const spice = item.spice_level ? `Spice: ${item.spice_level}` : '';
  const addons = Array.isArray(item.addons) && item.addons.length > 0
    ? `Add-ons: ${item.addons.map((addon) => addon.name).join(', ')}`
    : '';
  const details = [spice, protein ? `Protein: ${protein}` : '', addons, size ? `Size: ${size}` : ''].filter(Boolean).join('; ');
  return `${item.quantity || 1}x ${name}${details ? ` [${details}]` : ''}`;
};

const normalizeApiPromoCode = (promoCode) => ({
  id: promoCode.id,
  code: promoCode.code,
  type: promoCode.discount_type === 'fixed' ? 'flat' : promoCode.discount_type,
  value: Number(promoCode.discount_value || 0),
  minOrder: Number(promoCode.minimum_order_amount || 0),
  expiryDate: promoCode.end_date ? promoCode.end_date.slice(0, 10) : '',
  status: promoCode.is_active ? 'Active' : 'Inactive',
});

const formatAdminDate = (value) => {
  if (!value) return 'Not scheduled';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

const formatAdminTime = (value) => {
  if (!value) return 'Time pending';
  const [hours, minutes] = String(value).split(':');
  if (hours === undefined || minutes === undefined) return value;
  const date = new Date();
  date.setHours(Number(hours), Number(minutes), 0, 0);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit'
  });
};

const normalizeApiReservation = (booking) => ({
  id: booking.id,
  date: formatAdminDate(booking.preferred_date || booking.reservation_date || booking.date || ''),
  time: formatAdminTime(booking.seating_time || booking.reservation_time || booking.time || ''),
  guests: booking.guest_count || booking.guests || booking.party_size || 2,
  notes: booking.special_notes || booking.notes || '',
  status: booking.status ? booking.status.charAt(0).toUpperCase() + booking.status.slice(1) : 'Pending',
  customerName: booking.name || booking.full_name || booking.customer_name || booking.user?.full_name || booking.user?.name || 'Guest',
  customerEmail: booking.email || booking.customer_email || booking.user?.email || 'guest@example.com',
  customerPhone: booking.phone || booking.phone_number || booking.user?.phone || 'N/A',
});

const normalizeApiUser = (user) => ({
  id: user.id,
  name: user.name || user.full_name || user.email?.split('@')[0] || 'Guest',
  email: user.email || 'N/A',
  phone: user.phone || user.phone_number || 'N/A',
  role: user.role || 'customer',
  ordersCount: user.orders_count || user.orders?.length || 0,
  bookingsCount: user.reservations_count || user.bookings_count || user.reservations?.length || 0,
  rewardPoints: user.reward_balance?.current_points || 0,
  createdAt: user.created_at || '',
  lastOrderedOn: '',
  followingEmail: Boolean(user.following_email),
  followingSms: Boolean(user.following_sms),
  pointsRemaining: Number(user.points_remaining || user.reward_balance?.current_points || 0),
});

const normalizeApiFeedback = (feedback) => ({
  id: feedback.id,
  userId: feedback.user_id || feedback.user?.id || null,
  experience: feedback.dining_experience || feedback.experience || feedback.subject || 'Dining Experience',
  rating: Number(feedback.rating || 5),
  comment: feedback.review_notes || feedback.comment || feedback.message || '',
  date: feedback.created_at ? new Date(feedback.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : feedback.date || '',
  customerName: feedback.customer_name || feedback.name || feedback.user?.full_name || feedback.user?.name || 'Guest',
  customerEmail: feedback.customer_email || feedback.email || feedback.user?.email || 'guest@example.com',
  approved: feedback.approved ?? feedback.is_approved ?? false,
});

const normalizeApiCareerApplication = (application) => ({
  id: application.id,
  name: application.name || application.full_name || application.applicant_name || 'Applicant',
  email: application.email || application.applicant_email || 'N/A',
  phone: application.phone || application.phone_number || 'N/A',
  position: application.position || application.position_applied || application.job_title || 'General Application',
  experience: application.experience_level || application.experience || application.years_experience || 'N/A',
  message: application.about || application.message || application.cover_letter || application.notes || '',
  status: application.status
    ? String(application.status).charAt(0).toUpperCase() + String(application.status).slice(1).toLowerCase()
    : 'Pending',
  date: application.created_at
    ? new Date(application.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : application.date || '',
});

const normalizeApiContactMessage = (message) => ({
  id: message.id,
  name: message.name || message.full_name || message.user?.name || 'Guest',
  email: message.email || message.user?.email || 'N/A',
  phone: message.phone || message.phone_number || 'N/A',
  subject: message.subject || message.inquiry_type || 'Contact Message',
  message: message.message || message.notes || message.body || '',
  status: message.status
    ? String(message.status).charAt(0).toUpperCase() + String(message.status).slice(1).toLowerCase()
    : 'Pending',
  date: message.created_at
    ? new Date(message.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : message.date || '',
});

const normalizeApiConciergeInquiry = (inquiry) => ({
  id: inquiry.id,
  userId: inquiry.user_id || inquiry.user?.id || null,
  name: inquiry.user?.full_name || inquiry.user?.name || inquiry.name || 'Guest',
  email: inquiry.user?.email || inquiry.email || 'N/A',
  phone: inquiry.user?.phone || inquiry.phone || inquiry.phone_number || 'N/A',
  message: inquiry.message || inquiry.inquiry || '',
  response: inquiry.response || '',
  status: inquiry.status
    ? String(inquiry.status).charAt(0).toUpperCase() + String(inquiry.status).slice(1).replace('_', ' ').toLowerCase()
    : 'Open',
  date: inquiry.created_at
    ? new Date(inquiry.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : inquiry.date || '',
});

const getApiRecord = (payload) => payload?.data || payload?.record || payload?.application || payload;

const PAGE_SIZE = 10;
const fallbackMenuItemImage = 'https://images.unsplash.com/photo-1559314809-0d155014e29e?auto=format&fit=crop&q=80&w=200';
const dinnerSubcategories = ['Appetizers', 'Salads', 'Soups & Claypots', 'Soups & Regional', 'Noodle Bar', 'Curry Kitchen', 'Rice & Wok', 'Street Kitchen', 'From the Sea', 'Chef’s Table', 'Plant-Based', 'Sweet Endings', 'Beverages & Sides'];
const customerMenuCategories = ['Lunch', 'Dinner', 'Vegetarian'];
const adminMenuCategoryNames = [...dinnerSubcategories, ...customerMenuCategories];
const defaultDinnerSubcategory = dinnerSubcategories[0];
const menuPriceRanges = [
  { label: 'All Prices', min: 0, max: Infinity },
  { label: 'Under $15', min: 0, max: 15 },
  { label: '$15 - $25', min: 15, max: 25 },
  { label: '$25 - $40', min: 25, max: 40 },
  { label: 'Above $40', min: 40, max: Infinity }
];

const isDinnerSubcategory = (category) => dinnerSubcategories.includes(String(category || '').trim());

const normalizeApiOptionArray = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

const getPaginatedRows = (response) => {
  const rows = response?.data || response;
  return Array.isArray(rows) ? rows : [];
};

const getPaginatedTotal = (response, fallbackLength) => (
  response?.total ?? response?.meta?.total ?? fallbackLength
);

const getSortableIdValue = (id) => {
  const numericId = Number(id);
  if (Number.isFinite(numericId)) return numericId;
  const match = String(id || '').match(/\d+/);
  return match ? Number(match[0]) : Number.POSITIVE_INFINITY;
};

const sortByIdAscending = (records) => [...records].sort((a, b) => {
  const numericDiff = getSortableIdValue(a.id) - getSortableIdValue(b.id);
  if (numericDiff !== 0) return numericDiff;
  return String(a.id || '').localeCompare(String(b.id || ''), undefined, { numeric: true });
});

const normalizeMatchValue = (value) => String(value || '').trim().toLowerCase();
const isUsableMatchValue = (value) => {
  const normalized = normalizeMatchValue(value);
  return normalized && normalized !== 'n/a' && normalized !== 'guest@example.com';
};

const userMatchesRecord = (user, record) => {
  if (user.id && record.userId && String(user.id) === String(record.userId)) {
    return true;
  }

  const userEmail = normalizeMatchValue(user.email);
  const recordEmail = normalizeMatchValue(record.customerEmail);
  const userPhone = normalizeMatchValue(user.phone);
  const recordPhone = normalizeMatchValue(record.customerPhone);
  const userName = normalizeMatchValue(user.name);
  const recordName = normalizeMatchValue(record.customerName);

  return (
    (isUsableMatchValue(userEmail) && userEmail === recordEmail) ||
    (isUsableMatchValue(userPhone) && userPhone === recordPhone) ||
    (isUsableMatchValue(userName) && userName === recordName)
  );
};

const getRecordDateValue = (record) => {
  const rawValue = record.createdAt || record.created_at || record.order_date || record.date || '';
  if (!rawValue) return null;
  const date = new Date(rawValue);
  return Number.isNaN(date.getTime()) ? null : date;
};

const getLatestUserOrderDate = (user, orders) => {
  const latestTime = orders
    .filter((order) => userMatchesRecord(user, order))
    .map(getRecordDateValue)
    .filter(Boolean)
    .reduce((latest, date) => Math.max(latest, date.getTime()), 0);

  return latestTime ? new Date(latestTime).toISOString() : '';
};

const getLastPage = (response, totalItems) => (
  response?.last_page ??
  response?.meta?.last_page ??
  Math.max(1, Math.ceil(totalItems / PAGE_SIZE))
);

const fetchAllAdminPages = async (fetcher, params, normalizeRecord) => {
  const firstPage = await fetcher({ ...params, page: 1, per_page: PAGE_SIZE });
  const firstRows = getPaginatedRows(firstPage);
  const totalItems = getPaginatedTotal(firstPage, firstRows.length);
  const lastPage = getLastPage(firstPage, totalItems);

  const remainingPages = lastPage > 1
    ? await Promise.all(
        Array.from({ length: lastPage - 1 }, (_, index) => (
          fetcher({ ...params, page: index + 2, per_page: PAGE_SIZE })
        ))
      )
    : [];

  const records = sortByIdAscending(
    [firstPage, ...remainingPages]
      .flatMap(getPaginatedRows)
      .map(normalizeRecord)
  );

  return {
    records,
    total: Math.max(totalItems, records.length)
  };
};

function PaginationControls({ page, totalPages, totalItems, onPageChange }) {
  if (totalItems <= PAGE_SIZE) return null;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '1rem',
      padding: '0.85rem 1rem',
      border: '1px solid var(--border-light)',
      borderTop: 'none',
      borderRadius: '0 0 8px 8px',
      backgroundColor: 'var(--canvas-secondary)'
    }}>
      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
        Showing {(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, totalItems)} of {totalItems}
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <button
          type="button"
          disabled={page === 1}
          onClick={() => onPageChange(page - 1)}
          style={{ padding: '0.45rem 0.75rem', border: '1px solid var(--border-light)', borderRadius: '4px', backgroundColor: 'var(--canvas-primary)', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.45 : 1 }}
        >
          Previous
        </button>
        <span style={{ fontSize: '0.78rem', color: 'var(--text-dark)', minWidth: '4rem', textAlign: 'center' }}>
          {page} / {totalPages}
        </span>
        <button
          type="button"
          disabled={page === totalPages}
          onClick={() => onPageChange(page + 1)}
          style={{ padding: '0.45rem 0.75rem', border: '1px solid var(--border-light)', borderRadius: '4px', backgroundColor: 'var(--canvas-primary)', cursor: page === totalPages ? 'not-allowed' : 'pointer', opacity: page === totalPages ? 0.45 : 1 }}
        >
          Next
        </button>
      </div>
    </div>
  );
}

const groupApiMenuItems = (categories, items) => {
  const grouped = adminMenuCategoryNames.reduce((menu, category) => {
    menu[category] = [];
    return menu;
  }, {});
  const resolveAdminMenuCategory = (categoryName) => {
    const normalized = String(categoryName || '').trim();
    const lower = normalized.toLowerCase();
    if (lower === 'plant-based' || lower === 'plant based') return 'Vegetarian';
    return adminMenuCategoryNames.includes(normalized) ? normalized : 'Dinner';
  };
  const categoryNamesById = new Map(categories.map((category) => [
    category.id,
    category.name || category.title || category.slug || 'Menu'
  ]));

  items.forEach((item) => {
    const rawCategoryName = item.category?.name || item.menu_category?.name || categoryNamesById.get(item.menu_category_id) || categoryNamesById.get(item.category_id) || item.category;
    const legacySubCategory = isDinnerSubcategory(rawCategoryName) ? rawCategoryName : '';
    const customerCategoryName = legacySubCategory ? 'Dinner' : resolveAdminMenuCategory(rawCategoryName);
    const subCategory = isDinnerSubcategory(item.sub_category) ? item.sub_category : legacySubCategory;
    const categoryName = customerCategoryName === 'Dinner' && subCategory ? subCategory : customerCategoryName;
    if (!grouped[categoryName]) grouped[categoryName] = [];
    grouped[categoryName] = [
      ...(grouped[categoryName] || []),
      {
        id: item.id,
        name: item.name || item.title || 'Menu item',
        price: Number(item.price || 0),
        description: item.description || '',
        rating: Number(item.rating || 4.8),
        image: item.image || item.image_url || fallbackMenuItemImage,
        availability: item.is_available ?? item.availability ?? true,
        addon_options: normalizeApiOptionArray(item.addon_options),
        protein_choice: normalizeApiOptionArray(item.protein_choice),
        spice_options: normalizeApiOptionArray(item.spice_options),
        size_options: normalizeApiOptionArray(item.size_options),
        suggested_item_ids: normalizeApiOptionArray(item.suggested_item_ids),
        suggested_items: normalizeApiOptionArray(item.suggested_items),
        category: customerCategoryName,
        sub_category: subCategory
      }
    ];
  });

  return grouped;
};

const formatAddonOptions = (addons = []) => (
  Array.isArray(addons)
    ? addons.map((addon) => `${addon.name}:${Number(addon.price || 0).toFixed(2)}`).join('\n')
    : ''
);

const parseAddonOptions = (text = '') => (
  String(text)
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [namePart, pricePart] = line.split(':');
      const name = String(namePart || '').trim();
      const price = Number(String(pricePart || '0').trim());
      return name ? { name, price: Number.isFinite(price) ? price : 0 } : null;
    })
    .filter(Boolean)
);

const formatSpiceOptions = (options = []) => (
  Array.isArray(options) && options.length > 0
    ? options.join('\n')
    : ''
);

const parseSpiceOptions = (text = '') => (
  String(text)
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
);

const formatSizeOptions = (sizes = []) => (
  Array.isArray(sizes)
    ? sizes.map((size) => `${size.name}:${Number(size.price || 0).toFixed(2)}`).join('\n')
    : ''
);

const parseSizeOptions = (text = '') => (
  String(text)
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [namePart, pricePart] = line.split(':');
      const name = String(namePart || '').trim();
      const price = Number(String(pricePart || '0').trim());
      return name ? { name, price: Number.isFinite(price) ? price : 0 } : null;
    })
    .filter(Boolean)
);

const isBackendMenuItemId = (id) => /^\d+$/.test(String(id || ''));

const normalizeMenuItemsTableRow = (item) => ({
  id: item.id,
  name: item.name || item.title || 'Menu item',
  price: Number(item.price || 0),
  description: item.description || '',
  image: item.image || item.image_url || fallbackMenuItemImage,
  availability: item.is_available ?? item.availability ?? true,
  protein_choice: normalizeApiOptionArray(item.protein_choice),
  category: item.category?.name || item.menu_category?.name || item.category || 'Dinner',
  sub_category: item.sub_category || ''
});

const toApiPromoCodePayload = (coupon) => ({
  code: coupon.code.toUpperCase().trim(),
  discount_type: coupon.type === 'flat' ? 'fixed' : coupon.type,
  discount_value: Number(coupon.value),
  minimum_order_amount: coupon.minOrder === '' ? null : Number(coupon.minOrder),
  start_date: null,
  end_date: coupon.expiryDate || null,
  is_active: coupon.status === 'Active',
});

export default function AdminPage({ currentUser = null }) {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return isAdminUser(currentUser) || sessionStorage.getItem('maha_admin_auth') === 'true';
  });
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [adminNotice, setAdminNotice] = useState(null);

  const showAdminNotice = (type, message) => {
    setAdminNotice({ type, message });
    setTimeout(() => setAdminNotice(null), 4000);
  };

  useEffect(() => {
    if (isAdminUser(currentUser)) {
      sessionStorage.setItem('maha_admin_auth', 'true');
      setIsAuthenticated(true);
    }
  }, [currentUser]);

  // Dashboard Sidebar & View State
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'orders', 'items', 'coupons', 'users', 'automation', 'feedback'
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Global Lists States
  const [orders, setOrders] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [localMenu, setLocalMenu] = useState({});
  const [menuItemsTableRows, setMenuItemsTableRows] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [feedbackList, setFeedbackList] = useState([]);
  const [careerApplications, setCareerApplications] = useState([]);
  const [contactMessages, setContactMessages] = useState([]);
  const [conciergeInquiries, setConciergeInquiries] = useState([]);
  const [rewardsList, setRewardsList] = useState([]);
  const [ordersPage, setOrdersPage] = useState(1);
  const [bookingsPage, setBookingsPage] = useState(1);
  const [couponsPage, setCouponsPage] = useState(1);
  const [usersPage, setUsersPage] = useState(1);
  const [careersPage, setCareersPage] = useState(1);
  const [contactsPage, setContactsPage] = useState(1);
  const [supportPage, setSupportPage] = useState(1);
  const [feedbackPage, setFeedbackPage] = useState(1);
  const [rewardsPage, setRewardsPage] = useState(1);
  const [ordersTotalItems, setOrdersTotalItems] = useState(0);
  const [bookingsTotalItems, setBookingsTotalItems] = useState(0);

  // Mobile responsiveness check
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 992 : false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 992;
      setIsMobile(mobile);
      if (!mobile) {
        setIsMobileSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // CMS State
  const [cmsContent, setCmsContent] = useState(() => getWebsiteContent());
  const [cmsActiveSection, setCmsActiveSection] = useState('hero');
  const [cmsNotification, setCmsNotification] = useState('');

  const handleSaveCMS = (e) => {
    e.preventDefault();
    updateWebsiteContent(cmsContent);
    setCmsNotification('Website content updated successfully.');
    setTimeout(() => setCmsNotification(''), 4000);
  };

  const handleResetCMS = () => {
    if (window.confirm('Restore website content to default templates?')) {
      setCmsContent(defaultWebsiteContent);
      updateWebsiteContent(defaultWebsiteContent);
      setCmsNotification('Website content reset to defaults.');
      setTimeout(() => setCmsNotification(''), 4000);
    }
  };

  // Search & Filter state for tab lists
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [orderTypeFilter, setOrderTypeFilter] = useState('All'); // 'All', 'Pickup', 'Delivery'
  const [rewardsSearchQuery, setRewardsSearchQuery] = useState('');
  
  // Menu Category state for Items Tab
  const menuCategories = adminMenuCategoryNames;
  const [selectedMenuCategory, setSelectedMenuCategory] = useState('Appetizers');
  const [menuPriceRange, setMenuPriceRange] = useState(0);

  // Automation Settings
  const [automationRules, setAutomationRules] = useState(() => {
    const saved = localStorage.getItem('maha_automation_rules');
    if (saved) return JSON.parse(saved);
    return {
      seatingReminder: true,
      happyHourPricing: false,
      reviewInvites: true,
      backupSync: true,
      kitchenDisplayAutoAlert: true
    };
  });

  // Modal Dialog states
  const [showEditItemModal, setShowEditItemModal] = useState(false);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [selectedDish, setSelectedDish] = useState(null);
  const [dishFormData, setDishFormData] = useState({
    id: '',
    category: 'Dinner',
    subCategory: defaultDinnerSubcategory,
    name: '',
    price: 0,
    description: '',
    rating: 4.8,
    image: '',
    availability: true,
    addonOptionsText: '',
    proteinChoiceText: '',
    spiceOptionsText: '',
    sizeOptionsText: '',
    suggestedItemIds: []
  });
  const [suggestedItemSearch, setSuggestedItemSearch] = useState('');
  const [suggestedItemPriceRange, setSuggestedItemPriceRange] = useState(0);

  const refreshBackendMenuItems = async () => {
    const [apiCategories, apiItems] = await Promise.all([
      getMenuCategories().catch(() => []),
      getMenuItems().catch(() => [])
    ]);

    if (apiItems.length > 0) {
      setMenuItemsTableRows(apiItems.map(normalizeMenuItemsTableRow));
      const groupedMenu = groupApiMenuItems(apiCategories, apiItems);
      setLocalMenu(groupedMenu);
      localStorage.setItem('maha_custom_menu', JSON.stringify(groupedMenu));
      return groupedMenu;
    }

    setMenuItemsTableRows([]);
    const emptyMenu = groupApiMenuItems(apiCategories, []);
    setLocalMenu(emptyMenu);
    localStorage.setItem('maha_custom_menu', JSON.stringify(emptyMenu));

    return emptyMenu;
  };

  const handleImageFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        showAdminNotice('success', 'Uploading image...');
        const uploaded = await uploadMenuItemImage(file);
        setDishFormData(prev => ({ ...prev, image: uploaded.image_url }));
        showAdminNotice('success', 'Image uploaded successfully.');
      } catch (error) {
        console.error('Failed to upload menu item image.', error);
        showAdminNotice('error', error.message || 'Image upload failed.');
      } finally {
        e.target.value = '';
      }
    }
  };

  // Coupon Modals states
  const [showAddCouponModal, setShowAddCouponModal] = useState(false);
  const [showEditCouponModal, setShowEditCouponModal] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [couponFormData, setCouponFormData] = useState({
    id: '',
    code: '',
    type: 'percentage',
    value: 10,
    minOrder: 30,
    expiryDate: '2026-12-31',
    status: 'Active'
  });

  const [showOrderDetailsModal, setShowOrderDetailsModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Initialize Admin Data
  useEffect(() => {
    if (!isAuthenticated) return;

    // 1. Load Orders
    let savedOrders = localStorage.getItem('maha_global_orders');
    if (!savedOrders) {
      localStorage.setItem('maha_global_orders', JSON.stringify(defaultMockOrders));
      savedOrders = JSON.stringify(defaultMockOrders);
    }
    setOrders(sortByIdAscending(JSON.parse(savedOrders)));
    fetchAllAdminPages(getOrders, { sort_by: 'id', sort_direction: 'asc', order_by: 'id', order: 'asc' }, normalizeApiOrder)
      .then(({ records, total }) => {
        setOrders(records);
        setOrdersTotalItems(total);
        localStorage.setItem('maha_global_orders', JSON.stringify(records));
      })
      .catch((error) => console.error('Failed to load backend orders.', error));

    // 2. Load Bookings (Seating)
    let savedBookings = localStorage.getItem('maha_global_bookings');
    if (!savedBookings) {
      localStorage.setItem('maha_global_bookings', JSON.stringify(defaultMockBookings));
      savedBookings = JSON.stringify(defaultMockBookings);
    }
    setBookings(sortByIdAscending(JSON.parse(savedBookings)));
    fetchAllAdminPages(getReservations, { sort_by: 'id', sort_direction: 'asc', order_by: 'id', order: 'asc' }, normalizeApiReservation)
      .then(({ records, total }) => {
        setBookings(records);
        setBookingsTotalItems(total);
        localStorage.setItem('maha_global_bookings', JSON.stringify(records));
      })
      .catch((error) => console.error('Failed to load backend reservations.', error));

    // 3. Load Menu Data from menu_items only.
    setLocalMenu(groupApiMenuItems([], []));
    refreshBackendMenuItems()
      .catch((error) => console.error('Failed to load backend menu.', error));

    // 4. Load Coupons
    let savedCoupons = localStorage.getItem('maha_global_coupons');
    if (!savedCoupons) {
      localStorage.setItem('maha_global_coupons', JSON.stringify(defaultMockCoupons));
      savedCoupons = JSON.stringify(defaultMockCoupons);
    }
    setCoupons(JSON.parse(savedCoupons));
    getPromoCodes()
      .then((apiCoupons) => {
        const normalizedCoupons = apiCoupons.map(normalizeApiPromoCode);
        setCoupons(normalizedCoupons);
        localStorage.setItem('maha_global_coupons', JSON.stringify(normalizedCoupons));
      })
      .catch((error) => console.error('Failed to load backend promo codes.', error));

    // 5. Load customer feedback reviews
    loadAdminFeedback();

    // 6. Load career applications
    loadCareerApplications();

    // 7. Load Users from LocalStorage (keys matching maha_user_*)
    const users = [];
    users.push({
      name: 'Alexander Hamilton',
      email: 'alex@example.com',
      phone: '+1 (555) 019-2834',
      ordersCount: 2,
      bookingsCount: 1
    });
    users.push({
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+1 (555) 123-4567',
      ordersCount: 1,
      bookingsCount: 0
    });
    users.push({
      name: 'Sarah Connor',
      email: 'sarah@example.com',
      phone: '+1 (555) 987-6543',
      ordersCount: 1,
      bookingsCount: 0
    });

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('maha_user_')) {
        try {
          const userObj = JSON.parse(localStorage.getItem(key));
          if (userObj && userObj.email) {
            if (!users.some(u => u.email === userObj.email)) {
              users.push({
                name: userObj.name || userObj.email.split('@')[0],
                email: userObj.email,
                phone: userObj.phone || 'N/A',
                ordersCount: userObj.orders ? userObj.orders.length : 0,
                bookingsCount: userObj.bookings ? userObj.bookings.length : 0
              });
            }
          }
        } catch (e) {}
      }
    }
    setUsersList(users);
    getUsers()
      .then((apiUsers) => {
        if (apiUsers.length > 0) {
          setUsersList(apiUsers.map(normalizeApiUser));
        }
      })
      .catch((error) => console.error('Failed to load backend users.', error));
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || activeTab !== 'feedback') return;

    loadAdminFeedback();
    const refreshTimer = window.setInterval(loadAdminFeedback, 10000);

    const handleStorageUpdate = (event) => {
      if (event.key === 'maha_global_feedback') {
        loadAdminFeedback();
      }
    };

    window.addEventListener('storage', handleStorageUpdate);
    return () => {
      window.clearInterval(refreshTimer);
      window.removeEventListener('storage', handleStorageUpdate);
    };
  }, [isAuthenticated, activeTab]);

  useEffect(() => {
    if (!isAuthenticated || activeTab !== 'careers') return;

    loadCareerApplications();
    const refreshTimer = window.setInterval(loadCareerApplications, 10000);

    const handleStorageUpdate = (event) => {
      if (event.key === 'maha_career_applications') {
        loadCareerApplications();
      }
    };

    window.addEventListener('storage', handleStorageUpdate);
    return () => {
      window.clearInterval(refreshTimer);
      window.removeEventListener('storage', handleStorageUpdate);
    };
  }, [isAuthenticated, activeTab]);

  useEffect(() => {
    if (!isAuthenticated || activeTab !== 'contacts') return;

    loadContactMessages();
    const refreshTimer = window.setInterval(loadContactMessages, 10000);

    const handleStorageUpdate = (event) => {
      if (event.key === 'maha_contact_messages') {
        loadContactMessages();
      }
    };

    window.addEventListener('storage', handleStorageUpdate);
    return () => {
      window.clearInterval(refreshTimer);
      window.removeEventListener('storage', handleStorageUpdate);
    };
  }, [isAuthenticated, activeTab]);

  useEffect(() => {
    if (!isAuthenticated || activeTab !== 'support') return;

    loadConciergeInquiries();
    const refreshTimer = window.setInterval(loadConciergeInquiries, 10000);

    const handleStorageUpdate = (event) => {
      if (event.key === 'maha_concierge_inquiries') {
        loadConciergeInquiries();
      }
    };

    window.addEventListener('storage', handleStorageUpdate);
    return () => {
      window.clearInterval(refreshTimer);
      window.removeEventListener('storage', handleStorageUpdate);
    };
  }, [isAuthenticated, activeTab]);

  useEffect(() => {
    if (!isAuthenticated || activeTab !== 'rewards') return;

    const loadRewards = () => {
      getRewards()
        .then((balances) => setRewardsList(Array.isArray(balances) ? balances : []))
        .catch((error) => {
          console.error('Failed to load rewards.', error);
          showAdminNotice('error', 'Could not load reward balances.');
        });
    };

    loadRewards();
    const refreshTimer = window.setInterval(loadRewards, 10000);
    return () => window.clearInterval(refreshTimer);
  }, [isAuthenticated, activeTab]);

  useEffect(() => {
    if (!isAuthenticated) return;

    fetchAllAdminPages(getOrders, {
      search: searchQuery,
      status: statusFilter,
      order_type: orderTypeFilter,
      sort_by: 'id',
      sort_direction: 'asc',
      order_by: 'id',
      order: 'asc'
    }, normalizeApiOrder)
      .then(({ records, total }) => {
        setOrders(records);
        setOrdersTotalItems(total);
      })
      .catch((error) => {
        console.error('Failed to load paginated backend orders.', error);
        showAdminNotice('error', 'Could not load orders from backend.');
      });
  }, [isAuthenticated, searchQuery, statusFilter, orderTypeFilter]);

  useEffect(() => {
    if (!isAuthenticated) return;

    fetchAllAdminPages(getReservations, {
      search: searchQuery,
      status: statusFilter,
      sort_by: 'id',
      sort_direction: 'asc',
      order_by: 'id',
      order: 'asc'
    }, normalizeApiReservation)
      .then(({ records, total }) => {
        setBookings(records);
        setBookingsTotalItems(total);
      })
      .catch((error) => {
        console.error('Failed to load paginated backend reservations.', error);
        showAdminNotice('error', 'Could not load reservations from backend.');
      });
  }, [isAuthenticated, searchQuery, statusFilter]);

  // Handle Login Submission
  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);

    setTimeout(() => {
      if (loginEmail === 'admin@mahathai.com' && loginPassword === 'admin') {
        sessionStorage.setItem('maha_admin_auth', 'true');
        setIsAuthenticated(true);
      } else {
        setLoginError('Invalid credentials. Access to Siamese court registry denied.');
      }
      setIsLoggingIn(false);
    }, 1200);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('maha_admin_auth');
    setIsAuthenticated(false);
    window.location.hash = '#/signin';
  };

  // Sync / Save dynamic menu edits
  const saveMenuOverrides = (newMenu) => {
    setLocalMenu(newMenu);
    localStorage.setItem('maha_custom_menu', JSON.stringify(newMenu));
    showAdminNotice('success', 'Menu changes saved.');
  };

  const loadAdminFeedback = async () => {
    const savedFeedback = JSON.parse(localStorage.getItem('maha_global_feedback') || '[]');
    setFeedbackList(savedFeedback.map(normalizeApiFeedback));

    try {
      const { records } = await fetchAllAdminPages(getFeedback, {}, normalizeApiFeedback);
      setFeedbackList(records);
      localStorage.setItem('maha_global_feedback', JSON.stringify(records));
    } catch (error) {
      console.error('Failed to load backend feedback.', error);
    }
  };

  const loadCareerApplications = async () => {
    const savedApplications = JSON.parse(localStorage.getItem('maha_career_applications') || '[]');
    setCareerApplications(savedApplications.map(normalizeApiCareerApplication));

    try {
      const apiApplications = await getCareerApplications();
      const rows = getPaginatedRows(apiApplications);
      const normalizedApplications = sortByIdAscending(rows.map(normalizeApiCareerApplication));
      setCareerApplications(normalizedApplications);
      localStorage.setItem('maha_career_applications', JSON.stringify(normalizedApplications));
    } catch (error) {
      console.error('Failed to load backend career applications.', error);
    }
  };

  const loadContactMessages = async () => {
    const savedMessages = JSON.parse(localStorage.getItem('maha_contact_messages') || '[]');
    setContactMessages(savedMessages.map(normalizeApiContactMessage));

    try {
      const apiMessages = await getContactMessages();
      const rows = getPaginatedRows(apiMessages);
      const normalizedMessages = sortByIdAscending(rows.map(normalizeApiContactMessage));
      setContactMessages(normalizedMessages);
      localStorage.setItem('maha_contact_messages', JSON.stringify(normalizedMessages));
    } catch (error) {
      console.error('Failed to load backend contact messages.', error);
    }
  };

  const loadConciergeInquiries = async () => {
    const savedInquiries = JSON.parse(localStorage.getItem('maha_concierge_inquiries') || '[]');
    setConciergeInquiries(savedInquiries.map(normalizeApiConciergeInquiry));

    try {
      const apiInquiries = await getConciergeInquiries();
      const rows = getPaginatedRows(apiInquiries);
      const normalizedInquiries = sortByIdAscending(rows.map(normalizeApiConciergeInquiry));
      setConciergeInquiries(normalizedInquiries);
      localStorage.setItem('maha_concierge_inquiries', JSON.stringify(normalizedInquiries));
    } catch (error) {
      console.error('Failed to load backend concierge inquiries.', error);
    }
  };

  // --- ORDER OPERATIONS ---
  const handleUpdateOrderStatus = (orderId, newStatus) => {
    const updated = orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o);
    setOrders(updated);
    localStorage.setItem('maha_global_orders', JSON.stringify(updated));
    updateUserProfileData(orderId, 'orders', { status: newStatus });
    showAdminNotice('success', `Order status updated to ${newStatus}.`);
  };

  const handleDeleteOrder = (orderId) => {
    if (window.confirm('Are you sure you want to remove this order from history?')) {
      const updated = orders.filter(o => o.id !== orderId);
      setOrders(updated);
      localStorage.setItem('maha_global_orders', JSON.stringify(updated));
      showAdminNotice('success', 'Order removed.');
    }
  };

  const handleUpdateBookingStatus = async (bookingId, newStatus) => {
    const updated = bookings.map(b => b.id === bookingId ? { ...b, status: newStatus } : b);
    setBookings(updated);
    localStorage.setItem('maha_global_bookings', JSON.stringify(updated));
    updateUserProfileData(bookingId, 'bookings', { status: newStatus });

    try {
      await updateReservation(bookingId, { status: newStatus.toLowerCase() });
      showAdminNotice('success', `Reservation status updated to ${newStatus}.`);
    } catch (error) {
      console.error('Failed to sync reservation status with backend. Add PATCH /api/reservations/{id} in Laravel.', error);
      showAdminNotice('error', error.message || 'Reservation status update failed.');
    }
  };

  // Sync status edits back to target user localStorage key if applicable
  const updateUserProfileData = (recordId, type, fieldsToUpdate) => {
    const targetRecord = type === 'orders' ? orders.find(o => o.id === recordId) : bookings.find(b => b.id === recordId);
    if (!targetRecord || !targetRecord.customerEmail) return;

    const storageKey = `maha_user_${targetRecord.customerEmail}`;
    const userData = localStorage.getItem(storageKey);
    if (userData) {
      try {
        const userObj = JSON.parse(userData);
        if (userObj[type]) {
          userObj[type] = userObj[type].map(item => 
            item.id === recordId ? { ...item, ...fieldsToUpdate } : item
          );
          localStorage.setItem(storageKey, JSON.stringify(userObj));
        }
      } catch (e) {}
    }
  };

  // --- MENU ITEM OPERATIONS ---
  const handleOpenEditDish = async (dish) => {
    refreshBackendMenuItems().catch((error) => console.error('Failed to refresh suggested menu items.', error));
    setSelectedDish(dish);
    setDishFormData({
      id: dish.id,
      category: dish.category || (isDinnerSubcategory(selectedMenuCategory) ? 'Dinner' : selectedMenuCategory),
      subCategory: dish.sub_category || (isDinnerSubcategory(selectedMenuCategory) ? selectedMenuCategory : defaultDinnerSubcategory),
      name: dish.name,
      price: dish.price,
      description: dish.description || '',
      rating: dish.rating || 4.8,
      image: dish.image || '',
      availability: dish.availability !== false,
      addonOptionsText: formatAddonOptions(dish.addon_options || dish.addons || []),
      proteinChoiceText: formatAddonOptions(dish.protein_choice || []),
      spiceOptionsText: formatSpiceOptions(dish.spice_options || []),
      sizeOptionsText: formatSizeOptions(dish.size_options || []),
      suggestedItemIds: (dish.suggested_item_ids || dish.suggested_items?.map((item) => item.id) || []).filter(isBackendMenuItemId).map(Number)
    });
    setSuggestedItemSearch('');
    setSuggestedItemPriceRange(0);
    setShowEditItemModal(true);
  };

  const handleSaveEditDish = async (e) => {
    e.preventDefault();
    if (!dishFormData.name || dishFormData.price <= 0) {
      showAdminNotice('error', 'Dish name and price are required.');
      return;
    }

    const addonOptions = parseAddonOptions(dishFormData.addonOptionsText);
    const proteinChoice = parseAddonOptions(dishFormData.proteinChoiceText);
    const spiceOptions = parseSpiceOptions(dishFormData.spiceOptionsText);
    const sizeOptions = parseSizeOptions(dishFormData.sizeOptionsText);
    const suggestedItemIds = (dishFormData.suggestedItemIds || []).filter((id) => isBackendMenuItemId(id) && String(id) !== String(dishFormData.id)).map(Number);
    const customerCategory = dishFormData.category || 'Dinner';
    const subCategory = customerCategory === 'Dinner' ? (dishFormData.subCategory || defaultDinnerSubcategory) : '';
    const targetMenuCategory = customerCategory === 'Dinner' && subCategory ? subCategory : customerCategory;
    const updatedMenu = { ...localMenu };
    const items = updatedMenu[selectedMenuCategory] || [];
    const index = items.findIndex(item => item.id === dishFormData.id);
    
    if (index !== -1) {
      const updatedItem = {
        ...items[index],
        name: dishFormData.name,
        price: parseFloat(dishFormData.price),
        description: dishFormData.description,
        rating: parseFloat(dishFormData.rating),
        image: dishFormData.image,
        availability: dishFormData.availability,
        addon_options: addonOptions,
        protein_choice: proteinChoice,
        spice_options: spiceOptions,
        size_options: sizeOptions,
        suggested_item_ids: suggestedItemIds,
        category: customerCategory,
        sub_category: subCategory
      };
      updatedMenu[selectedMenuCategory] = items.filter(item => item.id !== dishFormData.id);
      updatedMenu[targetMenuCategory] = [
        ...(updatedMenu[targetMenuCategory] || []).filter(item => item.id !== dishFormData.id),
        updatedItem
      ];
      saveMenuOverrides(updatedMenu);
      setSelectedMenuCategory(targetMenuCategory);
      setShowEditItemModal(false);

      if (isBackendMenuItemId(dishFormData.id)) {
        try {
          const categories = await getMenuCategories();
          const existingCategory = categories.find((category) => (
            String(category.name || '').toLowerCase() === customerCategory.toLowerCase()
          ));
          const category = existingCategory || await createMenuCategory({
            name: customerCategory,
            description: `${customerCategory} menu items`,
            status: 'active'
          });

          await updateMenuItem(dishFormData.id, {
            category_id: category.id,
            name: dishFormData.name,
            description: dishFormData.description,
            price: Number(dishFormData.price),
            image_url: dishFormData.image || null,
            rating: Number(dishFormData.rating || 5),
            is_available: Boolean(dishFormData.availability),
            addon_options: addonOptions,
            protein_choice: proteinChoice,
            spice_options: spiceOptions,
            size_options: sizeOptions,
            suggested_item_ids: suggestedItemIds,
            sub_category: subCategory || null
          });
          showAdminNotice('success', 'Menu item updated in table.');
        } catch (error) {
          console.error('Failed to sync menu item update with backend.', error);
          showAdminNotice('error', error.message || 'Menu item updated locally, but table update failed.');
        }
      }
    }
  };

  const handleOpenAddDish = async () => {
    refreshBackendMenuItems().catch((error) => console.error('Failed to refresh suggested menu items.', error));
    const defaultCategory = ['Lunch', 'Dinner', 'Vegetarian'].includes(selectedMenuCategory)
      ? selectedMenuCategory
      : 'Dinner';
    const defaultSubCategory = isDinnerSubcategory(selectedMenuCategory)
      ? selectedMenuCategory
      : defaultDinnerSubcategory;

    setDishFormData({
      id: 'dish-' + Date.now(),
      category: defaultCategory,
      subCategory: defaultSubCategory,
      name: '',
      price: '',
      description: '',
      rating: 5.0,
      image: 'https://images.unsplash.com/photo-1559314809-0d155014e29e?auto=format&fit=crop&q=80&w=400',
      availability: true,
      addonOptionsText: 'Extra Chicken:2.50\nExtra Beef:3.00\nExtra Shrimp:3.50',
      proteinChoiceText: 'Chicken:2.00\nBeef:3.50\nShrimp:3.50\nTofu:0.00\nVegetable:0.00',
      spiceOptionsText: 'Mild\nMedium\nSpicy\nMore Spicy',
      sizeOptionsText: 'Small:12.99\nMedium:14.99\nLarge:16.99',
      suggestedItemIds: []
    });
    setSuggestedItemSearch('');
    setSuggestedItemPriceRange(0);
    setShowAddItemModal(true);
  };

  const handleSaveAddDish = async (e) => {
    e.preventDefault();
    if (!dishFormData.name || !dishFormData.price) {
      showAdminNotice('error', 'Dish name and price are required.');
      return;
    }

    const targetCustomerCategory = dishFormData.category || 'Dinner';
    const targetSubCategory = targetCustomerCategory === 'Dinner' ? (dishFormData.subCategory || defaultDinnerSubcategory) : '';
    const targetMenuCategory = targetCustomerCategory === 'Dinner' && targetSubCategory ? targetSubCategory : targetCustomerCategory;
    const addonOptions = parseAddonOptions(dishFormData.addonOptionsText);
    const proteinChoice = parseAddonOptions(dishFormData.proteinChoiceText);
    const spiceOptions = parseSpiceOptions(dishFormData.spiceOptionsText);
    const sizeOptions = parseSizeOptions(dishFormData.sizeOptionsText);
    const suggestedItemIds = (dishFormData.suggestedItemIds || []).filter(isBackendMenuItemId).map(Number);
    const updatedMenu = { ...localMenu };
    const items = updatedMenu[targetMenuCategory] || [];
    
    const newItem = {
      id: dishFormData.id,
      name: dishFormData.name,
      price: parseFloat(dishFormData.price),
      description: dishFormData.description,
      rating: parseFloat(dishFormData.rating),
      image: dishFormData.image || 'https://images.unsplash.com/photo-1559314809-0d155014e29e?auto=format&fit=crop&q=80&w=400',
      availability: dishFormData.availability,
      addon_options: addonOptions,
      protein_choice: proteinChoice,
      spice_options: spiceOptions,
      size_options: sizeOptions,
      suggested_item_ids: suggestedItemIds,
      category: targetCustomerCategory,
      sub_category: targetSubCategory
    };

    items.push(newItem);
    updatedMenu[targetMenuCategory] = items;
    saveMenuOverrides(updatedMenu);
    setSelectedMenuCategory(targetMenuCategory);
    setShowAddItemModal(false);
    showAdminNotice('success', 'Menu item added.');

    try {
      const categories = await getMenuCategories();
      const existingCategory = categories.find((category) => (
        String(category.name || '').toLowerCase() === targetCustomerCategory.toLowerCase()
      ));
      const category = existingCategory || await createMenuCategory({
        name: targetCustomerCategory,
        description: `${targetCustomerCategory} menu items`,
        status: 'active'
      });

      const savedItem = await createMenuItem({
        category_id: category.id,
        name: dishFormData.name,
        description: dishFormData.description,
        price: Number(dishFormData.price),
        image_url: dishFormData.image || null,
        rating: Number(dishFormData.rating || 5),
        is_available: Boolean(dishFormData.availability),
        addon_options: addonOptions,
        protein_choice: proteinChoice,
        spice_options: spiceOptions,
        size_options: sizeOptions,
        suggested_item_ids: suggestedItemIds,
        sub_category: targetSubCategory || null
      });

      const syncedItem = {
        id: savedItem.id,
        name: savedItem.name,
        price: Number(savedItem.price || dishFormData.price),
        description: savedItem.description || dishFormData.description,
        rating: Number(savedItem.rating || dishFormData.rating || 5),
        image: savedItem.image_url || dishFormData.image,
        availability: savedItem.is_available ?? dishFormData.availability,
        addon_options: normalizeApiOptionArray(savedItem.addon_options).length ? normalizeApiOptionArray(savedItem.addon_options) : addonOptions,
        protein_choice: normalizeApiOptionArray(savedItem.protein_choice).length ? normalizeApiOptionArray(savedItem.protein_choice) : proteinChoice,
        spice_options: normalizeApiOptionArray(savedItem.spice_options).length ? normalizeApiOptionArray(savedItem.spice_options) : spiceOptions,
        size_options: normalizeApiOptionArray(savedItem.size_options).length ? normalizeApiOptionArray(savedItem.size_options) : sizeOptions,
        suggested_item_ids: normalizeApiOptionArray(savedItem.suggested_item_ids).length ? normalizeApiOptionArray(savedItem.suggested_item_ids) : suggestedItemIds,
        suggested_items: normalizeApiOptionArray(savedItem.suggested_items),
        category: targetCustomerCategory,
        sub_category: savedItem.sub_category || targetSubCategory
      };

      const syncedMenu = { ...updatedMenu };
      syncedMenu[targetMenuCategory] = [
        ...(syncedMenu[targetMenuCategory] || []).filter((item) => item.id !== newItem.id),
        syncedItem
      ];
      saveMenuOverrides(syncedMenu);
      showAdminNotice('success', 'Menu item saved to table.');
    } catch (error) {
      console.error('Failed to save menu item to backend.', error);
      showAdminNotice('error', error.message || 'Menu item added locally, but table save failed.');
    }
  };

  const handleDeleteDish = async (dishId) => {
    if (window.confirm('Are you sure you want to delete this menu item?')) {
      const updatedMenu = { ...localMenu };
      const items = updatedMenu[selectedMenuCategory] || [];
      const filtered = items.filter(item => item.id !== dishId);
      updatedMenu[selectedMenuCategory] = filtered;
      saveMenuOverrides(updatedMenu);
      showAdminNotice('success', 'Menu item deleted.');

      if (isBackendMenuItemId(dishId)) {
        try {
          await deleteMenuItem(dishId);
          showAdminNotice('success', 'Menu item deleted from table.');
        } catch (error) {
          console.error('Failed to delete menu item from backend.', error);
          showAdminNotice('error', error.message || 'Menu item deleted locally, but table delete failed.');
        }
      }
    }
  };

  // --- COUPON OPERATIONS ---
  const handleOpenAddCoupon = () => {
    setCouponFormData({
      id: 'c-' + Date.now(),
      code: '',
      type: 'percentage',
      value: 10,
      minOrder: 30,
      expiryDate: '2026-12-31',
      status: 'Active'
    });
    setShowAddCouponModal(true);
  };

  const handleSaveAddCoupon = async (e) => {
    e.preventDefault();
    if (!couponFormData.code || couponFormData.value <= 0) {
      showAdminNotice('error', 'Coupon code and discount value are required.');
      return;
    }

    const localCoupon = {
      ...couponFormData,
      code: couponFormData.code.toUpperCase().trim(),
      value: parseFloat(couponFormData.value),
      minOrder: parseFloat(couponFormData.minOrder)
    };

    let savedCoupon = localCoupon;
    try {
      savedCoupon = normalizeApiPromoCode(await createPromoCode(toApiPromoCodePayload(couponFormData)));
      showAdminNotice('success', 'Coupon created successfully.');
    } catch (error) {
      console.error('Failed to sync promo code with backend.', error);
      showAdminNotice('error', error.message || 'Coupon saved locally, but backend sync failed.');
    }

    const updatedCoupons = [...coupons, savedCoupon];
    setCoupons(updatedCoupons);
    localStorage.setItem('maha_global_coupons', JSON.stringify(updatedCoupons));
    setShowAddCouponModal(false);
  };

  const handleOpenEditCoupon = (coupon) => {
    setSelectedCoupon(coupon);
    setCouponFormData({
      id: coupon.id,
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      minOrder: coupon.minOrder,
      expiryDate: coupon.expiryDate,
      status: coupon.status
    });
    setShowEditCouponModal(true);
  };

  const handleSaveEditCoupon = (e) => {
    e.preventDefault();
    if (!couponFormData.code || couponFormData.value <= 0) {
      showAdminNotice('error', 'Coupon code and discount value are required.');
      return;
    }

    const updatedCoupons = coupons.map(c => 
      c.id === couponFormData.id ? {
        ...couponFormData,
        code: couponFormData.code.toUpperCase().trim(),
        value: parseFloat(couponFormData.value),
        minOrder: parseFloat(couponFormData.minOrder)
      } : c
    );
    setCoupons(updatedCoupons);
    localStorage.setItem('maha_global_coupons', JSON.stringify(updatedCoupons));
    setShowEditCouponModal(false);
    showAdminNotice('success', 'Coupon updated.');
  };

  const handleDeleteCoupon = (couponId) => {
    if (window.confirm('Are you sure you want to delete this promo coupon?')) {
      const updatedCoupons = coupons.filter(c => c.id !== couponId);
      setCoupons(updatedCoupons);
      localStorage.setItem('maha_global_coupons', JSON.stringify(updatedCoupons));
      showAdminNotice('success', 'Coupon deleted.');
    }
  };

  // --- AUTOMATION OPERATIONS ---
  const handleToggleAutomation = (key) => {
    const updated = {
      ...automationRules,
      [key]: !automationRules[key]
    };
    setAutomationRules(updated);
    localStorage.setItem('maha_automation_rules', JSON.stringify(updated));
    showAdminNotice('success', 'Automation setting updated.');
  };

  // --- FEEDBACK BOARD OPERATIONS ---
  const handleDeleteFeedback = (feedbackId) => {
    if (window.confirm('Are you sure you want to delete this customer feedback?')) {
      const updated = feedbackList.filter(f => f.id !== feedbackId);
      setFeedbackList(updated);
      localStorage.setItem('maha_global_feedback', JSON.stringify(updated));
      showAdminNotice('success', 'Feedback deleted.');
    }
  };

  const handleApproveFeedback = (feedbackId) => {
    const updated = feedbackList.map(f => {
      if (f.id === feedbackId) {
        const nextState = !f.approved;
        return { ...f, approved: nextState };
      }
      return f;
    });
    setFeedbackList(updated);
    localStorage.setItem('maha_global_feedback', JSON.stringify(updated));
    showAdminNotice('success', 'Feedback visibility updated.');
  };

  const handleUpdateCareerStatus = async (applicationId, newStatus) => {
    const previousApplications = careerApplications;
    const updatedApplications = careerApplications.map((application) => (
      application.id === applicationId ? { ...application, status: newStatus } : application
    ));
    setCareerApplications(updatedApplications);
    localStorage.setItem('maha_career_applications', JSON.stringify(updatedApplications));

    try {
      const savedApplication = await updateCareerApplication(applicationId, { status: newStatus.toLowerCase() });
      const savedRecord = getApiRecord(savedApplication);

      if (savedRecord?.id) {
        const normalizedRecord = normalizeApiCareerApplication(savedRecord);
        const syncedApplications = updatedApplications.map((application) => (
          application.id === applicationId ? normalizedRecord : application
        ));
        setCareerApplications(syncedApplications);
        localStorage.setItem('maha_career_applications', JSON.stringify(syncedApplications));
      }

      loadCareerApplications();
      showAdminNotice('success', `Career application marked ${newStatus}.`);
    } catch (error) {
      console.error('Failed to sync career application status with backend.', error);
      setCareerApplications(previousApplications);
      localStorage.setItem('maha_career_applications', JSON.stringify(previousApplications));
      showAdminNotice('error', error.message || 'Career application status update failed.');
    }
  };

  const handleUpdateContactStatus = async (messageId, newStatus) => {
    const previousMessages = contactMessages;
    const updatedMessages = contactMessages.map((message) => (
      message.id === messageId ? { ...message, status: newStatus } : message
    ));
    setContactMessages(updatedMessages);
    localStorage.setItem('maha_contact_messages', JSON.stringify(updatedMessages));

    try {
      const savedMessage = await updateContactMessage(messageId, { status: newStatus.toLowerCase() });
      const savedRecord = getApiRecord(savedMessage);

      if (savedRecord?.id) {
        const normalizedRecord = normalizeApiContactMessage(savedRecord);
        const syncedMessages = updatedMessages.map((message) => (
          message.id === messageId ? normalizedRecord : message
        ));
        setContactMessages(syncedMessages);
        localStorage.setItem('maha_contact_messages', JSON.stringify(syncedMessages));
      }

      loadContactMessages();
      showAdminNotice('success', `Contact message marked ${newStatus}.`);
    } catch (error) {
      console.error('Failed to sync contact message status with backend.', error);
      setContactMessages(previousMessages);
      localStorage.setItem('maha_contact_messages', JSON.stringify(previousMessages));
      showAdminNotice('error', error.message || 'Contact message status update failed.');
    }
  };

  const handleUpdateConciergeInquiry = async (inquiryId, updates) => {
    const previousInquiries = conciergeInquiries;
    const updatedInquiries = conciergeInquiries.map((inquiry) => (
      inquiry.id === inquiryId ? { ...inquiry, ...updates } : inquiry
    ));
    setConciergeInquiries(updatedInquiries);
    localStorage.setItem('maha_concierge_inquiries', JSON.stringify(updatedInquiries));

    try {
      const savedInquiry = await updateConciergeInquiry(inquiryId, {
        ...updates,
        status: updates.status ? updates.status.toLowerCase().replace(' ', '_') : undefined
      });
      const savedRecord = getApiRecord(savedInquiry);

      if (savedRecord?.id) {
        const normalizedRecord = normalizeApiConciergeInquiry(savedRecord);
        const syncedInquiries = updatedInquiries.map((inquiry) => (
          inquiry.id === inquiryId ? normalizedRecord : inquiry
        ));
        setConciergeInquiries(syncedInquiries);
        localStorage.setItem('maha_concierge_inquiries', JSON.stringify(syncedInquiries));
      }

      loadConciergeInquiries();
      showAdminNotice('success', 'Concierge inquiry updated.');
    } catch (error) {
      console.error('Failed to sync concierge inquiry with backend.', error);
      setConciergeInquiries(previousInquiries);
      localStorage.setItem('maha_concierge_inquiries', JSON.stringify(previousInquiries));
      showAdminNotice('error', error.message || 'Concierge inquiry update failed.');
    }
  };

  // --- STATS COMPUTATIONS ---
  const stats = useMemo(() => {
    const totalRev = orders
      .filter(o => o.status !== 'Cancelled')
      .reduce((sum, o) => sum + parseFloat(o.total || 0), 0);
    const pendingOrders = orders.filter(o => o.status === 'Pending' || o.status === 'Preparing' || o.status === 'Out for Delivery').length;
    const bookingsCount = bookings.length;

    return {
      revenue: totalRev,
      pendingOrders,
      bookingsCount
    };
  }, [orders, bookings]);

  // Filtered Lists Computations
  const filteredOrders = useMemo(() => {
    return orders;
  }, [orders]);

  const filteredBookings = useMemo(() => {
    return bookings;
  }, [bookings]);

  useEffect(() => {
    setOrdersPage(1);
    setBookingsPage(1);
    setCouponsPage(1);
    setUsersPage(1);
    setCareersPage(1);
    setContactsPage(1);
    setSupportPage(1);
    setFeedbackPage(1);
    setRewardsPage(1);
  }, [activeTab, searchQuery, statusFilter, orderTypeFilter]);

  useEffect(() => {
    setRewardsPage(1);
  }, [rewardsSearchQuery]);

  const ordersTotalCount = ordersTotalItems || filteredOrders.length;
  const bookingsTotalCount = bookingsTotalItems || filteredBookings.length;
  const ordersTotalPages = Math.max(1, Math.ceil(ordersTotalCount / PAGE_SIZE));
  const bookingsTotalPages = Math.max(1, Math.ceil(bookingsTotalCount / PAGE_SIZE));
  const visibleOrders = filteredOrders.slice((ordersPage - 1) * PAGE_SIZE, ordersPage * PAGE_SIZE);
  const visibleBookings = filteredBookings.slice((bookingsPage - 1) * PAGE_SIZE, bookingsPage * PAGE_SIZE);

  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const { min, max } = menuPriceRanges[menuPriceRange];
    return (localMenu[selectedMenuCategory] || [])
      .filter(item => (
        !query ||
        item.name?.toLowerCase().includes(query) ||
        String(item.id || '').toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query)
      ))
      .filter(item => Number(item.price || 0) >= min && Number(item.price || 0) < max);
  }, [localMenu, selectedMenuCategory, searchQuery, menuPriceRange]);

  const suggestionCandidates = useMemo(() => {
    const seen = new Set();
    return menuItemsTableRows
      .filter((item) => isBackendMenuItemId(item.id))
      .filter((item) => {
        const key = String(item.id);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
  }, [menuItemsTableRows]);

  const selectedSuggestedItems = useMemo(() => {
    const selectedIds = new Set((dishFormData.suggestedItemIds || []).map(String));
    return suggestionCandidates.filter((item) => selectedIds.has(String(item.id)));
  }, [dishFormData.suggestedItemIds, suggestionCandidates]);

  const availableSuggestionMatches = useMemo(() => {
    const query = suggestedItemSearch.trim().toLowerCase();
    const selectedIds = new Set((dishFormData.suggestedItemIds || []).map(String));
    const { min, max } = menuPriceRanges[suggestedItemPriceRange];
    return suggestionCandidates
      .filter((item) => String(item.id) !== String(dishFormData.id))
      .filter((item) => !selectedIds.has(String(item.id)))
      .filter((item) => (
        !query ||
        item.name?.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query) ||
        String(item.id).includes(query)
      ))
      .filter((item) => Number(item.price || 0) >= min && Number(item.price || 0) < max)
      .slice(0, 25);
  }, [dishFormData.id, dishFormData.suggestedItemIds, suggestedItemSearch, suggestedItemPriceRange, suggestionCandidates]);

  const handleAddSuggestedItem = (itemId) => {
    setDishFormData((prev) => ({
      ...prev,
      suggestedItemIds: Array.from(new Set([...(prev.suggestedItemIds || []), Number(itemId)]))
    }));
  };

  const handleRemoveSuggestedItem = (itemId) => {
    setDishFormData((prev) => ({
      ...prev,
      suggestedItemIds: (prev.suggestedItemIds || []).filter((id) => String(id) !== String(itemId))
    }));
  };

  const renderSuggestedItemsPicker = () => (
    <div>
      <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', tracking: '0.1em', marginBottom: '0.4rem' }}>Suggested Items from menu_items</label>
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Search menu_items..."
          value={suggestedItemSearch}
          onChange={(e) => setSuggestedItemSearch(e.target.value)}
          style={{ flexGrow: 1, padding: '0.6rem 0.8rem', fontSize: '0.85rem', border: '1px solid var(--border-light)', borderRadius: '4px', outline: 'none' }}
        />
      </div>
      <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap', marginTop: '0.6rem' }}>
        {menuPriceRanges.map((range, index) => {
          const active = suggestedItemPriceRange === index;
          return (
            <button
              key={range.label}
              type="button"
              onClick={() => setSuggestedItemPriceRange(index)}
              style={{
                padding: '0.35rem 0.7rem',
                borderRadius: '9999px',
                border: `1px solid ${active ? 'var(--gold-antique)' : 'var(--border-light)'}`,
                backgroundColor: active ? 'var(--gold-antique)' : '#fff',
                color: active ? 'var(--text-dark)' : 'var(--text-muted)',
                fontSize: '0.68rem',
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              {range.label}
            </button>
          );
        })}
      </div>
      {availableSuggestionMatches.length > 0 && (
        <div style={{ marginTop: '0.5rem', border: '1px solid var(--border-light)', borderRadius: '6px', overflowY: 'auto', maxHeight: '260px', backgroundColor: '#fff' }}>
          {availableSuggestionMatches.map((item) => (
            <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', padding: '0.6rem 0.75rem', borderBottom: '1px solid var(--border-light)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0 }}>
                <img
                  src={item.image || fallbackMenuItemImage}
                  alt={item.name}
                  onError={(e) => { e.currentTarget.src = fallbackMenuItemImage; }}
                  style={{ width: '42px', height: '42px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--border-light)', flexShrink: 0 }}
                />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-dark)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>${Number(item.price || 0).toFixed(2)} | ID: {item.id}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleAddSuggestedItem(item.id)}
                style={{ padding: '0.35rem 0.7rem', border: '1px solid var(--gold-antique)', borderRadius: '4px', color: 'var(--gold-antique)', backgroundColor: 'transparent', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}
              >
                Add
              </button>
            </div>
          ))}
        </div>
      )}
      {availableSuggestionMatches.length === 0 && (
        <div style={{ marginTop: '0.5rem', padding: '0.75rem', border: '1px dashed var(--border-light)', borderRadius: '6px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          No matching menu_items rows found.
        </div>
      )}
      {selectedSuggestedItems.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.75rem' }}>
          {selectedSuggestedItems.map((item) => (
            <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', padding: '0.55rem 0.75rem', border: '1px solid var(--border-light)', borderRadius: '6px', backgroundColor: 'var(--canvas-secondary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0 }}>
                <img
                  src={item.image || fallbackMenuItemImage}
                  alt={item.name}
                  onError={(e) => { e.currentTarget.src = fallbackMenuItemImage; }}
                  style={{ width: '36px', height: '36px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--border-light)', flexShrink: 0 }}
                />
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-dark)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name} (${Number(item.price || 0).toFixed(2)})</span>
              </div>
              <button
                type="button"
                onClick={() => handleRemoveSuggestedItem(item.id)}
                style={{ width: '24px', height: '24px', borderRadius: '50%', border: '1px solid #db4455', backgroundColor: 'transparent', color: '#db4455', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}
              >
                -
              </button>
            </div>
          ))}
        </div>
      )}
      <span style={{ display: 'block', marginTop: '0.35rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>Search live rows from the menu_items table and add them as popup suggestions.</span>
    </div>
  );

  const filteredCoupons = useMemo(() => {
    return coupons.filter(c => 
      c.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.type?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [coupons, searchQuery]);

  const filteredUsers = useMemo(() => {
    const query = searchQuery.toLowerCase();

    return sortByIdAscending(usersList
      .map((user) => {
        const userOrders = orders.filter((order) => userMatchesRecord(user, order));
        return {
          ...user,
          ordersCount: userOrders.length,
          bookingsCount: bookings.filter((booking) => userMatchesRecord(user, booking)).length,
          lastOrderedOn: getLatestUserOrderDate(user, userOrders)
        };
      })
      .filter(u =>
        u.name?.toLowerCase().includes(query) ||
        u.email?.toLowerCase().includes(query) ||
        u.phone?.toLowerCase().includes(query) ||
        u.role?.toLowerCase().includes(query) ||
        String(u.id || '').toLowerCase().includes(query) ||
        String(u.pointsRemaining || '').includes(query) ||
        String(u.createdAt || '').toLowerCase().includes(query) ||
        String(u.lastOrderedOn || '').toLowerCase().includes(query) ||
        (u.followingEmail ? 'yes email true following' : 'no email false').includes(query) ||
        (u.followingSms ? 'yes sms true following' : 'no sms false').includes(query)
      ));
  }, [usersList, orders, bookings, searchQuery]);

  const filteredFeedback = useMemo(() => {
    const query = searchQuery.toLowerCase();

    return feedbackList
      .map((feedback) => {
        const matchedUser = usersList.find((user) => String(user.id) === String(feedback.userId));
        return {
          ...feedback,
          customerName: matchedUser?.name || feedback.customerName || `User #${feedback.userId || 'N/A'}`,
          customerEmail: matchedUser?.email || feedback.customerEmail || ''
        };
      })
      .filter(f =>
        f.customerName?.toLowerCase().includes(query) ||
        f.customerEmail?.toLowerCase().includes(query) ||
        f.comment?.toLowerCase().includes(query) ||
        f.experience?.toLowerCase().includes(query)
      );
  }, [feedbackList, usersList, searchQuery]);

  const filteredCareerApplications = useMemo(() => {
    const query = searchQuery.toLowerCase();

    return careerApplications.filter((application) =>
      application.name?.toLowerCase().includes(query) ||
      application.email?.toLowerCase().includes(query) ||
      application.phone?.toLowerCase().includes(query) ||
      application.position?.toLowerCase().includes(query) ||
      application.status?.toLowerCase().includes(query)
    );
  }, [careerApplications, searchQuery]);

  const filteredContactMessages = useMemo(() => {
    const query = searchQuery.toLowerCase();

    return contactMessages.filter((message) =>
      message.name?.toLowerCase().includes(query) ||
      message.email?.toLowerCase().includes(query) ||
      message.phone?.toLowerCase().includes(query) ||
      message.subject?.toLowerCase().includes(query) ||
      message.message?.toLowerCase().includes(query) ||
      message.status?.toLowerCase().includes(query)
    );
  }, [contactMessages, searchQuery]);

  const filteredConciergeInquiries = useMemo(() => {
    const query = searchQuery.toLowerCase();

    return conciergeInquiries.filter((inquiry) =>
      inquiry.name?.toLowerCase().includes(query) ||
      inquiry.email?.toLowerCase().includes(query) ||
      inquiry.phone?.toLowerCase().includes(query) ||
      inquiry.message?.toLowerCase().includes(query) ||
      inquiry.response?.toLowerCase().includes(query) ||
      inquiry.status?.toLowerCase().includes(query)
    );
  }, [conciergeInquiries, searchQuery]);

  const filteredRewards = useMemo(() => {
    const query = rewardsSearchQuery.trim().toLowerCase();
    if (!query) return rewardsList;

    return rewardsList.filter((reward) => {
      const user = reward.user || {};
      const displayName = user.full_name || user.name || `User ${reward.user_id || ''}`;
      const lastEarned = reward.last_earned_at ? new Date(reward.last_earned_at).toLocaleString() : 'Not earned yet';
      const currentPoints = reward.current_points || 0;
      const lifetimePoints = reward.lifetime_points || 0;
      const redeemedPoints = reward.redeemed_points || 0;
      const searchableText = [
        displayName,
        `User ${reward.user_id || ''}`,
        user.email,
        user.phone,
        user.phone_number,
        user.role,
        reward.user_id,
        currentPoints,
        `${currentPoints} pts`,
        `${currentPoints} points`,
        lifetimePoints,
        `${lifetimePoints} pts`,
        `${lifetimePoints} points`,
        redeemedPoints,
        `${redeemedPoints} pts`,
        `${redeemedPoints} points`,
        reward.last_earned_at,
        lastEarned,
        lastEarned.replace(',', ''),
        'points',
        'pts'
      ].filter(Boolean).join(' ').toLowerCase();

      return searchableText.includes(query);
    });
  }, [rewardsList, rewardsSearchQuery]);

  const couponsTotalPages = Math.max(1, Math.ceil(filteredCoupons.length / PAGE_SIZE));
  const usersTotalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const careersTotalPages = Math.max(1, Math.ceil(filteredCareerApplications.length / PAGE_SIZE));
  const contactsTotalPages = Math.max(1, Math.ceil(filteredContactMessages.length / PAGE_SIZE));
  const supportTotalPages = Math.max(1, Math.ceil(filteredConciergeInquiries.length / PAGE_SIZE));
  const feedbackTotalPages = Math.max(1, Math.ceil(filteredFeedback.length / PAGE_SIZE));
  const rewardsTotalPages = Math.max(1, Math.ceil(filteredRewards.length / PAGE_SIZE));
  const visibleCoupons = filteredCoupons.slice((couponsPage - 1) * PAGE_SIZE, couponsPage * PAGE_SIZE);
  const visibleUsers = filteredUsers.slice((usersPage - 1) * PAGE_SIZE, usersPage * PAGE_SIZE);
  const visibleCareerApplications = filteredCareerApplications.slice((careersPage - 1) * PAGE_SIZE, careersPage * PAGE_SIZE);
  const visibleContactMessages = filteredContactMessages.slice((contactsPage - 1) * PAGE_SIZE, contactsPage * PAGE_SIZE);
  const visibleConciergeInquiries = filteredConciergeInquiries.slice((supportPage - 1) * PAGE_SIZE, supportPage * PAGE_SIZE);
  const visibleFeedback = filteredFeedback.slice((feedbackPage - 1) * PAGE_SIZE, feedbackPage * PAGE_SIZE);
  const visibleRewards = filteredRewards.slice((rewardsPage - 1) * PAGE_SIZE, rewardsPage * PAGE_SIZE);

  useEffect(() => {
    setFeedbackPage((page) => Math.min(page, feedbackTotalPages));
  }, [feedbackTotalPages]);

  return (
    <div style={{ backgroundColor: 'var(--canvas-secondary)', minHeight: '100vh' }}>
      <AnimatePresence mode="wait">
        {!isAuthenticated ? (
          /* AUTHENTICATION WALL */
          <motion.div 
            key="login-view"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.5 }}
            style={{
              minHeight: '80vh',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '2rem'
            }}
          >
            <div 
              style={{
                width: '100%',
                maxWidth: '440px',
                backgroundColor: 'var(--canvas-primary)',
                border: '1px solid var(--gold-antique)',
                borderRadius: '8px',
                padding: '3rem 2.5rem',
                boxShadow: 'var(--shadow-premium)',
                position: 'relative',
                textAlign: 'center'
              }}
            >
              <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'var(--gold-light)', border: '1px solid var(--gold-antique)', color: 'var(--gold-antique)', marginBottom: '1.5rem' }}>
                <ShieldAlert size={28} />
              </div>

              <h2 className="font-serif" style={{ fontSize: '1.85rem', color: 'var(--text-dark)', fontWeight: 300, marginBottom: '0.5rem' }}>
                Siamese Registry Portal
              </h2>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '2.5rem', fontWeight: 300 }}>
                Credentials required. Access restricted to certified curators of Maha Thai.
              </p>

              {loginError && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', backgroundColor: 'rgba(219, 68, 85, 0.1)', border: '1px solid rgba(219, 68, 85, 0.3)', borderRadius: '4px', color: '#db4455', fontSize: '0.75rem', textAlign: 'left', marginBottom: '1.5rem' }}>
                  <AlertCircle size={16} style={{ flexShrink: 0 }} />
                  <span>{loginError}</span>
                </div>
              )}

              <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', textAlign: 'left' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', tracking: '0.15em', marginBottom: '0.5rem' }}>
                    Admin Coordinate (Email)
                  </label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                      <Mail size={16} />
                    </span>
                    <input 
                      type="email" 
                      required 
                      placeholder="admin@mahathai.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', fontSize: '0.85rem', backgroundColor: 'var(--canvas-secondary)', border: '1px solid var(--border-light)', borderRadius: '4px', outline: 'none' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', tracking: '0.15em', marginBottom: '0.5rem' }}>
                    Private Seal (Password)
                  </label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                      <Lock size={16} />
                    </span>
                    <input 
                      type="password" 
                      required 
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', fontSize: '0.85rem', backgroundColor: 'var(--canvas-secondary)', border: '1px solid var(--border-light)', borderRadius: '4px', outline: 'none' }}
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={isLoggingIn}
                  className="btn-filled"
                  style={{ width: '100%', justifyContent: 'center', padding: '1rem', marginTop: '0.5rem' }}
                >
                  {isLoggingIn ? 'DECRYPTING SEAL...' : 'ENTER PORTAL'}
                </button>
              </form>

              <div style={{ marginTop: '2rem', borderTop: '1px solid var(--border-light)', paddingTop: '1.25rem' }}>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  Demo credentials: <strong style={{ color: 'var(--text-dark)' }}>admin@mahathai.com</strong> / <strong style={{ color: 'var(--text-dark)' }}>admin</strong>
                </p>
              </div>
            </div>
          </motion.div>
        ) : (
          /* ADMIN PORTAL PANEL */
          <motion.div 
            key="dashboard-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            style={{
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              minHeight: '90vh',
              fontFamily: 'var(--font-sans)',
              color: 'var(--text-dark)'
            }}
          >
            {/* MOBILE TOP NAV BAR */}
            {isMobile && (
              <header style={{
                position: 'sticky',
                top: 0,
                left: 0,
                right: 0,
                height: '70px',
                backgroundColor: 'var(--text-dark)',
                color: 'var(--canvas-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 1.5rem',
                borderBottom: '1px solid var(--gold-antique)',
                zIndex: 50
              }}>
                <span className="font-serif" style={{ fontSize: '1.15rem', color: 'var(--gold-antique)', tracking: '0.05em' }}>
                  MAHA STAFF
                </span>
                <button 
                  onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
                  style={{ background: 'none', border: 'none', color: 'var(--gold-antique)', cursor: 'pointer', outline: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Menu size={24} />
                </button>
              </header>
            )}

            {/* SIDEBAR DRAWER / ASIDE */}
            {(!isMobile || isMobileSidebarOpen) && (
              <>
                {isMobile && (
                  /* Overlay backdrop to close drawer when clicked outside */
                  <div 
                    onClick={() => setIsMobileSidebarOpen(false)}
                    style={{
                      position: 'fixed',
                      inset: 0,
                      backgroundColor: 'rgba(0, 0, 0, 0.5)',
                      backdropFilter: 'blur(4px)',
                      zIndex: 80
                    }}
                  />
                )}
                <aside 
                  style={{
                    width: isMobile ? '280px' : (isSidebarOpen ? '260px' : '70px'),
                    position: isMobile ? 'fixed' : 'sticky',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    height: '100vh',
                    maxHeight: '100vh',
                    backgroundColor: 'var(--text-dark)',
                    color: 'var(--canvas-primary)',
                    transition: 'width 0.4s var(--ease-premium)',
                    display: 'flex',
                    flexDirection: 'column',
                    borderRight: '1px solid var(--gold-antique)',
                    zIndex: isMobile ? 90 : 40,
                    flexShrink: 0
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: (isMobile || isSidebarOpen) ? 'space-between' : 'center', padding: '1.5rem', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', minHeight: '75px' }}>
                    {(isMobile || isSidebarOpen) && (
                      <span className="font-serif" style={{ fontSize: '1.2rem', color: 'var(--gold-antique)', tracking: '0.05em' }}>
                        MAHA STAFF
                      </span>
                    )}
                    <button 
                      onClick={() => isMobile ? setIsMobileSidebarOpen(false) : setIsSidebarOpen(!isSidebarOpen)}
                      style={{ background: 'none', border: 'none', color: 'var(--gold-antique)', cursor: 'pointer', outline: 'none' }}
                    >
                      {isMobile ? <X size={20} /> : <Menu size={20} />}
                    </button>
                  </div>

                  {(isMobile || isSidebarOpen) && (
                    <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', backgroundColor: 'rgba(0,0,0,0.15)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--gold-antique)', color: 'var(--text-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                          M
                        </div>
                        <div>
                          <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--canvas-primary)' }}>Maha Curator</h4>
                          <p style={{ fontSize: '0.7rem', color: 'var(--gold-antique)' }}>Level 1 Admin</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <nav style={{ flex: '1 1 auto', minHeight: 0, padding: '1.5rem 0.5rem', display: 'flex', flexDirection: 'column', gap: '0.35rem', overflowY: 'auto' }}>
                    {[
                      { id: 'overview', label: 'Dashboard', icon: TrendingUp },
                      { id: 'orders', label: 'Orders Log', icon: ShoppingBag },
                      { id: 'bookings', label: 'Reservations', icon: Calendar },
                      { id: 'items', label: 'Items (Menu)', icon: FileText },
                      { id: 'coupons', label: 'Coupons', icon: Tag },
                      { id: 'users', label: 'Users', icon: Users },
                      { id: 'rewards', label: 'Rewards', icon: Coins },
                      { id: 'automation', label: 'Automation', icon: Cpu },
                      { id: 'cms', label: 'CMS (Pages)', icon: FileText },
                      { id: 'careers', label: 'Careers', icon: Briefcase },
                      { id: 'support', label: 'Concierge Support', icon: MessageSquare },
                      { id: 'contacts', label: 'Contact Messages', icon: MessageSquare },
                      { id: 'feedback', label: 'Feedback', icon: Star },
                    ].map((item) => {
                      const Icon = item.icon;
                      const isActive = activeTab === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            setActiveTab(item.id);
                            setSearchQuery('');
                            setRewardsSearchQuery('');
                            setStatusFilter('All');
                            setOrderTypeFilter('All');
                            if (isMobile) {
                              setIsMobileSidebarOpen(false);
                            }
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: (isMobile || isSidebarOpen) ? 'flex-start' : 'center',
                            gap: '1rem',
                            padding: '0.85rem 1rem',
                            borderRadius: '4px',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            width: '100%',
                            textAlign: 'left',
                            transition: 'all 0.3s',
                            backgroundColor: isActive ? 'var(--gold-antique)' : 'transparent',
                            color: isActive ? 'var(--text-dark)' : 'rgba(255,255,255,0.7)'
                          }}
                          onMouseEnter={(e) => {
                            if (!isActive) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
                          }}
                          onMouseLeave={(e) => {
                            if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                        >
                          <Icon size={18} style={{ flexShrink: 0 }} />
                          {(isMobile || isSidebarOpen) && <span>{item.label}</span>}
                        </button>
                      );
                    })}
                  </nav>

                  <div style={{ flexShrink: 0, padding: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)', backgroundColor: 'var(--text-dark)' }}>
                    <button
                      onClick={handleLogout}
                      title="Exit Portal"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: (isMobile || isSidebarOpen) ? 'flex-start' : 'center',
                        gap: '1rem',
                        padding: '0.75rem 1rem',
                        borderRadius: '4px',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        width: '100%',
                        backgroundColor: 'rgba(219, 68, 85, 0.15)',
                        color: '#f8d7da',
                        textAlign: 'left',
                        transition: 'opacity 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.opacity = 0.8}
                      onMouseLeave={(e) => e.currentTarget.style.opacity = 1}
                    >
                      <LogOut size={16} />
                      {(isMobile || isSidebarOpen) && <span>Exit Portal</span>}
                    </button>
                  </div>
                </aside>
              </>
            )}

            {/* MAIN CONTENT */}
            <main style={{ flexGrow: 1, padding: isMobile ? '1.25rem' : '2.5rem', overflowX: 'hidden' }}>
              
              {/* Header */}
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '2.5rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '1.25rem' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', tracking: '0.2em', color: 'var(--gold-antique)' }}>
                    Curator Salon Dashboard
                  </span>
                  <h1 className="font-serif" style={{ fontSize: '2.2rem', textTransform: 'capitalize', fontWeight: 300, marginTop: '0.25rem' }}>
                    {activeTab === 'overview' ? 'Staff Dashboard' : activeTab === 'users' ? 'Registered Users' : activeTab === 'rewards' ? 'Rewards Ledger' : activeTab === 'items' ? 'Items Menu' : activeTab === 'automation' ? 'Automation' : activeTab === 'cms' ? 'CMS Pages' : activeTab === 'contacts' ? 'Contact Messages' : activeTab === 'support' ? 'Concierge Support' : activeTab}
                  </h1>
                </div>

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <button
                    onClick={() => { window.location.hash = '#/'; }}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: 'var(--canvas-primary)',
                      border: '1px solid var(--border-light)',
                      borderRadius: '4px',
                      fontSize: '0.78rem',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      transition: 'border-color 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--gold-antique)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-light)'}
                  >
                    ← Back to Site
                  </button>
                  <div style={{ padding: '0.5rem 1rem', backgroundColor: 'var(--canvas-primary)', border: '1px solid var(--border-light)', borderRadius: '4px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Admin Mode: <strong style={{ color: 'var(--accent-jade)' }}>Online</strong>
                  </div>
                </div>
              </div>

              {adminNotice && (
                <div style={{
                  padding: '0.85rem 1rem',
                  marginBottom: '1.5rem',
                  borderRadius: '6px',
                  border: adminNotice.type === 'success' ? '1px solid rgba(14,110,86,0.24)' : '1px solid rgba(159,18,57,0.24)',
                  backgroundColor: adminNotice.type === 'success' ? 'rgba(14,110,86,0.08)' : 'rgba(159,18,57,0.06)',
                  color: adminNotice.type === 'success' ? 'var(--accent-jade)' : '#9F1239',
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.82rem',
                  fontWeight: 600
                }}>
                  {adminNotice.message}
                </div>
              )}

              {/* RENDER ACTIVE TAB */}
              {activeTab === 'overview' && (
                /* 1. DASHBOARD TAB */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
                    
                    <div style={{ backgroundColor: 'var(--canvas-primary)', border: '1px solid var(--border-light)', borderRadius: '8px', padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem', boxShadow: 'var(--shadow-soft)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', borderRadius: '8px', backgroundColor: 'var(--gold-light)', color: 'var(--gold-antique)' }}>
                        <DollarSign size={24} />
                      </div>
                      <div>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Total Revenue</p>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: 300, color: 'var(--text-dark)', marginTop: '0.15rem' }}>${stats.revenue.toFixed(2)}</h3>
                      </div>
                    </div>

                    <div style={{ backgroundColor: 'var(--canvas-primary)', border: '1px solid var(--border-light)', borderRadius: '8px', padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem', boxShadow: 'var(--shadow-soft)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', borderRadius: '8px', backgroundColor: 'rgba(14, 110, 86, 0.1)', color: 'var(--accent-jade)' }}>
                        <ShoppingBag size={24} />
                      </div>
                      <div>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Pending Orders</p>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: 300, color: 'var(--text-dark)', marginTop: '0.15rem' }}>{stats.pendingOrders} Active</h3>
                      </div>
                    </div>

                    <div style={{ backgroundColor: 'var(--canvas-primary)', border: '1px solid var(--border-light)', borderRadius: '8px', padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem', boxShadow: 'var(--shadow-soft)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', borderRadius: '8px', backgroundColor: 'var(--gold-light)', color: 'var(--gold-antique)' }}>
                        <Calendar size={24} />
                      </div>
                      <div>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Bookings</p>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: 300, color: 'var(--text-dark)', marginTop: '0.15rem' }}>{stats.bookingsCount} Tables</h3>
                      </div>
                    </div>

                  </div>

                </div>
              )}

              {activeTab === 'orders' && (
                /* 2. ORDERS TAB (Pickup, Delivery segregation) */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {/* Subfilters */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', justifyItems: 'center', justifyContent: 'space-between', gap: '1rem', backgroundColor: 'var(--canvas-primary)', border: '1px solid var(--border-light)', borderRadius: '6px', padding: '1rem' }}>
                    
                    {/* Pickup / Delivery Toggles */}
                    <div style={{ display: 'flex', gap: '0.25rem', backgroundColor: 'var(--canvas-secondary)', padding: '0.25rem', borderRadius: '4px', border: '1px solid var(--border-light)' }}>
                      {[
                        { id: 'All', label: 'All Orders' },
                        { id: 'Pickup', label: 'Pickups' },
                        { id: 'Delivery', label: 'Deliveries' }
                      ].map(t => (
                        <button
                          key={t.id}
                          onClick={() => setOrderTypeFilter(t.id)}
                          style={{
                            padding: '0.35rem 0.75rem',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            borderRadius: '3px',
                            border: 'none',
                            cursor: 'pointer',
                            backgroundColor: orderTypeFilter === t.id ? 'var(--text-dark)' : 'transparent',
                            color: orderTypeFilter === t.id ? 'var(--canvas-primary)' : 'var(--text-muted)'
                          }}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', flexGrow: 1, maxWidth: '400px' }}>
                      <div style={{ position: 'relative', width: '100%' }}>
                        <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                          <Search size={16} />
                        </span>
                        <input 
                          type="text" 
                          placeholder="Search orders (ID, client name, items)..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          style={{ width: '100%', padding: '0.5rem 0.75rem 0.5rem 2.25rem', fontSize: '0.8rem', border: '1px solid var(--border-light)', borderRadius: '4px', outline: 'none' }}
                        />
                      </div>

                      <select 
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        style={{ padding: '0.5rem', fontSize: '0.8rem', border: '1px solid var(--border-light)', borderRadius: '4px', outline: 'none', width: '140px' }}
                      >
                        <option value="All">All Statuses</option>
                        <option value="Pending">Pending</option>
                        <option value="Preparing">Preparing</option>
                        <option value="Out for Delivery">Out for Delivery</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>

                  {/* Orders Table */}
                  <div style={{ backgroundColor: 'var(--canvas-primary)', border: '1px solid var(--border-light)', borderRadius: '8px', boxShadow: 'var(--shadow-soft)', overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid var(--border-light)', backgroundColor: 'var(--canvas-secondary)' }}>
                          <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Order ID</th>
                          <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Patron Details</th>
                          <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Items</th>
                          <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Type</th>
                          <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Total Cost</th>
                          <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Status State</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredOrders.length === 0 ? (
                          <tr>
                            <td colSpan="7" style={{ padding: '3rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                              No orders found.
                            </td>
                          </tr>
                        ) : (
                          visibleOrders.map((order) => (
                            <tr key={order.id} style={{ borderBottom: '1px solid var(--border-light)', transition: 'background-color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--canvas-secondary)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                              <td style={{ padding: '1rem', fontSize: '0.8rem', fontWeight: 600 }}>{order.id}</td>
                              <td style={{ padding: '1rem', fontSize: '0.8rem' }}>
                                <div style={{ fontWeight: 600 }}>{order.customerName}</div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{order.customerPhone} | {order.customerEmail}</div>
                              </td>
                              <td style={{ padding: '1rem', fontSize: '0.8rem', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {order.items}
                              </td>
                              <td style={{ padding: '1rem', fontSize: '0.8rem' }}>
                                <span style={{ padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', backgroundColor: order.type === 'Delivery' ? 'rgba(14, 110, 86, 0.1)' : 'var(--gold-light)', color: order.type === 'Delivery' ? 'var(--accent-jade)' : 'var(--gold-antique)' }}>
                                  {order.type}
                                </span>
                              </td>
                              <td style={{ padding: '1rem', fontSize: '0.8rem', fontWeight: 600 }}>${parseFloat(order.total || 0).toFixed(2)}</td>
                              <td style={{ padding: '1rem', fontSize: '0.8rem' }}>
                                <select 
                                  value={order.status}
                                  onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                                  style={{ padding: '0.35rem 0.5rem', borderRadius: '4px', border: '1px solid var(--border-light)', fontSize: '0.75rem', fontWeight: 600, outline: 'none' }}
                                >
                                  <option value="Pending">Pending</option>
                                  <option value="Preparing">Preparing</option>
                                  <option value="Out for Delivery">Out for Delivery</option>
                                  <option value="Delivered">Delivered</option>
                                  <option value="Cancelled">Cancelled</option>
                                </select>
                              </td>
                              <td style={{ padding: '1rem', fontSize: '0.8rem' }}>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                  <button onClick={() => { setSelectedOrder(order); setShowOrderDetailsModal(true); }} style={{ background: 'none', border: 'none', color: 'var(--accent-jade)', cursor: 'pointer' }}><Eye size={16} /></button>
                                  <button onClick={() => handleDeleteOrder(order.id)} style={{ background: 'none', border: 'none', color: '#db4455', cursor: 'pointer' }}><Trash2 size={16} /></button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                    <PaginationControls page={ordersPage} totalPages={ordersTotalPages} totalItems={ordersTotalCount} onPageChange={setOrdersPage} />
                  </div>
                </div>
              )}

              {activeTab === 'bookings' && (
                <div>
                  <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                    <div>
                      <h2 className="font-serif" style={{ fontSize: '2rem', fontWeight: 300, color: 'var(--text-dark)' }}>Reservations</h2>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                        Confirm, keep pending, or cancel customer table bookings.
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', flexGrow: 1, maxWidth: '520px' }}>
                      <div style={{ position: 'relative', width: '100%' }}>
                        <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                          <Search size={16} />
                        </span>
                        <input
                          type="text"
                          placeholder="Search reservations..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          style={{ width: '100%', padding: '0.5rem 0.75rem 0.5rem 2.25rem', fontSize: '0.8rem', border: '1px solid var(--border-light)', borderRadius: '4px', outline: 'none' }}
                        />
                      </div>

                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        style={{ padding: '0.5rem', fontSize: '0.8rem', border: '1px solid var(--border-light)', borderRadius: '4px', outline: 'none', width: '140px' }}
                      >
                        <option value="All">All Statuses</option>
                        <option value="Pending">Pending</option>
                        <option value="Confirmed">Confirmed</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ backgroundColor: 'var(--canvas-primary)', border: '1px solid var(--border-light)', borderRadius: '8px', boxShadow: 'var(--shadow-soft)', overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '820px' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid var(--border-light)', backgroundColor: 'var(--canvas-secondary)' }}>
                          <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Reservation ID</th>
                          <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Patron Details</th>
                          <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Date & Time</th>
                          <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Guests</th>
                          <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Notes</th>
                          <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredBookings.length === 0 ? (
                          <tr>
                            <td colSpan="6" style={{ padding: '3rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                              No reservations found.
                            </td>
                          </tr>
                        ) : (
                          visibleBookings.map((booking) => (
                            <tr key={booking.id} style={{ borderBottom: '1px solid var(--border-light)', transition: 'background-color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--canvas-secondary)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                              <td style={{ padding: '1rem', fontSize: '0.8rem', fontWeight: 600 }}>{booking.id}</td>
                              <td style={{ padding: '1rem', fontSize: '0.8rem' }}>
                                <div style={{ fontWeight: 600 }}>{booking.customerName}</div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{booking.customerPhone} | {booking.customerEmail}</div>
                              </td>
                              <td style={{ padding: '1rem', fontSize: '0.8rem' }}>
                                <div>{booking.date}</div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{booking.time}</div>
                              </td>
                              <td style={{ padding: '1rem', fontSize: '0.8rem', fontWeight: 600 }}>{booking.guests}</td>
                              <td style={{ padding: '1rem', fontSize: '0.8rem', maxWidth: '260px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{booking.notes || 'None'}</td>
                              <td style={{ padding: '1rem', fontSize: '0.8rem' }}>
                                <select
                                  value={booking.status}
                                  onChange={(e) => handleUpdateBookingStatus(booking.id, e.target.value)}
                                  style={{ padding: '0.35rem 0.5rem', borderRadius: '4px', border: '1px solid var(--border-light)', fontSize: '0.75rem', fontWeight: 600, outline: 'none' }}
                                >
                                  <option value="Pending">Pending</option>
                                  <option value="Confirmed">Confirmed</option>
                                  <option value="Cancelled">Cancelled</option>
                                </select>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                    <PaginationControls page={bookingsPage} totalPages={bookingsTotalPages} totalItems={bookingsTotalCount} onPageChange={setBookingsPage} />
                  </div>
                </div>
              )}

              {activeTab === 'items' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem', maxWidth: '100%', whiteSpace: 'nowrap' }}>
                      {menuCategories.map(cat => (
                        <button
                          key={cat}
                          onClick={() => setSelectedMenuCategory(cat)}
                          style={{
                            padding: '0.5rem 1rem', fontSize: '0.75rem', fontWeight: 700, borderRadius: '24px', border: '1px solid',
                            borderColor: selectedMenuCategory === cat ? 'var(--gold-antique)' : 'var(--border-light)',
                            backgroundColor: selectedMenuCategory === cat ? 'var(--gold-antique)' : 'var(--canvas-primary)',
                            color: selectedMenuCategory === cat ? 'var(--text-dark)' : 'var(--text-muted)',
                            cursor: 'pointer', transition: 'all 0.3s'
                          }}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>

                    <button onClick={handleOpenAddDish} className="btn-filled" style={{ padding: '0.75rem 1.5rem', fontSize: '0.75rem' }}>
                      <Plus size={16} /> ADD NEW ITEM
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', alignItems: 'center', backgroundColor: 'var(--canvas-primary)', border: '1px solid var(--border-light)', borderRadius: '8px', padding: '1rem', boxShadow: 'var(--shadow-soft)' }}>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex' }}>
                        <Search size={16} />
                      </span>
                      <input
                        type="search"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search menu items..."
                        style={{ width: '100%', padding: '0.72rem 0.9rem 0.72rem 2.35rem', fontSize: '0.85rem', border: '1px solid var(--border-light)', borderRadius: '6px', outline: 'none', backgroundColor: 'var(--canvas-secondary)', color: 'var(--text-dark)' }}
                      />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginRight: '0.25rem' }}>
                        {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''}
                      </span>
                      {menuPriceRanges.map((range, index) => {
                        const active = menuPriceRange === index;
                        return (
                          <button
                            key={range.label}
                            type="button"
                            onClick={() => setMenuPriceRange(index)}
                            style={{
                              padding: '0.45rem 0.85rem',
                              borderRadius: '9999px',
                              border: `1px solid ${active ? 'var(--gold-antique)' : 'var(--border-light)'}`,
                              backgroundColor: active ? 'var(--gold-antique)' : 'var(--canvas-secondary)',
                              color: active ? 'var(--text-dark)' : 'var(--text-muted)',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {range.label}
                          </button>
                        );
                      })}
                      {(searchQuery.trim() || menuPriceRange !== 0) && (
                        <button
                          type="button"
                          onClick={() => { setSearchQuery(''); setMenuPriceRange(0); }}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.45rem 0.75rem', borderRadius: '6px', border: '1px solid var(--gold-antique)', backgroundColor: 'rgba(186,155,95,0.08)', color: 'var(--gold-antique)', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}
                        >
                          <X size={12} /> Clear
                        </button>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                    {filteredItems.map((dish) => (
                      <div key={dish.id} style={{ backgroundColor: 'var(--canvas-primary)', border: '1px solid var(--border-light)', borderRadius: '8px', overflow: 'hidden', boxShadow: 'var(--shadow-soft)', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                        <div style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', zIndex: 10, padding: '0.2rem 0.5rem', borderRadius: '12px', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', backgroundColor: dish.availability !== false ? 'rgba(14, 110, 86, 0.1)' : 'rgba(219, 68, 85, 0.1)', color: dish.availability !== false ? 'var(--accent-jade)' : '#db4455', border: '1px solid', borderColor: dish.availability !== false ? 'rgba(14, 110, 86, 0.2)' : 'rgba(219, 68, 85, 0.2)' }}>
                          {dish.availability !== false ? 'In Stock' : 'Out of Stock'}
                        </div>
                        <div style={{ height: '140px', overflow: 'hidden', backgroundColor: 'var(--canvas-secondary)' }}>
                          <img src={dish.image} alt={dish.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1559314809-0d155014e29e?auto=format&fit=crop&q=80&w=400'; }} />
                        </div>
                        <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', flexGrow: 1, gap: '0.5rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <h4 className="font-serif" style={{ fontSize: '1.1rem', color: 'var(--text-dark)' }}>{dish.name}</h4>
                            <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--gold-antique)' }}>${dish.price}</span>
                          </div>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.5, flexGrow: 1 }}>{dish.description}</p>
                          {Array.isArray(dish.addon_options) && dish.addon_options.length > 0 && (
                            <span style={{ fontSize: '0.68rem', color: 'var(--accent-jade)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                              {dish.addon_options.length} add-ons configured
                            </span>
                          )}
                          {Array.isArray(dish.protein_choice) && dish.protein_choice.length > 0 && (
                            <span style={{ fontSize: '0.68rem', color: 'var(--accent-jade)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                              {dish.protein_choice.length} protein choices configured
                            </span>
                          )}
                          {Array.isArray(dish.spice_options) && dish.spice_options.length > 0 && (
                            <span style={{ fontSize: '0.68rem', color: 'var(--gold-antique)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                              {dish.spice_options.length} spicy options configured
                            </span>
                          )}
                          {Array.isArray(dish.size_options) && dish.size_options.length > 0 && (
                            <span style={{ fontSize: '0.68rem', color: 'var(--text-dark)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                              {dish.size_options.length} size amounts configured
                            </span>
                          )}
                          {Array.isArray(dish.suggested_item_ids) && dish.suggested_item_ids.length > 0 && (
                            <span style={{ fontSize: '0.68rem', color: 'var(--text-dark)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                              {dish.suggested_item_ids.length} suggested items configured
                            </span>
                          )}
                          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-light)', paddingTop: '0.75rem', marginTop: '0.5rem', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>ID: {dish.id}</span>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <button onClick={() => handleOpenEditDish(dish)} style={{ background: 'none', border: 'none', color: 'var(--gold-antique)', cursor: 'pointer' }}><Edit size={15} /></button>
                              <button onClick={() => handleDeleteDish(dish.id)} style={{ background: 'none', border: 'none', color: '#db4455', cursor: 'pointer' }}><Trash2 size={15} /></button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'automation' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                  <div style={{ backgroundColor: 'var(--canvas-primary)', border: '1px solid var(--border-light)', borderRadius: '8px', padding: '2rem', boxShadow: 'var(--shadow-soft)' }}>
                    <h3 className="font-serif" style={{ fontSize: '1.4rem', fontWeight: 300, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Cpu size={20} style={{ color: 'var(--gold-antique)' }} /> Automatic Campaign Rules
                    </h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '2rem' }}>
                      Configure background automations, timed pricing reductions, and email logs.
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                      {[
                        { key: 'seatingReminder', title: 'Automated Seating Reminder', desc: 'Dispatches automated email/SMS reminders to patrons 24 hours prior to their reserved seating booking.' },
                        { key: 'happyHourPricing', title: 'Happy Hour Smart Pricing', desc: 'Lowers Appetizers and Beverages cost by 15% automatically on weekdays from 2 PM to 5 PM.' },
                        { key: 'reviewInvites', title: 'Automated Review Invites', desc: 'Triggers a dining feedback request email 2 hours after a food delivery is marked as delivered.' },
                        { key: 'backupSync', title: 'System Database Cloud Sync', desc: 'Syncs customer records, menu templates, and logs to secondary secure systems nightly.' },
                        { key: 'kitchenDisplayAutoAlert', title: 'Kitchen Alert Auto-Prioritizer', desc: 'Flags orders exceeding $100 as priority in staff logs automatically.' }
                      ].map(rule => (
                        <div key={rule.key} style={{ display: 'flex', justifyItems: 'center', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-light)', paddingBottom: '1.25rem', gap: '1.5rem' }}>
                          <div style={{ textAlign: 'left' }}>
                            <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-dark)' }}>{rule.title}</h4>
                            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>{rule.desc}</p>
                          </div>
                          <button
                            onClick={() => handleToggleAutomation(rule.key)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: automationRules[rule.key] ? 'var(--accent-jade)' : 'var(--text-muted)', transition: 'color 0.2s' }}
                          >
                            {automationRules[rule.key] ? <ToggleRight size={42} /> : <ToggleLeft size={42} />}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ backgroundColor: 'var(--canvas-primary)', border: '1px solid var(--border-light)', borderRadius: '8px', padding: '2rem', boxShadow: 'var(--shadow-soft)' }}>
                    <h4 className="font-serif" style={{ fontSize: '1.15rem', fontWeight: 300, marginBottom: '1rem' }}>Background Task Log</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.8rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>[14:15:32] System Cloud Backup:</span>
                        <strong style={{ color: 'var(--accent-jade)' }}>Completed (204Kb)</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>[12:00:00] Seating Reminders:</span>
                        <span>Sent 14 emails</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>[09:00:05] Menu Price Engine:</span>
                        <span>Standard pricing active (Happy hour disabled)</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'cms' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                  {cmsNotification && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem 1.25rem', backgroundColor: 'rgba(14, 110, 86, 0.1)', border: '1px solid rgba(14, 110, 86, 0.3)', borderRadius: '6px', color: 'var(--accent-jade)', fontSize: '0.85rem' }}>
                      <CheckCircle size={18} style={{ flexShrink: 0 }} />
                      <span>{cmsNotification}</span>
                    </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '240px 1fr', gap: '2rem', alignItems: 'start' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', backgroundColor: 'var(--canvas-primary)', border: '1px solid var(--border-light)', borderRadius: '8px', padding: '1rem', boxShadow: 'var(--shadow-soft)' }}>
                      <h4 style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: '0.5rem', paddingLeft: '0.5rem' }}>Sections</h4>
                      {Object.keys(cmsContent).map((sectionKey) => (
                        <button
                          key={sectionKey}
                          type="button"
                          onClick={() => setCmsActiveSection(sectionKey)}
                          style={{
                            padding: '0.65rem 0.85rem',
                            fontSize: '0.85rem',
                            fontWeight: 600,
                            borderRadius: '4px',
                            border: 'none',
                            cursor: 'pointer',
                            textAlign: 'left',
                            width: '100%',
                            transition: 'all 0.2s',
                            backgroundColor: cmsActiveSection === sectionKey ? 'var(--gold-light)' : 'transparent',
                            color: cmsActiveSection === sectionKey ? 'var(--gold-antique)' : 'var(--text-muted)',
                            borderLeft: cmsActiveSection === sectionKey ? '3px solid var(--gold-antique)' : '3px solid transparent',
                            textTransform: 'capitalize'
                          }}
                        >
                          {sectionKey}
                        </button>
                      ))}

                      <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-light)' }}>
                        <button onClick={handleSaveCMS} className="btn-filled" style={{ width: '100%', padding: '0.65rem', fontSize: '0.75rem', justifyContent: 'center' }}>
                          <Check size={14} /> SAVE ALL CHANGES
                        </button>
                        <button onClick={handleResetCMS} style={{ width: '100%', padding: '0.65rem', fontSize: '0.75rem', border: '1px solid var(--border-light)', backgroundColor: 'transparent', color: '#db4455', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                          <Clock size={14} /> Restore Defaults
                        </button>
                      </div>
                    </div>

                    <div style={{ backgroundColor: 'var(--canvas-primary)', border: '1px solid var(--border-light)', borderRadius: '8px', padding: '2rem', boxShadow: 'var(--shadow-soft)' }}>
                      <form onSubmit={handleSaveCMS} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '0.75rem' }}>
                          <h3 className="font-serif" style={{ fontSize: '1.35rem', fontWeight: 300, textTransform: 'capitalize' }}>{cmsActiveSection.replace(/([A-Z])/g, ' $1')}</h3>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Dynamically edit website content for this section.</p>
                        </div>

                        {Object.entries(cmsContent[cmsActiveSection] || {}).map(([fieldKey, fieldValue]) => (
                          <div key={fieldKey}>
                            <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.4rem' }}>{fieldKey.replace(/([A-Z])/g, ' $1')}</label>
                            {String(fieldValue).length > 90 ? (
                              <textarea
                                rows="4"
                                value={fieldValue}
                                onChange={(e) => setCmsContent((prev) => ({ ...prev, [cmsActiveSection]: { ...prev[cmsActiveSection], [fieldKey]: e.target.value } }))}
                                style={{ width: '100%', padding: '0.65rem 0.85rem', fontSize: '0.85rem', border: '1px solid var(--border-light)', borderRadius: '4px', outline: 'none', backgroundColor: 'var(--canvas-secondary)', color: 'var(--text-dark)', fontFamily: 'var(--font-sans)', resize: 'vertical' }}
                              />
                            ) : (
                              <input
                                type="text"
                                value={fieldValue}
                                onChange={(e) => setCmsContent((prev) => ({ ...prev, [cmsActiveSection]: { ...prev[cmsActiveSection], [fieldKey]: e.target.value } }))}
                                style={{ width: '100%', padding: '0.65rem 0.85rem', fontSize: '0.85rem', border: '1px solid var(--border-light)', borderRadius: '4px', outline: 'none', backgroundColor: 'var(--canvas-secondary)', color: 'var(--text-dark)' }}
                              />
                            )}
                          </div>
                        ))}
                      </form>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'coupons' && (
                /* 4. COUPONS TAB (Add, Update coupons) */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyItems: 'center', justifyContent: 'space-between', gap: '1rem', backgroundColor: 'var(--canvas-primary)', border: '1px solid var(--border-light)', borderRadius: '6px', padding: '1rem', alignItems: 'center' }}>
                    <div style={{ position: 'relative', width: '300px' }}>
                      <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                        <Search size={16} />
                      </span>
                      <input 
                        type="text" 
                        placeholder="Search coupons..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{ width: '100%', padding: '0.5rem 0.75rem 0.5rem 2.25rem', fontSize: '0.8rem', border: '1px solid var(--border-light)', borderRadius: '4px', outline: 'none' }}
                      />
                    </div>

                    <button onClick={handleOpenAddCoupon} className="btn-filled" style={{ padding: '0.75rem 1.5rem', fontSize: '0.75rem' }}>
                      <Plus size={16} /> ADD COUPON
                    </button>
                  </div>

                  {/* Coupons Table */}
                  <div style={{ backgroundColor: 'var(--canvas-primary)', border: '1px solid var(--border-light)', borderRadius: '8px', boxShadow: 'var(--shadow-soft)', overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid var(--border-light)', backgroundColor: 'var(--canvas-secondary)' }}>
                          <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Coupon Code</th>
                          <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Discount Type</th>
                          <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Discount Value</th>
                          <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Min Order (USD)</th>
                          <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Expiry Date</th>
                          <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {visibleCoupons.map((coupon) => (
                          <tr key={coupon.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                            <td style={{ padding: '1rem', fontSize: '0.8rem', fontWeight: 700, color: 'var(--gold-antique)' }}>{coupon.code}</td>
                            <td style={{ padding: '1rem', fontSize: '0.8rem', textTransform: 'capitalize' }}>{coupon.type}</td>
                            <td style={{ padding: '1rem', fontSize: '0.8rem', fontWeight: 600 }}>
                              {coupon.type === 'percentage' ? `${coupon.value}%` : `$${coupon.value}`}
                            </td>
                            <td style={{ padding: '1rem', fontSize: '0.8rem' }}>${coupon.minOrder}</td>
                            <td style={{ padding: '1rem', fontSize: '0.8rem' }}>{coupon.expiryDate}</td>
                            <td style={{ padding: '1rem', fontSize: '0.8rem' }}>
                              <span style={{ padding: '0.2rem 0.5rem', borderRadius: '12px', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', backgroundColor: coupon.status === 'Active' ? 'rgba(14, 110, 86, 0.1)' : 'rgba(219, 68, 85, 0.1)', color: coupon.status === 'Active' ? 'var(--accent-jade)' : '#db4455' }}>
                                {coupon.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <PaginationControls page={couponsPage} totalPages={couponsTotalPages} totalItems={filteredCoupons.length} onPageChange={setCouponsPage} />
                </div>
              )}

              {activeTab === 'users' && (
                /* 5. USERS TAB */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyItems: 'center', justifyContent: 'space-between', gap: '1rem', backgroundColor: 'var(--canvas-primary)', border: '1px solid var(--border-light)', borderRadius: '6px', padding: '1rem' }}>
                    <div style={{ position: 'relative', width: '350px' }}>
                      <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                        <Search size={16} />
                      </span>
                      <input 
                        type="text" 
                        placeholder="Search users..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{ width: '100%', padding: '0.5rem 0.75rem 0.5rem 2.25rem', fontSize: '0.8rem', border: '1px solid var(--border-light)', borderRadius: '4px', outline: 'none' }}
                      />
                    </div>
                  </div>

                  <div style={{ backgroundColor: 'var(--canvas-primary)', border: '1px solid var(--border-light)', borderRadius: '8px', boxShadow: 'var(--shadow-soft)', overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '1360px' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid var(--border-light)', backgroundColor: 'var(--canvas-secondary)' }}>
                          <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>User ID</th>
                          <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>User Name</th>
                          <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Email Address</th>
                          <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Phone Number</th>
                          <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Created</th>
                          <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Last Ordered</th>
                          <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Email Follow</th>
                          <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>SMS Follow</th>
                          <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Points</th>
                          <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Role</th>
                          <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Bookings</th>
                          <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Orders</th>
                        </tr>
                      </thead>
                      <tbody>
                        {visibleUsers.map((user, idx) => (
                          <tr key={user.id || user.email || idx} style={{ borderBottom: '1px solid var(--border-light)' }}>
                            <td style={{ padding: '1rem', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-dark)' }}>{user.id || 'N/A'}</td>
                            <td style={{ padding: '1rem', fontSize: '0.8rem', fontWeight: 600 }}>{user.name}</td>
                            <td style={{ padding: '1rem', fontSize: '0.8rem' }}>{user.email}</td>
                            <td style={{ padding: '1rem', fontSize: '0.8rem' }}>{user.phone}</td>
                            <td style={{ padding: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                              {user.createdAt ? new Date(user.createdAt).toLocaleString() : 'N/A'}
                            </td>
                            <td style={{ padding: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                              {user.lastOrderedOn ? new Date(user.lastOrderedOn).toLocaleString() : 'N/A'}
                            </td>
                            <td style={{ padding: '1rem', fontSize: '0.8rem' }}>
                              <span style={{ padding: '0.15rem 0.5rem', backgroundColor: user.followingEmail ? 'rgba(14, 110, 86, 0.1)' : 'rgba(219, 68, 85, 0.1)', color: user.followingEmail ? 'var(--accent-jade)' : '#db4455', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 700 }}>
                                {user.followingEmail ? 'Yes' : 'No'}
                              </span>
                            </td>
                            <td style={{ padding: '1rem', fontSize: '0.8rem' }}>
                              <span style={{ padding: '0.15rem 0.5rem', backgroundColor: user.followingSms ? 'rgba(14, 110, 86, 0.1)' : 'rgba(219, 68, 85, 0.1)', color: user.followingSms ? 'var(--accent-jade)' : '#db4455', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 700 }}>
                                {user.followingSms ? 'Yes' : 'No'}
                              </span>
                            </td>
                            <td style={{ padding: '1rem', fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-jade)' }}>{user.pointsRemaining} pts</td>
                            <td style={{ padding: '1rem', fontSize: '0.8rem', textTransform: 'capitalize' }}>{user.role}</td>
                            <td style={{ padding: '1rem', fontSize: '0.8rem' }}>
                              <span style={{ padding: '0.15rem 0.5rem', backgroundColor: 'var(--gold-light)', color: 'var(--gold-antique)', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
                                {user.bookingsCount} Seating
                              </span>
                            </td>
                            <td style={{ padding: '1rem', fontSize: '0.8rem' }}>
                              <span style={{ padding: '0.15rem 0.5rem', backgroundColor: 'rgba(14, 110, 86, 0.1)', color: 'var(--accent-jade)', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
                                {user.ordersCount} Orders
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <PaginationControls page={usersPage} totalPages={usersTotalPages} totalItems={filteredUsers.length} onPageChange={setUsersPage} />
                </div>
              )}

              {activeTab === 'rewards' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyItems: 'center', justifyContent: 'space-between', gap: '1rem', backgroundColor: 'var(--canvas-primary)', border: '1px solid var(--border-light)', borderRadius: '6px', padding: '1rem' }}>
                    <div style={{ position: 'relative', width: '350px' }}>
                      <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                        <Search size={16} />
                      </span>
                      <input
                        type="text"
                        placeholder="Search reward users..."
                        value={rewardsSearchQuery}
                        onChange={(e) => setRewardsSearchQuery(e.target.value)}
                        style={{ width: '100%', padding: '0.5rem 0.75rem 0.5rem 2.25rem', fontSize: '0.8rem', border: '1px solid var(--border-light)', borderRadius: '4px', outline: 'none' }}
                      />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--gold-antique)', fontSize: '0.82rem', fontWeight: 700 }}>
                      <Coins size={16} />
                      $10 spent earns 1 point
                    </div>
                  </div>

                  <div style={{ backgroundColor: 'var(--canvas-primary)', border: '1px solid var(--border-light)', borderRadius: '8px', boxShadow: 'var(--shadow-soft)', overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '820px' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid var(--border-light)', backgroundColor: 'var(--canvas-secondary)' }}>
                          <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Customer</th>
                          <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Current Points</th>
                          <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Lifetime Earned</th>
                          <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Redeemed</th>
                          <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Last Earned</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredRewards.length === 0 ? (
                          <tr>
                            <td colSpan="5" style={{ padding: '3rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                              No reward balances found yet.
                            </td>
                          </tr>
                        ) : (
                          visibleRewards.map((reward) => {
                            const user = reward.user || {};
                            return (
                              <tr key={reward.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                                <td style={{ padding: '1rem', fontSize: '0.8rem' }}>
                                  <div style={{ fontWeight: 600 }}>{user.full_name || user.name || `User ${reward.user_id}`}</div>
                                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{user.email || 'N/A'}</div>
                                </td>
                                <td style={{ padding: '1rem', fontSize: '0.9rem', fontWeight: 700, color: 'var(--accent-jade)' }}>{reward.current_points || 0} pts</td>
                                <td style={{ padding: '1rem', fontSize: '0.8rem' }}>{reward.lifetime_points || 0} pts</td>
                                <td style={{ padding: '1rem', fontSize: '0.8rem' }}>{reward.redeemed_points || 0} pts</td>
                                <td style={{ padding: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                  {reward.last_earned_at ? new Date(reward.last_earned_at).toLocaleString() : 'Not earned yet'}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                  <PaginationControls page={rewardsPage} totalPages={rewardsTotalPages} totalItems={filteredRewards.length} onPageChange={setRewardsPage} />
                </div>
              )}

              {activeTab === 'careers' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyItems: 'center', justifyContent: 'space-between', gap: '1rem', backgroundColor: 'var(--canvas-primary)', border: '1px solid var(--border-light)', borderRadius: '6px', padding: '1rem' }}>
                    <div style={{ position: 'relative', width: '350px' }}>
                      <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                        <Search size={16} />
                      </span>
                      <input
                        type="text"
                        placeholder="Search career applications..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{ width: '100%', padding: '0.5rem 0.75rem 0.5rem 2.25rem', fontSize: '0.8rem', border: '1px solid var(--border-light)', borderRadius: '4px', outline: 'none' }}
                      />
                    </div>
                  </div>

                  <div style={{ backgroundColor: 'var(--canvas-primary)', border: '1px solid var(--border-light)', borderRadius: '8px', boxShadow: 'var(--shadow-soft)', overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '920px' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid var(--border-light)', backgroundColor: 'var(--canvas-secondary)' }}>
                          <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Applicant</th>
                          <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Phone</th>
                          <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Position</th>
                          <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Experience</th>
                          <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Message</th>
                          <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Applied</th>
                          <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredCareerApplications.length === 0 ? (
                          <tr>
                            <td colSpan="7" style={{ padding: '3rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                              No career applications found.
                            </td>
                          </tr>
                        ) : (
                          visibleCareerApplications.map((application) => (
                            <tr key={application.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                              <td style={{ padding: '1rem', fontSize: '0.8rem' }}>
                                <div style={{ fontWeight: 600 }}>{application.name}</div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{application.email}</div>
                              </td>
                              <td style={{ padding: '1rem', fontSize: '0.8rem' }}>{application.phone}</td>
                              <td style={{ padding: '1rem', fontSize: '0.8rem', fontWeight: 600 }}>{application.position}</td>
                              <td style={{ padding: '1rem', fontSize: '0.8rem' }}>{application.experience}</td>
                              <td style={{ padding: '1rem', fontSize: '0.8rem', maxWidth: '260px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{application.message || 'None'}</td>
                              <td style={{ padding: '1rem', fontSize: '0.8rem' }}>{application.date || 'N/A'}</td>
                              <td style={{ padding: '1rem', fontSize: '0.8rem' }}>
                                <select
                                  value={application.status}
                                  onChange={(e) => handleUpdateCareerStatus(application.id, e.target.value)}
                                  style={{ padding: '0.35rem 0.5rem', borderRadius: '4px', border: '1px solid var(--border-light)', fontSize: '0.75rem', fontWeight: 600, outline: 'none' }}
                                >
                                  <option value="Pending">Pending</option>
                                  <option value="Reviewing">Reviewing</option>
                                  <option value="Shortlisted">Shortlisted</option>
                                  <option value="Interview">Interview</option>
                                  <option value="Rejected">Rejected</option>
                                  <option value="Hired">Hired</option>
                                </select>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                  <PaginationControls page={careersPage} totalPages={careersTotalPages} totalItems={filteredCareerApplications.length} onPageChange={setCareersPage} />
                </div>
              )}

              {activeTab === 'contacts' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyItems: 'center', justifyContent: 'space-between', gap: '1rem', backgroundColor: 'var(--canvas-primary)', border: '1px solid var(--border-light)', borderRadius: '6px', padding: '1rem' }}>
                    <div style={{ position: 'relative', width: '350px' }}>
                      <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                        <Search size={16} />
                      </span>
                      <input
                        type="text"
                        placeholder="Search contact messages..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{ width: '100%', padding: '0.5rem 0.75rem 0.5rem 2.25rem', fontSize: '0.8rem', border: '1px solid var(--border-light)', borderRadius: '4px', outline: 'none' }}
                      />
                    </div>
                  </div>

                  <div style={{ backgroundColor: 'var(--canvas-primary)', border: '1px solid var(--border-light)', borderRadius: '8px', boxShadow: 'var(--shadow-soft)', overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '980px' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid var(--border-light)', backgroundColor: 'var(--canvas-secondary)' }}>
                          <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Customer</th>
                          <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Phone</th>
                          <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Subject</th>
                          <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Message</th>
                          <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Date</th>
                          <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredContactMessages.length === 0 ? (
                          <tr>
                            <td colSpan="6" style={{ padding: '3rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                              No contact messages found.
                            </td>
                          </tr>
                        ) : (
                          visibleContactMessages.map((message) => (
                            <tr key={message.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                              <td style={{ padding: '1rem', fontSize: '0.8rem' }}>
                                <div style={{ fontWeight: 600 }}>{message.name}</div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{message.email}</div>
                              </td>
                              <td style={{ padding: '1rem', fontSize: '0.8rem' }}>{message.phone}</td>
                              <td style={{ padding: '1rem', fontSize: '0.8rem', fontWeight: 600 }}>{message.subject}</td>
                              <td style={{ padding: '1rem', fontSize: '0.8rem', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{message.message || 'None'}</td>
                              <td style={{ padding: '1rem', fontSize: '0.8rem' }}>{message.date || 'N/A'}</td>
                              <td style={{ padding: '1rem', fontSize: '0.8rem' }}>
                                <select
                                  value={message.status}
                                  onChange={(e) => handleUpdateContactStatus(message.id, e.target.value)}
                                  style={{ padding: '0.35rem 0.5rem', borderRadius: '4px', border: '1px solid var(--border-light)', fontSize: '0.75rem', fontWeight: 600, outline: 'none' }}
                                >
                                  <option value="Pending">Pending</option>
                                  <option value="In Progress">In Progress</option>
                                  <option value="Resolved">Resolved</option>
                                  <option value="Closed">Closed</option>
                                </select>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                  <PaginationControls page={contactsPage} totalPages={contactsTotalPages} totalItems={filteredContactMessages.length} onPageChange={setContactsPage} />
                </div>
              )}

              {activeTab === 'support' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyItems: 'center', justifyContent: 'space-between', gap: '1rem', backgroundColor: 'var(--canvas-primary)', border: '1px solid var(--border-light)', borderRadius: '6px', padding: '1rem' }}>
                    <div style={{ position: 'relative', width: '350px' }}>
                      <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                        <Search size={16} />
                      </span>
                      <input
                        type="text"
                        placeholder="Search concierge support..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{ width: '100%', padding: '0.5rem 0.75rem 0.5rem 2.25rem', fontSize: '0.8rem', border: '1px solid var(--border-light)', borderRadius: '4px', outline: 'none' }}
                      />
                    </div>
                  </div>

                  <div style={{ backgroundColor: 'var(--canvas-primary)', border: '1px solid var(--border-light)', borderRadius: '8px', boxShadow: 'var(--shadow-soft)', overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '1080px' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid var(--border-light)', backgroundColor: 'var(--canvas-secondary)' }}>
                          <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Customer</th>
                          <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Phone</th>
                          <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Message</th>
                          <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Response</th>
                          <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Date</th>
                          <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredConciergeInquiries.length === 0 ? (
                          <tr>
                            <td colSpan="6" style={{ padding: '3rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                              No concierge support records found.
                            </td>
                          </tr>
                        ) : (
                          visibleConciergeInquiries.map((inquiry) => (
                            <tr key={inquiry.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                              <td style={{ padding: '1rem', fontSize: '0.8rem' }}>
                                <div style={{ fontWeight: 600 }}>{inquiry.name}</div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{inquiry.email}</div>
                                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>User {inquiry.userId || 'N/A'}</div>
                              </td>
                              <td style={{ padding: '1rem', fontSize: '0.8rem' }}>{inquiry.phone}</td>
                              <td style={{ padding: '1rem', fontSize: '0.8rem', maxWidth: '260px', whiteSpace: 'normal', lineHeight: 1.45 }}>{inquiry.message || 'None'}</td>
                              <td style={{ padding: '1rem', fontSize: '0.8rem', minWidth: '260px' }}>
                                <textarea
                                  rows="3"
                                  value={inquiry.response}
                                  placeholder="Write admin response..."
                                  onChange={(e) => setConciergeInquiries((items) => items.map((item) => (
                                    item.id === inquiry.id ? { ...item, response: e.target.value } : item
                                  )))}
                                  style={{ width: '100%', resize: 'vertical', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border-light)', fontSize: '0.75rem', fontFamily: 'var(--font-sans)', outline: 'none' }}
                                />
                                <button
                                  type="button"
                                  onClick={() => handleUpdateConciergeInquiry(inquiry.id, {
                                    response: inquiry.response,
                                    status: inquiry.status
                                  })}
                                  style={{
                                    marginTop: '0.5rem',
                                    padding: '0.4rem 0.7rem',
                                    border: '1px solid var(--gold-antique)',
                                    borderRadius: '4px',
                                    backgroundColor: 'rgba(204, 164, 83, 0.08)',
                                    color: 'var(--gold-antique)',
                                    fontSize: '0.7rem',
                                    fontWeight: 700,
                                    textTransform: 'uppercase',
                                    cursor: 'pointer'
                                  }}
                                >
                                  Save Response
                                </button>
                              </td>
                              <td style={{ padding: '1rem', fontSize: '0.8rem' }}>{inquiry.date || 'N/A'}</td>
                              <td style={{ padding: '1rem', fontSize: '0.8rem' }}>
                                <select
                                  value={inquiry.status}
                                  onChange={(e) => handleUpdateConciergeInquiry(inquiry.id, { status: e.target.value })}
                                  style={{ padding: '0.35rem 0.5rem', borderRadius: '4px', border: '1px solid var(--border-light)', fontSize: '0.75rem', fontWeight: 600, outline: 'none' }}
                                >
                                  <option value="Open">Open</option>
                                  <option value="New">New</option>
                                  <option value="In progress">In progress</option>
                                  <option value="Resolved">Resolved</option>
                                  <option value="Closed">Closed</option>
                                </select>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                  <PaginationControls page={supportPage} totalPages={supportTotalPages} totalItems={filteredConciergeInquiries.length} onPageChange={setSupportPage} />
                </div>
              )}

              {activeTab === 'feedback' && (
                /* 7. FEEDBACK TAB */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyItems: 'center', justifyContent: 'space-between', gap: '1rem', backgroundColor: 'var(--canvas-primary)', border: '1px solid var(--border-light)', borderRadius: '6px', padding: '1rem' }}>
                    <div style={{ position: 'relative', width: '350px' }}>
                      <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                        <Search size={16} />
                      </span>
                      <input 
                        type="text" 
                        placeholder="Search feedback reviews..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{ width: '100%', padding: '0.5rem 0.75rem 0.5rem 2.25rem', fontSize: '0.8rem', border: '1px solid var(--border-light)', borderRadius: '4px', outline: 'none' }}
                      />
                    </div>
                  </div>

                  {/* Feedback table */}
                  <div style={{ backgroundColor: 'var(--canvas-primary)', border: '1px solid var(--border-light)', borderRadius: '8px', boxShadow: 'var(--shadow-soft)', overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid var(--border-light)', backgroundColor: 'var(--canvas-secondary)' }}>
                          <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Patron</th>
                          <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Dining Experience</th>
                          <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Rating</th>
                          <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Comment</th>
                          <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredFeedback.length === 0 ? (
                          <tr>
                            <td colSpan="5" style={{ padding: '3rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                              No customer feedback reviews found.
                            </td>
                          </tr>
                        ) : (
                          visibleFeedback.map((f) => (
                            <tr key={f.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                              <td style={{ padding: '1rem', fontSize: '0.8rem' }}>
                                <div style={{ fontWeight: 600 }}>{f.customerName}</div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{f.customerEmail}</div>
                              </td>
                              <td style={{ padding: '1rem', fontSize: '0.8rem' }}>{f.experience}</td>
                              <td style={{ padding: '1rem', fontSize: '0.8rem', color: 'var(--gold-antique)' }}>
                                <div style={{ display: 'flex', gap: '1px' }}>
                                  {[1, 2, 3, 4, 5].map(star => (
                                    <Star key={star} size={12} fill={star <= f.rating ? 'var(--gold-antique)' : 'none'} stroke="var(--gold-antique)" />
                                  ))}
                                </div>
                              </td>
                              <td style={{ padding: '1rem', fontSize: '0.8rem', maxWidth: '300px', lineHeight: 1.4 }}>{f.comment}</td>
                              <td style={{ padding: '1rem', fontSize: '0.8rem' }}>{f.date}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                  <PaginationControls page={feedbackPage} totalPages={feedbackTotalPages} totalItems={filteredFeedback.length} onPageChange={setFeedbackPage} />
                </div>
              )}

            </main>

      <AnimatePresence>
        {showAddItemModal && (
          <div className="luxury-modal-overlay" onClick={() => setShowAddItemModal(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="luxury-modal-content" style={{ maxWidth: '500px', display: 'flex', flexDirection: 'column' }} onClick={(e) => e.stopPropagation()}>
              <button onClick={() => setShowAddItemModal(false)} className="luxury-modal-close"><X size={20} /></button>
              <div style={{ marginBottom: '1.5rem' }}>
                <span className="modal-subtitle">Items Manager</span>
                <h3 className="modal-title" style={{ fontSize: '1.5rem' }}>Add New Culinary Creation</h3>
              </div>
              <form onSubmit={handleSaveAddDish} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', tracking: '0.1em', marginBottom: '0.4rem' }}>Customer Category</label>
                    <select value={dishFormData.category || 'Dinner'} onChange={(e) => setDishFormData({ ...dishFormData, category: e.target.value, subCategory: e.target.value === 'Dinner' ? (dishFormData.subCategory || defaultDinnerSubcategory) : '' })} style={{ width: '100%', padding: '0.6rem 0.8rem', fontSize: '0.85rem', border: '1px solid var(--border-light)', borderRadius: '4px', outline: 'none', backgroundColor: '#fff' }}>
                      <option value="Lunch">Lunch</option>
                      <option value="Dinner">Dinner</option>
                      <option value="Vegetarian">Vegetarian</option>
                    </select>
                  </div>
                  {(dishFormData.category || 'Dinner') === 'Dinner' && (
                    <div>
                      <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', tracking: '0.1em', marginBottom: '0.4rem' }}>Dinner Subcategory</label>
                      <select value={dishFormData.subCategory || defaultDinnerSubcategory} onChange={(e) => setDishFormData({ ...dishFormData, subCategory: e.target.value })} style={{ width: '100%', padding: '0.6rem 0.8rem', fontSize: '0.85rem', border: '1px solid var(--border-light)', borderRadius: '4px', outline: 'none', backgroundColor: '#fff' }}>
                        {dinnerSubcategories.map((subcategory) => (
                          <option key={subcategory} value={subcategory}>{subcategory}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div>
                    <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', tracking: '0.1em', marginBottom: '0.4rem' }}>Price (USD)</label>
                    <input type="number" step="0.01" required placeholder="28" value={dishFormData.price} onChange={(e) => setDishFormData({ ...dishFormData, price: e.target.value })} style={{ width: '100%', padding: '0.6rem 0.8rem', fontSize: '0.85rem', border: '1px solid var(--border-light)', borderRadius: '4px', outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', tracking: '0.1em', marginBottom: '0.4rem' }}>Dish Name</label>
                    <input type="text" required placeholder="e.g. Royal Curry" value={dishFormData.name} onChange={(e) => setDishFormData({ ...dishFormData, name: e.target.value })} style={{ width: '100%', padding: '0.6rem 0.8rem', fontSize: '0.85rem', border: '1px solid var(--border-light)', borderRadius: '4px', outline: 'none' }} />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', tracking: '0.1em', marginBottom: '0.4rem' }}>Description</label>
                  <textarea rows="3" placeholder="Provide details..." value={dishFormData.description} onChange={(e) => setDishFormData({ ...dishFormData, description: e.target.value })} style={{ width: '100%', padding: '0.6rem 0.8rem', fontSize: '0.85rem', border: '1px solid var(--border-light)', borderRadius: '4px', outline: 'none', fontFamily: 'var(--font-sans)', resize: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', tracking: '0.1em', marginBottom: '0.4rem' }}>Size Amounts</label>
                  <textarea
                    rows="3"
                    placeholder={'Small:12.99\nMedium:14.99\nLarge:16.99'}
                    value={dishFormData.sizeOptionsText}
                    onChange={(e) => setDishFormData({ ...dishFormData, sizeOptionsText: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem 0.8rem', fontSize: '0.85rem', border: '1px solid var(--border-light)', borderRadius: '4px', outline: 'none', fontFamily: 'var(--font-sans)', resize: 'vertical' }}
                  />
                  <span style={{ display: 'block', marginTop: '0.35rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>One size per line. Use Size:Amount.</span>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', tracking: '0.1em', marginBottom: '0.4rem' }}>Add-ons</label>
                  <textarea
                    rows="4"
                    placeholder={'Extra Chicken:2.50\nExtra Beef:3.00\nExtra Shrimp:3.50'}
                    value={dishFormData.addonOptionsText}
                    onChange={(e) => setDishFormData({ ...dishFormData, addonOptionsText: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem 0.8rem', fontSize: '0.85rem', border: '1px solid var(--border-light)', borderRadius: '4px', outline: 'none', fontFamily: 'var(--font-sans)', resize: 'vertical' }}
                  />
                  <span style={{ display: 'block', marginTop: '0.35rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>One add-on per line. Use Name:Price.</span>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', tracking: '0.1em', marginBottom: '0.4rem' }}>Protein Choices</label>
                  <textarea
                    rows="4"
                    placeholder={'Chicken:2.00\nBeef:3.50\nShrimp:3.50\nTofu:0.00'}
                    value={dishFormData.proteinChoiceText}
                    onChange={(e) => setDishFormData({ ...dishFormData, proteinChoiceText: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem 0.8rem', fontSize: '0.85rem', border: '1px solid var(--border-light)', borderRadius: '4px', outline: 'none', fontFamily: 'var(--font-sans)', resize: 'vertical' }}
                  />
                  <span style={{ display: 'block', marginTop: '0.35rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>One protein per line. Use Name:Price.</span>
                </div>
                {renderSuggestedItemsPicker()}
                <div>
                  <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', tracking: '0.1em', marginBottom: '0.4rem' }}>Spicy Options</label>
                  <textarea
                    rows="4"
                    placeholder={'Mild\nMedium\nSpicy\nMore Spicy'}
                    value={dishFormData.spiceOptionsText}
                    onChange={(e) => setDishFormData({ ...dishFormData, spiceOptionsText: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem 0.8rem', fontSize: '0.85rem', border: '1px solid var(--border-light)', borderRadius: '4px', outline: 'none', fontFamily: 'var(--font-sans)', resize: 'vertical' }}
                  />
                  <span style={{ display: 'block', marginTop: '0.35rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>One spicy option per line.</span>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', tracking: '0.1em', marginBottom: '0.4rem' }}>Visual Asset Link (Image URL)</label>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <input type="text" placeholder="https://images.unsplash.com/photo..." value={dishFormData.image} onChange={(e) => setDishFormData({ ...dishFormData, image: e.target.value })} style={{ flexGrow: 1, padding: '0.6rem 0.8rem', fontSize: '0.85rem', border: '1px solid var(--border-light)', borderRadius: '4px', outline: 'none' }} />
                    <label style={{ padding: '0.6rem 1rem', fontSize: '0.75rem', fontWeight: 600, border: '1px solid var(--gold-antique)', borderRadius: '4px', color: 'var(--gold-antique)', cursor: 'pointer', whiteSpace: 'nowrap', backgroundColor: 'transparent', transition: 'all 0.3s' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--gold-light)'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
                      Upload File
                      <input type="file" accept="image/*" onChange={handleImageFileChange} style={{ display: 'none' }} />
                    </label>
                  </div>
                  {dishFormData.image && (
                    <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ position: 'relative', width: '64px', height: '48px', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--border-light)' }}>
                        <img src={dishFormData.image} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <button type="button" onClick={() => setDishFormData({ ...dishFormData, image: '' })} style={{ position: 'absolute', top: '2px', right: '2px', backgroundColor: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%', width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer', outline: 'none' }}><X size={10} /></button>
                      </div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Image asset loaded successfully</span>
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input type="checkbox" id="dish-avail-add" checked={dishFormData.availability} onChange={(e) => setDishFormData({ ...dishFormData, availability: e.target.checked })} style={{ cursor: 'pointer' }} />
                  <label htmlFor="dish-avail-add" style={{ fontSize: '0.8rem', color: 'var(--text-dark)', userSelect: 'none', cursor: 'pointer' }}>Mark as Available in Inventory (In Stock)</label>
                </div>
                <button type="submit" className="btn-filled" style={{ width: '100%', justifyContent: 'center', padding: '0.9rem', marginTop: '0.5rem' }}>ADD TO CATALOG</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- EDIT DISH MODAL --- */}
      <AnimatePresence>
        {showEditItemModal && (
          <div className="luxury-modal-overlay" onClick={() => setShowEditItemModal(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="luxury-modal-content" style={{ maxWidth: '500px', display: 'flex', flexDirection: 'column' }} onClick={(e) => e.stopPropagation()}>
              <button onClick={() => setShowEditItemModal(false)} className="luxury-modal-close"><X size={20} /></button>
              <div style={{ marginBottom: '1.5rem' }}>
                <span className="modal-subtitle">Items Manager</span>
                <h3 className="modal-title" style={{ fontSize: '1.5rem' }}>Update Dish details</h3>
              </div>
              <form onSubmit={handleSaveEditDish} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', tracking: '0.1em', marginBottom: '0.4rem' }}>Customer Category</label>
                    <select value={dishFormData.category || 'Dinner'} onChange={(e) => setDishFormData({ ...dishFormData, category: e.target.value, subCategory: e.target.value === 'Dinner' ? (dishFormData.subCategory || defaultDinnerSubcategory) : '' })} style={{ width: '100%', padding: '0.6rem 0.8rem', fontSize: '0.85rem', border: '1px solid var(--border-light)', borderRadius: '4px', outline: 'none', backgroundColor: '#fff' }}>
                      <option value="Lunch">Lunch</option>
                      <option value="Dinner">Dinner</option>
                      <option value="Vegetarian">Vegetarian</option>
                    </select>
                  </div>
                  {(dishFormData.category || 'Dinner') === 'Dinner' && (
                    <div>
                      <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', tracking: '0.1em', marginBottom: '0.4rem' }}>Dinner Subcategory</label>
                      <select value={dishFormData.subCategory || defaultDinnerSubcategory} onChange={(e) => setDishFormData({ ...dishFormData, subCategory: e.target.value })} style={{ width: '100%', padding: '0.6rem 0.8rem', fontSize: '0.85rem', border: '1px solid var(--border-light)', borderRadius: '4px', outline: 'none', backgroundColor: '#fff' }}>
                        {dinnerSubcategories.map((subcategory) => (
                          <option key={subcategory} value={subcategory}>{subcategory}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div>
                    <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', tracking: '0.1em', marginBottom: '0.4rem' }}>Dish Name</label>
                    <input type="text" required value={dishFormData.name} onChange={(e) => setDishFormData({ ...dishFormData, name: e.target.value })} style={{ width: '100%', padding: '0.6rem 0.8rem', fontSize: '0.85rem', border: '1px solid var(--border-light)', borderRadius: '4px', outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', tracking: '0.1em', marginBottom: '0.4rem' }}>Price (USD)</label>
                    <input type="number" step="0.01" required value={dishFormData.price} onChange={(e) => setDishFormData({ ...dishFormData, price: e.target.value })} style={{ width: '100%', padding: '0.6rem 0.8rem', fontSize: '0.85rem', border: '1px solid var(--border-light)', borderRadius: '4px', outline: 'none' }} />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', tracking: '0.1em', marginBottom: '0.4rem' }}>Description</label>
                  <textarea rows="3" value={dishFormData.description} onChange={(e) => setDishFormData({ ...dishFormData, description: e.target.value })} style={{ width: '100%', padding: '0.6rem 0.8rem', fontSize: '0.85rem', border: '1px solid var(--border-light)', borderRadius: '4px', outline: 'none', fontFamily: 'var(--font-sans)', resize: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', tracking: '0.1em', marginBottom: '0.4rem' }}>Size Amounts</label>
                  <textarea
                    rows="3"
                    placeholder={'Small:12.99\nMedium:14.99\nLarge:16.99'}
                    value={dishFormData.sizeOptionsText}
                    onChange={(e) => setDishFormData({ ...dishFormData, sizeOptionsText: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem 0.8rem', fontSize: '0.85rem', border: '1px solid var(--border-light)', borderRadius: '4px', outline: 'none', fontFamily: 'var(--font-sans)', resize: 'vertical' }}
                  />
                  <span style={{ display: 'block', marginTop: '0.35rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>One size per line. Use Size:Amount.</span>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', tracking: '0.1em', marginBottom: '0.4rem' }}>Add-ons</label>
                  <textarea
                    rows="4"
                    placeholder={'Extra Chicken:2.50\nExtra Beef:3.00\nExtra Shrimp:3.50'}
                    value={dishFormData.addonOptionsText}
                    onChange={(e) => setDishFormData({ ...dishFormData, addonOptionsText: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem 0.8rem', fontSize: '0.85rem', border: '1px solid var(--border-light)', borderRadius: '4px', outline: 'none', fontFamily: 'var(--font-sans)', resize: 'vertical' }}
                  />
                  <span style={{ display: 'block', marginTop: '0.35rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>One add-on per line. Use Name:Price.</span>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', tracking: '0.1em', marginBottom: '0.4rem' }}>Protein Choices</label>
                  <textarea
                    rows="4"
                    placeholder={'Chicken:2.00\nBeef:3.50\nShrimp:3.50\nTofu:0.00'}
                    value={dishFormData.proteinChoiceText}
                    onChange={(e) => setDishFormData({ ...dishFormData, proteinChoiceText: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem 0.8rem', fontSize: '0.85rem', border: '1px solid var(--border-light)', borderRadius: '4px', outline: 'none', fontFamily: 'var(--font-sans)', resize: 'vertical' }}
                  />
                  <span style={{ display: 'block', marginTop: '0.35rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>One protein per line. Use Name:Price.</span>
                </div>
                {renderSuggestedItemsPicker()}
                <div>
                  <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', tracking: '0.1em', marginBottom: '0.4rem' }}>Spicy Options</label>
                  <textarea
                    rows="4"
                    placeholder={'Mild\nMedium\nSpicy\nMore Spicy'}
                    value={dishFormData.spiceOptionsText}
                    onChange={(e) => setDishFormData({ ...dishFormData, spiceOptionsText: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem 0.8rem', fontSize: '0.85rem', border: '1px solid var(--border-light)', borderRadius: '4px', outline: 'none', fontFamily: 'var(--font-sans)', resize: 'vertical' }}
                  />
                  <span style={{ display: 'block', marginTop: '0.35rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>One spicy option per line.</span>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', tracking: '0.1em', marginBottom: '0.4rem' }}>Visual Asset Link (Image URL)</label>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <input type="text" placeholder="https://images.unsplash.com/photo..." value={dishFormData.image} onChange={(e) => setDishFormData({ ...dishFormData, image: e.target.value })} style={{ flexGrow: 1, padding: '0.6rem 0.8rem', fontSize: '0.85rem', border: '1px solid var(--border-light)', borderRadius: '4px', outline: 'none' }} />
                    <label style={{ padding: '0.6rem 1rem', fontSize: '0.75rem', fontWeight: 600, border: '1px solid var(--gold-antique)', borderRadius: '4px', color: 'var(--gold-antique)', cursor: 'pointer', whiteSpace: 'nowrap', backgroundColor: 'transparent', transition: 'all 0.3s' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--gold-light)'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
                      Upload File
                      <input type="file" accept="image/*" onChange={handleImageFileChange} style={{ display: 'none' }} />
                    </label>
                  </div>
                  {dishFormData.image && (
                    <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ position: 'relative', width: '64px', height: '48px', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--border-light)' }}>
                        <img src={dishFormData.image} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <button type="button" onClick={() => setDishFormData({ ...dishFormData, image: '' })} style={{ position: 'absolute', top: '2px', right: '2px', backgroundColor: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%', width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer', outline: 'none' }}><X size={10} /></button>
                      </div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Image asset loaded successfully</span>
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input type="checkbox" id="dish-avail-edit" checked={dishFormData.availability} onChange={(e) => setDishFormData({ ...dishFormData, availability: e.target.checked })} style={{ cursor: 'pointer' }} />
                  <label htmlFor="dish-avail-edit" style={{ fontSize: '0.8rem', color: 'var(--text-dark)', userSelect: 'none', cursor: 'pointer' }}>Mark as Available in Inventory (In Stock)</label>
                </div>
                <button type="submit" className="btn-filled" style={{ width: '100%', justifyContent: 'center', padding: '0.9rem', marginTop: '0.5rem' }}>UPDATE ITEM</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- ADD COUPON MODAL --- */}
      <AnimatePresence>
        {showAddCouponModal && (
          <div className="luxury-modal-overlay" onClick={() => setShowAddCouponModal(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="luxury-modal-content" style={{ maxWidth: '480px', display: 'flex', flexDirection: 'column' }} onClick={(e) => e.stopPropagation()}>
              <button onClick={() => setShowAddCouponModal(false)} className="luxury-modal-close"><X size={20} /></button>
              <div style={{ marginBottom: '1.5rem' }}>
                <span className="modal-subtitle">Promo Manager</span>
                <h3 className="modal-title" style={{ fontSize: '1.5rem' }}>Create Promo Discount Coupon</h3>
              </div>
              <form onSubmit={handleSaveAddCoupon} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', tracking: '0.1em', marginBottom: '0.4rem' }}>Coupon Code</label>
                    <input type="text" required placeholder="WELCOME20" value={couponFormData.code} onChange={(e) => setCouponFormData({ ...couponFormData, code: e.target.value })} style={{ width: '100%', padding: '0.6rem 0.8rem', fontSize: '0.85rem', border: '1px solid var(--border-light)', borderRadius: '4px', outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', tracking: '0.1em', marginBottom: '0.4rem' }}>Discount Type</label>
                    <select value={couponFormData.type} onChange={(e) => setCouponFormData({ ...couponFormData, type: e.target.value })} style={{ width: '100%', padding: '0.6rem 0.8rem', fontSize: '0.85rem', border: '1px solid var(--border-light)', borderRadius: '4px', outline: 'none' }}>
                      <option value="percentage">Percentage (%)</option>
                      <option value="flat">Flat Amount ($)</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', tracking: '0.1em', marginBottom: '0.4rem' }}>Discount Value</label>
                    <input type="number" required placeholder="10" value={couponFormData.value} onChange={(e) => setCouponFormData({ ...couponFormData, value: e.target.value })} style={{ width: '100%', padding: '0.6rem 0.8rem', fontSize: '0.85rem', border: '1px solid var(--border-light)', borderRadius: '4px', outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', tracking: '0.1em', marginBottom: '0.4rem' }}>Min Order Purchase ($)</label>
                    <input type="number" required placeholder="30" value={couponFormData.minOrder} onChange={(e) => setCouponFormData({ ...couponFormData, minOrder: e.target.value })} style={{ width: '100%', padding: '0.6rem 0.8rem', fontSize: '0.85rem', border: '1px solid var(--border-light)', borderRadius: '4px', outline: 'none' }} />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', tracking: '0.1em', marginBottom: '0.4rem' }}>Expiry Date</label>
                  <input type="date" required value={couponFormData.expiryDate} onChange={(e) => setCouponFormData({ ...couponFormData, expiryDate: e.target.value })} style={{ width: '100%', padding: '0.6rem 0.8rem', fontSize: '0.85rem', border: '1px solid var(--border-light)', borderRadius: '4px', outline: 'none' }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input type="checkbox" id="coupon-status-add" checked={couponFormData.status === 'Active'} onChange={(e) => setCouponFormData({ ...couponFormData, status: e.target.checked ? 'Active' : 'Inactive' })} style={{ cursor: 'pointer' }} />
                  <label htmlFor="coupon-status-add" style={{ fontSize: '0.8rem', color: 'var(--text-dark)', userSelect: 'none', cursor: 'pointer' }}>Mark as Active Immediately</label>
                </div>
                <button type="submit" className="btn-filled" style={{ width: '100%', justifyContent: 'center', padding: '0.9rem', marginTop: '0.5rem' }}>CREATE COUPON</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- EDIT COUPON MODAL --- */}
      <AnimatePresence>
        {showEditCouponModal && (
          <div className="luxury-modal-overlay" onClick={() => setShowEditCouponModal(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="luxury-modal-content" style={{ maxWidth: '480px', display: 'flex', flexDirection: 'column' }} onClick={(e) => e.stopPropagation()}>
              <button onClick={() => setShowEditCouponModal(false)} className="luxury-modal-close"><X size={20} /></button>
              <div style={{ marginBottom: '1.5rem' }}>
                <span className="modal-subtitle">Promo Manager</span>
                <h3 className="modal-title" style={{ fontSize: '1.5rem' }}>Update Promo Coupon Details</h3>
              </div>
              <form onSubmit={handleSaveEditCoupon} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', tracking: '0.1em', marginBottom: '0.4rem' }}>Coupon Code</label>
                    <input type="text" required value={couponFormData.code} onChange={(e) => setCouponFormData({ ...couponFormData, code: e.target.value })} style={{ width: '100%', padding: '0.6rem 0.8rem', fontSize: '0.85rem', border: '1px solid var(--border-light)', borderRadius: '4px', outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', tracking: '0.1em', marginBottom: '0.4rem' }}>Discount Type</label>
                    <select value={couponFormData.type} onChange={(e) => setCouponFormData({ ...couponFormData, type: e.target.value })} style={{ width: '100%', padding: '0.6rem 0.8rem', fontSize: '0.85rem', border: '1px solid var(--border-light)', borderRadius: '4px', outline: 'none' }}>
                      <option value="percentage">Percentage (%)</option>
                      <option value="flat">Flat Amount ($)</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', tracking: '0.1em', marginBottom: '0.4rem' }}>Discount Value</label>
                    <input type="number" required value={couponFormData.value} onChange={(e) => setCouponFormData({ ...couponFormData, value: e.target.value })} style={{ width: '100%', padding: '0.6rem 0.8rem', fontSize: '0.85rem', border: '1px solid var(--border-light)', borderRadius: '4px', outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', tracking: '0.1em', marginBottom: '0.4rem' }}>Min Order Purchase ($)</label>
                    <input type="number" required value={couponFormData.minOrder} onChange={(e) => setCouponFormData({ ...couponFormData, minOrder: e.target.value })} style={{ width: '100%', padding: '0.6rem 0.8rem', fontSize: '0.85rem', border: '1px solid var(--border-light)', borderRadius: '4px', outline: 'none' }} />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', tracking: '0.1em', marginBottom: '0.4rem' }}>Expiry Date</label>
                  <input type="date" required value={couponFormData.expiryDate} onChange={(e) => setCouponFormData({ ...couponFormData, expiryDate: e.target.value })} style={{ width: '100%', padding: '0.6rem 0.8rem', fontSize: '0.85rem', border: '1px solid var(--border-light)', borderRadius: '4px', outline: 'none' }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input type="checkbox" id="coupon-status-edit" checked={couponFormData.status === 'Active'} onChange={(e) => setCouponFormData({ ...couponFormData, status: e.target.checked ? 'Active' : 'Inactive' })} style={{ cursor: 'pointer' }} />
                  <label htmlFor="coupon-status-edit" style={{ fontSize: '0.8rem', color: 'var(--text-dark)', userSelect: 'none', cursor: 'pointer' }}>Mark as Active</label>
                </div>
                <button type="submit" className="btn-filled" style={{ width: '100%', justifyContent: 'center', padding: '0.9rem', marginTop: '0.5rem' }}>SAVE CHANGES</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- ORDER DETAILS MODAL --- */}
      <AnimatePresence>
        {showOrderDetailsModal && selectedOrder && (
          <div className="luxury-modal-overlay" onClick={() => setShowOrderDetailsModal(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="luxury-modal-content" style={{ maxWidth: '460px', display: 'flex', flexDirection: 'column' }} onClick={(e) => e.stopPropagation()}>
              <button onClick={() => setShowOrderDetailsModal(false)} className="luxury-modal-close"><X size={20} /></button>
              <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.75rem' }}>
                <span className="modal-subtitle" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><FileText size={12} /> Ticket Order Receipt</span>
                <h3 className="modal-title" style={{ fontSize: '1.6rem' }}>{selectedOrder.id}</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.8rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', backgroundColor: 'var(--canvas-secondary)', padding: '1rem', borderRadius: '4px', border: '1px solid var(--border-light)' }}>
                  <div>
                    <strong style={{ display: 'block', fontSize: '9px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Customer</strong>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{selectedOrder.customerName}</span>
                  </div>
                  <div>
                    <strong style={{ display: 'block', fontSize: '9px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Phone</strong>
                    <span>{selectedOrder.customerPhone || 'N/A'}</span>
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <strong style={{ display: 'block', fontSize: '9px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Email</strong>
                    <span>{selectedOrder.customerEmail || 'N/A'}</span>
                  </div>
                </div>
                <div>
                  <strong style={{ display: 'block', fontSize: '9px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Logistics details</strong>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem' }}>
                    <span>Service Type:</span>
                    <strong style={{ color: 'var(--gold-antique)' }}>{selectedOrder.type}</strong>
                  </div>
                  {selectedOrder.type === 'Delivery' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', paddingTop: '0.5rem' }}>
                      <span style={{ fontSize: '9px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Address:</span>
                      <p style={{ lineHeight: '1.4' }}>{selectedOrder.address}</p>
                    </div>
                  )}
                </div>
                <div className="receipt-box" style={{ margin: '0.5rem 0' }}>
                  <div className="receipt-header">Aromatic Selection Items</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '0.5rem 0' }}>
                    {selectedOrder.items.split(/\s+\|\s+|, /).map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                  <div className="receipt-total-row" style={{ marginTop: '0.5rem' }}>
                    <span>Receipt Total (USD)</span>
                    <span>${parseFloat(selectedOrder.total || 0).toFixed(2)}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '1rem', justifyItems: 'center', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-light)', paddingTop: '1rem', marginTop: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Workflow:</span>
                    <select value={selectedOrder.status} onChange={(e) => handleUpdateOrderStatus(selectedOrder.id, e.target.value)} style={{ padding: '0.35rem 0.5rem', border: '1px solid var(--border-light)', borderRadius: '4px', fontSize: '0.75rem' }}>
                      <option value="Pending">Pending</option>
                      <option value="Preparing">Preparing</option>
                      <option value="Out for Delivery">Out for Delivery</option>
                      <option value="Delivered">Delivered</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                  <button onClick={() => setShowOrderDetailsModal(false)} className="btn-filled" style={{ padding: '0.6rem 1.2rem', fontSize: '0.7rem' }}>CLOSE TICKET</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
