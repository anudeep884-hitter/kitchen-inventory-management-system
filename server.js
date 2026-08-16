import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { readDB, writeDB, computeItemStatus, getEnrichedInventory } from './backend/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'kitchen_inventory_jwt_secret_key_2026';

// Middleware
app.use(cors());
app.use(express.json());

// Serve static frontend files
app.use(express.static(__dirname));

// Auth Middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    // Check query param or pass as guest if optional
    return res.status(401).json({ success: false, message: 'Authentication token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
}

function requireRoles(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Requires one of [${roles.join(', ')}] role`
      });
    }
    next();
  };
}

// ==========================================
// 1. AUTH & USER ROUTES
// ==========================================

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required' });
  }

  const db = readDB();
  const user = (db.users || []).find(u => u.email.toLowerCase() === email.trim().toLowerCase());

  if (!user) {
    return res.status(401).json({ success: false, message: 'Invalid email or password' });
  }

  if (user.status === 'disabled') {
    return res.status(403).json({ success: false, message: 'Your account has been deactivated. Please contact an admin.' });
  }

  const isMatch = bcrypt.compareSync(password, user.password);
  if (!isMatch) {
    return res.status(401).json({ success: false, message: 'Invalid email or password' });
  }

  const tokenPayload = { id: user.id, email: user.email, name: user.name, role: user.role };
  const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '7d' });

  const safeUser = { ...user };
  delete safeUser.password;

  res.json({
    success: true,
    message: 'Login successful',
    token,
    user: safeUser
  });
});

app.get('/api/auth/me', authenticateToken, (req, res) => {
  const db = readDB();
  const user = (db.users || []).find(u => u.id === req.user.id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }
  const safeUser = { ...user };
  delete safeUser.password;
  res.json({ success: true, user: safeUser });
});

app.post('/api/auth/forgot-password', (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, message: 'Email is required' });
  }
  const db = readDB();
  const user = (db.users || []).find(u => u.email.toLowerCase() === email.trim().toLowerCase());
  if (!user) {
    return res.status(404).json({ success: false, message: 'No account registered with this email' });
  }
  res.json({
    success: true,
    message: `Password reset link generated for ${user.email}. In demo mode, your password remains "${user.role}123" or "password123".`
  });
});

app.put('/api/auth/profile', authenticateToken, (req, res) => {
  const { name, phone, location, bio, timezone } = req.body;
  const db = readDB();
  const userIndex = (db.users || []).findIndex(u => u.id === req.user.id);
  if (userIndex === -1) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  if (name) db.users[userIndex].name = name.trim();
  if (phone !== undefined) db.users[userIndex].phone = phone.trim();
  if (location !== undefined) db.users[userIndex].location = location.trim();
  if (bio !== undefined) db.users[userIndex].bio = bio.trim();
  if (timezone !== undefined) db.users[userIndex].timezone = timezone.trim();

  writeDB(db);

  const safeUser = { ...db.users[userIndex] };
  delete safeUser.password;
  res.json({ success: true, message: 'Profile updated successfully', user: safeUser });
});

app.put('/api/auth/change-password', authenticateToken, (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ success: false, message: 'Current and new password required' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
  }

  const db = readDB();
  const user = (db.users || []).find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });

  if (!bcrypt.compareSync(currentPassword, user.password)) {
    return res.status(400).json({ success: false, message: 'Current password is incorrect' });
  }

  user.password = bcrypt.hashSync(newPassword, 10);
  writeDB(db);
  res.json({ success: true, message: 'Password changed successfully' });
});

// Admin User Management
app.get('/api/users', authenticateToken, requireRoles('admin'), (req, res) => {
  const db = readDB();
  const safeUsers = (db.users || []).map(u => {
    const copy = { ...u };
    delete copy.password;
    return copy;
  });
  res.json({ success: true, users: safeUsers });
});

app.post('/api/users', authenticateToken, requireRoles('admin'), (req, res) => {
  const { name, email, role, phone, location, password } = req.body;
  if (!name || !email || !role) {
    return res.status(400).json({ success: false, message: 'Name, email, and role are required' });
  }

  const db = readDB();
  const exists = (db.users || []).some(u => u.email.toLowerCase() === email.trim().toLowerCase());
  if (exists) {
    return res.status(400).json({ success: false, message: 'A user with this email already exists' });
  }

  const newUser = {
    id: 'usr_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    name: name.trim(),
    email: email.trim().toLowerCase(),
    password: bcrypt.hashSync(password || 'password123', 10),
    role: role.toLowerCase(),
    phone: phone || '',
    location: location || '',
    timezone: 'Asia/Kolkata',
    bio: '',
    status: 'active',
    joined: new Date().toISOString().slice(0, 10)
  };

  db.users.push(newUser);
  writeDB(db);

  const safe = { ...newUser };
  delete safe.password;
  res.status(201).json({ success: true, message: 'User created successfully', user: safe });
});

app.put('/api/users/:id', authenticateToken, requireRoles('admin'), (req, res) => {
  const { id } = req.params;
  const { name, email, role, phone, location, status, password } = req.body;
  const db = readDB();
  const user = (db.users || []).find(u => u.id === id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });

  if (name) user.name = name.trim();
  if (email) user.email = email.trim().toLowerCase();
  if (role) user.role = role.toLowerCase();
  if (phone !== undefined) user.phone = phone;
  if (location !== undefined) user.location = location;
  if (status) user.status = status;
  if (password && password.trim().length >= 6) {
    user.password = bcrypt.hashSync(password.trim(), 10);
  }

  writeDB(db);
  const safe = { ...user };
  delete safe.password;
  res.json({ success: true, message: 'User updated successfully', user: safe });
});

app.delete('/api/users/:id', authenticateToken, requireRoles('admin'), (req, res) => {
  const { id } = req.params;
  const db = readDB();
  const index = (db.users || []).findIndex(u => u.id === id);
  if (index === -1) return res.status(404).json({ success: false, message: 'User not found' });

  if (db.users[index].id === req.user.id) {
    return res.status(400).json({ success: false, message: 'Cannot delete your own admin account' });
  }

  db.users.splice(index, 1);
  writeDB(db);
  res.json({ success: true, message: 'User deleted successfully' });
});

// ==========================================
// 2. INVENTORY & STOCK OPERATIONS
// ==========================================

app.get('/api/inventory', (req, res) => {
  const db = readDB();
  let items = getEnrichedInventory(db);

  const { search, category, status, expiry, supplier, location, sort } = req.query;

  if (search) {
    const q = search.trim().toLowerCase();
    items = items.filter(it =>
      (it.name || '').toLowerCase().includes(q) ||
      (it.supplier || '').toLowerCase().includes(q) ||
      (it.batchNo || '').toLowerCase().includes(q) ||
      (it.location || '').toLowerCase().includes(q)
    );
  }

  if (category) {
    items = items.filter(it => (it.category || '').toLowerCase() === category.trim().toLowerCase());
  }

  if (status) {
    items = items.filter(it => it.status === status.toUpperCase());
  }

  if (expiry) {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const in3Days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    if (expiry === 'expired') {
      items = items.filter(it => it.expiry && it.expiry < todayStr);
    } else if (expiry === 'expiring-today') {
      items = items.filter(it => it.expiry === todayStr);
    } else if (expiry === 'expiring-3') {
      items = items.filter(it => it.expiry && it.expiry >= todayStr && it.expiry <= in3Days);
    } else if (expiry === 'expiring-7') {
      items = items.filter(it => it.expiry && it.expiry >= todayStr && it.expiry <= in7Days);
    } else if (expiry === 'safe') {
      items = items.filter(it => !it.expiry || it.expiry > in7Days);
    }
  }

  if (supplier) {
    items = items.filter(it => (it.supplier || '').toLowerCase() === supplier.trim().toLowerCase());
  }

  if (location) {
    items = items.filter(it => (it.location || '').toLowerCase() === location.trim().toLowerCase());
  }

  if (sort) {
    if (sort === 'name-asc') items.sort((a, b) => a.name.localeCompare(b.name));
    else if (sort === 'name-desc') items.sort((a, b) => b.name.localeCompare(a.name));
    else if (sort === 'qty-asc') items.sort((a, b) => Number(a.qty) - Number(b.qty));
    else if (sort === 'qty-desc') items.sort((a, b) => Number(b.qty) - Number(a.qty));
    else if (sort === 'expiry-asc') items.sort((a, b) => (a.expiry || '9999').localeCompare(b.expiry || '9999'));
    else if (sort === 'expiry-desc') items.sort((a, b) => (b.expiry || '').localeCompare(a.expiry || ''));
    else if (sort === 'price-desc') items.sort((a, b) => (Number(b.purchasePrice) || 0) - (Number(a.purchasePrice) || 0));
  }

  res.json({ success: true, count: items.length, items });
});

app.get('/api/inventory/:id', (req, res) => {
  const db = readDB();
  const item = (db.inventory || []).find(it => it.id === req.params.id);
  if (!item) return res.status(404).json({ success: false, message: 'Item not found' });
  const enriched = {
    ...item,
    status: computeItemStatus(item),
    inventoryValue: Number(((Number(item.qty) || 0) * (Number(item.purchasePrice) || 0)).toFixed(2))
  };
  res.json({ success: true, item: enriched });
});

app.post('/api/inventory', authenticateToken, requireRoles('admin', 'delivery'), (req, res) => {
  const {
    name, category, qty, unit, minStock, maxStock,
    purchasePrice, expiry, purchaseDate, supplier, location, batchNo
  } = req.body;

  if (!name || name.trim() === '') {
    return res.status(400).json({ success: false, message: 'Item name is required' });
  }

  const quantity = Math.max(0, parseFloat(qty) || 0);
  const min = Math.max(0, parseFloat(minStock) || 5);
  const max = Math.max(min, parseFloat(maxStock) || 50);
  const price = Math.max(0, parseFloat(purchasePrice) || 0);

  const db = readDB();
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const id = 'item_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);

  const newItem = {
    id,
    name: name.trim(),
    category: category ? category.trim() : 'General',
    qty: quantity,
    unit: unit ? unit.trim() : 'pcs',
    minStock: min,
    maxStock: max,
    purchasePrice: price,
    expiry: expiry || '',
    purchaseDate: purchaseDate || new Date().toISOString().slice(0, 10),
    supplier: supplier || 'Unassigned',
    location: location || 'Dry Storage',
    batchNo: batchNo || `BAT-${Date.now().toString(36).toUpperCase()}`,
    icon: `assets/${slug}.svg`,
    lastUsed: '',
    usageLog: []
  };

  db.inventory.unshift(newItem);

  // Log transaction
  const tx = {
    id: 'tx_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    itemId: id,
    itemName: newItem.name,
    userId: req.user.id,
    userName: req.user.name,
    userRole: req.user.role,
    operation: 'NEW_ITEM',
    quantity: quantity,
    previousQty: 0,
    newQty: quantity,
    unit: newItem.unit,
    reason: `Initial stock added by ${req.user.name}`,
    timestamp: new Date().toISOString()
  };
  db.transactions.unshift(tx);

  // Check low stock
  if (quantity <= min) {
    db.notifications.unshift({
      id: 'notif_' + Date.now().toString(36),
      type: 'LOW_STOCK',
      title: 'Low Stock Alert',
      message: `${newItem.name} added below minimum threshold (${quantity} ${newItem.unit})`,
      itemId: id,
      itemName: newItem.name,
      timestamp: new Date().toISOString(),
      read: false,
      severity: 'warning'
    });
  }

  writeDB(db);
  res.status(201).json({
    success: true,
    message: 'Item added successfully',
    item: { ...newItem, status: computeItemStatus(newItem) }
  });
});

app.put('/api/inventory/:id', authenticateToken, requireRoles('admin'), (req, res) => {
  const { id } = req.params;
  const db = readDB();
  const item = (db.inventory || []).find(it => it.id === id);
  if (!item) return res.status(404).json({ success: false, message: 'Item not found' });

  const {
    name, category, qty, unit, minStock, maxStock,
    purchasePrice, expiry, purchaseDate, supplier, location, batchNo
  } = req.body;

  if (name) item.name = name.trim();
  if (category) item.category = category.trim();
  if (qty !== undefined) item.qty = Math.max(0, parseFloat(qty) || 0);
  if (unit) item.unit = unit.trim();
  if (minStock !== undefined) item.minStock = Math.max(0, parseFloat(minStock) || 0);
  if (maxStock !== undefined) item.maxStock = Math.max(0, parseFloat(maxStock) || 0);
  if (purchasePrice !== undefined) item.purchasePrice = Math.max(0, parseFloat(purchasePrice) || 0);
  if (expiry !== undefined) item.expiry = expiry;
  if (purchaseDate !== undefined) item.purchaseDate = purchaseDate;
  if (supplier) item.supplier = supplier.trim();
  if (location) item.location = location.trim();
  if (batchNo) item.batchNo = batchNo.trim();

  writeDB(db);
  res.json({
    success: true,
    message: 'Item updated successfully',
    item: { ...item, status: computeItemStatus(item) }
  });
});

app.delete('/api/inventory/:id', authenticateToken, requireRoles('admin'), (req, res) => {
  const { id } = req.params;
  const db = readDB();
  const index = (db.inventory || []).findIndex(it => it.id === id);
  if (index === -1) return res.status(404).json({ success: false, message: 'Item not found' });

  const deletedItem = db.inventory[index];
  db.inventory.splice(index, 1);

  db.transactions.unshift({
    id: 'tx_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    itemId: id,
    itemName: deletedItem.name,
    userId: req.user.id,
    userName: req.user.name,
    userRole: req.user.role,
    operation: 'DELETE_ITEM',
    quantity: deletedItem.qty,
    previousQty: deletedItem.qty,
    newQty: 0,
    unit: deletedItem.unit,
    reason: `Item removed from inventory by ${req.user.name}`,
    timestamp: new Date().toISOString()
  });

  writeDB(db);
  res.json({ success: true, message: 'Item deleted successfully' });
});

// Stock Operations: ADD, USE, RESTOCK, MARK_DAMAGED
app.post('/api/stock/operation', authenticateToken, (req, res) => {
  const { itemId, operation, quantity, reason, batchNo, expiryDate } = req.body;
  if (!itemId || !operation || quantity === undefined) {
    return res.status(400).json({ success: false, message: 'itemId, operation, and quantity are required' });
  }

  const op = operation.toUpperCase();
  const validOps = ['ADD_STOCK', 'USE_STOCK', 'RESTOCK', 'MARK_DAMAGED'];
  if (!validOps.includes(op)) {
    return res.status(400).json({ success: false, message: `Invalid operation. Must be one of [${validOps.join(', ')}]` });
  }

  const q = parseFloat(quantity);
  if (isNaN(q) || q <= 0) {
    return res.status(400).json({ success: false, message: 'Quantity must be a positive number greater than 0' });
  }

  const db = readDB();
  const item = (db.inventory || []).find(it => it.id === itemId);
  if (!item) return res.status(404).json({ success: false, message: 'Inventory item not found' });

  const prevQty = Number(item.qty) || 0;
  let newQty = prevQty;

  if (op === 'USE_STOCK' || op === 'MARK_DAMAGED') {
    if (prevQty - q < 0) {
      return res.status(400).json({
        success: false,
        message: `Insufficient stock. Current quantity is ${prevQty} ${item.unit}, cannot deduct ${q} ${item.unit}.`
      });
    }
    newQty = Number((prevQty - q).toFixed(3));
    item.lastUsed = new Date().toISOString().slice(0, 10);
  } else if (op === 'ADD_STOCK' || op === 'RESTOCK') {
    newQty = Number((prevQty + q).toFixed(3));
    if (batchNo) item.batchNo = batchNo.trim();
    if (expiryDate) item.expiry = expiryDate;
  }

  item.qty = newQty;

  // Record usage in item internal log
  if (op === 'USE_STOCK') {
    item.usageLog = item.usageLog || [];
    item.usageLog.push({ date: new Date().toISOString().slice(0, 10), qty: q, reason: reason || 'Kitchen Usage' });
  }

  // Audit transaction record
  const tx = {
    id: 'tx_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    itemId: item.id,
    itemName: item.name,
    userId: req.user.id,
    userName: req.user.name,
    userRole: req.user.role,
    operation: op,
    quantity: q,
    previousQty: prevQty,
    newQty: newQty,
    unit: item.unit,
    reason: reason || `${op} operation logged by ${req.user.name}`,
    timestamp: new Date().toISOString()
  };
  db.transactions.unshift(tx);

  // Trigger low stock notifications if needed
  if (newQty <= (item.minStock || 0)) {
    const existingLow = (db.notifications || []).some(
      n => n.itemId === item.id && n.type === 'LOW_STOCK' && !n.read
    );
    if (!existingLow) {
      db.notifications.unshift({
        id: 'notif_' + Date.now().toString(36),
        type: 'LOW_STOCK',
        title: 'Low Stock Alert',
        message: `${item.name} is now at ${newQty} ${item.unit} (Min: ${item.minStock} ${item.unit})`,
        itemId: item.id,
        itemName: item.name,
        timestamp: new Date().toISOString(),
        read: false,
        severity: 'warning'
      });
    }
  }

  writeDB(db);
  res.json({
    success: true,
    message: `Stock updated successfully (${op}: ${q} ${item.unit})`,
    item: { ...item, status: computeItemStatus(item) },
    transaction: tx
  });
});

// ==========================================
// 3. SUPPLIERS
// ==========================================

app.get('/api/suppliers', (req, res) => {
  const db = readDB();
  res.json({ success: true, suppliers: db.suppliers || [] });
});

app.post('/api/suppliers', authenticateToken, requireRoles('admin'), (req, res) => {
  const { name, contactPerson, phone, email, address, productsSupplied } = req.body;
  if (!name) return res.status(400).json({ success: false, message: 'Supplier name is required' });

  const db = readDB();
  const newSupplier = {
    id: 'sup_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
    name: name.trim(),
    contactPerson: contactPerson || '',
    phone: phone || '',
    email: email || '',
    address: address || '',
    productsSupplied: productsSupplied || '',
    lastPurchaseDate: new Date().toISOString().slice(0, 10),
    status: 'active'
  };

  db.suppliers.push(newSupplier);
  writeDB(db);
  res.status(201).json({ success: true, message: 'Supplier added successfully', supplier: newSupplier });
});

app.put('/api/suppliers/:id', authenticateToken, requireRoles('admin'), (req, res) => {
  const { id } = req.params;
  const db = readDB();
  const supplier = (db.suppliers || []).find(s => s.id === id);
  if (!supplier) return res.status(404).json({ success: false, message: 'Supplier not found' });

  const { name, contactPerson, phone, email, address, productsSupplied, status } = req.body;
  if (name) supplier.name = name.trim();
  if (contactPerson !== undefined) supplier.contactPerson = contactPerson;
  if (phone !== undefined) supplier.phone = phone;
  if (email !== undefined) supplier.email = email;
  if (address !== undefined) supplier.address = address;
  if (productsSupplied !== undefined) supplier.productsSupplied = productsSupplied;
  if (status) supplier.status = status;

  writeDB(db);
  res.json({ success: true, message: 'Supplier updated successfully', supplier });
});

app.delete('/api/suppliers/:id', authenticateToken, requireRoles('admin'), (req, res) => {
  const { id } = req.params;
  const db = readDB();
  const index = (db.suppliers || []).findIndex(s => s.id === id);
  if (index === -1) return res.status(404).json({ success: false, message: 'Supplier not found' });

  db.suppliers.splice(index, 1);
  writeDB(db);
  res.json({ success: true, message: 'Supplier deleted successfully' });
});

// ==========================================
// 4. DELIVERIES
// ==========================================

app.get('/api/deliveries', (req, res) => {
  const db = readDB();
  res.json({ success: true, deliveries: db.deliveries || [] });
});

app.post('/api/deliveries', authenticateToken, requireRoles('admin', 'delivery'), (req, res) => {
  const { supplierName, items, expectedDate, notes, assignedTo } = req.body;
  if (!supplierName) return res.status(400).json({ success: false, message: 'Supplier name is required' });

  const db = readDB();
  const newDelivery = {
    id: 'del_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
    trackingNumber: 'TRK-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000),
    supplierName: supplierName.trim(),
    assignedTo: assignedTo || req.user.id,
    assignedToName: req.user.name,
    status: 'IN_TRANSIT',
    items: Array.isArray(items) ? items : [],
    expectedDate: expectedDate || new Date().toISOString().slice(0, 10),
    receivedDate: null,
    notes: notes || ''
  };

  db.deliveries.unshift(newDelivery);
  writeDB(db);
  res.status(201).json({ success: true, message: 'Delivery recorded successfully', delivery: newDelivery });
});

app.put('/api/deliveries/:id', authenticateToken, requireRoles('admin', 'delivery'), (req, res) => {
  const { id } = req.params;
  const db = readDB();
  const delivery = (db.deliveries || []).find(d => d.id === id);
  if (!delivery) return res.status(404).json({ success: false, message: 'Delivery not found' });

  const { status, notes, receivedDate, autoUpdateStock } = req.body;
  if (status) delivery.status = status;
  if (notes !== undefined) delivery.notes = notes;
  if (receivedDate !== undefined) delivery.receivedDate = receivedDate;

  // Auto-intake items into inventory when marked DELIVERED
  if (status === 'DELIVERED' && autoUpdateStock && Array.isArray(delivery.items)) {
    delivery.items.forEach(delItem => {
      const match = db.inventory.find(i => i.name.toLowerCase() === (delItem.itemName || '').toLowerCase());
      const addQty = parseFloat(delItem.qty) || 0;
      if (match && addQty > 0) {
        const prev = match.qty;
        match.qty = Number((match.qty + addQty).toFixed(3));
        if (delItem.batchNo) match.batchNo = delItem.batchNo;
        if (delItem.expiryDate) match.expiry = delItem.expiryDate;

        db.transactions.unshift({
          id: 'tx_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
          itemId: match.id,
          itemName: match.name,
          userId: req.user.id,
          userName: req.user.name,
          userRole: req.user.role,
          operation: 'ADD_STOCK',
          quantity: addQty,
          previousQty: prev,
          newQty: match.qty,
          unit: match.unit,
          reason: `Shipment received (${delivery.trackingNumber})`,
          timestamp: new Date().toISOString()
        });
      }
    });
  }

  writeDB(db);
  res.json({ success: true, message: 'Delivery updated successfully', delivery });
});

// ==========================================
// 5. TRANSACTIONS / AUDIT HISTORY
// ==========================================

app.get('/api/transactions', (req, res) => {
  const db = readDB();
  let txs = db.transactions || [];

  const { itemId, userId, operation, startDate, endDate, search } = req.query;

  if (itemId) txs = txs.filter(t => t.itemId === itemId);
  if (userId) txs = txs.filter(t => t.userId === userId);
  if (operation) txs = txs.filter(t => t.operation === operation.toUpperCase());
  if (startDate) txs = txs.filter(t => t.timestamp >= startDate);
  if (endDate) txs = txs.filter(t => t.timestamp <= endDate + 'T23:59:59.999Z');
  if (search) {
    const q = search.toLowerCase();
    txs = txs.filter(t =>
      (t.itemName || '').toLowerCase().includes(q) ||
      (t.userName || '').toLowerCase().includes(q) ||
      (t.reason || '').toLowerCase().includes(q)
    );
  }

  res.json({ success: true, count: txs.length, transactions: txs });
});

// ==========================================
// 6. NOTIFICATIONS
// ==========================================

app.get('/api/notifications', (req, res) => {
  const db = readDB();
  const notifs = db.notifications || [];
  res.json({
    success: true,
    unreadCount: notifs.filter(n => !n.read).length,
    notifications: notifs
  });
});

app.put('/api/notifications/:id/read', (req, res) => {
  const { id } = req.params;
  const db = readDB();
  const notif = (db.notifications || []).find(n => n.id === id);
  if (notif) notif.read = true;
  writeDB(db);
  res.json({ success: true, message: 'Notification marked as read' });
});

app.put('/api/notifications/mark-all-read', (req, res) => {
  const db = readDB();
  (db.notifications || []).forEach(n => n.read = true);
  writeDB(db);
  res.json({ success: true, message: 'All notifications marked as read' });
});

app.delete('/api/notifications', authenticateToken, requireRoles('admin'), (req, res) => {
  const db = readDB();
  db.notifications = [];
  writeDB(db);
  res.json({ success: true, message: 'Notifications cleared' });
});

// ==========================================
// 7. ANALYTICS & DASHBOARD METRICS
// ==========================================

app.get('/api/analytics/overview', (req, res) => {
  const db = readDB();
  const items = getEnrichedInventory(db);
  const txs = db.transactions || [];

  const totalItems = items.length;
  const availableStock = items.filter(i => i.status === 'AVAILABLE').length;
  const lowStock = items.filter(i => i.status === 'LOW_STOCK').length;
  const expiredItems = items.filter(i => i.status === 'EXPIRED').length;
  const expiringSoon = items.filter(i => i.status === 'EXPIRING_SOON').length;

  const totalValue = items.reduce((sum, i) => sum + (i.inventoryValue || 0), 0);

  // Today's consumption
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayUsage = txs
    .filter(t => t.operation === 'USE_STOCK' && t.timestamp && t.timestamp.startsWith(todayStr))
    .reduce((sum, t) => sum + (t.quantity || 0), 0);

  // Most expensive items by total value
  const topValuedItems = [...items]
    .sort((a, b) => b.inventoryValue - a.inventoryValue)
    .slice(0, 5);

  // Categories distribution
  const categoryCounts = {};
  items.forEach(i => {
    categoryCounts[i.category] = (categoryCounts[i.category] || 0) + 1;
  });

  // Recent 7-day consumption trend
  const dailyTrends = [];
  for (let d = 6; d >= 0; d--) {
    const targetDate = new Date(Date.now() - d * 24 * 3600000).toISOString().slice(0, 10);
    const dayUsage = txs
      .filter(t => t.operation === 'USE_STOCK' && t.timestamp && t.timestamp.startsWith(targetDate))
      .reduce((sum, t) => sum + (t.quantity || 0), 0);
    dailyTrends.push({ date: targetDate, consumption: Number(dayUsage.toFixed(1)) });
  }

  res.json({
    success: true,
    stats: {
      totalItems,
      availableStock,
      lowStock,
      expiredItems,
      expiringSoon,
      todayConsumption: Number(todayUsage.toFixed(1)),
      totalInventoryValue: Number(totalValue.toFixed(2))
    },
    topValuedItems,
    categoryCounts,
    dailyTrends,
    recentActivity: txs.slice(0, 8),
    recentNotifications: (db.notifications || []).slice(0, 6)
  });
});

// ==========================================
// 8. SMART RECOMMENDATIONS & FORECAST
// ==========================================

app.get('/api/recommendations', (req, res) => {
  const db = readDB();
  const items = getEnrichedInventory(db);
  const txs = db.transactions || [];

  // 1. Reorder Recommendations for Low Stock items
  const reorderRecommendations = items
    .filter(i => i.status === 'LOW_STOCK' || Number(i.qty) <= Number(i.minStock))
    .map(i => {
      const targetMax = Number(i.maxStock) || (Number(i.minStock) * 2.5);
      const recommendedReorder = Math.max(1, Math.ceil(targetMax - Number(i.qty)));
      const estimatedCost = Number((recommendedReorder * Number(i.purchasePrice || 0)).toFixed(2));
      return {
        id: i.id,
        name: i.name,
        category: i.category,
        currentQty: i.qty,
        minStock: i.minStock,
        maxStock: i.maxStock,
        unit: i.unit,
        recommendedReorder,
        estimatedCost,
        supplier: i.supplier,
        urgency: Number(i.qty) <= 0 ? 'CRITICAL' : 'HIGH'
      };
    });

  // 2. Expiry Risk Prevention
  const expiryRisks = items
    .filter(i => i.status === 'EXPIRING_SOON' || i.status === 'EXPIRED')
    .map(i => ({
      id: i.id,
      name: i.name,
      qty: i.qty,
      unit: i.unit,
      expiry: i.expiry,
      status: i.status,
      actionAdvice: i.status === 'EXPIRED'
        ? 'Discard & record in Mark Damaged to prevent contamination.'
        : 'Feature in chef daily specials or meal prep batches.'
    }));

  // 3. Fast-moving items (consumption velocity)
  const usageMap = {};
  txs.filter(t => t.operation === 'USE_STOCK').forEach(t => {
    usageMap[t.itemName] = (usageMap[t.itemName] || 0) + (t.quantity || 0);
  });
  const fastMoving = Object.entries(usageMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, total]) => ({ itemName: name, totalUsed: Number(total.toFixed(1)) }));

  res.json({
    success: true,
    reorderRecommendations,
    expiryRisks,
    fastMoving
  });
});

// ==========================================
// 9. REPORTS GENERATOR
// ==========================================

app.get('/api/reports/:type', (req, res) => {
  const { type } = req.params;
  const db = readDB();
  const items = getEnrichedInventory(db);
  const txs = db.transactions || [];

  let reportData = [];
  let title = '';

  switch (type) {
    case 'inventory':
      title = 'Master Inventory Valuation Report';
      reportData = items.map(i => ({
        'Item ID': i.id,
        'Name': i.name,
        'Category': i.category,
        'Quantity': `${i.qty} ${i.unit}`,
        'Min Stock': i.minStock,
        'Unit Price': `₹${i.purchasePrice}`,
        'Total Value': `₹${i.inventoryValue}`,
        'Status': i.status,
        'Expiry Date': i.expiry || 'N/A',
        'Storage Location': i.location,
        'Supplier': i.supplier
      }));
      break;

    case 'movement':
      title = 'Stock Movement & Transaction Audit Report';
      reportData = txs.map(t => ({
        'Transaction ID': t.id,
        'Timestamp': t.timestamp,
        'Item Name': t.itemName,
        'Operation': t.operation,
        'Quantity': `${t.quantity} ${t.unit || ''}`,
        'Previous Qty': t.previousQty,
        'New Qty': t.newQty,
        'User': `${t.userName} (${t.userRole})`,
        'Reason': t.reason
      }));
      break;

    case 'expiry':
      title = 'Expiry & Waste Risk Report';
      reportData = items
        .filter(i => i.expiry)
        .sort((a, b) => (a.expiry || '').localeCompare(b.expiry || ''))
        .map(i => ({
          'Name': i.name,
          'Category': i.category,
          'Current Qty': `${i.qty} ${i.unit}`,
          'Expiry Date': i.expiry,
          'Status': i.status,
          'Unit Price': `₹${i.purchasePrice}`,
          'Value at Risk': `₹${i.inventoryValue}`,
          'Storage Location': i.location
        }));
      break;

    case 'purchase':
      title = 'Supplier Purchase Order & Inbound Report';
      reportData = (db.deliveries || []).map(d => ({
        'Tracking No': d.trackingNumber,
        'Supplier': d.supplierName,
        'Status': d.status,
        'Expected Date': d.expectedDate,
        'Received Date': d.receivedDate || 'Pending',
        'Items Count': (d.items || []).length,
        'Notes': d.notes
      }));
      break;

    case 'consumption':
      title = 'Kitchen Ingredient Consumption Report';
      reportData = txs
        .filter(t => t.operation === 'USE_STOCK')
        .map(t => ({
          'Timestamp': t.timestamp,
          'Item Name': t.itemName,
          'Qty Consumed': `${t.quantity} ${t.unit || ''}`,
          'Chef / User': t.userName,
          'Prep Reason': t.reason
        }));
      break;

    default:
      return res.status(400).json({ success: false, message: 'Invalid report type' });
  }

  res.json({
    success: true,
    reportType: type,
    title,
    generatedAt: new Date().toISOString(),
    rowCount: reportData.length,
    data: reportData
  });
});

// Demo reset endpoint
app.post('/api/settings/reset-demo', authenticateToken, requireRoles('admin'), async (req, res) => {
  const { writeDB } = await import('./backend/db.js');
  // Re-seed DB by removing file and reading again
  const fs = (await import('fs')).default;
  const path = (await import('path')).default;
  const dbPath = path.join(__dirname, 'data', 'db.json');
  if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
  }
  const { readDB } = await import('./backend/db.js');
  readDB();
  res.json({ success: true, message: 'Demo database reset to factory defaults' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🍳 Kitchen Inventory Management Server running at http://localhost:${PORT}`);
});
