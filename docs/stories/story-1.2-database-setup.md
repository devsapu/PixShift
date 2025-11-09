# Story 1.2: Database Setup & User Schema

**Epic:** Epic 1: Foundation & Core Infrastructure  
**Story ID:** 1.2  
**Status:** Pending  
**Estimated Time:** 2-4 hours

---

## User Story

**As a** developer,  
**I want** PostgreSQL database configured with user schema and migrations,  
**so that** I can store and retrieve user account data.

---

## Prerequisites

Story 1.1 (Project Setup)

---

## Acceptance Criteria

1. PostgreSQL database connection configured
2. Database connection string stored in environment variables
3. ORM (Prisma or TypeORM) configured and working
4. User table schema created with required fields:
   - id (UUID, primary key)
   - email (VARCHAR, unique, nullable)
   - phone (VARCHAR, nullable)
   - auth_provider (ENUM: 'gmail', 'facebook', 'mobile')
   - role (ENUM: 'admin', 'guest', default 'guest')
   - free_tier_used (INT, default 0)
   - pricing_tier (VARCHAR, nullable)
   - created_at (TIMESTAMP)
   - updated_at (TIMESTAMP)
5. Database migrations system working (can create and run migrations)
6. Database connection tested and verified
7. User model/entity created with TypeScript types
8. Database connection pooling configured
9. Database connection error handling implemented
10. Migration files version controlled

---

## Non-Functional Requirements

- Database queries complete within 100ms (NFR10)
- Connection pooling configured appropriately
- Database credentials stored securely (environment variables)

---

## Technical Notes

- Use Prisma ORM (as per technical decision)
- Configure PostgreSQL 14+
- Set up connection pooling
- Create user schema with all required fields
- Implement proper error handling

---

## Dependencies

- Story 1.1: Project Setup & Health Check

---

## Related Stories

- Story 1.4: Gmail OAuth Authentication (depends on this story)

