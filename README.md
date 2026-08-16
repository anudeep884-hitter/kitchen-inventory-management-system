# 🍳 Kitchen Inventory Management System

A full-featured, professional web-based **Kitchen Inventory Management System** built with **HTML, Vanilla CSS, JavaScript, Node.js, Express.js**, and persistent database storage. Designed for restaurant kitchens, culinary academies, hotels, and pantry facilities to streamline inventory tracking, reduce food waste, automate stock replenishment, and provide tailored role-based dashboards for **Admins**, **Chefs**, and **Delivery Partners**.

---

## 📌 Problem Statement

Commercial kitchens face recurring challenges:
1. **Food Spoilage & Expiry Waste**: Ingredients expire unnoticed in cold rooms, leading to direct financial loss.
2. **Stockout Disruptions**: Running out of critical prep items during peak dining hours disrupts service.
3. **Lack of Audit Accountability**: Manual adjustments make it difficult to trace who consumed or added stock and why.
4. **Disjointed Supplier & Delivery Management**: Inbound shipments are not verified against active inventory levels in real-time.

This system provides a unified digital operational platform to solve these problems with real-time stock valuation, automated low-stock warnings, expiry radar, recipe usage logging, supplier tracking, and smart reordering algorithms.

---

## ✨ Key Features

### 1. 🔐 Secure Authentication & Role Redirection
- **Multi-Role Access Control**: Dedicated roles for **Admin**, **Chef**, and **Delivery Partner**.
- **JWT & Password Security**: Bcrypt-encrypted password hashing with JWT bearer authentication.
- **Login UX**: Show/hide password toggle, remember-me persistence, forgot-password modal, and 1-click demo login chips.

### 2. 👨‍💼 Admin Dashboard
- **7 Live Operational Metric Cards**:
  1. *Total Inventory Items*
  2. *Available Stock*
  3. *Low Stock* (with threshold warnings)
  4. *Expired Items* (with urgent disposal badges)
  5. *Expiring Soon* (within 3 days)
  6. *Today's Usage* (aggregate culinary consumption)
  7. *Total Inventory Valuation* (`Quantity × Purchase Price` in ₹)
- **7-Day Consumption Trends Chart**: Dynamic daily usage volume visualization.
- **Top-Valued Pantry Items**: High-capital investment breakdown.
- **Real-Time Audit Feed & Alerts**: Recent stock movements and critical notifications.
- **Quick Action Modals**: One-click shortcuts to Add Inventory, Add Stock, Use Stock, and Register Suppliers.

### 3. 📦 Advanced Inventory Management
- **13 Standard Item Data Fields**: Name, Category, Current Quantity, Unit, Minimum Stock Level, Maximum Stock Level, Purchase Price, Expiry Date, Purchase Date, Supplier, Storage Location, Batch Number, and Live Status.
- **Stock Status Automation**:
  - `AVAILABLE`: Safe stock above minimum threshold.
  - `LOW_STOCK`: Quantity at or below safety minimum.
  - `EXPIRING_SOON`: Shelf life expiring within 2–3 days.
  - `EXPIRED`: Shelf life exceeded.
- **Dedicated Stock Operations**:
  - `➕ Add Stock`: Increment quantity with batch number and expiry date.
  - `📤 Use Stock`: Deduct quantity with recipe/prep reason (prevents negative stock).
  - `↻ Restock`: Quick replenishment to safety level.
  - `⚠️ Mark Damaged`: Log spoilage or transit damage for loss auditing.
- **Multi-Factor Search & Filtering**: Filter by category, status, storage location, supplier; sort by name, quantity, expiry date, or valuation.
- **📱 QR & Barcode Generator**: Every inventory item includes a printable barcode/QR modal with SKU, batch, location, and quick operational details.

### 4. 👨‍🍳 Chef Culinary Station
- **Ingredient Catalog**: Rapid search of fresh pantry and cold storage ingredients.
- **⏰ Expiry Radar**: Prioritizes ingredients expiring in the next 48–72 hours so chefs can feature them in daily specials and prevent food waste.
- **Quick Consumption Logger**: One-click modal to deduct ingredients with culinary prep reasons (*Lunch Buffet, Sauce Base, Dinner Special, Baking Batch*).
- **Personal Prep History**: Real-time log of ingredient usages recorded by the chef.

### 5. 🚚 Delivery & Inbound Logistics Station
- **Shipment Tracker**: In-transit and pending inbound supplier deliveries.
- **Receive & Intake Workflow**: Verifies delivered quantities and automatically updates inventory stock upon confirmation.
- **Supplier Contact Lookup**: Direct access to supplier phone, email, and facility address.

### 6. 🏭 Supplier Management
- Manage vendor directory: Supplier Name, Contact Person, Phone, Email, Address, Products Supplied, and Last Purchase Date.
- Full CRUD operations with linked inventory items.

### 7. 👥 User Management (Admin Only)
- Manage kitchen staff accounts: Name, Email, Role, Phone, Location, and Status (*Active / Disabled*).
- Enforces strict backend authorization and privilege separation.

### 8. 📜 Inventory Audit Trail & Activity Log
- Granular transaction log tracking: `Item`, `User`, `Operation`, `Quantity`, `Previous Qty`, `New Qty`, `Timestamp`, and `Reason`.
- Filterable by operation type, date range, and keyword.
- One-click CSV export.

### 9. 🔔 Notification Center
- Categorized alerts: 🔴 Expired, 🟠 Expiring Soon, 🟡 Low Stock, 🟢 Stock Inbound.
- Filter pills, read/unread states, mark-all-read, and clear actions.

### 10. 📈 Smart Forecast & Replenishment
- **Rule-Based Reorder Suggestions**: Computes optimal purchase order quantities (`targetMax - currentQty`) with estimated replenishment costs.
- **Fast-Moving Ingredient Velocity**: Analyzes historical usage volume to identify top consumable items.
- **Waste Prevention Recommendations**: Actionable tips to utilize ingredients before expiration.
- **1-Click Quick Restock**: Instant replenishment from the reorder queue.

### 11. 📊 Reports & Analytics Hub
- **5 Comprehensive Reports**:
  1. *Master Inventory Valuation Report*
  2. *Stock Movement & Transaction Audit Report*
  3. *Expiry & Waste Risk Report*
  4. *Kitchen Ingredient Consumption Report*
  5. *Supplier Purchase Order Report*
- Instant **CSV Export** and **Print-Ready Views**.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | HTML5, Vanilla JavaScript (ES Modules), Vanilla CSS (Custom Design System with Glassmorphism) |
| **Backend** | Node.js, Express.js (RESTful API architecture) |
| **Authentication** | JSON Web Tokens (`jsonwebtoken`), Password Hashing (`bcryptjs`) |
| **Database** | Persistent JSON Database Engine (`backend/db.js`) with atomic file locking and factory re-seeding |
| **Assets** | 100+ Custom Kitchen Item SVG Vector Graphics |
| **Styling Palette** | Sky Blue (`#0ea5e9`), Royal Blue (`#2563eb`), Slate Muted (`#64748b`), Soft Light Blue-Gray (`#f3f6fb`) |

---

## 📁 Project Structure

```
kitchen-inventory-management-system/
├── assets/                    # 100+ SVG icons for ingredients and items
├── backend/
│   └── db.js                  # Database engine, data models, status computation & seed data
├── data/
│   └── db.json                # Persistent JSON storage (created automatically)
├── index.html                 # Login page & role redirection
├── dashboard.html             # Admin Executive Dashboard
├── inventory.html             # Inventory Management & Stock Operations
├── chef.html                  # Chef Station Dashboard & Expiry Radar
├── delivery.html              # Delivery Partner Logistics & Inbound Intake
├── suppliers.html             # Supplier Management Directory
├── users.html                 # Staff & User Access Control (Admin only)
├── history.html               # Inventory Activity & Audit Trail
├── notifications.html         # Categorized Notification Center
├── forecast.html              # Smart Reorder & Demand Forecast
├── reports.html               # Reports & Analytics Hub (CSV & Print)
├── usage.html                 # Kitchen Usage Logs
├── profile.html               # User Profile & Station Details
├── settings.html              # Password & System Settings
├── shared.js                  # Client REST API client, role guards, UI shell & modals
├── styles.css                 # Master CSS design system (preserved palette & themes)
├── server.js                  # Express.js REST API Server
├── package.json               # Node.js dependencies & scripts
└── README.md                  # System documentation
```

---

## 🚀 Installation & Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) (version 18 or higher)
- npm (Node Package Manager)

### Step 1: Clone the Repository
```bash
git clone https://github.com/anudeep884-hitter/kitchen-inventory-management-system.git
cd kitchen-inventory-management-system
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Start the Application
```bash
npm start
```
The server will start on: **`http://localhost:5000`**

To run in auto-reload development mode:
```bash
npm run dev
```

---

## 🔑 Demo User Credentials

| Role | Email | Password | Dashboard URL |
|---|---|---|---|
| **👨‍💼 Admin** | `admin@example.com` | `admin123` | `http://localhost:5000/dashboard.html` |
| **👨‍🍳 Chef** | `chef@example.com` | `chef123` | `http://localhost:5000/chef.html` |
| **🚚 Delivery Partner** | `delivery@example.com` | `delivery123` | `http://localhost:5000/delivery.html` |

*Note: You can also click the quick demo chips on the login page to sign in instantly.*

---

## 📡 REST API Reference

### Authentication
- `POST /api/auth/login` — Authenticate user and receive JWT token.
- `GET /api/auth/me` — Retrieve current authenticated profile.
- `POST /api/auth/forgot-password` — Request password reset link.
- `PUT /api/auth/profile` — Update staff profile details.
- `PUT /api/auth/change-password` — Update password with bcrypt encryption.

### Inventory & Stock Operations
- `GET /api/inventory` — List inventory with search, category, status, expiry, and sort filters.
- `GET /api/inventory/:id` — Get single inventory item details.
- `POST /api/inventory` — Create new inventory item *(Admin / Delivery)*.
- `PUT /api/inventory/:id` — Edit inventory item *(Admin only)*.
- `DELETE /api/inventory/:id` — Delete inventory item *(Admin only)*.
- `POST /api/stock/operation` — Execute `ADD_STOCK`, `USE_STOCK`, `RESTOCK`, or `MARK_DAMAGED` operations.

### Suppliers & Deliveries
- `GET /api/suppliers` & `POST /api/suppliers` — Supplier directory CRUD.
- `GET /api/deliveries` & `POST /api/deliveries` — Shipment tracking.
- `PUT /api/deliveries/:id` — Update status and auto-intake items into stock.

### Users & Audit Logs
- `GET /api/users`, `POST /api/users`, `PUT /api/users/:id` — User administration *(Admin only)*.
- `GET /api/transactions` — Audit trail of all stock operations.
- `GET /api/notifications` — Notification alerts and badge counts.

### Analytics, Forecast & Reports
- `GET /api/analytics/overview` — Executive KPIs, valuation, and 7-day consumption trends.
- `GET /api/recommendations` — Algorithmic reorder recommendations and velocity rankings.
- `GET /api/reports/:type` — Generate `inventory`, `movement`, `expiry`, `purchase`, or `consumption` reports.

---

## 🛡️ Security & Reliability
- **Role-Based Backend Guards**: Middleware enforces permissions at the API route level.
- **Negative Stock Prevention**: Prevents stock deductions greater than available inventory.
- **Deduplicated Alerts**: Prevents notification flooding for unchanged conditions.
- **Safe Password Storage**: Bcrypt hashing with salt rounds.

---

## 📄 License
This project is licensed under the MIT License.
