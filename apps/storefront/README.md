Storefront v1
A modern, fast e-commerce storefront built with React, TypeScript, Vite, and Tailwind CSS.
Features

🛍️ Product Catalog: Grid view with search, filters, and sorting
📦 Product Details: Full product pages with related items
🛒 Shopping Cart: Persistent cart with localStorage
💳 Checkout: Simple checkout flow with order placement
📊 Order Status: Track orders through 6 stages
💬 Ask Support: AI-powered support assistant with ground-truth Q&A

Installation
bash# Install dependencies
pnpm install

# Or using npm
npm install

# Or using yarn
yarn install
Development
bash# Start development server
pnpm dev

# Or
npm run dev
The app will be available at http://localhost:5173
Build
bash# Build for production
pnpm build

# Or
npm run build
Test
bash# Run unit tests
pnpm test

# Or
npm test
Project Structure
/apps/storefront/
  /src/
    /components/
      /atoms/          # Basic UI elements (Button, Input, Badge)
      /molecules/      # Composite components (ProductCard, SearchBar)
      /organisms/      # Complex components (Header, CartDrawer, SupportPanel)
    /pages/            # Page components (catalog, product, cart, checkout, order-status)
    /lib/              # Utilities (API, router, store, format)
    /assistant/        # Support assistant (engine, ground-truth, prompt)
  /public/             # Static assets
Tech Stack

React 18: UI library
TypeScript: Type safety
Vite: Build tool and dev server
Tailwind CSS: Utility-first styling
Zustand: State management
Vitest: Unit testing

Features Breakdown
Catalog

Product grid with responsive layout
Client-side search by title/tags
Sort by price (asc/desc) or name
Filter by product tags
Lazy-loaded images

Product Details

Full product information
Stock indicator
Related products by shared tags
Add to cart functionality

Cart

Persistent storage with localStorage
Quantity controls (+/- buttons)
Remove items
Real-time total calculation
Free shipping over $100

Checkout

Order summary
Shipping information form
Payment method selection
Tax calculation (8%)

Order Status

Visual progress tracker
6 stages: Placed → Packed → Shipped → In Transit → Out for Delivery → Delivered
Carrier and ETA display for shipped orders

Ask Support

Keyword-based Q&A matching
Order status lookup by ID
PII masking (shows last 4 digits only)
Citation with [Qxx] format
Polite refusal for out-of-scope queries

Performance

Cold load: ~150KB JS (gzipped)
Lazy-loaded images
Route transitions: <250ms (dev build)

Accessibility

Keyboard navigation
Focus trapping
