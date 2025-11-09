# PixShift Architecture Document

**Version:** 1.0  
**Date:** 2024-11-09  
**Status:** Complete Architecture Design  
**Based on:** PRD v1.2

This document provides a comprehensive technical architecture for the PixShift application, covering system design, database schema, API specifications, component architecture, and deployment strategy.

---

## Table of Contents

1. [System Architecture Overview](#1-system-architecture-overview)
2. [Database Schema Design](#2-database-schema-design)
3. [API Endpoint Specifications](#3-api-endpoint-specifications)
4. [Component Architecture](#4-component-architecture)
5. [Authentication & Authorization Architecture](#5-authentication--authorization-architecture)
6. [Payment Integration Architecture](#6-payment-integration-architecture)
7. [Image Processing Workflow](#7-image-processing-workflow)
8. [Error Handling Strategy](#8-error-handling-strategy)
9. [Deployment Architecture](#9-deployment-architecture)
10. [Testing Strategy](#10-testing-strategy)
11. [Configuration Management](#11-configuration-management)
12. [Security Architecture](#12-security-architecture)
13. [Performance Optimization](#13-performance-optimization)

---

## 1. System Architecture Overview

### 1.1 High-Level Architecture

PixShift follows a monolithic architecture pattern for the MVP, with all components deployed as a single Next.js application. The architecture is designed to be scalable and can evolve to microservices if needed.

### 1.2 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Layer                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ Web Browser  │  │ Mobile Web   │  │ Tablet Web   │         │
│  │ (Desktop)    │  │ (Mobile)     │  │ (Tablet)     │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Application Layer                            │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Next.js 14+ (App Router)                    │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │  │
│  │  │   Server     │  │   Client     │  │   API Routes  │  │  │
│  │  │  Components  │  │  Components  │  │   (REST)     │  │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ Auth Service │    │Transform Svc │    │Billing Svc   │
│              │    │              │    │              │
│ - OAuth      │    │ - Gemini API │    │ - Stripe     │
│ - SMS OTP    │    │ - Processing │    │ - PayPal     │
│ - Sessions   │    │ - Storage    │    │ - Tracking   │
└──────────────┘    └──────────────┘    └──────────────┘
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Data Layer                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │ PostgreSQL   │  │    Redis     │  │   AWS S3      │        │
│  │  (Prisma)    │  │  (Sessions)  │  │ (Temp Images) │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    External Services                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ Gemini API   │  │   Stripe     │  │   Twilio     │         │
│  │              │  │              │  │              │         │
│  │ - Image      │  │ - Payments   │  │ - SMS OTP    │         │
│  │   Transform  │  │ - Webhooks   │  │ - Delivery   │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│  ┌──────────────┐  ┌──────────────┐                           │
│  │   PayPal      │  │ OAuth (G/F)  │                           │
│  │              │  │              │                           │
│  │ - Payments   │  │ - Gmail      │                           │
│  │   (Optional)  │  │ - Facebook   │                           │
│  └──────────────┘  └──────────────┘                           │
└─────────────────────────────────────────────────────────────────┘
```

### 1.3 Technology Stack

**Frontend:**
- Next.js 14+ (App Router)
- React 18+
- TypeScript
- Tailwind CSS

**Backend:**
- Next.js API Routes
- Node.js 18+ LTS
- TypeScript

**Database:**
- PostgreSQL 14+
- Prisma ORM
- Redis (Session Storage)

**Authentication:**
- NextAuth.js (OAuth)
- Twilio (SMS OTP)

**Payment:**
- Stripe (Primary)
- PayPal (Configurable)

**Image Processing:**
- Sharp (Image Validation)
- AWS S3 (Temporary Storage)

**Testing:**
- Jest (Unit & Integration)
- Playwright (E2E)

**Deployment:**
- Vercel (Primary)
- AWS/Azure (Alternative)

---

## 2. Database Schema Design

### 2.1 Entity Relationship Diagram

```mermaid
erDiagram
    USERS ||--o{ TRANSFORMATIONS : creates
    USERS ||--o{ BILLING_RECORDS : has
    USERS ||--o{ ADMIN_ACTIONS : performs
    TRANSFORMATION_TYPES ||--o{ TRANSFORMATIONS : used_in
    TRANSFORMATIONS ||--o| BILLING_RECORDS : generates
    
    USERS {
        uuid id PK
        string email UK
        string phone
        enum auth_provider
        enum role
        int free_tier_used
        string pricing_tier
        timestamp created_at
        timestamp updated_at
    }
    
    TRANSFORMATION_TYPES {
        uuid id PK
        string name UK
        text description
        text prompt_template
        boolean enabled
        timestamp created_at
        timestamp updated_at
    }
    
    TRANSFORMATIONS {
        uuid id PK
        uuid user_id FK
        uuid transformation_type_id FK
        string original_image_url
        string transformed_image_url
        enum status
        text error_message
        string pricing_tier_locked
        timestamp created_at
        timestamp updated_at
    }
    
    BILLING_RECORDS {
        uuid id PK
        uuid user_id FK
        uuid transformation_id FK
        decimal amount
        string currency
        enum status
        string payment_gateway_transaction_id
        timestamp created_at
    }
    
    ADMIN_ACTIONS {
        uuid id PK
        uuid admin_user_id FK
        string action_type
        string entity_type
        uuid entity_id
        jsonb details
        timestamp timestamp
    }
```

### 2.2 Prisma Schema

```prisma
// schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum AuthProvider {
  GMAIL
  FACEBOOK
  MOBILE
}

enum UserRole {
  ADMIN
  GUEST
}

enum TransformationStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
}

enum BillingStatus {
  PENDING
  COMPLETED
  FAILED
  REFUNDED
}

model User {
  id                String         @id @default(uuid())
  email             String?        @unique
  phone             String?
  authProvider      AuthProvider
  role              UserRole       @default(GUEST)
  freeTierUsed      Int            @default(0)
  pricingTier       String?
  createdAt         DateTime       @default(now())
  updatedAt         DateTime       @updatedAt
  
  transformations   Transformation[]
  billingRecords    BillingRecord[]
  adminActions      AdminAction[]
  
  @@index([email])
  @@index([authProvider])
  @@index([role])
}

model TransformationType {
  id                String         @id @default(uuid())
  name              String         @unique
  description       String?
  promptTemplate    String
  enabled           Boolean        @default(true)
  createdAt         DateTime       @default(now())
  updatedAt         DateTime       @updatedAt
  
  transformations   Transformation[]
  
  @@index([enabled])
}

model Transformation {
  id                      String                @id @default(uuid())
  userId                  String
  transformationTypeId    String
  originalImageUrl        String
  transformedImageUrl    String?
  status                  TransformationStatus   @default(PENDING)
  errorMessage            String?
  pricingTierLocked      String?
  createdAt              DateTime               @default(now())
  updatedAt              DateTime               @updatedAt
  
  user                    User                  @relation(fields: [userId], references: [id], onDelete: Cascade)
  transformationType      TransformationType    @relation(fields: [transformationTypeId], references: [id])
  billingRecord           BillingRecord?
  
  @@index([userId])
  @@index([transformationTypeId])
  @@index([status])
  @@index([createdAt])
}

model BillingRecord {
  id                          String          @id @default(uuid())
  userId                      String
  transformationId            String?         @unique
  amount                      Decimal         @db.Decimal(10, 2)
  currency                    String          @default("USD")
  status                      BillingStatus  @default(PENDING)
  paymentGatewayTransactionId String?
  createdAt                   DateTime        @default(now())
  
  user                        User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  transformation              Transformation? @relation(fields: [transformationId], references: [id], onDelete: SetNull)
  
  @@index([userId])
  @@index([status])
  @@index([createdAt])
}

model AdminAction {
  id            String   @id @default(uuid())
  adminUserId   String
  actionType    String
  entityType    String
  entityId      String?
  details       Json?
  timestamp     DateTime @default(now())
  
  adminUser     User     @relation(fields: [adminUserId], references: [id], onDelete: Cascade)
  
  @@index([adminUserId])
  @@index([actionType])
  @@index([entityType])
  @@index([timestamp])
}
```

### 2.3 Database Indexes

**Performance Indexes:**
- `users.email` - Unique index for OAuth lookups
- `users.authProvider` - Index for authentication queries
- `users.role` - Index for role-based access control
- `transformations.userId` - Index for user transformation history
- `transformations.status` - Index for status filtering
- `billing_records.userId` - Index for user billing history
- `billing_records.status` - Index for payment status queries
- `admin_actions.timestamp` - Index for audit log queries

**Composite Indexes:**
- `(transformations.userId, transformations.status)` - For user status queries
- `(billing_records.userId, billing_records.createdAt)` - For user billing history

### 2.4 Database Constraints

**Foreign Key Constraints:**
- `transformations.userId` → `users.id` (CASCADE on delete)
- `transformations.transformationTypeId` → `transformation_types.id`
- `billing_records.userId` → `users.id` (CASCADE on delete)
- `billing_records.transformationId` → `transformations.id` (SET NULL on delete)
- `admin_actions.adminUserId` → `users.id` (CASCADE on delete)

**Check Constraints:**
- `users.free_tier_used >= 0` - Free tier cannot be negative
- `billing_records.amount > 0` - Billing amount must be positive
- `transformation_types.enabled IN (true, false)` - Boolean constraint

---

## 3. API Endpoint Specifications

### 3.1 API Design Principles

- **RESTful Design**: All endpoints follow REST conventions
- **JSON Format**: Request and response bodies use JSON
- **Authentication**: Protected endpoints require valid session
- **Error Handling**: Consistent error response format
- **Versioning**: API versioning via URL path (`/api/v1/...`)

### 3.2 Authentication Endpoints

#### POST `/api/auth/oauth/gmail`
**Description:** Initiate Gmail OAuth flow  
**Request:** None (redirect handled by NextAuth.js)  
**Response:** Redirect to Google OAuth  
**Auth:** Public

#### GET `/api/auth/callback/gmail`
**Description:** Gmail OAuth callback  
**Request:** OAuth callback parameters  
**Response:** Redirect to dashboard  
**Auth:** Public

#### POST `/api/auth/oauth/facebook`
**Description:** Initiate Facebook OAuth flow  
**Request:** None (redirect handled by NextAuth.js)  
**Response:** Redirect to Facebook OAuth  
**Auth:** Public

#### GET `/api/auth/callback/facebook`
**Description:** Facebook OAuth callback  
**Request:** OAuth callback parameters  
**Response:** Redirect to dashboard  
**Auth:** Public

#### POST `/api/auth/sms/request-otp`
**Description:** Request SMS OTP  
**Request Body:**
```json
{
  "phone": "+1234567890"
}
```
**Response:**
```json
{
  "success": true,
  "message": "OTP sent successfully"
}
```
**Auth:** Public

#### POST `/api/auth/sms/verify-otp`
**Description:** Verify SMS OTP  
**Request Body:**
```json
{
  "phone": "+1234567890",
  "otp": "123456"
}
```
**Response:**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": null,
    "phone": "+1234567890",
    "role": "GUEST"
  },
  "session": "session_token"
}
```
**Auth:** Public

#### POST `/api/auth/logout`
**Description:** Logout user  
**Request:** None  
**Response:**
```json
{
  "success": true
}
```
**Auth:** Required

#### GET `/api/auth/session`
**Description:** Get current session  
**Request:** None  
**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "GUEST",
    "freeTierUsed": 2
  }
}
```
**Auth:** Required

### 3.3 Transformation Endpoints

#### POST `/api/transformations/upload`
**Description:** Upload image for transformation  
**Request:** Multipart form data with image file  
**Response:**
```json
{
  "success": true,
  "imageUrl": "https://s3.amazonaws.com/temp/image.jpg",
  "imageId": "uuid"
}
```
**Auth:** Required  
**Validation:** File type, size, dimensions

#### GET `/api/transformation-types`
**Description:** Get available transformation types  
**Request:** None  
**Response:**
```json
{
  "types": [
    {
      "id": "uuid",
      "name": "Person wearing crown",
      "description": "Transform person to wear a crown",
      "enabled": true
    }
  ]
}
```
**Auth:** Required  
**Filter:** Only enabled types

#### POST `/api/transformations`
**Description:** Create transformation request  
**Request Body:**
```json
{
  "imageUrl": "https://s3.amazonaws.com/temp/image.jpg",
  "transformationTypeId": "uuid"
}
```
**Response:**
```json
{
  "success": true,
  "transformation": {
    "id": "uuid",
    "status": "PENDING",
    "createdAt": "2024-11-09T10:00:00Z"
  }
}
```
**Auth:** Required  
**Business Logic:** Free tier check, billing check

#### GET `/api/transformations/:id`
**Description:** Get transformation status  
**Request:** None  
**Response:**
```json
{
  "transformation": {
    "id": "uuid",
    "status": "COMPLETED",
    "originalImageUrl": "https://...",
    "transformedImageUrl": "https://...",
    "createdAt": "2024-11-09T10:00:00Z",
    "updatedAt": "2024-11-09T10:05:00Z"
  }
}
```
**Auth:** Required (owner or admin)

#### GET `/api/transformations/:id/download`
**Description:** Download transformed image  
**Request:** None  
**Response:** Image file (binary)  
**Auth:** Required (owner or admin)  
**Side Effect:** Delete image after download

#### POST `/api/transformations/:id/share`
**Description:** Share transformation to social media  
**Request Body:**
```json
{
  "platform": "facebook" // facebook, twitter, instagram
}
```
**Response:**
```json
{
  "success": true,
  "shareUrl": "https://..."
}
```
**Auth:** Required (owner)

### 3.4 Billing Endpoints

#### GET `/api/billing/free-tier`
**Description:** Get free tier status  
**Request:** None  
**Response:**
```json
{
  "freeTierUsed": 2,
  "freeTierLimit": 5,
  "remaining": 3
}
```
**Auth:** Required

#### GET `/api/billing/pricing-tiers`
**Description:** Get available pricing tiers  
**Request:** None  
**Response:**
```json
{
  "tiers": [
    {
      "id": "basic",
      "name": "Basic",
      "description": "Pay per image",
      "costPerImage": 0.99,
      "currency": "USD"
    }
  ]
}
```
**Auth:** Required

#### POST `/api/billing/pricing-tier`
**Description:** Select pricing tier  
**Request Body:**
```json
{
  "pricingTier": "basic"
}
```
**Response:**
```json
{
  "success": true,
  "pricingTier": "basic"
}
```
**Auth:** Required

#### POST `/api/billing/payment`
**Description:** Process payment for transformation  
**Request Body:**
```json
{
  "transformationId": "uuid",
  "paymentMethodId": "pm_xxx",
  "amount": 0.99,
  "currency": "USD"
}
```
**Response:**
```json
{
  "success": true,
  "billingRecord": {
    "id": "uuid",
    "amount": 0.99,
    "status": "COMPLETED",
    "transactionId": "txn_xxx"
  }
}
```
**Auth:** Required

#### GET `/api/billing/history`
**Description:** Get billing history  
**Request:** Query parameters: `?page=1&limit=10`  
**Response:**
```json
{
  "records": [
    {
      "id": "uuid",
      "amount": 0.99,
      "status": "COMPLETED",
      "createdAt": "2024-11-09T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25
  }
}
```
**Auth:** Required

### 3.5 Admin Endpoints

#### GET `/api/admin/stats`
**Description:** Get system statistics  
**Request:** None  
**Response:**
```json
{
  "totalUsers": 1000,
  "totalTransformations": 5000,
  "totalRevenue": 4950.00,
  "activeUsers": 500
}
```
**Auth:** Required (Admin only)

#### GET `/api/admin/transformation-types`
**Description:** Get all transformation types (admin)  
**Request:** None  
**Response:**
```json
{
  "types": [
    {
      "id": "uuid",
      "name": "Person wearing crown",
      "enabled": true,
      "usageCount": 100
    }
  ]
}
```
**Auth:** Required (Admin only)

#### POST `/api/admin/transformation-types`
**Description:** Create transformation type  
**Request Body:**
```json
{
  "name": "Person delivering speech",
  "description": "Transform person to deliver a speech",
  "promptTemplate": "Transform the person in the image to deliver a speech"
}
```
**Response:**
```json
{
  "success": true,
  "type": {
    "id": "uuid",
    "name": "Person delivering speech",
    "enabled": true
  }
}
```
**Auth:** Required (Admin only)

#### PUT `/api/admin/transformation-types/:id`
**Description:** Update transformation type  
**Request Body:**
```json
{
  "name": "Updated name",
  "description": "Updated description",
  "promptTemplate": "Updated prompt",
  "enabled": true
}
```
**Response:**
```json
{
  "success": true,
  "type": { ... }
}
```
**Auth:** Required (Admin only)

#### DELETE `/api/admin/transformation-types/:id`
**Description:** Delete transformation type  
**Request:** None  
**Response:**
```json
{
  "success": true
}
```
**Auth:** Required (Admin only)  
**Validation:** Cannot delete if in use

#### GET `/api/admin/users`
**Description:** Get all users  
**Request:** Query parameters: `?page=1&limit=10&role=GUEST`  
**Response:**
```json
{
  "users": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "role": "GUEST",
      "freeTierUsed": 5,
      "pricingTier": "basic"
    }
  ],
  "pagination": { ... }
}
```
**Auth:** Required (Admin only)

#### PUT `/api/admin/users/:id/role`
**Description:** Change user role  
**Request Body:**
```json
{
  "role": "ADMIN"
}
```
**Response:**
```json
{
  "success": true,
  "user": { ... }
}
```
**Auth:** Required (Admin only)  
**Logging:** Admin action logged

#### GET `/api/admin/actions`
**Description:** Get admin action log  
**Request:** Query parameters: `?page=1&limit=10&actionType=CREATE&entityType=TRANSFORMATION_TYPE`  
**Response:**
```json
{
  "actions": [
    {
      "id": "uuid",
      "adminUserId": "uuid",
      "actionType": "CREATE",
      "entityType": "TRANSFORMATION_TYPE",
      "timestamp": "2024-11-09T10:00:00Z"
    }
  ],
  "pagination": { ... }
}
```
**Auth:** Required (Admin only)

### 3.6 User Profile Endpoints

#### GET `/api/users/profile`
**Description:** Get user profile  
**Request:** None  
**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "phone": "+1234567890",
    "role": "GUEST",
    "freeTierUsed": 3,
    "pricingTier": "basic"
  },
  "stats": {
    "totalTransformations": 10,
    "totalSpent": 4.95
  }
}
```
**Auth:** Required

#### PUT `/api/users/profile`
**Description:** Update user profile  
**Request Body:**
```json
{
  "phone": "+1234567890"
}
```
**Response:**
```json
{
  "success": true,
  "user": { ... }
}
```
**Auth:** Required

---

## 4. Component Architecture

### 4.1 Next.js App Router Structure

```
app/
├── layout.tsx                 # Root layout
├── page.tsx                   # Home page
├── (auth)/
│   ├── login/
│   │   └── page.tsx           # Login page
│   └── callback/
│       └── page.tsx          # OAuth callback
├── (dashboard)/
│   ├── layout.tsx             # Dashboard layout (protected)
│   ├── dashboard/
│   │   └── page.tsx           # Dashboard page
│   ├── transform/
│   │   └── page.tsx           # Transformation page
│   └── profile/
│       └── page.tsx           # Profile page
├── (admin)/
│   ├── layout.tsx             # Admin layout (admin only)
│   ├── admin/
│   │   └── page.tsx           # Admin dashboard
│   ├── admin/transformation-types/
│   │   └── page.tsx           # Transformation type management
│   └── admin/users/
│       └── page.tsx           # User management
└── api/
    ├── auth/
    │   ├── [...nextauth]/
    │   │   └── route.ts        # NextAuth.js handler
    │   ├── sms/
    │   │   ├── request-otp/
    │   │   │   └── route.ts
    │   │   └── verify-otp/
    │   │       └── route.ts
    │   └── logout/
    │       └── route.ts
    ├── transformations/
    │   ├── upload/
    │   │   └── route.ts
    │   ├── route.ts            # GET, POST /api/transformations
    │   └── [id]/
    │       ├── route.ts        # GET, PUT /api/transformations/:id
    │       ├── download/
    │       │   └── route.ts
    │       └── share/
    │           └── route.ts
    ├── transformation-types/
    │   └── route.ts            # GET /api/transformation-types
    ├── billing/
    │   ├── free-tier/
    │   │   └── route.ts
    │   ├── pricing-tiers/
    │   │   └── route.ts
    │   ├── pricing-tier/
    │   │   └── route.ts
    │   ├── payment/
    │   │   └── route.ts
    │   └── history/
    │       └── route.ts
    ├── admin/
    │   ├── stats/
    │   │   └── route.ts
    │   ├── transformation-types/
    │   │   └── route.ts
    │   ├── users/
    │   │   └── route.ts
    │   └── actions/
    │       └── route.ts
    └── users/
        └── profile/
            └── route.ts
```

### 4.2 React Component Structure

```
src/
├── components/
│   ├── ui/                     # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   ├── Modal.tsx
│   │   └── Loading.tsx
│   ├── auth/                   # Authentication components
│   │   ├── LoginForm.tsx
│   │   ├── OAuthButtons.tsx
│   │   └── OTPForm.tsx
│   ├── transformation/         # Transformation components
│   │   ├── ImageUpload.tsx
│   │   ├── TransformationTypeSelector.tsx
│   │   ├── TransformationPreview.tsx
│   │   └── TransformationStatus.tsx
│   ├── billing/                 # Billing components
│   │   ├── FreeTierDisplay.tsx
│   │   ├── PricingTierSelector.tsx
│   │   └── PaymentForm.tsx
│   ├── admin/                   # Admin components
│   │   ├── AdminDashboard.tsx
│   │   ├── TransformationTypeManager.tsx
│   │   └── UserManager.tsx
│   └── layout/                  # Layout components
│       ├── Header.tsx
│       ├── Sidebar.tsx
│       └── Footer.tsx
├── lib/                         # Utility libraries
│   ├── auth.ts                 # Auth utilities
│   ├── db.ts                    # Prisma client
│   ├── validation.ts            # Validation utilities
│   └── errors.ts                # Error handling
├── services/                    # Business logic services
│   ├── transformation.ts
│   ├── billing.ts
│   ├── gemini.ts
│   └── payment.ts
└── types/                       # TypeScript types
    ├── user.ts
    ├── transformation.ts
    └── billing.ts
```

### 4.3 Component Communication Flow

```
User Action
    │
    ▼
React Component (Client)
    │
    ▼
API Route Handler (Server)
    │
    ▼
Service Layer (Business Logic)
    │
    ├──► Database (Prisma)
    ├──► External API (Gemini, Stripe, etc.)
    └──► Storage (S3)
    │
    ▼
Response to Client
    │
    ▼
Component Update (React State)
```

---

## 5. Authentication & Authorization Architecture

### 5.1 Authentication Flow

**OAuth Flow (Gmail/Facebook):**
1. User clicks "Login with Gmail/Facebook"
2. Redirect to OAuth provider
3. User authorizes application
4. OAuth provider redirects to callback URL
5. NextAuth.js handles callback and creates session
6. User record created/updated in database
7. Session stored in Redis/database
8. User redirected to dashboard

**SMS OTP Flow:**
1. User enters phone number
2. System generates 6-digit OTP
3. OTP sent via Twilio SMS
4. OTP stored in Redis with 5-minute expiration
5. User enters OTP
6. System validates OTP
7. User record created/updated in database
8. Session created and stored
9. User redirected to dashboard

### 5.2 Session Management

**Session Storage:**
- **Primary:** Redis (preferred for performance)
- **Fallback:** PostgreSQL (if Redis unavailable)
- **Session Data:**
  - User ID
  - User role
  - Session expiration timestamp
  - Last activity timestamp

**Session Lifecycle:**
- Created: After successful authentication
- Validated: On each protected route access
- Refreshed: On user activity (24-hour inactivity timer)
- Expired: After 24 hours of inactivity
- Invalidated: On logout or security event

### 5.3 Authorization (Role-Based Access Control)

**Roles:**
- **GUEST:** Standard user with transformation access
- **ADMIN:** Administrative user with management access

**Access Control Matrix:**

| Resource | GUEST | ADMIN |
|----------|-------|-------|
| View Dashboard | ✅ | ✅ |
| Transform Images | ✅ | ✅ |
| View Own Profile | ✅ | ✅ |
| View Own Transformations | ✅ | ✅ |
| View Own Billing History | ✅ | ✅ |
| Admin Dashboard | ❌ | ✅ |
| Manage Transformation Types | ❌ | ✅ |
| Manage Users | ❌ | ✅ |
| View System Stats | ❌ | ✅ |
| View Admin Action Log | ❌ | ✅ |

**Implementation:**
- **Middleware:** Next.js middleware for route protection
- **API Routes:** Server-side role validation
- **UI Components:** Conditional rendering based on role

### 5.4 Security Measures

**Authentication Security:**
- OAuth tokens encrypted in storage
- OTP codes single-use and time-limited (5 minutes)
- Session tokens cryptographically secure
- Rate limiting on authentication attempts

**Authorization Security:**
- Server-side role validation (never trust client)
- API endpoints protected with middleware
- Admin actions logged for audit trail
- CSRF protection for state-changing operations

---

## 6. Payment Integration Architecture

### 6.1 Payment Gateway Architecture

**Primary Gateway: Stripe**
- Stripe SDK for Node.js
- Payment Intents API for secure payments
- Webhooks for payment status updates
- Customer portal for subscription management

**Secondary Gateway: PayPal (Configurable)**
- PayPal SDK for Node.js
- PayPal REST API
- Webhooks for payment notifications
- Configurable via configuration file

### 6.2 Payment Flow

```
User Requests Transformation
    │
    ▼
Check Free Tier
    │
    ├──► Free Tier Available → Allow Transformation
    │
    └──► Free Tier Exhausted
            │
            ▼
        Check Pricing Tier
            │
            ├──► No Tier Selected → Show Upgrade Prompt
            │
            └──► Tier Selected
                    │
                    ▼
                Calculate Cost
                    │
                    ▼
                Create Payment Intent (Stripe)
                    │
                    ▼
                User Enters Payment Details
                    │
                    ▼
                Process Payment
                    │
                    ├──► Success → Create Billing Record → Allow Transformation
                    │
                    └──► Failed → Show Error → Retry Option
```

### 6.3 Billing Record Creation

**Transaction Flow:**
1. Payment processed via gateway
2. Gateway returns transaction ID
3. Billing record created in database
4. Transaction linked to transformation
5. User usage tracked
6. Webhook received (async) to confirm payment

**Atomic Operations:**
- Free tier check and increment (single transaction)
- Payment processing and billing record creation (single transaction)
- Transformation creation and billing record linking (single transaction)

### 6.4 Payment Configuration

**Configuration File:** `config/payment-gateway.yaml`
```yaml
gateway:
  type: "stripe"  # or "paypal"
  stripe:
    apiKey: "${STRIPE_API_KEY}"
    webhookSecret: "${STRIPE_WEBHOOK_SECRET}"
  paypal:
    clientId: "${PAYPAL_CLIENT_ID}"
    clientSecret: "${PAYPAL_CLIENT_SECRET}"
    mode: "sandbox"  # or "live"
```

---

## 7. Image Processing Workflow

### 7.1 Image Upload Flow

```
User Selects Image
    │
    ▼
Client-Side Validation
    ├──► File Type (JPG, PNG, WebP)
    ├──► File Size (max 10MB)
    └──► Image Dimensions (min 100x100, max 5000x5000)
    │
    ▼
Upload to Temporary Storage (S3)
    │
    ▼
Server-Side Validation
    ├──► MIME Type Verification
    ├──► File Signature Validation
    └──► Dimension Validation (Sharp)
    │
    ▼
Store Image URL in Database
    │
    ▼
Return Image URL to Client
```

### 7.2 Transformation Processing Flow

```
User Initiates Transformation
    │
    ▼
Check Free Tier / Billing
    │
    ▼
Create Transformation Record (Status: PENDING)
    │
    ▼
Call Gemini API
    ├──► Prepare Prompt (from transformation type)
    ├──► Upload Image to Gemini
    └──► Request Transformation
    │
    ├──► Success
    │       │
    │       ▼
    │   Receive Transformed Image
    │       │
    │       ▼
    │   Store in Temporary Storage (S3)
    │       │
    │       ▼
    │   Update Transformation Record (Status: COMPLETED)
    │
    └──► Failure
            │
            ▼
        Update Transformation Record (Status: FAILED)
            │
            ▼
        Log Error
            │
            ▼
        Notify User
```

### 7.3 Image Storage Strategy

**Temporary Storage:**
- **Primary:** AWS S3 (scalable, reliable)
- **Fallback:** Local filesystem (for development)
- **Lifecycle:** Images deleted within 5 minutes of download
- **Access Control:** Signed URLs with expiration

**Storage Structure:**
```
s3://pixshift-temp/
├── uploads/
│   └── {userId}/
│       └── {imageId}.jpg
└── transformations/
    └── {userId}/
        └── {transformationId}.jpg
```

**Cleanup Process:**
1. Image downloaded by user
2. Download timestamp recorded
3. Background job scheduled (5-minute delay)
4. Image deleted from S3
5. Database record updated

---

## 8. Error Handling Strategy

### 8.1 Error Categories

**Authentication Errors:**
- Invalid credentials
- Session expired
- OAuth failure
- OTP expired/invalid

**Billing Errors:**
- Payment declined
- Insufficient funds
- Payment gateway timeout
- Billing record creation failure

**API Errors:**
- Gemini API failure
- Rate limit exceeded
- API timeout
- Invalid API response

**Network Errors:**
- Connection timeout
- Network unavailable
- DNS resolution failure

**Validation Errors:**
- Invalid file format
- File size exceeded
- Invalid input data
- Missing required fields

### 8.2 Error Response Format

**Standard Error Response:**
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "User-friendly error message",
    "category": "AUTHENTICATION|BILLING|API|NETWORK|VALIDATION",
    "details": {
      "field": "additional error details"
    },
    "requestId": "uuid-for-tracking"
  }
}
```

**HTTP Status Codes:**
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (authorization failed)
- `404` - Not Found
- `429` - Too Many Requests (rate limiting)
- `500` - Internal Server Error
- `502` - Bad Gateway (external API failure)
- `503` - Service Unavailable

### 8.3 Error Handling Implementation

**Client-Side:**
- Try-catch blocks around API calls
- Error boundary components for React errors
- User-friendly error messages displayed
- Retry logic for transient errors

**Server-Side:**
- Centralized error handling middleware
- Error logging with context (Winston/Pino)
- Error categorization and routing
- Retry logic with exponential backoff

**Error Logging:**
- All errors logged with:
  - Error message and stack trace
  - User ID (if available)
  - Request ID for tracking
  - Timestamp
  - Request details (URL, method, body)

---

## 9. Deployment Architecture

### 9.1 Primary Deployment: Vercel

**Vercel Configuration:**
- Next.js optimized deployment
- Automatic builds from Git
- Preview deployments for PRs
- Edge functions for global distribution
- Built-in CDN

**Environment Variables:**
- Database connection string
- API keys (Gemini, Stripe, Twilio)
- OAuth credentials
- S3 credentials
- Session secret

**Deployment Flow:**
```
Git Push to Main Branch
    │
    ▼
Vercel Build Triggered
    │
    ▼
Install Dependencies
    │
    ▼
Build Next.js Application
    │
    ▼
Run Tests (if configured)
    │
    ▼
Deploy to Production
    │
    ▼
Health Check
    │
    ▼
Traffic Routed to New Deployment
```

### 9.2 Alternative Deployment: AWS/Azure

**AWS Architecture:**
- **Compute:** EC2 instances or ECS/Fargate
- **Database:** RDS PostgreSQL
- **Storage:** S3 for temporary images
- **Sessions:** ElastiCache Redis
- **Load Balancer:** Application Load Balancer
- **CDN:** CloudFront

**Azure Architecture:**
- **Compute:** App Service or Container Instances
- **Database:** Azure Database for PostgreSQL
- **Storage:** Azure Blob Storage
- **Sessions:** Azure Cache for Redis
- **Load Balancer:** Application Gateway
- **CDN:** Azure CDN

### 9.3 CI/CD Pipeline

**GitHub Actions Workflow:**
```yaml
name: Deploy
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run lint
      - run: npm run test
      - run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

### 9.4 Database Migration Strategy

**Prisma Migrations:**
- Migrations version controlled in Git
- Migration files in `prisma/migrations/`
- Production migrations run via CI/CD
- Rollback strategy for failed migrations

**Migration Process:**
1. Developer creates migration locally
2. Migration tested in development
3. Migration committed to Git
4. CI/CD runs migration in staging
5. Migration verified in staging
6. Migration applied to production
7. Rollback plan ready if needed

---

## 10. Testing Strategy

### 10.1 Testing Pyramid

**Unit Tests (70%):**
- Component tests (React components)
- Service tests (business logic)
- Utility function tests
- API route handler tests

**Integration Tests (20%):**
- Database integration tests
- Authentication flow tests
- Payment gateway integration tests
- External API integration tests

**E2E Tests (10%):**
- Critical user flows
- Authentication workflows
- Transformation workflows
- Billing workflows

### 10.2 Test Structure

```
tests/
├── unit/
│   ├── components/
│   ├── services/
│   └── utils/
├── integration/
│   ├── api/
│   ├── database/
│   └── external/
└── e2e/
    ├── auth.spec.ts
    ├── transformation.spec.ts
    └── billing.spec.ts
```

### 10.3 Test Coverage Targets

**Feature Coverage:**
- Authentication: 80% unit, 15% integration, 5% E2E
- Transformation: 75% unit, 20% integration, 5% E2E
- Billing: 85% unit, 10% integration, 5% E2E
- Admin: 70% unit, 20% integration, 10% E2E

**Overall Coverage:**
- Minimum 70% code coverage
- Critical paths: 100% coverage
- Billing logic: 100% coverage

### 10.4 Test Execution

**Local Development:**
```bash
npm run test          # Unit tests
npm run test:integration  # Integration tests
npm run test:e2e       # E2E tests
npm run test:coverage  # Coverage report
```

**CI/CD:**
- All tests run on PR
- Tests must pass before merge
- Coverage report generated
- E2E tests run on staging deployment

---

## 11. Configuration Management

### 11.1 Configuration Files

**Gemini API Configuration:** `config/gemini-api.yaml`
```yaml
gemini:
  apiKey: "${GEMINI_API_KEY}"
  endpoint: "https://generativelanguage.googleapis.com/v1beta"
  model: "gemini-pro-vision"
  timeout: 30000  # 30 seconds
  retry:
    maxAttempts: 3
    backoffMultiplier: 2
    initialDelay: 1000
```

**Pricing Tiers Configuration:** `config/pricing-tiers.yaml`
```yaml
pricingTiers:
  - id: "basic"
    name: "Basic"
    description: "Pay per image"
    costPerImage: 0.99
    currency: "USD"
  - id: "premium"
    name: "Premium"
    description: "Monthly limit"
    monthlyLimit: 100
    costPerMonth: 9.99
    currency: "USD"
```

**Payment Gateway Configuration:** `config/payment-gateway.yaml`
```yaml
gateway:
  type: "stripe"  # or "paypal"
  stripe:
    apiKey: "${STRIPE_API_KEY}"
    webhookSecret: "${STRIPE_WEBHOOK_SECRET}"
  paypal:
    clientId: "${PAYPAL_CLIENT_ID}"
    clientSecret: "${PAYPAL_CLIENT_SECRET}"
    mode: "sandbox"
```

**SMS OTP Configuration:** `config/sms-otp.yaml`
```yaml
sms:
  provider: "twilio"
  twilio:
    accountSid: "${TWILIO_ACCOUNT_SID}"
    authToken: "${TWILIO_AUTH_TOKEN}"
    fromNumber: "${TWILIO_PHONE_NUMBER}"
  otp:
    length: 6
    expirationMinutes: 5
    maxAttempts: 3
```

### 11.2 Configuration Validation

**Validation on Startup:**
- All configuration files loaded
- Schema validation (JSON Schema or YAML schema)
- Required fields checked
- Invalid configuration prevents service start
- Validation errors logged clearly

**Configuration Access:**
- Configuration loaded once at startup
- Stored in memory for runtime access
- Type-safe configuration objects (TypeScript)
- Configuration changes require restart

---

## 12. Security Architecture

### 12.1 Security Measures

**API Key Security:**
- All API keys stored in environment variables
- Never exposed to client-side code
- Server-side only access
- Rotated regularly

**Authentication Security:**
- OAuth tokens encrypted in storage
- Session tokens cryptographically secure
- OTP codes single-use and time-limited
- Rate limiting on authentication attempts

**Payment Security:**
- PCI DSS compliance via payment gateway
- No payment data stored locally
- Payment data encrypted in transit
- Secure payment processing flow

**Data Security:**
- Database connections encrypted (SSL/TLS)
- Images stored with access control
- User data encrypted at rest
- Regular security audits

### 12.2 Security Best Practices

**Input Validation:**
- All user inputs validated
- SQL injection prevention (Prisma parameterized queries)
- XSS prevention (React automatic escaping)
- CSRF protection for state-changing operations

**Access Control:**
- Role-based access control (RBAC)
- Server-side authorization checks
- API endpoint protection
- Admin action logging

**Monitoring:**
- Security event logging
- Failed authentication attempts tracked
- Suspicious activity alerts
- Regular security reviews

---

## 13. Performance Optimization

### 13.1 Performance Targets

**API Response Times:**
- Image upload validation: < 100ms
- Transformation API call: < 30 seconds
- Database queries: < 100ms
- Session validation: < 50ms

**Scalability:**
- Support 1000 concurrent users
- Database connection pooling
- Redis caching for sessions
- CDN for static assets

### 13.2 Optimization Strategies

**Database Optimization:**
- Indexes on frequently queried columns
- Query optimization (Prisma query analysis)
- Connection pooling (PgBouncer or built-in)
- Read replicas for scaling reads

**Caching:**
- Redis for session storage
- API response caching where appropriate
- Static asset caching (CDN)
- Transformation type caching

**Code Optimization:**
- Next.js automatic code splitting
- Image optimization (Next.js Image component)
- Lazy loading for components
- Bundle size optimization

**Infrastructure Optimization:**
- Vercel edge functions for global distribution
- CDN for static assets
- Database read replicas
- Load balancing for high traffic

---

## Appendix A: Environment Variables

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/pixshift"

# Redis
REDIS_URL="redis://localhost:6379"

# Authentication
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
FACEBOOK_CLIENT_ID="your-facebook-client-id"
FACEBOOK_CLIENT_SECRET="your-facebook-client-secret"

# Twilio
TWILIO_ACCOUNT_SID="your-twilio-account-sid"
TWILIO_AUTH_TOKEN="your-twilio-auth-token"
TWILIO_PHONE_NUMBER="your-twilio-phone-number"

# Gemini API
GEMINI_API_KEY="your-gemini-api-key"

# Stripe
STRIPE_API_KEY="your-stripe-api-key"
STRIPE_WEBHOOK_SECRET="your-stripe-webhook-secret"

# PayPal (Optional)
PAYPAL_CLIENT_ID="your-paypal-client-id"
PAYPAL_CLIENT_SECRET="your-paypal-client-secret"

# AWS S3
AWS_ACCESS_KEY_ID="your-aws-access-key-id"
AWS_SECRET_ACCESS_KEY="your-aws-secret-access-key"
AWS_REGION="us-east-1"
AWS_S3_BUCKET="pixshift-temp"
```

---

## Appendix B: API Error Codes

| Code | Description | HTTP Status |
|------|-------------|-------------|
| `AUTH_REQUIRED` | Authentication required | 401 |
| `AUTH_INVALID` | Invalid credentials | 401 |
| `AUTH_EXPIRED` | Session expired | 401 |
| `AUTH_FORBIDDEN` | Insufficient permissions | 403 |
| `VALIDATION_ERROR` | Invalid input data | 400 |
| `FILE_TOO_LARGE` | File size exceeded | 400 |
| `INVALID_FILE_TYPE` | Unsupported file type | 400 |
| `FREE_TIER_EXHAUSTED` | Free tier limit reached | 402 |
| `PAYMENT_REQUIRED` | Payment required | 402 |
| `PAYMENT_FAILED` | Payment processing failed | 402 |
| `TRANSFORMATION_FAILED` | Image transformation failed | 500 |
| `API_ERROR` | External API error | 502 |
| `RATE_LIMIT_EXCEEDED` | Rate limit exceeded | 429 |
| `NOT_FOUND` | Resource not found | 404 |
| `INTERNAL_ERROR` | Internal server error | 500 |

---

## Document Status

**Version:** 1.0  
**Last Updated:** 2024-11-09  
**Status:** Complete  
**Next Review:** After Epic 1 implementation

**Change Log:**
- 2024-11-09: Initial architecture document created based on PRD v1.2

---

**Note:** This architecture document is based on the PRD and may need updates as the implementation progresses. All architectural decisions should be reviewed and approved before implementation.

