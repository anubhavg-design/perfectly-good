# Perfectly Good - Product Requirements Document

## Problem Statement
Build a full-stack mobile-first web application called "Perfectly Good" — a surplus food marketplace where users can discover and reserve discounted food from nearby restaurants to reduce food waste.

## Architecture
- **Frontend**: React 19 + Tailwind CSS + Shadcn UI + Phosphor Icons
- **Backend**: FastAPI (Python) with Motor (async MongoDB driver)
- **Database**: MongoDB
- **Payments**: Razorpay (test mode)
- **Auth**: Email/password with JWT (access + refresh tokens, httpOnly cookies)
- **Storage**: Emergent Object Storage for food images
- **Design**: Mobile-first, Organic & Earthy theme (#2E7D32 primary, #FDFBF7 background)

## User Personas
1. **Consumer** — discovers nearby food drops, reserves items, pays via Razorpay
2. **Vendor** — lists surplus food items ("drops"), manages inventory & orders
3. **Admin** — seeded on startup, can access all features

## What's Been Implemented (April 12, 2026)

### Phase 1 (MVP)
- [x] Email/password JWT authentication (register, login, logout, refresh, /me)
- [x] Admin seeding on startup
- [x] Brute force protection
- [x] Home feed with geolocation-based sorting
- [x] Drop detail page
- [x] Razorpay checkout integration
- [x] Order creation and payment verification
- [x] Quantity reduction on order placement
- [x] Order history (user + vendor)
- [x] Vendor creation flow ("Become a Vendor" modal)
- [x] Vendor dashboard with CRUD on drops
- [x] Image upload via Emergent Object Storage
- [x] Toggle drop active/inactive
- [x] Countdown timer for pickup windows
- [x] Bottom navigation (context-aware for user/vendor roles)
- [x] Profile page with role display
- [x] Mobile-first UI with Outfit + DM Sans fonts, organic theme

### Phase 2 (Iteration 2)
- [x] Order status management — vendor marks orders as picked_up or cancelled
- [x] Cancelled orders restore quantity to food item
- [x] Search/filter on home feed — text search, category, max price, sort by price/discount/distance
- [x] Category chips filter UI
- [x] GET /api/drops/categories endpoint
- [x] Password reset flow — forgot-password + reset-password with token
- [x] Order expiry — background task auto-expires reserved orders after 4 hours, restores quantity
- [x] Expired order status shown in user order history
- [x] 8 dummy food drops seeded across 4 vendor categories (Bakery, Restaurant, Cafe, Grocery)
- [x] Demo vendor account (vendor@demo.com / vendor123)

## Prioritized Backlog
### P1 (Important)
- Push/email notifications for order status changes
- Real-time quantity updates via WebSockets
- User reviews/ratings for vendors
- Favourite vendors list

### P2 (Nice to Have)
- Admin panel for managing all vendors
- Order cancellation by user (before pickup)
- Map view for nearby drops
- Share drops on WhatsApp/social media

## Next Tasks
1. Push notifications for order status changes
2. Map view for drop discovery
3. User reviews and ratings
4. Share drops via social media
