import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star } from 'lucide-react';
import CustomizeModal from './CustomizeModal';

// Import images
import heroDish from '../assets/hero_dish.png';
import menuAppetizer from '../assets/menu_appetizer.png';
import menuCurry from '../assets/menu_curry.png';
import menuDessert from '../assets/menu_dessert.png';
import mahaStreetPadThaiImg from '../assets/Pad thai.png';
import coconutShellSeafoodImg from '../assets/Coconut Shell.png';
import chooCheeSeafoodCurryImg from '../assets/Choo Chee Seafood Curry.png';
import lambChopsImg from '../assets/Lamb Chops.jpeg';
import salmonImg from '../assets/Salmon .png';
import wholeFishSelectionImg from '../assets/Whole Fish Selection.png';
import wholeFishSwaiImg from '../assets/Whole Fish Selection (Swai Filet).png';
import wholeFishTilapiaImg from '../assets/Whole Fish Selection (Tilapia).png';
import wholeFishRedsnapperImg from '../assets/Whole Fish Selection (Redsnapper).png';
import wholeFishPomfretImg from '../assets/Whole Fish Selection (Pomfret).png';
import yentafoImg from '../assets/Yen Ta Fo.png';
import kanaHedHormImg from '../assets/KA-NA HED HORM.png';
import lemongrassChickenImg from '../assets/Lemongrass.png';
import massamanBeefStewImg from '../assets/Massaman Beef Stew with Roti.png';
import thaiRamaGardenImg from '../assets/Thai Rama Garden.png';
import thaiStyleOmeletteImg from '../assets/Thai Style Omelette.png';
import vietnamesePhoImg from '../assets/Vietnamese Pho.png';
import hainaneseChickenRiceImg from '../assets/Hainanese Chicken Rice.png';
import thaiChickenBiryaniImg from '../assets/Thai Chicken Biryani.png';
import thaiOrangeSesameChickenImg from '../assets/Thai Orange Sesame Chicken.png';
import thaiSweetAndSourChickenImg from '../assets/Thai Sweet and Sour Chicken.png';
import vegThaiFriedRiceImg from '../assets/Vegetarian Thai Fried Rice.png';
import crispySpringRollsImg from '../assets/Crispy Spring Rolls (veg  shrimp  chicken).png';
import firecrackerShrimpImg from '../assets/Firecracker Shrimp.png';
import freshGardenRollsImg from '../assets/Fresh Garden Rolls.png';
import goldenFriedTofuImg from '../assets/Golden Fried Tofu.png';
import mahaCrispyCrabBitesImg from '../assets/Maha Crispy Crab Bites.png';
import crabBitesImg from '../assets/crab bites.png';
import panSearedDumplingsImg from '../assets/Pan-Seared Dumplings (chicken  pork  veg).png';
import dumplingsImg from '../assets/Dumplings.png';
import tofuSatayImg from '../assets/Tofu Satay.png';
import shrimpSaladImg from '../assets/shrimp salad.png';
import streetSataySkewersImg from '../assets/Street Satay Skewers (chicken  spicy chicken 🌶️  tofu).png';
import vietnameseFreshRollsImg from '../assets/Vietnamese Fresh Rolls.png';
import caramelizedPadSeeEwImg from '../assets/Caramelized Pad See Ew.png';
import glassNoodleSeafoodSaladImg from '../assets/Glass Noodle Seafood Salad (Yum Woon Sen).png';
import greenPapayaCrunchImg from '../assets/Green Papaya Crunch (Som Tum Thai).png';
import midnightDrunkenNoodlesImg from '../assets/Midnight Drunken Noodles .png';
import northernLarbHerbSaladImg from '../assets/Northern Larb Herb Salad .png';
import padThaiOmeletteWrapImg from '../assets/Pad Thai Omelette Wrap.png';
import somTumPooPlaraImg from '../assets/Som Tum Poo Plara.png';
import somTumPooImg from '../assets/Som Tum Poo.png';
import yumSeafoodCombinationImg from '../assets/Yum Seafood Combination .png';
import yumShrimpOrSquidImg from '../assets/Yum Shrimp or Squid .png';
import bangkokFireBasilRiceImg from '../assets/Bangkok Fire Basil Rice.png';
import edamameImg from '../assets/Edamame .png';
import glassNoodleStirFryImg from '../assets/Glass Noodle Stir Fry (Pad Wun Sen).png';
import mahaHotPotImg from '../assets/Maha Hot Pot (Seasonal).png';
import northernKhaoSoiImg from '../assets/Northern Khao Soi.png';
import riceComfortSoupImg from '../assets/Rice Comfort Soup (Khao Tom).png';
import thaiSukiyakiStirFryImg from '../assets/Thai Sukiyaki Stir-Fry (Suki Hang).png';
import tomYumCreamyBrothImg from '../assets/Tom Yum Creamy Broth.png';
import tomYumFireBrothImg from '../assets/Tom Yum Fire Broth (Clear).png';
import tomKhaCoconutSoupImg from '../assets/Tom kha coconut soup.png';
import classicThaiFriedRiceImg from '../assets/Classic Thai Fried Rice.png';
import crabButterFriedRiceImg from '../assets/Crab Butter Fried Rice.png';
import currySpicedFriedRiceImg from '../assets/Curry Spiced Fried Rice.png';
import pineappleIslandFriedRiceImg from '../assets/Pineapple Island Fried Rice.png';
import goldenYellowCurryImg from '../assets/Golden Yellow Curry.png';
import greenHerbCurryImg from '../assets/Green Herb Curry.png';
import jungleHeatCurryImg from '../assets/Jungle Heat Curry.png';
import massamanComfortCurryImg from '../assets/Massaman Comfort Curry.png';
import panangSilkCurryImg from '../assets/Panang Silk Curr.png';
import redCurryWithPumpkinImg from '../assets/Red Curry with Pumpkin.png';
import redFireCurryImg from '../assets/Red Fire Curry.png';
import greenCurryFriedRiceImg from '../assets/Green Curry Fried Rice .png';
import kapiUmamiFriedRiceImg from '../assets/Kapi Umami Fried Rice.png';
import redCurryFriedRiceImg from '../assets/Red Curry Fried Rice.png';
import plantBasilRiceImg from '../assets/Basil Fried Rice 🌶️.png';
import plantChooCheeTofuImg from '../assets/Choo Chee Tofu.png';
import plantEggplantTofuImg from '../assets/Eggplant & Tofu Curry.png';
import kanaHedHormImgNew from '../assets/KANA HED HORM.png';
import mangoStickyRiceImg from '../assets/Mango Sticky Rice.png';
import rubiesCoconutImg from '../assets/Red Rubies in Coconut Milk..png';
import plantTofuKheeMaoImg from '../assets/Tofu Khee Mao.png';
import plantTomKhaImg from '../assets/Tom Kha (veg).png';
import plantTomYumImg from '../assets/Tom Yum (veg).png';
import plantPadThaiImg from '../assets/Vegetarian Pad Thai.png';
import bananaStickyRiceImg from '../assets/Banana Sticky Rice.png';
import blackRiceMangoImg from '../assets/Black Rice Mango.png';
import eggDropSoupImg from '../assets/Egg Drop Soup.png';
import hotSourSoupImg from '../assets/hot and sour soup.png';
import misoSoupImg from '../assets/Miso Soup.png';
import shrimpWontonSoupImg from '../assets/Shrimp Wonton Soup.png';
import lunchImg from '../assets/lunchimg.png';
import brownRiceImg from '../assets/Brown Rice.png';
import deepFriedIceCreamImg from '../assets/Deep Fried Ice Cream.png';
import friedBananaWithHoneyImg from '../assets/Fried Banana with Honey.png';
import jasmineRiceImg from '../assets/Jasmine Rice.png';
import peanutSauceImg from '../assets/Peanut Sauce.png';
import steamedNoodlesImg from '../assets/Steamed Noodles.png';
import steamedVegetablesImg from '../assets/Steamed Vegetables.png';
import stickyRiceImg from '../assets/Sticky Rice.png';
import sweetRotiImg from '../assets/Sweet Roti.png';
import thaiCoconutPancakesImg from '../assets/Thai Coconut Pancakes.png';
import thaiIcedTeaImg from '../assets/Thai Iced Tea.png';

// Signature dishes matching mockup
export const signatureDishes = [
  {
    id: 'sig-1',
    name: 'Maha Street Pad Thai',
    price: 15.99,
    description: 'Aromatic wok-fired rice ribbon noodles with egg, pressed tofu, sweet turnip, chives, bean sprouts, crushed peanuts, and fresh lime in our signature tamarind reduction.',
    image: mahaStreetPadThaiImg,
    tags: ['Signature', 'Wok-Fired']
  },
  {
    id: 'sig-2',
    name: 'Coconut Shell Seafood (Hor Mok)',
    price: 19.99,
    description: 'Rich, fragrant red curry soufflé steamed inside a young coconut shell with fresh sea scallops, calamari, jumbo shrimp, kaffir lime leaves, and sweet basil.',
    image: coconutShellSeafoodImg,
    tags: ['Signature', 'Spicy']
  },
  {
    id: 'sig-3',
    name: 'Northern Khao Soi',
    price: 18.99,
    description: 'Slow-simmered aromatic coconut curry broth with tender egg noodles, mustard greens, red shallots, and lime, topped with crispy noodles and house chili oil.',
    image: northernKhaoSoiImg,
    tags: ['Signature', 'Spicy']
  }
];

export const menuData = {
  'Appetizers': [

    
  ],
  'Salads': [
    
  ],
  'Noodle Bar': [
   
  ],
  'Curry Kitchen': [
   
  ],
  'Rice & Wok': [
   
  ],
  'Street Kitchen': [
   
  ],
  'From the Sea': [
    
  ],
  'Chef’s Table': [
   
  ],
  'Plant-Based': [
   
    
  ],
  'Sweet Endings': [
    
  ],
  'Beverages & Sides': [
    
  ],
  'Soups & Claypots': [
    
   
  ]
};

// Map Lunch, Dinner, and Vegetarian menu keys for the specialized dropdowns and pages
menuData['Vegetarian'] = menuData['Plant-Based'];
const rawDinnerList = [
  ...menuData['Appetizers'],
  ...menuData['Salads'],
  ...menuData['Soups & Claypots'],
  ...menuData['Noodle Bar'],
  ...menuData['Curry Kitchen'],
  ...menuData['Rice & Wok'],
  ...menuData['Street Kitchen'],
  ...menuData['From the Sea'],
  ...menuData['Chef’s Table'],
  ...menuData['Plant-Based'],
  ...menuData['Sweet Endings'],
  ...menuData['Beverages & Sides']
];
menuData['Dinner'] = rawDinnerList.filter((item, index, self) =>
  self.findIndex(t => t.id === item.id) === index
);
menuData['Lunch'] = [
  {
    id: 'lunch-experience',
    name: 'Maha Lunch Experience (Mon-Fri)',
    description: 'A curated multi-course midday feast. Includes your choice of one appetizer, one soup or salad, and one signature entrée (curry, noodle, or wok rice dish).',
    price: 12.99,
    rating: 5.0,
    image: lunchImg,
    tags: ['Lunch Special', 'Multi-Course']
  },
  {
    id: 'lunch-pad-thai',
    name: 'Lunch Maha Street Pad Thai',
    description: 'Midday portion of our signature stir-fried rice noodles with tamarind sauce, egg, and peanuts.',
    price: 12.99,
    rating: 4.9,
    image: mahaStreetPadThaiImg
  },
  {
    id: 'lunch-drunken-noodles',
    name: 'Lunch Midnight Drunken Noodles 🌶️🔥',
    description: 'Wide noodles stir-fried with chili, garlic, and Thai basil.',
    price: 12.99,
    rating: 4.8,
    image: midnightDrunkenNoodlesImg
  },
  {
    id: 'lunch-pad-see-ew',
    name: 'Lunch Caramelized Pad See Ew',
    description: 'Flat noodles stir-fried with egg and Chinese broccoli in a savory soy glaze.',
    price: 12.99,
    rating: 4.8,
    image: caramelizedPadSeeEwImg
  },
  {
    id: 'lunch-massaman',
    name: 'Lunch Massaman Comfort Curry',
    description: 'Mild curry with potatoes, onions, and warm spices.',
    price: 12.99,
    rating: 4.9,
    image: massamanComfortCurryImg
  },
  {
    id: 'lunch-yellow-curry',
    name: 'Lunch Golden Yellow Curry',
    description: 'Mild curry with turmeric, potatoes, and vegetables.',
    price: 12.99,
    rating: 4.7,
    image: goldenYellowCurryImg
  },
  {
    id: 'lunch-basil-rice',
    name: 'Lunch Bangkok Fire Basil Rice 🌶️🔥',
    description: 'Spicy basil fried rice with chili and garlic.',
    price: 12.99,
    rating: 4.8,
    image: bangkokFireBasilRiceImg
  },
  {
    id: 'lunch-pineapple-rice',
    name: 'Lunch Pineapple Island Fried Rice',
    description: 'Sweet and savory fried rice with pineapple and cashews.',
    price: 12.99,
    rating: 4.8,
    image: pineappleIslandFriedRiceImg
  },
  {
    id: 'lunch-classic-rice',
    name: 'Lunch Classic Thai Fried Rice',
    description: 'Simple egg fried rice with vegetables.',
    price: 12.99,
    rating: 4.6,
    image: classicThaiFriedRiceImg
  },
  {
    id: 'lunch-lemongrass-chicken',
    name: 'Lunch Lemongrass Chicken',
    description: 'Grilled chicken infused with lemongrass and herbs.',
    price: 12.99,
    rating: 4.8,
    image: lemongrassChickenImg
  },
  {
    id: 'lunch-veg-padthai',
    name: 'Lunch Vegetarian Pad Thai',
    description: 'Rice noodles stir-fried with vegetables and tofu.',
    price: 12.99,
    rating: 4.8,
    image: mahaStreetPadThaiImg
  }
];

// Load custom admin overrides from localStorage if present
try {
  if (typeof window !== 'undefined') {
    if (!localStorage.getItem('maha_menu_reset_prices_v5')) {
      localStorage.removeItem('maha_custom_menu');
      localStorage.setItem('maha_menu_reset_prices_v5', 'true');
    }
  }
  const customMenuData = localStorage.getItem('maha_custom_menu');
  if (customMenuData) {
    const parsed = JSON.parse(customMenuData);
    Object.keys(parsed).forEach(key => {
      menuData[key] = parsed[key];
    });
  }
} catch (e) {
  console.error("Failed to parse custom menu data", e);
}

// Deduplicate the Dinner menu to prevent React key collision warnings
if (Array.isArray(menuData['Dinner'])) {
  menuData['Dinner'] = menuData['Dinner'].filter((item, index, self) =>
    self.findIndex(t => t.id === item.id) === index
  );
}

export default function MenuSection({ cart = {}, addToCart, removeFromCart }) {
  const [customizingItem, setCustomizingItem] = useState(null);
  const seasonalItems = [
    menuData['Soups & Claypots'].find(item => item.id === 'soup-hot-pot'),
    menuData['Curry Kitchen'].find(item => item.id === 'curry-jungle'),
    menuData['Soups & Claypots'].find(item => item.id === 'soup-khao-tom')
  ].filter(Boolean);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
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
    <section
      id="menu"
      className="section-padding"
      style={{ backgroundColor: 'var(--canvas-secondary)', borderBottom: '1px solid var(--border-light)' }}
    >
      <div className="container">
        {/* Title Block */}
        <div className="text-center max-w-2xl mx-auto mb-12" style={{ textAlign: 'center', maxWidth: '42rem', margin: '0 auto 3rem' }}>
          <span
            className="block font-sans text-xs font-bold tracking-[0.3em] uppercase mb-4"
            style={{ color: 'var(--gold-antique)', display: 'block', fontSize: '0.75rem', letterSpacing: '0.3em', marginBottom: '1rem' }}
          >
            THE COLLECTION
          </span>
          <h2
            className="font-serif text-4xl md:text-5xl font-light mb-6"
            style={{ fontSize: 'clamp(2rem, 3.5vw, 3rem)', fontWeight: 300, color: 'var(--text-dark)' }}
          >
            Our Seasonal Menu
          </h2>
        </div>

        {/* Grid Showcase of Seasonal Menu Cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '2rem'
          }}
        >
          {seasonalItems.map((item) => (
            <motion.div
              key={item.id}
              variants={itemVariants}
              whileHover={{ y: -6 }}
              transition={{ duration: 0.4 }}
              className="group flex flex-col"
              style={{ display: 'flex', flexDirection: 'column' }}
            >
              {/* Image Container */}
              <div
                className="relative overflow-hidden w-full aspect-[4/3] rounded-md mb-6"
                style={{ overflow: 'hidden', position: 'relative', width: '100%', aspectRatio: '4/3', borderRadius: '8px', marginBottom: '1.5rem' }}
              >
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-cover"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />

                <div
                  className="absolute bottom-3 left-3 flex items-center gap-1 bg-white/95 px-2 py-1 rounded"
                  style={{
                    position: 'absolute',
                    bottom: '0.75rem',
                    left: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '4px',
                    boxShadow: '0 2px 8px rgba(11, 54, 61, 0.05)'
                  }}
                >
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

        {/* View Full Menu Button */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '3rem' }}>
          <a
            href="#/menu/dinner"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '1rem 2.5rem',
              border: '1px solid var(--gold-antique)',
              backgroundColor: 'transparent',
              color: 'var(--text-dark)',
              fontFamily: 'var(--font-body)',
              fontSize: '0.75rem',
              fontWeight: 600,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              textDecoration: 'none',
              borderRadius: '2px',
              cursor: 'pointer',
              transition: 'all 0.4s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--gold-antique)';
              e.currentTarget.style.color = '#FFFFFF';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--text-dark)';
            }}
          >
            View Full Menu
            <span style={{ fontSize: '1rem', lineHeight: 1 }}>→</span>
          </a>
        </div>
      </div>
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
    </section>
  );
}
