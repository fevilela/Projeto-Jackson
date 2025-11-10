# Athletic Performance Tracking System

## Overview

This is a full-stack athletic performance tracking application designed for coaches and trainers to monitor athlete jump test performance (CMJ and SJ tests). The system allows users to register athletes, record test results, and visualize performance trends over time through interactive charts and dashboards.

The application follows a Material Design-inspired approach optimized for data-heavy workflows, prioritizing clarity, efficiency, and real-time feedback for sports performance tracking.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React with TypeScript using Vite as the build tool

**UI Component Library**: Radix UI primitives with shadcn/ui components styled using Tailwind CSS (New York variant)

**State Management**: 
- TanStack Query (React Query) for server state management with infinite stale time and disabled refetching
- React Context API for authentication state
- Local component state for form inputs

**Routing**: Wouter for lightweight client-side routing

**Design System**:
- Typography: Inter for general UI, Roboto Mono for numerical data
- Color scheme: HSL-based theme system with CSS variables supporting light/dark modes
- Spacing: Tailwind's spacing scale with custom elevate classes for depth
- Component patterns: Card-based layouts, tabbed interfaces, responsive grids

**Key Features**:
- Protected routes requiring authentication
- Real-time form validation using react-hook-form with Zod schemas
- Interactive data visualization using Recharts (line and bar charts)
- Responsive design with mobile-first approach
- Toast notifications for user feedback

### Backend Architecture

**Runtime**: Node.js with Express.js framework

**Language**: TypeScript with ES modules

**API Design**: RESTful JSON API with the following endpoint groups:
- `/api/auth/*` - Authentication (register, login, logout, session check)
- `/api/athletes/*` - Athlete CRUD operations
- `/api/tests/*` - Test result CRUD operations

**Session Management**:
- Express-session with MemoryStore (development)
- Session-based authentication with HTTP-only cookies
- 7-day session expiration
- User ID stored in session for request authentication

**Middleware Stack**:
- JSON body parsing with raw body preservation
- Session management
- Custom request logging with timing
- Authentication guard middleware (`requireAuth`)

**Password Security**: Bcrypt hashing with salt rounds of 10

**Development Tools**:
- Vite middleware integration for HMR in development
- Custom error overlay for runtime errors
- Request/response logging

### Data Storage

**Database**: PostgreSQL via Neon serverless driver

**ORM**: Drizzle ORM with type-safe schema definitions

**Schema Design**:

1. **Users Table**:
   - UUID primary key (auto-generated)
   - Username (unique)
   - Hashed password
   - Timestamps

2. **Athletes Table**:
   - UUID primary key
   - Foreign key to users (cascade delete)
   - Name, age, sport
   - Timestamps

3. **Tests Table**:
   - UUID primary key
   - Foreign keys to athletes and users (cascade delete)
   - Test date, CMJ value, SJ value
   - Optional observations
   - Timestamps

**Data Relationships**:
- One-to-many: User → Athletes
- One-to-many: User → Tests
- One-to-many: Athlete → Tests
- Cascade deletion maintains referential integrity

**Type Safety**: Shared schema types between client and server using Zod for runtime validation and Drizzle for compile-time types

### Authentication & Authorization

**Authentication Flow**:
1. User registers with username/password
2. Password hashed and stored
3. Session created on successful login
4. Session cookie sent to client (HTTP-only, secure in production)
5. Protected routes verify session via `requireAuth` middleware

**Authorization Model**:
- User-scoped data access (users only see their own athletes and tests)
- All database queries filtered by `userId` from session
- Storage layer enforces ownership checks on mutations

### External Dependencies

**Core Runtime Dependencies**:
- `@neondatabase/serverless` - Neon PostgreSQL serverless driver
- `drizzle-orm` - Type-safe ORM for database operations
- `express` & `express-session` - Web server and session management
- `bcryptjs` - Password hashing
- `memorystore` - In-memory session store

**Frontend UI Libraries**:
- `@radix-ui/*` - Headless UI primitives (18+ components)
- `@tanstack/react-query` - Server state management
- `react-hook-form` & `@hookform/resolvers` - Form handling
- `zod` - Schema validation
- `recharts` - Data visualization charts
- `tailwindcss` - Utility-first CSS framework
- `class-variance-authority` & `clsx` - Component variant styling

**Development Tools**:
- `vite` - Build tool and dev server
- `typescript` - Type safety
- `tsx` - TypeScript execution
- `drizzle-kit` - Database migrations
- `wouter` - Lightweight routing

**Fonts**: Google Fonts (Inter, Roboto Mono) loaded via CDN

**Build & Deployment**:
- Production build: Vite builds client, esbuild bundles server
- Output: `dist/public` for client assets, `dist/index.js` for server
- Database migrations: Drizzle Kit push command
- Environment: `DATABASE_URL` required, optional `SESSION_SECRET`