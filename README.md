# SimexMafia - Digital Gaming Marketplace

A modern, beautiful digital marketplace for gaming products, themed around the German Fortnite YouTuber Simex. Built with Next.js 14, TypeScript, and Tailwind CSS.

## Features

- 🎮 **Product Listings**: Browse games, gift cards, subscriptions, DLC, and in-game currency
- 🔍 **Advanced Filtering**: Filter by category, platform, and price range
- 🛒 **Shopping Cart**: Add products to cart and manage quantities
- 👤 **Seller System**: View seller ratings and verified status
- 💳 **Secure Checkout**: Beautiful checkout interface
- 📱 **Responsive Design**: Works perfectly on all devices
- 🎨 **Modern UI**: Fortnite-inspired purple and gold theme

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
simexmafia-website/
├── app/                    # Next.js app directory
│   ├── page.tsx           # Homepage
│   ├── products/          # Product pages
│   ├── cart/              # Shopping cart
│   └── categories/        # Category pages
├── components/            # React components
│   ├── Navbar.tsx         # Navigation bar
│   ├── Footer.tsx         # Footer
│   └── ProductCard.tsx    # Product card component
├── data/                  # Mock data
│   └── products.ts        # Product data
└── types/                 # TypeScript types
    └── index.ts           # Type definitions
```

## Pages

- **Home** (`/`): Featured products and categories
- **Products** (`/products`): All products with filters
- **Product Detail** (`/products/[id]`): Individual product page
- **Cart** (`/cart`): Shopping cart
- **Categories** (`/categories`): Browse by category

## Features Overview

### Marketplace Model
- Third-party sellers with ratings and reviews
- Verified seller badges
- Product reviews and ratings

### Product Categories
- Video Games (Steam, PlayStation, Xbox, etc.)
- Gift Cards
- Subscriptions (Game Pass, PlayStation Plus)
- DLC & Expansions
- In-Game Currency (V-Bucks, FIFA Points)
- Top-Ups

### Security Features
- Secure checkout interface
- Seller verification system
- Refund policy notices

## Development

Build for production:
```bash
npm run build
```

Start production server:
```bash
npm start
```

## License

This project is created for demonstration purposes.








