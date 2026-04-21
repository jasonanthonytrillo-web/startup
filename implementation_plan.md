# MK FOOD CORNER — Online Kiosk System

A full-stack food ordering kiosk with a Laravel API backend and React + Vite frontend, featuring real-time queue updates, cart management, checkout, and an admin panel.

## User Review Required

> [!IMPORTANT]
> **PHP Version Constraint:** Your system has **PHP 7.4.15** (XAMPP). Laravel 9+ requires PHP 8.0+, and Laravel 10+ requires PHP 8.1+. We will use **Laravel 8** which is the latest version supporting PHP 7.4. All features in your spec are fully achievable with Laravel 8.

> [!IMPORTANT]
> **Real-Time Updates (WebSockets):** Setting up Pusher/Laravel Echo requires a Pusher account or a self-hosted solution (like `laravel-websockets` package). For this initial build, I'll implement **polling-based real-time updates** (the queue page auto-refreshes every 5 seconds). This works perfectly for a kiosk system and avoids external service dependencies. WebSockets can be added later as an enhancement.

> [!WARNING]
> **Database:** Your system has **MariaDB 10.4.17** via XAMPP. I'll use this instead of MySQL — they are fully compatible. Make sure XAMPP's Apache and MySQL services are **running** before we start.

---

## Proposed Changes

### 1. Backend — Laravel 8 API (`backend/`)

#### [NEW] Laravel 8 project via Composer

Create a Laravel 8 project in `c:\Users\Student\Documents\HB\backend\` using:
```
composer create-project laravel/laravel:^8.0 backend
```

Configure `.env` for MariaDB connection (database: `mk_food_corner`).

---

#### [NEW] `app/Models/Product.php`
- Fields: `id`, `name`, `description`, `price`, `image`, `category`
- Relationships: `hasMany(OrderItem)`

#### [NEW] `app/Models/Order.php`
- Fields: `id`, `order_number`, `customer_name`, `status`, `payment_method`, `queue_position`, `created_at`
- Status enum: `preparing`, `serving`, `completed`
- Relationships: `hasMany(OrderItem)`
- Auto-generate unique order numbers like `MK-0001`

#### [NEW] `app/Models/OrderItem.php`
- Fields: `id`, `order_id`, `product_id`, `quantity`, `price`
- Relationships: `belongsTo(Order)`, `belongsTo(Product)`

---

#### [NEW] Database Migrations
- `create_products_table` — includes `category` column for menu grouping
- `create_orders_table` — includes `order_number`, `status`, `payment_method`, `customer_name`, `queue_position`
- `create_order_items_table` — pivot with quantity and price snapshot

#### [NEW] Database Seeder (`ProductSeeder.php`)
Seed 12+ fast food items across categories:
- 🍔 Burgers (4 items)
- 🍟 Sides (3 items)
- 🥤 Drinks (3 items)
- 🍰 Desserts (2 items)

Each product will have a placeholder image URL (generated or from a free food image API).

---

#### [NEW] `app/Http/Controllers/ProductController.php`
| Endpoint | Method | Description |
|---|---|---|
| `/api/products` | GET | List all products (grouped by category) |

#### [NEW] `app/Http/Controllers/OrderController.php`
| Endpoint | Method | Description |
|---|---|---|
| `/api/orders` | POST | Create new order (with items, payment method, customer name) |
| `/api/orders/{order_number}` | GET | Get single order by order number |
| `/api/queue` | GET | Get active queue (preparing + serving orders) |

#### [NEW] `app/Http/Controllers/AdminController.php`
| Endpoint | Method | Description |
|---|---|---|
| `/api/admin/orders` | GET | List all orders (with optional status filter) |
| `/api/admin/orders/{id}/status` | PUT | Update order status |

#### [MODIFY] `routes/api.php`
Register all API routes listed above.

#### [MODIFY] `app/Http/Middleware/Cors.php` (or config)
Enable CORS for the React frontend (localhost:5173).

---

### 2. Frontend — React + Vite (`frontend/`)

#### [NEW] React + Vite project

Create via: `npm create vite@latest frontend -- --template react`

Install dependencies: `react-router-dom`, `axios`

---

#### [NEW] `src/context/CartContext.jsx`
- React Context for global cart state
- Actions: `addToCart`, `removeFromCart`, `updateQuantity`, `clearCart`
- Persisted to `localStorage`

#### [NEW] `src/services/api.js`
- Axios instance configured with base URL (`http://localhost:8000/api`)
- Functions: `getProducts()`, `createOrder()`, `getOrder()`, `getQueue()`, `getAdminOrders()`, `updateOrderStatus()`

---

#### [NEW] Pages

| Page | File | Description |
|---|---|---|
| Landing | `src/pages/Landing.jsx` | Hero with "START YOUR ORDER" button, restaurant branding |
| Menu | `src/pages/Menu.jsx` | Categorized product grid, add-to-cart, quantity selectors |
| Cart | `src/pages/Cart.jsx` | Cart items list, quantity update, remove, total, proceed to checkout |
| Checkout | `src/pages/Checkout.jsx` | Customer name input, payment method selection (Cash/Maya/GCash), confirm |
| Order Confirmation | `src/pages/OrderConfirmation.jsx` | Order number, status, queue position, "Order Again" button |
| Queue | `src/pages/Queue.jsx` | Real-time queue display (polling every 5s), preparing/serving lists |
| Admin | `src/pages/Admin.jsx` | Order management dashboard with status filters and action buttons |

#### [NEW] Reusable Components

| Component | File | Description |
|---|---|---|
| Button | `src/components/Button.jsx` | Styled button with variants (primary, secondary, danger) |
| ProductCard | `src/components/ProductCard.jsx` | Food item card with image, name, price, add-to-cart |
| CartItem | `src/components/CartItem.jsx` | Cart row with quantity controls and remove |
| Navbar | `src/components/Navbar.jsx` | Navigation bar with cart icon + item count badge |
| QueueCard | `src/components/QueueCard.jsx` | Order card for queue display |
| OrderCard | `src/components/OrderCard.jsx` | Admin order card with status actions |

#### [NEW] `src/App.jsx`
- React Router setup with all page routes
- CartContext provider wrapping the app

#### [NEW] `src/main.jsx`
- App entry point with router

---

#### [NEW] Styling — `src/index.css` + page-specific CSS modules

**Design System:**
- **Color Palette:** Deep charcoal (#1a1a2e) background, vibrant orange (#ff6b35) primary, warm gold (#ffc947) accent, clean white text
- **Typography:** Google Fonts — `Outfit` for headings, `Inter` for body
- **Cards:** Glassmorphism with `backdrop-filter: blur()`, subtle borders
- **Animations:** Smooth fade-ins, slide-ups, hover scale transforms, cart bounce
- **Layout:** CSS Grid for product cards, Flexbox for everything else
- **Responsive:** Mobile-first, works on kiosk screens (1080p) and tablets

---

### 3. Product Images

I will use the `generate_image` tool to create appealing food item images for the menu, or use high-quality placeholder URLs.

---

## Architecture Diagram

```
┌─────────────────┐         ┌──────────────────┐
│   React + Vite  │  HTTP   │   Laravel 8 API  │
│   (port 5173)   │ ◄─────► │   (port 8000)    │
│                 │  JSON   │                  │
│  - Landing      │         │  - /api/products │
│  - Menu         │         │  - /api/orders   │
│  - Cart         │         │  - /api/queue    │
│  - Checkout     │         │  - /api/admin/*  │
│  - Queue        │         │                  │
│  - Admin        │         └────────┬─────────┘
└─────────────────┘                  │
                                     │
                              ┌──────▼─────────┐
                              │  MariaDB 10.4  │
                              │  (XAMPP)       │
                              │                │
                              │  - products    │
                              │  - orders      │
                              │  - order_items │
                              └────────────────┘
```

---

## Open Questions

> [!IMPORTANT]
> 1. **Should the admin panel require authentication (login)?** For simplicity, I'll make it publicly accessible at `/admin` — but I can add basic auth if you want.
> 2. **Product images:** Should I generate custom food images using AI, or use placeholder image URLs? (AI-generated will look better but takes longer.)
> 3. **XAMPP services:** Please confirm Apache and MySQL are running in the XAMPP Control Panel before I proceed.

---

## Verification Plan

### Automated Tests
1. Run `php artisan migrate` to verify database schema
2. Run `php artisan db:seed` to verify seeder
3. Test all API endpoints via browser/curl
4. Run `npm run dev` for frontend and verify all pages render

### Manual Verification
1. Open the app in the browser and complete a full order flow: Landing → Menu → Cart → Checkout → Order Confirmation → Queue
2. Open Admin panel and update order statuses
3. Verify queue updates reflect status changes
4. Test responsive layout at different screen sizes
