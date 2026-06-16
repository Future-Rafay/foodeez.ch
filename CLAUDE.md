# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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
