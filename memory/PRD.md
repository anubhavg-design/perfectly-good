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
2. **Vendor** — lists surplus food items ("drops"), manages inventory, views orders
3. **Admin** — seeded on startup, can access all features

## Core Requirements (Static)
- Email/password authentication (register, login, logout, JWT refresh)
- Home feed with geolocation-sorted food drops
- Drop detail page with pricing, pickup time, countdown, distance
- Razorpay checkout flow
- Order history for consumers
- Vendor dashboard: create/edit drops, toggle availability, view orders
- Image upload via object storage
- Brute force protection on login
- Mobile-first responsive design

## What's Been Implemented (April 12, 2026)
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

## Prioritized Backlog
### P0 (Critical)
- None remaining

### P1 (Important)
- Order cancellation by user
- Order status update by vendor (reserved → picked_up)
- Push notification for order status changes
- Search/filter on home feed (by category, price range)

### P2 (Nice to Have)
- Forgot password / password reset flow
- User reviews/ratings for vendors
- Favourite vendors list
- Admin panel for managing all vendors
- Real-time quantity updates via WebSockets
- Order expiry (auto-cancel if not picked up)

## Next Tasks
1. Add order status management (vendor can mark as picked up)
2. Add search/filter functionality on the home feed
3. Implement password reset flow
4. Add order expiry logic
5. Add category-based filtering
