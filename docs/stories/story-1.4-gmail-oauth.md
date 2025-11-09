# Story 1.4: Gmail OAuth Authentication

**Epic:** Epic 1: Foundation & Core Infrastructure  
**Story ID:** 1.4  
**Status:** Pending  
**Estimated Time:** 2-4 hours

---

## User Story

**As a** user,  
**I want** to register and login using my Gmail account,  
**so that** I can access the application without creating a separate account.

---

## Prerequisites

Story 1.2 (Database Setup), Story 1.3 (Configuration System)

---

## Acceptance Criteria

1. Google OAuth 2.0 credentials configured (client ID, client secret)
2. OAuth library installed (NextAuth.js or Passport.js)
3. OAuth callback endpoint implemented (`/api/auth/callback/google`)
4. User registration flow: New Gmail users are automatically registered
5. User login flow: Existing Gmail users can login
6. User record created in database with:
   - email from Google account
   - auth_provider set to 'gmail'
   - role set to 'guest' (default)
   - free_tier_used initialized to 0
7. OAuth tokens stored securely (encrypted in database)
8. OAuth errors handled gracefully with user-friendly messages
9. OAuth flow tested and working end-to-end
10. User redirected to dashboard after successful authentication

---

## Non-Functional Requirements

- OAuth tokens encrypted in storage (NFR8)
- OAuth errors logged for debugging (NFR13)
- OAuth flow completes within 10 seconds

---

## Technical Notes

- Use NextAuth.js for OAuth (as per technical decision)
- Configure Google OAuth 2.0 credentials
- Implement secure token storage
- Handle OAuth errors gracefully
- Test end-to-end OAuth flow

---

## Dependencies

- Story 1.2: Database Setup & User Schema
- Story 1.3: Configuration System

---

## Related Stories

- Story 1.5: Session Management (depends on this story)
- Story 5.3: Facebook OAuth Authentication (similar pattern)

