# PixShift Visual Summary

**Version:** 1.2  
**Date:** 2024-11-09  
**Status:** Complete PRD with Visual Diagrams

This document provides a comprehensive visual overview of the PixShift application architecture, workflows, and processes. All diagrams are based on the Product Requirements Document (PRD) and represent the complete system design.

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [User Flows](#2-user-flows)
3. [Business Logic](#3-business-logic)
4. [Data Architecture](#4-data-architecture)
5. [Administration](#5-administration)
6. [Deployment & Operations](#6-deployment--operations)
7. [Testing & Quality](#7-testing--quality)

---

## 1. System Overview

### 1.1 System Architecture Overview

This diagram shows the high-level system architecture with all components and their relationships.

```mermaid
graph TB
    subgraph "Client Layer"
        WEB[Web Browser<br/>Next.js + React]
        MOBILE[Mobile Browser<br/>Responsive Web]
    end
    
    subgraph "Application Layer"
        NEXT[Next.js App Router<br/>Server Components]
        API[API Routes<br/>REST Endpoints]
    end
    
    subgraph "Authentication Services"
        OAUTH[OAuth Providers<br/>Gmail, Facebook]
        SMS[Twilio SMS<br/>OTP Service]
        AUTH[NextAuth.js<br/>Session Management]
    end
    
    subgraph "Business Logic"
        TRANS[Transformation Service<br/>Gemini API]
        BILLING[Billing Service<br/>Stripe/PayPal]
        ADMIN[Admin Service<br/>Management]
    end
    
    subgraph "Data Layer"
        DB[(PostgreSQL<br/>Prisma ORM)]
        REDIS[(Redis<br/>Sessions)]
        S3[(AWS S3<br/>Temporary Storage)]
    end
    
    subgraph "External Services"
        GEMINI[Google Gemini API<br/>Image Transformation]
        STRIPE[Stripe<br/>Payment Gateway]
        PAYPAL[PayPal<br/>Payment Gateway]
    end
    
    WEB --> NEXT
    MOBILE --> NEXT
    NEXT --> API
    API --> AUTH
    AUTH --> OAUTH
    AUTH --> SMS
    API --> TRANS
    API --> BILLING
    API --> ADMIN
    TRANS --> GEMINI
    BILLING --> STRIPE
    BILLING --> PAYPAL
    API --> DB
    AUTH --> REDIS
    TRANS --> S3
    ADMIN --> DB
    BILLING --> DB
```

**Key Components:**
- **Client Layer**: Web and mobile browsers accessing the Next.js application
- **Application Layer**: Next.js App Router with Server Components and REST API Routes
- **Authentication Services**: OAuth providers (Gmail, Facebook) and Twilio SMS for OTP
- **Business Logic**: Transformation, Billing, and Admin services
- **Data Layer**: PostgreSQL database, Redis for sessions, AWS S3 for temporary image storage
- **External Services**: Google Gemini API, Stripe, PayPal

---

## 2. User Flows

### 2.1 User Authentication Flow

Complete authentication sequence for all authentication methods (OAuth and SMS OTP).

```mermaid
sequenceDiagram
    participant User
    participant WebApp
    participant AuthService
    participant OAuthProvider
    participant Database
    participant SessionStore
    
    User->>WebApp: Access Application
    WebApp->>AuthService: Check Session
    AuthService->>SessionStore: Validate Session
    
    alt Session Valid
        SessionStore-->>AuthService: Session Valid
        AuthService-->>WebApp: Authenticated
        WebApp-->>User: Show Dashboard
    else Session Invalid/Expired
        SessionStore-->>AuthService: Session Invalid
        AuthService-->>WebApp: Not Authenticated
        WebApp-->>User: Show Login Options
        
        User->>WebApp: Select Auth Method
        alt OAuth (Gmail/Facebook)
            WebApp->>OAuthProvider: Initiate OAuth
            OAuthProvider->>User: Request Authorization
            User->>OAuthProvider: Grant Access
            OAuthProvider->>AuthService: OAuth Callback
            AuthService->>Database: Create/Update User
            AuthService->>SessionStore: Create Session
            AuthService-->>WebApp: Authentication Success
            WebApp-->>User: Redirect to Dashboard
        else SMS OTP
            WebApp->>AuthService: Request OTP
            AuthService->>SMS: Send OTP
            SMS->>User: SMS with OTP Code
            User->>WebApp: Enter OTP
            WebApp->>AuthService: Verify OTP
            AuthService->>Database: Create/Update User
            AuthService->>SessionStore: Create Session
            AuthService-->>WebApp: Authentication Success
            WebApp-->>User: Redirect to Dashboard
        end
    end
```

**Authentication Methods:**
- **OAuth**: Gmail and Facebook OAuth 2.0 flow
- **SMS OTP**: Twilio SMS with 6-digit OTP codes (5-minute expiration, single-use)
- **Session Management**: Server-side sessions with Redis or database storage

---

### 2.2 Image Transformation Workflow

End-to-end image transformation process from upload to download and sharing.

```mermaid
flowchart TD
    START([User Starts]) --> UPLOAD[Upload Image]
    UPLOAD --> VALIDATE{Validate Image}
    
    VALIDATE -->|Invalid| ERROR1[Show Error Message]
    ERROR1 --> UPLOAD
    
    VALIDATE -->|Valid| SELECT[Select Transformation Type]
    SELECT --> CHECK{Check Free Tier}
    
    CHECK -->|Free Tier Available| TRANSFORM[Transform Image]
    CHECK -->|Free Tier Exhausted| UPGRADE{Has Pricing Tier?}
    
    UPGRADE -->|No| PROMPT[Show Upgrade Prompt]
    PROMPT --> SELECT
    
    UPGRADE -->|Yes| PAY{Payment Required?}
    PAY -->|Yes| PROCESS[Process Payment]
    PROCESS -->|Success| TRANSFORM
    PROCESS -->|Failed| ERROR2[Show Payment Error]
    ERROR2 --> SELECT
    
    PAY -->|No| TRANSFORM
    
    TRANSFORM --> API[Call Gemini API]
    API -->|Success| PREVIEW[Show Preview]
    API -->|Failed| RETRY{Retry Available?}
    
    RETRY -->|Yes| TRANSFORM
    RETRY -->|No| ERROR3[Show Error Message]
    ERROR3 --> SELECT
    
    PREVIEW --> DOWNLOAD[Download Image]
    DOWNLOAD --> SHARE{Share to Social Media?}
    
    SHARE -->|Yes| SOCIAL[Share to Facebook/Twitter/Instagram]
    SHARE -->|No| CLEANUP[Delete Image]
    
    SOCIAL --> CLEANUP
    CLEANUP --> END([Complete])
    
    style START fill:#90EE90
    style END fill:#90EE90
    style ERROR1 fill:#FFB6C1
    style ERROR2 fill:#FFB6C1
    style ERROR3 fill:#FFB6C1
    style PREVIEW fill:#87CEEB
    style DOWNLOAD fill:#87CEEB
```

**Key Steps:**
1. **Upload**: User uploads image (max 10MB, JPEG/PNG/WebP)
2. **Validation**: Client and server-side validation
3. **Free Tier Check**: Check if user has free transformations remaining
4. **Payment**: Process payment if free tier exhausted
5. **Transformation**: Call Gemini API to transform image
6. **Preview**: Show transformed image preview
7. **Download**: User downloads transformed image
8. **Sharing**: Optional social media sharing
9. **Cleanup**: Delete image after download (within 5 minutes)

---

### 2.3 Billing and Payment Flow

Payment processing and billing logic for paid transformations.

```mermaid
sequenceDiagram
    participant User
    participant App
    participant BillingService
    participant PaymentGateway
    participant Database
    
    User->>App: Request Transformation
    App->>BillingService: Check Free Tier
    BillingService->>Database: Get User Free Tier Count
    
    alt Free Tier Available
        Database-->>BillingService: Free Tier Count < 5
        BillingService->>Database: Increment Free Tier Count
        BillingService-->>App: Allow Transformation
    else Free Tier Exhausted
        Database-->>BillingService: Free Tier Count >= 5
        BillingService->>Database: Get User Pricing Tier
        Database-->>BillingService: Pricing Tier Info
        
        alt No Pricing Tier Selected
            BillingService-->>App: Show Upgrade Prompt
            App-->>User: Display Upgrade Options
            User->>App: Select Pricing Tier
            App->>BillingService: Update Pricing Tier
            BillingService->>Database: Save Pricing Tier
        end
        
        BillingService->>Database: Calculate Cost
        Database-->>BillingService: Cost Amount
        
        BillingService->>PaymentGateway: Create Payment Intent
        PaymentGateway-->>User: Payment Form
        User->>PaymentGateway: Enter Payment Details
        PaymentGateway->>PaymentGateway: Process Payment
        
        alt Payment Success
            PaymentGateway-->>BillingService: Payment Success
            BillingService->>Database: Create Billing Record
            BillingService->>Database: Update Usage Tracking
            BillingService-->>App: Payment Confirmed
            App-->>User: Allow Transformation
        else Payment Failed
            PaymentGateway-->>BillingService: Payment Failed
            BillingService-->>App: Payment Error
            App-->>User: Show Error Message
        end
    end
```

**Billing Features:**
- **Free Tier**: 5 free transformations per user
- **Pricing Tiers**: Configurable per-image or monthly limit models
- **Payment Gateways**: Stripe (primary), PayPal (configurable)
- **Usage Tracking**: Track all transformations and billing records

---

## 3. Business Logic

### 3.1 Free Tier Enforcement Flow

Free tier checking and enforcement logic with atomic operations.

```mermaid
sequenceDiagram
    participant User
    participant App
    participant BillingService
    participant Database
    
    User->>App: Request Transformation
    App->>BillingService: Check Free Tier
    BillingService->>Database: Get User Free Tier Count
    
    Database-->>BillingService: Free Tier Count
    
    alt Free Tier Count < 5
        BillingService->>Database: Begin Transaction
        BillingService->>Database: Check Count Again (Atomic)
        Database-->>BillingService: Count < 5
        BillingService->>Database: Increment Count
        BillingService->>Database: Commit Transaction
        BillingService-->>App: Free Tier Available
        App-->>User: Allow Transformation
    else Free Tier Count >= 5
        BillingService->>Database: Get User Pricing Tier
        Database-->>BillingService: Pricing Tier Info
        
        alt No Pricing Tier Selected
            BillingService-->>App: Free Tier Exhausted
            App-->>User: Show Upgrade Prompt
            Note over User: User must select pricing tier
        else Pricing Tier Selected
            BillingService->>Database: Calculate Cost
            Database-->>BillingService: Cost Amount
            BillingService-->>App: Payment Required
            App-->>User: Process Payment
        end
    end
```

**Key Features:**
- **Atomic Operations**: Database transactions prevent race conditions
- **Free Tier Limit**: 5 free transformations per user
- **Upgrade Prompts**: Non-intrusive prompts when free tier exhausted
- **Pricing Tier Selection**: Users can choose per-image or monthly limit models

---

### 3.2 Error Handling Flow

Error categorization and handling for all error types.

```mermaid
flowchart TD
    START([User Action]) --> ACTION[Execute Action]
    ACTION --> SUCCESS{Success?}
    
    SUCCESS -->|Yes| COMPLETE([Complete])
    
    SUCCESS -->|No| CATEGORIZE{Categorize Error}
    
    CATEGORIZE -->|Authentication| AUTH_ERROR[Authentication Error]
    CATEGORIZE -->|Billing| BILLING_ERROR[Billing Error]
    CATEGORIZE -->|API| API_ERROR[API Error]
    CATEGORIZE -->|Network| NETWORK_ERROR[Network Error]
    CATEGORIZE -->|Validation| VALIDATION_ERROR[Validation Error]
    
    AUTH_ERROR --> AUTH_MSG[Show Message:<br/>"Please login again"]
    AUTH_ERROR --> AUTH_LOG[Log Error with Context]
    AUTH_LOG --> AUTH_REDIRECT[Redirect to Login]
    
    BILLING_ERROR --> BILLING_MSG[Show Message:<br/>"Payment failed.<br/>Please check your payment method"]
    BILLING_ERROR --> BILLING_LOG[Log Error with Context]
    BILLING_LOG --> BILLING_RETRY[Offer Retry Option]
    
    API_ERROR --> API_RETRY{Retry Available?}
    API_RETRY -->|Yes| API_RETRY_ACTION[Retry with Exponential Backoff]
    API_RETRY_ACTION --> ACTION
    API_RETRY -->|No| API_MSG[Show Message:<br/>"Transformation failed.<br/>Please try again later"]
    API_ERROR --> API_LOG[Log Error with Context]
    API_LOG --> API_MSG
    
    NETWORK_ERROR --> NETWORK_MSG[Show Message:<br/>"Network error.<br/>Please check your connection"]
    NETWORK_ERROR --> NETWORK_LOG[Log Error with Context]
    NETWORK_LOG --> NETWORK_RETRY[Offer Retry Option]
    
    VALIDATION_ERROR --> VALIDATION_MSG[Show Message:<br/>"Invalid input.<br/>Please check your data"]
    VALIDATION_ERROR --> VALIDATION_LOG[Log Error with Context]
    VALIDATION_LOG --> VALIDATION_FORM[Highlight Form Errors]
    
    style START fill:#90EE90
    style COMPLETE fill:#90EE90
    style AUTH_ERROR fill:#FFB6C1
    style BILLING_ERROR fill:#FFB6C1
    style API_ERROR fill:#FFB6C1
    style NETWORK_ERROR fill:#FFB6C1
    style VALIDATION_ERROR fill:#FFB6C1
```

**Error Categories:**
- **Authentication Errors**: Session expired, invalid credentials
- **Billing Errors**: Payment declined, insufficient funds
- **API Errors**: Gemini API failures, rate limits
- **Network Errors**: Connection timeouts, network issues
- **Validation Errors**: Invalid input, file format issues

---

### 3.3 Configuration Management Flow

Configuration loading and validation at application startup.

```mermaid
graph TB
    START([Application Startup]) --> LOAD[Load Configuration Files]
    
    LOAD --> GEMINI_CONFIG[Load Gemini API Config<br/>config/gemini-api.yaml]
    LOAD --> PRICING_CONFIG[Load Pricing Tiers Config<br/>config/pricing-tiers.yaml]
    LOAD --> PAYMENT_CONFIG[Load Payment Gateway Config<br/>config/payment-gateway.yaml]
    LOAD --> SMS_CONFIG[Load SMS OTP Config<br/>config/sms-otp.yaml]
    
    GEMINI_CONFIG --> VALIDATE1{Validate Gemini Config}
    PRICING_CONFIG --> VALIDATE2{Validate Pricing Config}
    PAYMENT_CONFIG --> VALIDATE3{Validate Payment Config}
    SMS_CONFIG --> VALIDATE4{Validate SMS Config}
    
    VALIDATE1 -->|Invalid| ERROR1[Log Error & Exit]
    VALIDATE1 -->|Valid| STORE1[Store in Memory]
    
    VALIDATE2 -->|Invalid| ERROR2[Log Error & Exit]
    VALIDATE2 -->|Valid| STORE2[Store in Memory]
    
    VALIDATE3 -->|Invalid| ERROR3[Log Error & Exit]
    VALIDATE3 -->|Valid| STORE3[Store in Memory]
    
    VALIDATE4 -->|Invalid| ERROR4[Log Error & Exit]
    VALIDATE4 -->|Valid| STORE4[Store in Memory]
    
    STORE1 --> READY[Application Ready]
    STORE2 --> READY
    STORE3 --> READY
    STORE4 --> READY
    
    READY --> RUNTIME[Runtime Access]
    
    RUNTIME --> ADMIN_CHANGE{Admin Changes Config?}
    ADMIN_CHANGE -->|Yes| UPDATE[Update Config File]
    UPDATE --> RELOAD[Reload Configuration]
    RELOAD --> VALIDATE1
    ADMIN_CHANGE -->|No| RUNTIME
    
    style START fill:#90EE90
    style READY fill:#87CEEB
    style ERROR1 fill:#FFB6C1
    style ERROR2 fill:#FFB6C1
    style ERROR3 fill:#FFB6C1
    style ERROR4 fill:#FFB6C1
```

**Configuration Files:**
- **Gemini API Config**: API key, model settings, rate limits
- **Pricing Tiers Config**: Tier definitions, pricing models, features
- **Payment Gateway Config**: Stripe/PayPal credentials, settings
- **SMS OTP Config**: Twilio credentials, OTP settings

---

## 4. Data Architecture

### 4.1 Database Schema Relationships

Entity-relationship diagram showing all database tables and their relationships.

```mermaid
erDiagram
    USERS ||--o{ TRANSFORMATIONS : has
    USERS ||--o{ BILLING_RECORDS : has
    USERS ||--o{ ADMIN_ACTIONS : performs
    TRANSFORMATION_TYPES ||--o{ TRANSFORMATIONS : used_in
    TRANSFORMATIONS ||--o| BILLING_RECORDS : generates
    
    USERS {
        uuid id PK
        string email
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
        string name
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

**Database Tables:**
- **USERS**: User accounts with authentication and role information
- **TRANSFORMATION_TYPES**: Available transformation types (managed by admins)
- **TRANSFORMATIONS**: Image transformation records with status tracking
- **BILLING_RECORDS**: Payment and billing transaction records
- **ADMIN_ACTIONS**: Audit log for all admin actions

---

## 5. Administration

### 5.1 Admin Dashboard Flow

Complete admin user workflows for system management.

```mermaid
flowchart TD
    START([Admin Login]) --> DASH[Admin Dashboard]
    
    DASH --> STATS[View System Statistics]
    DASH --> TYPES[Manage Transformation Types]
    DASH --> PRICING[Manage Pricing Tiers]
    DASH --> USERS[Manage Users]
    DASH --> LOGS[View Action Logs]
    
    STATS --> STATS_DISPLAY[Display:<br/>- Total Users<br/>- Total Transformations<br/>- Total Revenue<br/>- Active Users]
    
    TYPES --> TYPE_LIST[List Transformation Types]
    TYPE_LIST --> TYPE_ADD[Add New Type]
    TYPE_LIST --> TYPE_EDIT[Edit Existing Type]
    TYPE_LIST --> TYPE_DELETE[Delete Type]
    TYPE_LIST --> TYPE_TOGGLE[Enable/Disable Type]
    
    TYPE_ADD --> TYPE_VALIDATE{Validate}
    TYPE_EDIT --> TYPE_VALIDATE
    TYPE_DELETE --> TYPE_CHECK{In Use?}
    
    TYPE_VALIDATE -->|Valid| TYPE_SAVE[Save to Database]
    TYPE_VALIDATE -->|Invalid| TYPE_ERROR[Show Error]
    TYPE_CHECK -->|No| TYPE_SAVE
    TYPE_CHECK -->|Yes| TYPE_ERROR
    
    TYPE_SAVE --> TYPE_LOG[Log Admin Action]
    TYPE_LOG --> TYPE_LIST
    
    PRICING --> PRICING_LIST[List Pricing Tiers]
    PRICING_LIST --> PRICING_ADD[Add New Tier]
    PRICING_LIST --> PRICING_EDIT[Edit Tier]
    PRICING_LIST --> PRICING_DELETE[Delete Tier]
    
    PRICING_ADD --> PRICING_VALIDATE{Validate}
    PRICING_EDIT --> PRICING_VALIDATE
    PRICING_VALIDATE -->|Valid| PRICING_SAVE[Save to Config File]
    PRICING_VALIDATE -->|Invalid| PRICING_ERROR[Show Error]
    
    PRICING_SAVE --> PRICING_LOG[Log Admin Action]
    PRICING_LOG --> PRICING_LIST
    
    USERS --> USER_LIST[List All Users]
    USER_LIST --> USER_VIEW[View User Details]
    USER_LIST --> USER_ROLE[Change User Role]
    
    USER_VIEW --> USER_STATS[Display:<br/>- Free Tier Usage<br/>- Pricing Tier<br/>- Total Transformations<br/>- Total Spending]
    
    USER_ROLE --> USER_ROLE_SAVE[Save Role Change]
    USER_ROLE_SAVE --> USER_ROLE_LOG[Log Admin Action]
    USER_ROLE_LOG --> USER_LIST
    
    LOGS --> LOG_FILTER[Filter Logs:<br/>- By Admin User<br/>- By Action Type<br/>- By Entity Type<br/>- By Date Range]
    LOG_FILTER --> LOG_DISPLAY[Display Logs]
    
    style START fill:#90EE90
    style DASH fill:#87CEEB
    style TYPE_SAVE fill:#98FB98
    style PRICING_SAVE fill:#98FB98
    style USER_ROLE_SAVE fill:#98FB98
    style TYPE_ERROR fill:#FFB6C1
    style PRICING_ERROR fill:#FFB6C1
```

**Admin Features:**
- **System Statistics**: View total users, transformations, revenue
- **Transformation Type Management**: Add, edit, delete, enable/disable types
- **Pricing Tier Management**: Configure pricing tiers via UI
- **User Management**: View users, change roles, view statistics
- **Action Logging**: Complete audit trail for all admin actions

---

### 5.2 Epic Dependencies and Sequencing

How epics and stories relate and depend on each other.

```mermaid
graph LR
    subgraph "Epic 1: Foundation"
        E1S1[Project Setup]
        E1S2[Database Schema]
        E1S3[Configuration]
        E1S4[Gmail OAuth]
        E1S5[Session Mgmt]
        E1S6[Error Handling]
        
        E1S1 --> E1S2
        E1S2 --> E1S3
        E1S3 --> E1S4
        E1S4 --> E1S5
        E1S5 --> E1S6
    end
    
    subgraph "Epic 2: Transformation"
        E2S1[Image Upload]
        E2S2[Type Mgmt]
        E2S3[Type Selection]
        E2S4[Gemini API]
        E2S5[Processing]
        E2S6[Preview/Download]
        E2S7[Cleanup]
        E2S8[Social Sharing]
        
        E2S1 --> E2S3
        E2S2 --> E2S3
        E2S3 --> E2S4
        E2S4 --> E2S5
        E2S5 --> E2S6
        E2S6 --> E2S7
        E2S6 --> E2S8
    end
    
    subgraph "Epic 3: Billing"
        E3S1[Free Tier Tracking]
        E3S2[Free Tier Enforcement]
        E3S3[Pricing Config]
        E3S4[Pricing Selection]
        E3S5[Payment Gateway]
        E3S6[Usage Tracking]
        E3S7[Upgrade Prompts]
        
        E3S1 --> E3S2
        E3S3 --> E3S4
        E3S2 --> E3S4
        E3S4 --> E3S5
        E3S5 --> E3S6
        E3S6 --> E3S7
        E3S2 --> E3S7
    end
    
    subgraph "Epic 4: Admin"
        E4S1[Admin Dashboard]
        E4S2[Type Mgmt UI]
        E4S3[Pricing Mgmt UI]
        E4S4[Action Logging]
        E4S5[User Mgmt]
        
        E4S1 --> E4S2
        E4S1 --> E4S3
        E4S2 --> E4S4
        E4S3 --> E4S4
    end
    
    subgraph "Epic 5: Enhanced Features"
        E5S1[User Profile]
        E5S2[Profile Stats]
        E5S3[Facebook OAuth]
        E5S4[SMS OTP]
        E5S5[Password Reset]
        E5S6[Logout]
        E5S7[Enhanced Errors]
        
        E5S1 --> E5S2
    end
    
    E1S6 --> E2S1
    E1S4 --> E2S2
    E1S6 --> E3S1
    E2S6 --> E3S2
    E3S6 --> E4S1
    E1S5 --> E5S1
    E3S6 --> E5S2
    
    style E1S1 fill:#FFE4B5
    style E2S1 fill:#E6E6FA
    style E3S1 fill:#F0E68C
    style E4S1 fill:#DDA0DD
    style E5S1 fill:#98FB98
```

**Epic Summary:**
- **Epic 1**: Foundation & Core Infrastructure (6 stories)
- **Epic 2**: Core Transformation Workflow (8 stories)
- **Epic 3**: Free Tier & Billing System (7 stories)
- **Epic 4**: Admin Features & Dashboard (5 stories)
- **Epic 5**: User Profile & Enhanced Features (7 stories)
- **Total**: 33 stories across 5 epics

---

## 6. Deployment & Operations

### 6.1 Deployment Architecture

Infrastructure and deployment components for both primary (Vercel) and alternative (AWS/Azure) deployments.

```mermaid
graph TB
    subgraph "Development Environment"
        DEV[Developer Machine<br/>Local Development]
        GIT[Git Repository<br/>Version Control]
    end
    
    subgraph "CI/CD Pipeline"
        CI[GitHub Actions<br/>CI/CD]
        BUILD[Build Process<br/>Next.js Build]
        TEST_AUTO[Automated Tests<br/>Jest + Playwright]
    end
    
    subgraph "Primary Deployment - Vercel"
        VERCEL[Vercel Platform<br/>Next.js Optimized]
        EDGE[Edge Functions<br/>CDN Distribution]
        PREVIEW[Preview Deployments<br/>PR Previews]
    end
    
    subgraph "Alternative Deployment - AWS/Azure"
        AWS[AWS/Azure<br/>Enterprise Scale]
        EC2[Compute Instances<br/>App Servers]
        RDS[Managed PostgreSQL<br/>Database]
        S3_STORAGE[AWS S3<br/>Image Storage]
        LB[Load Balancer<br/>Traffic Distribution]
    end
    
    subgraph "Database Services"
        DB_PRIMARY[(PostgreSQL<br/>Primary Database)]
        DB_REPLICA[(PostgreSQL<br/>Read Replica)]
        REDIS_DEPLOY[(Redis<br/>Session Store)]
    end
    
    subgraph "External Services"
        GEMINI_EXT[Google Gemini API<br/>Image Transformation]
        STRIPE_EXT[Stripe<br/>Payment Gateway]
        TWILIO_EXT[Twilio<br/>SMS OTP]
        OAUTH_EXT[OAuth Providers<br/>Gmail, Facebook]
    end
    
    subgraph "Monitoring & Logging"
        MONITOR[Application Monitoring<br/>Error Tracking]
        LOGS[Log Aggregation<br/>Centralized Logging]
        ALERTS[Alerting System<br/>Critical Notifications]
    end
    
    DEV --> GIT
    GIT --> CI
    CI --> BUILD
    CI --> TEST_AUTO
    BUILD --> VERCEL
    BUILD --> AWS
    
    VERCEL --> EDGE
    VERCEL --> PREVIEW
    VERCEL --> DB_PRIMARY
    VERCEL --> REDIS_DEPLOY
    VERCEL --> GEMINI_EXT
    VERCEL --> STRIPE_EXT
    VERCEL --> TWILIO_EXT
    VERCEL --> OAUTH_EXT
    
    AWS --> EC2
    EC2 --> LB
    LB --> EC2
    EC2 --> RDS
    EC2 --> S3_STORAGE
    EC2 --> REDIS_DEPLOY
    EC2 --> GEMINI_EXT
    EC2 --> STRIPE_EXT
    EC2 --> TWILIO_EXT
    EC2 --> OAUTH_EXT
    
    RDS --> DB_PRIMARY
    DB_PRIMARY --> DB_REPLICA
    
    VERCEL --> MONITOR
    AWS --> MONITOR
    MONITOR --> LOGS
    MONITOR --> ALERTS
    
    style VERCEL fill:#87CEEB
    style AWS fill:#FFA500
    style DB_PRIMARY fill:#98FB98
    style MONITOR fill:#DDA0DD
```

**Deployment Options:**
- **Primary**: Vercel (Next.js optimized, zero-config, CDN, edge functions)
- **Alternative**: AWS/Azure (enterprise scale, more control, lower cost at scale)
- **Database**: Managed PostgreSQL with read replicas
- **Monitoring**: Application monitoring, log aggregation, alerting

---

### 6.2 Deployment Flow

Complete deployment process from code commit to production.

```mermaid
flowchart TD
    START([Code Commit]) --> PUSH[Push to Git Repository]
    PUSH --> TRIGGER{CI/CD Trigger}
    
    TRIGGER -->|Pull Request| PR_BUILD[PR Build]
    TRIGGER -->|Main Branch| PROD_BUILD[Production Build]
    
    PR_BUILD --> PR_TEST[Run Tests]
    PR_TEST --> PR_BUILD_APP[Build Application]
    PR_BUILD_APP --> PR_DEPLOY[Deploy to Preview]
    PR_DEPLOY --> PR_REVIEW[PR Review Environment]
    
    PROD_BUILD --> PROD_TEST[Run All Tests]
    PROD_TEST --> TEST_RESULT{All Tests Pass?}
    
    TEST_RESULT -->|No| FAIL[Build Failed]
    FAIL --> NOTIFY[Notify Developer]
    NOTIFY --> FIX[Fix Issues]
    FIX --> START
    
    TEST_RESULT -->|Yes| BUILD_APP[Build Application]
    BUILD_APP --> BUILD_OPTIMIZE[Optimize Build]
    BUILD_OPTIMIZE --> BUILD_VALIDATE{Validate Build?}
    
    BUILD_VALIDATE -->|Invalid| FAIL
    BUILD_VALIDATE -->|Valid| DEPLOY_TYPE{Deployment Type?}
    
    DEPLOY_TYPE -->|Vercel| VERCEL_DEPLOY[Deploy to Vercel]
    DEPLOY_TYPE -->|AWS/Azure| AWS_DEPLOY[Deploy to AWS/Azure]
    
    VERCEL_DEPLOY --> VERCEL_CDN[CDN Distribution]
    VERCEL_CDN --> VERCEL_EDGE[Edge Functions]
    VERCEL_EDGE --> VERCEL_HEALTH[Health Check]
    
    AWS_DEPLOY --> AWS_EC2[Deploy to EC2]
    AWS_EC2 --> AWS_LB[Load Balancer]
    AWS_LB --> AWS_HEALTH[Health Check]
    
    VERCEL_HEALTH --> HEALTH_CHECK{Health Check Pass?}
    AWS_HEALTH --> HEALTH_CHECK
    
    HEALTH_CHECK -->|No| ROLLBACK[Rollback Deployment]
    ROLLBACK --> NOTIFY
    
    HEALTH_CHECK -->|Yes| SMOKE_TEST[Smoke Tests]
    SMOKE_TEST --> SMOKE_RESULT{Smoke Tests Pass?}
    
    SMOKE_RESULT -->|No| ROLLBACK
    SMOKE_RESULT -->|Yes| PROD_LIVE[Production Live]
    
    PROD_LIVE --> MONITOR[Start Monitoring]
    MONITOR --> ALERT{Issues Detected?}
    
    ALERT -->|Yes| AUTO_ROLLBACK[Auto-Rollback if Critical]
    ALERT -->|No| SUCCESS([Deployment Success])
    
    AUTO_ROLLBACK --> ROLLBACK
    
    style START fill:#90EE90
    style SUCCESS fill:#90EE90
    style FAIL fill:#FFB6C1
    style ROLLBACK fill:#FFB6C1
    style PROD_LIVE fill:#87CEEB
```

**Deployment Stages:**
1. **Code Commit**: Developer commits code to Git
2. **CI/CD Trigger**: GitHub Actions triggered on PR or main branch
3. **Testing**: Run all tests (unit, integration, E2E)
4. **Build**: Build Next.js application
5. **Deploy**: Deploy to Vercel or AWS/Azure
6. **Health Check**: Verify deployment health
7. **Smoke Tests**: Run critical path tests
8. **Monitoring**: Start monitoring and alerting
9. **Auto-Rollback**: Automatic rollback on critical issues

---

### 6.3 CI/CD Pipeline Flow

Complete CI/CD pipeline from source control to deployment.

```mermaid
flowchart LR
    subgraph "Source Control"
        GIT[Git Repository<br/>GitHub/GitLab]
        PR[Pull Request]
        MAIN[Main Branch]
    end
    
    subgraph "CI Pipeline"
        LINT[Lint Code<br/>ESLint]
        FORMAT[Format Code<br/>Prettier]
        UNIT_CI[Unit Tests<br/>Jest]
        INT_CI[Integration Tests<br/>Jest]
        BUILD_CI[Build Application<br/>Next.js]
        E2E_CI[E2E Tests<br/>Playwright]
    end
    
    subgraph "Quality Gates"
        COVERAGE[Code Coverage<br/>>= 70%]
        SECURITY[Security Scan<br/>Dependencies]
        QUALITY[Quality Check<br/>Code Review]
    end
    
    subgraph "Deployment"
        PREVIEW_DEPLOY[Preview Deployment<br/>Vercel Preview]
        STAGING_DEPLOY[Staging Deployment<br/>Staging Environment]
        PROD_DEPLOY[Production Deployment<br/>Vercel/AWS]
    end
    
    subgraph "Post-Deployment"
        SMOKE[Smoke Tests<br/>Health Checks]
        MONITOR_DEPLOY[Monitoring<br/>Error Tracking]
        ROLLBACK_DEPLOY[Auto-Rollback<br/>If Critical Issues]
    end
    
    GIT --> PR
    GIT --> MAIN
    
    PR --> LINT
    MAIN --> LINT
    
    LINT --> FORMAT
    FORMAT --> UNIT_CI
    UNIT_CI --> INT_CI
    INT_CI --> BUILD_CI
    BUILD_CI --> E2E_CI
    
    E2E_CI --> COVERAGE
    COVERAGE --> SECURITY
    SECURITY --> QUALITY
    
    QUALITY -->|PR| PREVIEW_DEPLOY
    QUALITY -->|Main| STAGING_DEPLOY
    
    PREVIEW_DEPLOY --> SMOKE
    STAGING_DEPLOY --> SMOKE
    SMOKE --> PROD_DEPLOY
    
    PROD_DEPLOY --> MONITOR_DEPLOY
    MONITOR_DEPLOY --> ROLLBACK_DEPLOY
    
    ROLLBACK_DEPLOY -->|Issues| PROD_DEPLOY
    
    style GIT fill:#90EE90
    style QUALITY fill:#FFE4B5
    style PROD_DEPLOY fill:#87CEEB
    style MONITOR_DEPLOY fill:#DDA0DD
    style ROLLBACK_DEPLOY fill:#FFB6C1
```

**CI/CD Stages:**
1. **Lint & Format**: Code quality checks
2. **Testing**: Unit, integration, and E2E tests
3. **Build**: Next.js application build
4. **Quality Gates**: Coverage, security, code review
5. **Deployment**: Preview (PR), Staging, Production
6. **Post-Deployment**: Smoke tests, monitoring, auto-rollback

---

## 7. Testing & Quality

### 7.1 Testing Architecture & Flow

Testing pyramid and test infrastructure for comprehensive test coverage.

```mermaid
graph TB
    subgraph "Testing Pyramid"
        UNIT[Unit Tests<br/>70% Coverage<br/>Jest]
        INTEGRATION[Integration Tests<br/>20% Coverage<br/>Jest]
        E2E[E2E Tests<br/>10% Coverage<br/>Playwright]
    end
    
    subgraph "Unit Testing"
        UNIT_COMP[Component Tests<br/>React Components]
        UNIT_SERVICE[Service Tests<br/>Business Logic]
        UNIT_UTIL[Utility Tests<br/>Helper Functions]
        UNIT_API[API Route Tests<br/>Next.js API Routes]
    end
    
    subgraph "Integration Testing"
        INT_DB[Database Tests<br/>Prisma + PostgreSQL]
        INT_AUTH[Authentication Tests<br/>OAuth + SMS OTP]
        INT_PAYMENT[Payment Tests<br/>Stripe/PayPal Mock]
        INT_API[API Integration Tests<br/>External Services]
    end
    
    subgraph "E2E Testing"
        E2E_USER[User Flows<br/>Complete Workflows]
        E2E_CRITICAL[Critical Paths<br/>Authentication, Transformation, Billing]
        E2E_CROSS[Cross-Browser Tests<br/>Chrome, Firefox, Safari]
    end
    
    subgraph "Test Infrastructure"
        TEST_ENV[Test Environment<br/>Isolated Database]
        MOCK_SERVICES[Mock Services<br/>External APIs]
        TEST_DATA[Test Data<br/>Fixtures & Factories]
        CI_TEST[CI/CD Integration<br/>Automated Testing]
    end
    
    UNIT --> UNIT_COMP
    UNIT --> UNIT_SERVICE
    UNIT --> UNIT_UTIL
    UNIT --> UNIT_API
    
    INTEGRATION --> INT_DB
    INTEGRATION --> INT_AUTH
    INTEGRATION --> INT_PAYMENT
    INTEGRATION --> INT_API
    
    E2E --> E2E_USER
    E2E --> E2E_CRITICAL
    E2E --> E2E_CROSS
    
    UNIT_COMP --> TEST_ENV
    UNIT_SERVICE --> TEST_ENV
    INT_DB --> TEST_ENV
    INT_AUTH --> MOCK_SERVICES
    INT_PAYMENT --> MOCK_SERVICES
    INT_API --> MOCK_SERVICES
    E2E_USER --> TEST_ENV
    E2E_CRITICAL --> TEST_ENV
    
    TEST_ENV --> TEST_DATA
    MOCK_SERVICES --> TEST_DATA
    
    UNIT --> CI_TEST
    INTEGRATION --> CI_TEST
    E2E --> CI_TEST
    
    style UNIT fill:#90EE90
    style INTEGRATION fill:#87CEEB
    style E2E fill:#DDA0DD
    style TEST_ENV fill:#FFE4B5
    style CI_TEST fill:#FFA500
```

**Testing Strategy:**
- **Unit Tests (70%)**: Component, service, utility, API route tests
- **Integration Tests (20%)**: Database, authentication, payment, API integration tests
- **E2E Tests (10%)**: User flows, critical paths, cross-browser tests
- **Test Infrastructure**: Isolated test environment, mock services, test data, CI/CD integration

---

### 7.2 Testing Flow

Test execution workflow from code change to CI/CD integration.

```mermaid
flowchart TD
    START([Code Change]) --> WRITE[Write Tests]
    
    WRITE --> UNIT_TEST[Unit Tests]
    WRITE --> INT_TEST[Integration Tests]
    WRITE --> E2E_TEST[E2E Tests]
    
    UNIT_TEST --> RUN_UNIT[Run Unit Tests]
    INT_TEST --> RUN_INT[Run Integration Tests]
    E2E_TEST --> RUN_E2E[Run E2E Tests]
    
    RUN_UNIT --> UNIT_RESULT{Unit Tests Pass?}
    RUN_INT --> INT_RESULT{Integration Tests Pass?}
    RUN_E2E --> E2E_RESULT{E2E Tests Pass?}
    
    UNIT_RESULT -->|No| FIX_UNIT[Fix Unit Test Failures]
    INT_RESULT -->|No| FIX_INT[Fix Integration Test Failures]
    E2E_RESULT -->|No| FIX_E2E[Fix E2E Test Failures]
    
    FIX_UNIT --> RUN_UNIT
    FIX_INT --> RUN_INT
    FIX_E2E --> RUN_E2E
    
    UNIT_RESULT -->|Yes| COVERAGE_CHECK{Code Coverage >= 70%?}
    INT_RESULT -->|Yes| COVERAGE_CHECK
    E2E_RESULT -->|Yes| COVERAGE_CHECK
    
    COVERAGE_CHECK -->|No| ADD_TESTS[Add More Tests]
    ADD_TESTS --> WRITE
    
    COVERAGE_CHECK -->|Yes| ALL_PASS{All Tests Pass?}
    
    ALL_PASS -->|No| FIX_ALL[Fix All Failures]
    FIX_ALL --> WRITE
    
    ALL_PASS -->|Yes| CI_TRIGGER[Trigger CI/CD]
    
    CI_TRIGGER --> CI_UNIT[CI: Run Unit Tests]
    CI_TRIGGER --> CI_INT[CI: Run Integration Tests]
    CI_TRIGGER --> CI_E2E[CI: Run E2E Tests]
    
    CI_UNIT --> CI_UNIT_RESULT{CI Unit Tests Pass?}
    CI_INT --> CI_INT_RESULT{CI Integration Tests Pass?}
    CI_E2E --> CI_E2E_RESULT{CI E2E Tests Pass?}
    
    CI_UNIT_RESULT -->|No| CI_FAIL[CI Build Failed]
    CI_INT_RESULT -->|No| CI_FAIL
    CI_E2E_RESULT -->|No| CI_FAIL
    
    CI_FAIL --> NOTIFY_DEV[Notify Developer]
    NOTIFY_DEV --> FIX_ALL
    
    CI_UNIT_RESULT -->|Yes| CI_ALL_PASS{All CI Tests Pass?}
    CI_INT_RESULT -->|Yes| CI_ALL_PASS
    CI_E2E_RESULT -->|Yes| CI_ALL_PASS
    
    CI_ALL_PASS -->|No| CI_FAIL
    CI_ALL_PASS -->|Yes| DEPLOY[Proceed to Deployment]
    
    DEPLOY --> SUCCESS([Tests Complete])
    
    style START fill:#90EE90
    style SUCCESS fill:#90EE90
    style CI_FAIL fill:#FFB6C1
    style FIX_UNIT fill:#FFB6C1
    style FIX_INT fill:#FFB6C1
    style FIX_E2E fill:#FFB6C1
    style COVERAGE_CHECK fill:#FFE4B5
    style DEPLOY fill:#87CEEB
```

**Testing Process:**
1. **Write Tests**: Create unit, integration, and E2E tests
2. **Run Tests**: Execute tests locally
3. **Fix Failures**: Address any test failures
4. **Coverage Check**: Ensure code coverage >= 70%
5. **CI/CD Integration**: Run tests in CI/CD pipeline
6. **Deploy**: Proceed to deployment if all tests pass

---

### 7.3 Test Coverage by Feature

Testing breakdown by feature area showing unit, integration, and E2E coverage.

```mermaid
graph LR
    subgraph "Authentication Features"
        AUTH_UNIT[Unit: 80%<br/>Auth Logic]
        AUTH_INT[Integration: 15%<br/>OAuth Flow]
        AUTH_E2E[E2E: 5%<br/>Login Flow]
    end
    
    subgraph "Transformation Features"
        TRANS_UNIT[Unit: 75%<br/>Transformation Logic]
        TRANS_INT[Integration: 20%<br/>Gemini API]
        TRANS_E2E[E2E: 5%<br/>Transform Flow]
    end
    
    subgraph "Billing Features"
        BILLING_UNIT[Unit: 85%<br/>Billing Logic]
        BILLING_INT[Integration: 10%<br/>Payment Gateway]
        BILLING_E2E[E2E: 5%<br/>Payment Flow]
    end
    
    subgraph "Admin Features"
        ADMIN_UNIT[Unit: 70%<br/>Admin Logic]
        ADMIN_INT[Integration: 20%<br/>Admin APIs]
        ADMIN_E2E[E2E: 10%<br/>Admin Workflows]
    end
    
    subgraph "User Profile Features"
        PROFILE_UNIT[Unit: 75%<br/>Profile Logic]
        PROFILE_INT[Integration: 15%<br/>Profile APIs]
        PROFILE_E2E[E2E: 10%<br/>Profile Flow]
    end
    
    AUTH_UNIT --> AUTH_INT
    AUTH_INT --> AUTH_E2E
    
    TRANS_UNIT --> TRANS_INT
    TRANS_INT --> TRANS_E2E
    
    BILLING_UNIT --> BILLING_INT
    BILLING_INT --> BILLING_E2E
    
    ADMIN_UNIT --> ADMIN_INT
    ADMIN_INT --> ADMIN_E2E
    
    PROFILE_UNIT --> PROFILE_INT
    PROFILE_INT --> PROFILE_E2E
    
    style AUTH_UNIT fill:#90EE90
    style TRANS_UNIT fill:#90EE90
    style BILLING_UNIT fill:#90EE90
    style ADMIN_UNIT fill:#90EE90
    style PROFILE_UNIT fill:#90EE90
    
    style AUTH_INT fill:#87CEEB
    style TRANS_INT fill:#87CEEB
    style BILLING_INT fill:#87CEEB
    style ADMIN_INT fill:#87CEEB
    style PROFILE_INT fill:#87CEEB
    
    style AUTH_E2E fill:#DDA0DD
    style TRANS_E2E fill:#DDA0DD
    style BILLING_E2E fill:#DDA0DD
    style ADMIN_E2E fill:#DDA0DD
    style PROFILE_E2E fill:#DDA0DD
```

**Feature Coverage:**
- **Authentication**: 80% unit, 15% integration, 5% E2E
- **Transformation**: 75% unit, 20% integration, 5% E2E
- **Billing**: 85% unit, 10% integration, 5% E2E
- **Admin**: 70% unit, 20% integration, 10% E2E
- **User Profile**: 75% unit, 15% integration, 10% E2E

---

## Summary

This visual summary document provides a comprehensive overview of the PixShift application through 16 detailed diagrams covering:

1. **System Architecture** - Complete system components and relationships
2. **User Flows** - Authentication, transformation, and billing workflows
3. **Business Logic** - Free tier enforcement, error handling, configuration management
4. **Data Architecture** - Database schema and relationships
5. **Administration** - Admin dashboard and epic dependencies
6. **Deployment & Operations** - Deployment architecture, flow, and CI/CD pipeline
7. **Testing & Quality** - Testing architecture, flow, and coverage by feature

All diagrams are based on the Product Requirements Document (PRD) and represent the complete system design for the PixShift MVP.

---

## Diagram Usage

These diagrams can be viewed in:
- **GitHub/GitLab**: Mermaid diagrams render automatically in markdown files
- **VS Code**: Install "Markdown Preview Mermaid Support" extension
- **Online**: Copy Mermaid code to [Mermaid Live Editor](https://mermaid.live)
- **Documentation Tools**: Most modern documentation tools support Mermaid

---

**Note:** These diagrams are based on the PRD and may need updates as the architecture evolves.

