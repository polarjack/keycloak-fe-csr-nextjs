# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 15 application bootstrapped with `create-next-app`, using the App Router architecture. The project is an MPC (Multi-Party Computation) MVP frontend with Client-Side Rendering (CSR).

**Tech Stack:**
- Next.js 15.5.9 with Turbopack
- React 19.1.0
- TypeScript 5
- Tailwind CSS 4 (using the new `@tailwindcss/postcss` plugin)
- pnpm workspace
- Keycloak.js 26.2.2 for authentication

## Commands

### Development
```bash
pnpm dev          # Start development server with Turbopack (http://localhost:3000)
pnpm build        # Build for production with Turbopack
pnpm start        # Start production server
pnpm lint         # Run ESLint
```

Note: This project uses **pnpm** as the package manager, not npm or yarn.

### Turbopack
All build and dev commands use `--turbopack` flag by default. Turbopack is Next.js's Rust-based bundler for faster builds and hot reloading.

## Architecture

### Project Structure
```
src/
  app/               # Next.js App Router directory
    page.tsx         # Home page with sign in/out buttons (route: /)
    layout.tsx       # Root layout with fonts and metadata
    globals.css      # Global styles with Tailwind imports
    profile/         # User profile page (protected)
    favicon.ico
  contexts/          # React contexts
    KeycloakContext.tsx  # Keycloak authentication context
  lib/               # Utility libraries
    keycloak.ts      # Keycloak configuration
public/              # Static assets
```

### Path Aliases
- `@/*` maps to `./src/*` - use this for all internal imports

### Styling
- **Tailwind CSS 4** with the new PostCSS plugin (`@tailwindcss/postcss`)
- Uses `@theme inline` directive in globals.css for CSS variable configuration
- Custom CSS variables for theming: `--background`, `--foreground`, `--font-geist-sans`, `--font-geist-mono`
- Automatic dark mode support via `prefers-color-scheme`

### Fonts
- Uses `next/font/google` to load Geist and Geist Mono fonts
- Fonts are configured in layout.tsx with CSS variables:
  - `--font-geist-sans`
  - `--font-geist-mono`

### TypeScript Configuration
- Strict mode enabled
- Module resolution: `bundler`
- Target: ES2017
- Path alias: `@/*` → `./src/*`

### ESLint
- Uses flat config format (eslint.config.mjs)
- Extends `next/core-web-vitals` and `next/typescript`
- Compatible with Next.js TypeScript best practices

## Key Implementation Details

### App Router
This project uses Next.js App Router (not Pages Router). Components in `src/app/` are Server Components by default unless marked with `'use client'`.

### Tailwind CSS 4
This project uses Tailwind CSS v4 which has a different configuration approach:
- No `tailwind.config.ts` file (removed in v4)
- Configuration is done via `@theme` directive in CSS files
- PostCSS plugin: `@tailwindcss/postcss`

### CSS Variables Pattern
The project uses a CSS variable system for theming:
- Root variables defined in `:root` and `@media (prefers-color-scheme: dark)`
- Variables registered in `@theme inline` block
- Referenced in Tailwind classes (e.g., `bg-background`, `text-foreground`)

## Authentication

### Keycloak Integration
This project uses Keycloak for authentication and identity management.

**Setup:**
1. Copy `.env.example` to `.env.local`
2. Configure Keycloak environment variables:
   - `NEXT_PUBLIC_KEYCLOAK_URL` - Keycloak server URL
   - `NEXT_PUBLIC_KEYCLOAK_REALM` - Keycloak realm name
   - `NEXT_PUBLIC_KEYCLOAK_CLIENT_ID` - Client ID for this application

**Features:**
- SSO (Single Sign-On) authentication
- Automatic token refresh (every 60 seconds)
- JWT token management (access token + refresh token)
- Protected routes (profile page requires authentication)

**Routes:**
- `/` - Home page with authentication status and sign in/out buttons
  - Shows "Sign In" button for unauthenticated users (redirects to Keycloak login)
  - Shows "View Profile" and "Sign Out" buttons for authenticated users
  - Automatically redirects authenticated users to `/profile`
- `/profile` - Protected profile page showing:
  - JWT tokens (raw and decoded)
  - Real-time token expiration countdown
  - Highlighted `exp` field with readable timestamps
  - Manual token refresh button
  - Logout button (redirects to home page after logout)

**Implementation Details:**
- `KeycloakProvider` wraps the entire application in `layout.tsx`
- Uses React Context (`KeycloakContext`) for state management
- PKCE (Proof Key for Code Exchange) enabled for security
- Client-side token validation and refresh
- Logout redirects to home page (`/`) via `redirectUri: window.location.origin`
