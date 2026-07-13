# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## 🚀 Common Development Tasks

Here are some commonly used commands for developing in this codebase:

-   **Start development server:**
    ```bash
    npm run dev
    # or
    yarn dev
    ```
    This will start the Next.js development server and open the application at `http://localhost:3000`.

-   **Build for production:**
    ```bash
    npm run build
    # or
    yarn build
    ```
    This command builds the application for production, including Prisma client generation.

-   **Start production server:**
    ```bash
    npm run start
    # or
    yarn start
    ```
    This starts the Next.js application in production mode.

-   **Run ESLint:**
    ```bash
    npm run lint
    # or
    yarn lint
    ```
    This command runs ESLint to check for code style and quality issues.

-   **Generate Prisma Client:**
    ```bash
    npx prisma generate
    ```
    This command is automatically run during `postinstall` and `build`, but can be run manually if needed to regenerate the Prisma client after schema changes.

## 🏛️ High-Level Code Architecture

The project is a Next.js 14 application with a clear separation of concerns.

-   **`src/app/`**: This directory contains the Next.js App Router structure, including pages, layouts, and API routes.
-   **`src/components/`**: This directory is further organized into:
    -   `core/`: Contains fundamental, reusable UI components that are application-agnostic.
    -   `home/`: Houses components specific to the home page.
    -   `layout/`: Defines the overall structure and navigation of the application.
    -   `ui/`: Contains re-usable UI components built with Radix UI and styled with Tailwind CSS (e.g., buttons, dialogs, forms).
-   **`src/features/`**: This directory is intended for feature-specific code, encapsulating logic and components related to a particular feature, promoting modularity.
-   **`src/lib/`**: This directory contains utility functions and helper modules used across the application (e.g., date formatting with `date-fns`, utility functions from `lodash`).
-   **`src/services/`**: This directory is dedicated to API services, handling data fetching and interactions with external APIs (e.g., Google Maps API).
-   **`src/shared/`**: This directory holds shared resources like constants, configuration files, and hooks that might be used across different parts of the application.
-   **`src/types/`**: This directory defines TypeScript types and interfaces for the application.

### Key Technologies and Patterns:

-   **Next.js 14**: The application leverages the App Router for routing, data fetching, and server components.
-   **Tailwind CSS & Radix UI**: Styling is managed with Tailwind CSS for utility-first styling, complemented by Radix UI for accessible and unstyled UI primitives.
-   **Prisma**: Used as the ORM for database interactions. Prisma client generation is integrated into the build process.
-   **AWS S3**: Utilized for media storage (images, videos) via a custom S3Storage service and internal API routes.
-   **NextAuth.js**: Handles secure authentication.
-   **Google Maps API**: Integrated for location-based features.
-   **Zustand**: Used for state management where global state is required.
-   **Framer Motion**: Utilized for animations and interactive UI elements.

## Frontend Modal and Dialog Rules

- Every new frontend modal, dialog box, confirmation, or popup must render through `frontend/src/components/core/ModalPortal.tsx`. Do not introduce a separate portal implementation or render modal overlays inside page/card layout containers.
- Follow the existing `ProductDetailsModal` and `MenuProductCard` patterns: use a fixed full-screen `z-50` overlay, responsive horizontal padding, a bounded responsive panel, and internal scrolling when content can exceed the viewport.
- New modals must include `role="dialog"`, `aria-modal="true"`, labelled title/description IDs, an accessible close button, Escape-key closing, and overlay-click closing unless dismissing would risk losing user data.
- Keep modal styling consistent with existing Foodeez forms and cards. Reuse current buttons, spacing, border radius, colors, and typography instead of creating a new visual pattern.
- Keep return, reject, delete, clear-cart, and other dangerous actions away from the routine primary action so users cannot trigger them accidentally. The safe/cancel action should remain visually prominent and easy to reach.

## Customer Menu Notes

- The customer menu route is `frontend/src/app/business/[slug]/menu/page.tsx`.
- Menu data is loaded through `frontend/src/services/MenuPageService.ts`; keep active-menu filtering there instead of duplicating schedule checks in components.
- Customer menu cards are active only when `business_food_menu_card.STATUS = 1`, `VALID_FROM` is today or earlier, non-unlimited menus are not past `VALID_TO`, and weekly menus include today's lowercase weekday in `ACTIVE_DAYS_JSON`. Multiple active menus are valid and render as tabs.
- If no active menu cards exist, the customer menu should show: `No menu is available right now.`
- Customer product cards use `business_product.PIC`, `TITLE`, `DESCRIPTION`, `PRODUCT_PRICE`, `COMPARE_AS_PRICE`, `TRACK_INVENTORY`, `INVENTORY_AVAILABLE`, `WEIGHT`, and `WEIGHT_UNIT`. Never expose `COST_PRICE` on the customer frontend.
- Show prices with CHF formatting. Show compare-at pricing only when `COMPARE_AS_PRICE > PRODUCT_PRICE`; show weight only when `WEIGHT > 0`.
- For tracked inventory, show `Out of stock` and disable Add to cart when `INVENTORY_AVAILABLE = 0`; otherwise show the available quantity. Do not show a stock badge for untracked products.
- Cart quantity changes and add-to-cart are guarded in `frontend/src/stores/cartStore.ts`; backend stock validation and reservation live in `frontend/src/lib/inventory.ts` and are called by both `/api/checkout` and `/api/order/verify`.
- Tracked inventory checkout must reserve stock inside the same transaction that creates the order/details: decrement `business_product.INVENTORY_AVAILABLE` and increment `INVENTORY_COMMITED` only when `INVENTORY_AVAILABLE >= quantity`; otherwise return `Only X left in stock for PRODUCT_TITLE.` Untracked products do not apply stock limits.
- Cart and checkout surfaces should show item-level stock warnings from stored cart availability and disable checkout until the quantity is reduced; backend validation remains the source of truth because stock can change after add-to-cart.
- The mixed-restaurant `Start a new order?` confirmation in `frontend/src/components/menu/MenuProductCard.tsx` uses `frontend/src/components/core/ModalPortal.tsx`; keep the safe `Keep current cart` action prominent and the cart-clearing action visually separate.

## Stripe Payment Notes

- Manual SQL for Stripe order fields lives at `docs/sql/add_stripe_order_payment_fields.sql`; run it in MySQL Workbench, then run `npx prisma db pull` and `npx prisma generate` from `frontend`. Do not use `prisma migrate` for this change.
- Stripe checkout is created in `frontend/src/app/api/checkout/route.ts`; card orders are inserted once with `PAYMENT_MODE = "stripe"` and `PAYMENT_DONE = 0`, then updated with `STRIPE_CHECKOUT_SESSION_ID` and any available `STRIPE_PAYMENT_INTENT_ID`.
- Stripe webhook handling lives at `frontend/src/app/api/stripe/webhook/route.ts` and verifies signatures with `STRIPE_WEBHOOK_SECRET`; it handles `checkout.session.completed`, `payment_intent.succeeded`, and `payment_intent.payment_failed` without creating duplicate orders.
- Payment state uses `PAYMENT_DONE`: `0` pending/unpaid, `1` paid, `2` refunded, `3` failed. Refund display fields are `ORDER_REFUND_AMOUNT`, `STRIPE_REFUND_STATUS`, and `STRIPE_REFUNDED_DATETIME`.

## Customer Notification Notes

- Customer-facing notifications belong in this `foodeez.ch` frontend repo, not `admin.foodeez.ch`.
- The navbar notification bell is `frontend/src/components/layout/CustomerNotifications.tsx` and is mounted by `frontend/src/components/layout/Navbar.tsx`.
- Customer notifications use `customer_order_notification`, keyed by `VISITORS_ACCOUNT_ID` and `BUSINESS_ORDER_ID`; multiple immutable rows per order form the customer tracking timeline. `/api/orders/history` synchronizes customer-visible order changes and returns the timeline, while `/api/customer-notifications` persists visitor-scoped read state. Admin/business notifications remain separate.
- Keep notification labels based on shared order helpers in `frontend/src/lib/order.ts` so delivery, pickup, payment, and refund wording stays aligned with My Orders.

## Customer Order Display and Cart Notes

- Customer-facing order numbers must use `getDisplayOrderNumber(order)` from `frontend/src/lib/order.ts`: prefer `ORDER_NUMBER` such as `FDZ.000001`, and only fall back to formatted `BUSINESS_ORDER_ID`.
- Customer checkout order creation in `frontend/src/app/api/checkout/route.ts` must populate `business_order.ORDER_NUMBER` with `generateOrderNumberFromId(orderId)` so new web orders display the DB order number column.
- Customer ETA displays must use `getDisplayEta(order)` / `formatEtaTimeOnly()` from `frontend/src/lib/order.ts`, use 24-hour time, and round upward to the next quarter-hour, for example `04:23` becomes `04:30` and `05:49` becomes `06:00`; when `DELIVERY_ET` is missing, compute from `CREATION_DATETIME` plus the business default prep minutes before rounding.
- The customer cart store is `frontend/src/stores/cartStore.ts`; it persists `business` metadata and cart items with `businessId`, `businessSlug`, and `businessName`.
- Adding a product from a different restaurant returns a mixed-business result from `addToCart`; the menu card shows the `Start a new order?` confirmation before clearing the cart.
- `/api/checkout` validates product ownership from the database before order creation and rejects mixed-business payloads with `You can only order from one restaurant at a time.`
- Checkout passes delivery-zone data through `CheckoutSummaryState`; the free-delivery reminder stays above the Order Summary, remains sticky with it on large screens, and must stay hidden until the entered ZIP resolves to a zone. Show only the matched zone, its free-delivery threshold, the remaining amount, and a link back to the current restaurant menu.
- My Orders lives at `frontend/src/app/(dashboard)/dashboard/orders/page.tsx`; it defaults to the `Active` filter, highlights the newest active order at the top, still shows active orders in the spreadsheet-style filtered table below, keeps the filtered content area at a stable minimum height to prevent tab-switch jumps, includes `View details` as the final table column, silently refreshes `/api/orders/history` every 30 seconds while the page is open, and sends `Explore Restaurants` to `/business`.
- The customer notification bell polls the authenticated history response every 30 seconds and renders durable customer notification rows, including multiple events for one order. Pending fields are stored locally only for six-second My Orders highlights when the page is visible; read/unread state stays in the customer notification table.

## Business Profile Notes

- The owner business-profile map is `frontend/src/app/(business-owner)/manage-business/[slug]/components/MapSectionBusinesProfile.tsx`; missing API keys, place IDs, Places errors, and initialization errors must render an in-card fallback instead of leaving a broken map surface.
- Foodeez reviews are currently hidden on `frontend/src/app/(business-owner)/manage-business/[slug]/page.tsx`; do not re-enable them without confirming the intended owner-profile review experience.
- Shared business-profile presentation components live in `frontend/src/components/BusinessSlug/`; both `/business/[slug]` and `/manage-business/[slug]` should reuse them instead of maintaining duplicate copies.
- The manage-business claim card is mounted between Google reviews and the map through its local `BusinessDeferredSections`. Its dialog lives in `ClaimBusinessSection.tsx`, submits the official email and business identity to `/api/claim-business`, and sends the request to `ADMIN_EMAIL` through the existing email service.

## Homepage Performance, Accessibility, and Security Notes

- The homepage route is `frontend/src/app/page.tsx`. Keep `AdsBar1`, `HeroSection`, and `Separator` eager because they are above the fold; keep lower homepage sections behind `next/dynamic({ ssr: false })` plus the local `LazyRender` viewport gate so heavy sections do not load on first paint.
- `GoogleMapsProvider` and `frontend/src/components/home/MapSection.tsx` should only render inside the homepage `LazyMapSection`, which uses `IntersectionObserver` and a `300px` root margin. Do not move Google Maps script loading back into the initial homepage render.
- Hero carousel controls in `frontend/src/components/home/HeroSection.tsx` need accessible names. Dot buttons should keep at least a 24x24 touch target while preserving the small visible dot.
- Homepage card/list images should keep explicit `sizes` values. Current shared sizing fixes live in `HeroSection`, `BusinessCard`, `RecentBlogs`, `Banner`, `AdsBar1`, `AdsBar2`, `ScrollingBusinessBar`, testimonial review cards, and food journey cards.
- `frontend/next.config.mjs` owns image formats, remote image hosts, production browser source maps, and security headers. The CSP must allow the app's current third-party needs: Google Maps, Stripe, Google fonts, WordPress/blog images, S3/media, and other configured image CDNs.
- `frontend/package.json` includes the modern `browserslist` baseline used to avoid unnecessary legacy JavaScript transforms. Keep it aligned with the browsers the product actually supports.
- Do not change global brand colors to satisfy contrast audits without explicit product approval. Prefer local accessibility treatments that preserve the Foodeez brand palette.
