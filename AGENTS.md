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

## Stripe Payment Notes

- Manual SQL for Stripe order fields lives at `docs/sql/add_stripe_order_payment_fields.sql`; run it in MySQL Workbench, then run `npx prisma db pull` and `npx prisma generate` from `frontend`. Do not use `prisma migrate` for this change.
- Stripe checkout is created in `frontend/src/app/api/checkout/route.ts`; card orders are inserted once with `PAYMENT_MODE = "stripe"` and `PAYMENT_DONE = 0`, then updated with `STRIPE_CHECKOUT_SESSION_ID` and any available `STRIPE_PAYMENT_INTENT_ID`.
- Stripe webhook handling lives at `frontend/src/app/api/stripe/webhook/route.ts` and verifies signatures with `STRIPE_WEBHOOK_SECRET`; it handles `checkout.session.completed`, `payment_intent.succeeded`, and `payment_intent.payment_failed` without creating duplicate orders.
- Payment state uses `PAYMENT_DONE`: `0` pending/unpaid, `1` paid, `2` refunded, `3` failed. Refund display fields are `ORDER_REFUND_AMOUNT`, `STRIPE_REFUND_STATUS`, and `STRIPE_REFUNDED_DATETIME`.

## Customer Notification Notes

- Customer-facing notifications belong in this `foodeez.ch` frontend repo, not `admin.foodeez.ch`.
- The navbar notification bell is `frontend/src/components/layout/CustomerNotifications.tsx` and is mounted by `frontend/src/components/layout/Navbar.tsx`.
- Notifications are derived from the signed-in visitor's `/api/orders/history` response and use localStorage only for per-customer read state; admin/business notifications remain separate.
- Keep notification labels based on shared order helpers in `frontend/src/lib/order.ts` so delivery, pickup, payment, and refund wording stays aligned with My Orders.
