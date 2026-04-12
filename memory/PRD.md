# Perfectly Good - Product Requirements Document

## Problem Statement
Build a full-stack mobile-first web app "Perfectly Good" — surplus food marketplace reducing food waste.

## Architecture
- **Frontend**: React 19 + Tailwind CSS + Shadcn UI + Phosphor Icons
- **Backend**: FastAPI + Motor (async MongoDB)
- **Database**: MongoDB
- **Payments**: Razorpay + 5% convenience fee
- **Auth**: Email/password JWT (httpOnly cookies)
- **Storage**: Emergent Object Storage

## What's Been Implemented (April 12, 2026)

### Phase 1 — MVP
- [x] Email/password JWT auth with brute force protection
- [x] Home feed with geolocation sorting, food cards with images
- [x] Drop detail page, Razorpay checkout, order history
- [x] Vendor creation, dashboard, drop CRUD, image upload
- [x] Bottom nav (context-aware), Profile page

### Phase 2 — Features
- [x] Search/filter: text search, category, max price, sort by
- [x] Order status management: vendor marks picked_up/cancelled
- [x] Password reset flow
- [x] Order expiry (background task, 4hr window)
- [x] 8 demo food drops across 4 vendors

### Phase 3 — Admin & Business Model
- [x] Admin panel (/admin) for vendor onboarding
- [x] Admin creates vendor accounts with login credentials
- [x] Admin uploads full menu (items + photos + original prices)
- [x] Vendors pick from pre-loaded menu to create drops
- [x] Vendors only set: discounted price, quantity, pickup window
- [x] 5% convenience fee on checkout (covers payment processing)
- [x] Admin role enforced on every startup

## Prioritized Backlog
### P1
- Push notifications for order status changes
- Map view for drop discovery
- User reviews & ratings

### P2
- Email integration for password reset (currently token-based)
- Share drops via WhatsApp
- Analytics dashboard for admin

## Next Tasks
1. Send email for password reset (currently returns token)
2. Map view for nearby drops
3. User ratings for vendors
