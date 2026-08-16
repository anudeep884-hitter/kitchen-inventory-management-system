import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial seed data
function getSeedData() {
  const salt = bcrypt.genSaltSync(10);
  const defaultPasswordHash = bcrypt.hashSync('password123', salt);
  const adminPasswordHash = bcrypt.hashSync('admin123', salt);
  const chefPasswordHash = bcrypt.hashSync('chef123', salt);
  const deliveryPasswordHash = bcrypt.hashSync('delivery123', salt);

  const users = [
    {
      id: 'usr_admin_1',
      name: 'Alice Admin',
      email: 'admin@example.com',
      password: adminPasswordHash,
      role: 'admin',
      phone: '+91 98765 43210',
      location: 'Mumbai Central Kitchen',
      timezone: 'Asia/Kolkata',
      bio: 'Executive Administrator overseeing kitchen inventory, suppliers, and procurement.',
      status: 'active',
      joined: '2024-01-15'
    },
    {
      id: 'usr_chef_1',
      name: 'Carlos Chef',
      email: 'chef@example.com',
      password: chefPasswordHash,
      role: 'chef',
      phone: '+91 98765 43211',
      location: 'Main Culinary Kitchen',
      timezone: 'Asia/Kolkata',
      bio: 'Head Executive Chef managing menu planning, prep consumption, and recipes.',
      status: 'active',
      joined: '2024-03-20'
    },
    {
      id: 'usr_delivery_1',
      name: 'Dina Delivery',
      email: 'delivery@example.com',
      password: deliveryPasswordHash,
      role: 'delivery',
      phone: '+91 98765 43212',
      location: 'Supply Logistics Hub',
      timezone: 'Asia/Kolkata',
      bio: 'Lead Logistics & Delivery Partner handling inbound shipments and stock intake.',
      status: 'active',
      joined: '2024-05-10'
    }
  ];

  const suppliers = [
    {
      id: 'sup_1',
      name: 'Fresh Valley Farms',
      contactPerson: 'Rajesh Sharma',
      phone: '+91 98200 11223',
      email: 'orders@freshvalley.com',
      address: 'Plot 42, Green Belt Agri Zone, Pune, MH',
      productsSupplied: 'Organic Vegetables, Fresh Fruits, Herbs',
      lastPurchaseDate: '2026-08-10',
      status: 'active'
    },
    {
      id: 'sup_2',
      name: 'Metro Dairy Wholesale',
      contactPerson: 'Sunita Patel',
      phone: '+91 98200 22334',
      email: 'sales@metrodairy.in',
      address: 'Dairy Complex Road, Anand, GJ',
      productsSupplied: 'Whole Milk, Butter, Cheeses, Greek Yogurt, Cream',
      lastPurchaseDate: '2026-08-14',
      status: 'active'
    },
    {
      id: 'sup_3',
      name: 'Prime Meats & Seafood',
      contactPerson: 'David Fernandes',
      phone: '+91 98200 33445',
      email: 'supply@primemeats.com',
      address: 'Dockyard Road Cold Storage, Goa',
      productsSupplied: 'Chicken Breast, Salmon Fillet, Prawns, Beef Mince, Bacon',
      lastPurchaseDate: '2026-08-12',
      status: 'active'
    },
    {
      id: 'sup_4',
      name: 'Golden Harvest Grains & Flour',
      contactPerson: 'Amitabh Verma',
      phone: '+91 98200 44556',
      email: 'info@goldenharvest.com',
      address: 'Grain Market Yard 5, Karnal, HR',
      productsSupplied: 'Basmati Rice, All-purpose Flour, Oats, Quinoa, Pasta',
      lastPurchaseDate: '2026-08-05',
      status: 'active'
    },
    {
      id: 'sup_5',
      name: 'Heritage Spice Emporium',
      contactPerson: 'Lakshmi Nair',
      phone: '+91 98200 55667',
      email: 'contact@heritagespices.com',
      address: 'Spice Bazaar Lane 9, Kochi, KL',
      productsSupplied: 'Saffron, Black Pepper, Garam Masala, Turmeric, Cinnamon, Cardamom',
      lastPurchaseDate: '2026-07-28',
      status: 'active'
    }
  ];

  // Helper date generators for realistic expiry & status
  const today = new Date();
  const fmt = (d) => d.toISOString().slice(0, 10);
  const addDays = (n) => {
    const d = new Date(today);
    d.setDate(d.getDate() + n);
    return fmt(d);
  };

  const rawItems = [
    { name: 'Tomatoes', qty: 3.5, unit: 'kg', cat: 'Vegetable', exp: addDays(2), price: 40, min: 10, max: 40, sup: 'Fresh Valley Farms', loc: 'Cold Room A', batch: 'BAT-2026-TOM-01' },
    { name: 'Basmati Rice', qty: 45, unit: 'kg', cat: 'Grain', exp: addDays(180), price: 110, min: 20, max: 100, sup: 'Golden Harvest Grains & Flour', loc: 'Dry Storage Bay 1', batch: 'BAT-2026-RIC-09' },
    { name: 'Whole Milk', qty: 4, unit: 'L', cat: 'Dairy', exp: addDays(1), price: 65, min: 12, max: 50, sup: 'Metro Dairy Wholesale', loc: 'Refrigerator 1', batch: 'BAT-2026-MLK-88' },
    { name: 'Eggs', qty: 18, unit: 'pcs', cat: 'Dairy', exp: addDays(12), price: 8, min: 30, max: 120, sup: 'Metro Dairy Wholesale', loc: 'Refrigerator 2', batch: 'BAT-2026-EGG-44' },
    { name: 'Olive Oil', qty: 15, unit: 'L', cat: 'Cooking', exp: addDays(240), price: 750, min: 5, max: 30, sup: 'Heritage Spice Emporium', loc: 'Dry Storage Bay 2', batch: 'BAT-2026-OIL-02' },
    { name: 'All-purpose Flour', qty: 25, unit: 'kg', cat: 'Baking', exp: addDays(90), price: 55, min: 15, max: 60, sup: 'Golden Harvest Grains & Flour', loc: 'Dry Storage Bay 1', batch: 'BAT-2026-FLR-12' },
    { name: 'Sugar', qty: 30, unit: 'kg', cat: 'Baking', exp: addDays(365), price: 48, min: 10, max: 50, sup: 'Golden Harvest Grains & Flour', loc: 'Dry Storage Bay 2', batch: 'BAT-2026-SUG-05' },
    { name: 'Black Pepper', qty: 450, unit: 'g', cat: 'Spice', exp: addDays(200), price: 2.2, min: 200, max: 1000, sup: 'Heritage Spice Emporium', loc: 'Spice Rack B', batch: 'BAT-2026-PEP-01' },
    { name: 'Greek Yogurt', qty: 2, unit: 'kg', cat: 'Dairy', exp: addDays(-1), price: 320, min: 5, max: 20, sup: 'Metro Dairy Wholesale', loc: 'Refrigerator 1', batch: 'BAT-2026-YOG-19' },
    { name: 'Butter', qty: 8, unit: 'kg', cat: 'Dairy', exp: addDays(25), price: 480, min: 5, max: 25, sup: 'Metro Dairy Wholesale', loc: 'Refrigerator 2', batch: 'BAT-2026-BUT-33' },
    { name: 'Cheddar Cheese', qty: 4.5, unit: 'kg', cat: 'Dairy', exp: addDays(18), price: 620, min: 3, max: 15, sup: 'Metro Dairy Wholesale', loc: 'Refrigerator 1', batch: 'BAT-2026-CHE-11' },
    { name: 'Chicken Breast', qty: 12, unit: 'kg', cat: 'Meat', exp: addDays(3), price: 280, min: 10, max: 40, sup: 'Prime Meats & Seafood', loc: 'Freezer A', batch: 'BAT-2026-CHK-51' },
    { name: 'Salmon Fillet', qty: 6, unit: 'kg', cat: 'Seafood', exp: addDays(2), price: 950, min: 4, max: 20, sup: 'Prime Meats & Seafood', loc: 'Freezer B', batch: 'BAT-2026-SAL-08' },
    { name: 'Spinach', qty: 1.5, unit: 'kg', cat: 'Vegetable', exp: addDays(1), price: 50, min: 4, max: 15, sup: 'Fresh Valley Farms', loc: 'Cold Room A', batch: 'BAT-2026-SPN-22' },
    { name: 'Garlic', qty: 8, unit: 'kg', cat: 'Produce', exp: addDays(45), price: 140, min: 3, max: 20, sup: 'Fresh Valley Farms', loc: 'Dry Storage Bay 3', batch: 'BAT-2026-GAR-04' },
    { name: 'Onions', qty: 35, unit: 'kg', cat: 'Produce', exp: addDays(40), price: 35, min: 15, max: 60, sup: 'Fresh Valley Farms', loc: 'Dry Storage Bay 3', batch: 'BAT-2026-ONI-18' },
    { name: 'Potatoes', qty: 40, unit: 'kg', cat: 'Produce', exp: addDays(50), price: 30, min: 20, max: 80, sup: 'Fresh Valley Farms', loc: 'Dry Storage Bay 3', batch: 'BAT-2026-POT-07' },
    { name: 'Carrots', qty: 9, unit: 'kg', cat: 'Vegetable', exp: addDays(10), price: 45, min: 5, max: 25, sup: 'Fresh Valley Farms', loc: 'Cold Room A', batch: 'BAT-2026-CAR-14' },
    { name: 'Strawberries', qty: 1.2, unit: 'kg', cat: 'Fruit', exp: addDays(-2), price: 380, min: 3, max: 12, sup: 'Fresh Valley Farms', loc: 'Cold Room B', batch: 'BAT-2026-STR-90' },
    { name: 'Honey', qty: 10, unit: 'kg', cat: 'Pantry', exp: addDays(300), price: 450, min: 3, max: 15, sup: 'Heritage Spice Emporium', loc: 'Dry Storage Bay 2', batch: 'BAT-2026-HNY-03' },
    { name: 'Turmeric Powder', qty: 600, unit: 'g', cat: 'Spice', exp: addDays(250), price: 0.6, min: 300, max: 1500, sup: 'Heritage Spice Emporium', loc: 'Spice Rack A', batch: 'BAT-2026-TUR-01' },
    { name: 'Garam Masala', qty: 500, unit: 'g', cat: 'Spice', exp: addDays(220), price: 1.5, min: 250, max: 1000, sup: 'Heritage Spice Emporium', loc: 'Spice Rack A', batch: 'BAT-2026-GAR-02' },
    { name: 'Saffron', qty: 25, unit: 'g', cat: 'Spice', exp: addDays(360), price: 280, min: 10, max: 50, sup: 'Heritage Spice Emporium', loc: 'Spice Safe', batch: 'BAT-2026-SAF-99' },
    { name: 'Coffee Beans', qty: 14, unit: 'kg', cat: 'Beverage', exp: addDays(120), price: 850, min: 5, max: 25, sup: 'Golden Harvest Grains & Flour', loc: 'Dry Storage Bay 2', batch: 'BAT-2026-COF-06' },
    { name: 'Prawns', qty: 5, unit: 'kg', cat: 'Seafood', exp: addDays(4), price: 650, min: 4, max: 20, sup: 'Prime Meats & Seafood', loc: 'Freezer B', batch: 'BAT-2026-PRW-16' },
    { name: 'Broccoli', qty: 4, unit: 'kg', cat: 'Vegetable', exp: addDays(3), price: 90, min: 5, max: 20, sup: 'Fresh Valley Farms', loc: 'Cold Room A', batch: 'BAT-2026-BRO-05' },
    { name: 'Tofu', qty: 3, unit: 'kg', cat: 'Pantry', exp: addDays(5), price: 180, min: 4, max: 15, sup: 'Metro Dairy Wholesale', loc: 'Refrigerator 2', batch: 'BAT-2026-TOF-03' },
    { name: 'Soy Sauce', qty: 8, unit: 'L', cat: 'Condiment', exp: addDays(300), price: 220, min: 3, max: 15, sup: 'Heritage Spice Emporium', loc: 'Dry Storage Bay 2', batch: 'BAT-2026-SOY-01' },
    { name: 'Pasta', qty: 22, unit: 'kg', cat: 'Grain', exp: addDays(150), price: 130, min: 10, max: 50, sup: 'Golden Harvest Grains & Flour', loc: 'Dry Storage Bay 1', batch: 'BAT-2026-PAS-42' },
    { name: 'Apples', qty: 12, unit: 'kg', cat: 'Fruit', exp: addDays(14), price: 160, min: 8, max: 30, sup: 'Fresh Valley Farms', loc: 'Cold Room B', batch: 'BAT-2026-APP-19' }
  ];

  const inventory = rawItems.map((it, idx) => {
    const slug = it.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const id = 'item_' + (idx + 1).toString().padStart(3, '0');
    return {
      id,
      name: it.name,
      category: it.cat,
      qty: it.qty,
      unit: it.unit,
      minStock: it.min,
      maxStock: it.max,
      purchasePrice: it.price,
      expiry: it.exp,
      purchaseDate: addDays(-Math.floor(Math.random() * 15) - 2),
      supplier: it.sup,
      location: it.loc,
      batchNo: it.batch,
      icon: `assets/${slug}.svg`,
      lastUsed: addDays(-Math.floor(Math.random() * 5)),
      usageLog: []
    };
  });

  const transactions = [
    {
      id: 'tx_001',
      itemId: 'item_001',
      itemName: 'Tomatoes',
      userId: 'usr_chef_1',
      userName: 'Carlos Chef',
      userRole: 'chef',
      operation: 'USE_STOCK',
      quantity: 4.5,
      previousQty: 8.0,
      newQty: 3.5,
      unit: 'kg',
      reason: 'Dinner service tomato soup & gravy prep',
      timestamp: new Date(Date.now() - 4 * 3600000).toISOString()
    },
    {
      id: 'tx_002',
      itemId: 'item_012',
      itemName: 'Chicken Breast',
      userId: 'usr_chef_1',
      userName: 'Carlos Chef',
      userRole: 'chef',
      operation: 'USE_STOCK',
      quantity: 6.0,
      previousQty: 18.0,
      newQty: 12.0,
      unit: 'kg',
      reason: 'Grilled chicken lunch orders',
      timestamp: new Date(Date.now() - 6 * 3600000).toISOString()
    },
    {
      id: 'tx_003',
      itemId: 'item_002',
      itemName: 'Basmati Rice',
      userId: 'usr_delivery_1',
      userName: 'Dina Delivery',
      userRole: 'delivery',
      operation: 'ADD_STOCK',
      quantity: 25.0,
      previousQty: 20.0,
      newQty: 45.0,
      unit: 'kg',
      reason: 'Weekly shipment intake from Golden Harvest',
      timestamp: new Date(Date.now() - 24 * 3600000).toISOString()
    },
    {
      id: 'tx_004',
      itemId: 'item_009',
      itemName: 'Greek Yogurt',
      userId: 'usr_admin_1',
      userName: 'Alice Admin',
      userRole: 'admin',
      operation: 'MARK_DAMAGED',
      quantity: 1.0,
      previousQty: 3.0,
      newQty: 2.0,
      unit: 'kg',
      reason: 'Seal broken during refrigeration transit',
      timestamp: new Date(Date.now() - 30 * 3600000).toISOString()
    },
    {
      id: 'tx_005',
      itemId: 'item_003',
      itemName: 'Whole Milk',
      userId: 'usr_chef_1',
      userName: 'Carlos Chef',
      userRole: 'chef',
      operation: 'USE_STOCK',
      quantity: 8.0,
      previousQty: 12.0,
      newQty: 4.0,
      unit: 'L',
      reason: 'Morning breakfast coffee & dessert batch',
      timestamp: new Date(Date.now() - 8 * 3600000).toISOString()
    }
  ];

  const notifications = [
    {
      id: 'notif_001',
      type: 'EXPIRED',
      title: 'Item Expired',
      message: 'Greek Yogurt has expired (Expiry: ' + addDays(-1) + ')',
      itemId: 'item_009',
      itemName: 'Greek Yogurt',
      timestamp: new Date(Date.now() - 2 * 3600000).toISOString(),
      read: false,
      severity: 'danger'
    },
    {
      id: 'notif_002',
      type: 'EXPIRING_SOON',
      title: 'Expiring Soon',
      message: 'Whole Milk expires in 1 day (Expiry: ' + addDays(1) + ')',
      itemId: 'item_003',
      itemName: 'Whole Milk',
      timestamp: new Date(Date.now() - 4 * 3600000).toISOString(),
      read: false,
      severity: 'warning'
    },
    {
      id: 'notif_003',
      type: 'LOW_STOCK',
      title: 'Low Stock Alert',
      message: 'Tomatoes is below minimum threshold (Current: 3.5 kg, Min: 10 kg)',
      itemId: 'item_001',
      itemName: 'Tomatoes',
      timestamp: new Date(Date.now() - 5 * 3600000).toISOString(),
      read: false,
      severity: 'warning'
    },
    {
      id: 'notif_004',
      type: 'RESTOCKED',
      title: 'Stock Added',
      message: 'Basmati Rice restocked (+25 kg) by Dina Delivery',
      itemId: 'item_002',
      itemName: 'Basmati Rice',
      timestamp: new Date(Date.now() - 24 * 3600000).toISOString(),
      read: true,
      severity: 'success'
    }
  ];

  const deliveries = [
    {
      id: 'del_001',
      trackingNumber: 'TRK-2026-8801',
      supplierName: 'Fresh Valley Farms',
      assignedTo: 'usr_delivery_1',
      assignedToName: 'Dina Delivery',
      status: 'DELIVERED',
      items: [
        { itemName: 'Tomatoes', qty: 25, unit: 'kg', batchNo: 'BAT-2026-TOM-01', expiryDate: addDays(7) },
        { itemName: 'Spinach', qty: 10, unit: 'kg', batchNo: 'BAT-2026-SPN-22', expiryDate: addDays(4) }
      ],
      expectedDate: fmt(today),
      receivedDate: fmt(today),
      notes: 'Delivered in good condition and cold chain verified.'
    },
    {
      id: 'del_002',
      trackingNumber: 'TRK-2026-8802',
      supplierName: 'Metro Dairy Wholesale',
      assignedTo: 'usr_delivery_1',
      assignedToName: 'Dina Delivery',
      status: 'IN_TRANSIT',
      items: [
        { itemName: 'Whole Milk', qty: 30, unit: 'L', batchNo: 'BAT-2026-MLK-99', expiryDate: addDays(6) },
        { itemName: 'Butter', qty: 15, unit: 'kg', batchNo: 'BAT-2026-BUT-40', expiryDate: addDays(30) }
      ],
      expectedDate: addDays(1),
      receivedDate: null,
      notes: 'Dispatch confirmed, scheduled for morning delivery.'
    },
    {
      id: 'del_003',
      trackingNumber: 'TRK-2026-8803',
      supplierName: 'Prime Meats & Seafood',
      assignedTo: 'usr_delivery_1',
      assignedToName: 'Dina Delivery',
      status: 'PENDING',
      items: [
        { itemName: 'Chicken Breast', qty: 25, unit: 'kg', batchNo: 'BAT-2026-CHK-77', expiryDate: addDays(5) },
        { itemName: 'Salmon Fillet', qty: 10, unit: 'kg', batchNo: 'BAT-2026-SAL-12', expiryDate: addDays(4) }
      ],
      expectedDate: addDays(2),
      receivedDate: null,
      notes: 'Awaiting supplier dispatch confirmation.'
    }
  ];

  const settings = {
    notificationsEnabled: true,
    lowStockThresholdDays: 7,
    expiringSoonThresholdDays: 3,
    itemsPerPage: 25,
    currencySymbol: '₹',
    theme: 'light'
  };

  return {
    users,
    suppliers,
    inventory,
    transactions,
    notifications,
    deliveries,
    settings
  };
}

export function readDB() {
  if (!fs.existsSync(DB_FILE)) {
    const initial = getSeedData();
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf-8');
    return initial;
  }
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading db.json, returning seeded fallback', err);
    return getSeedData();
  }
}

export function writeDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

// Helpers for item statuses
export function computeItemStatus(item) {
  const qty = Number(item.qty) || 0;
  const minStock = Number(item.minStock) || 0;

  if (item.expiry) {
    const exp = new Date(item.expiry);
    const now = new Date();
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    const in3Days = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 3, 23, 59, 59);

    if (exp < new Date(now.getFullYear(), now.getMonth(), now.getDate())) {
      return 'EXPIRED';
    }
    if (exp <= in3Days) {
      return 'EXPIRING_SOON';
    }
  }

  if (qty <= minStock) {
    return 'LOW_STOCK';
  }

  return 'AVAILABLE';
}

export function getEnrichedInventory(db) {
  return (db.inventory || []).map(item => ({
    ...item,
    status: computeItemStatus(item),
    inventoryValue: Number(((Number(item.qty) || 0) * (Number(item.purchasePrice) || 0)).toFixed(2))
  }));
}
