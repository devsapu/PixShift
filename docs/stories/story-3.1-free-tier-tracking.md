# Story 3.1: Free Tier Tracking & Display

**Epic:** Epic 3: Free Tier & Billing System  
**Story ID:** 3.1  
**Status:** Completed  
**Estimated Time:** 2-4 hours

---

## User Story

**As a** guest user,  
**I want** to see my remaining free tier transformations,  
**so that** I know how many free transformations I have left.

---

## Prerequisites

Epic 1 (User Schema), Epic 2 (Transformation Processing)

---

## Acceptance Criteria

1. Free tier counter initialized to 0 on user registration (FR2a)
2. Free tier counter increments atomically after successful transformation (FR2)
3. Free tier counter persists across user sessions (FR2b)
4. Free tier counter displayed in user dashboard (FR22):
   - Shows remaining count (e.g., "3 of 5 free transformations remaining")
   - Updates in real-time after transformation
5. Free tier counter API endpoint (`GET /api/users/:id/free-tier`)
6. Free tier counter updated atomically (database transaction) (FR2)
7. Free tier counter tested:
   - Initialization on registration
   - Increment after transformation
   - Persistence across sessions
   - Atomic updates (no race conditions)
8. Free tier counter displayed prominently in UI
9. Free tier counter accessible via keyboard (accessibility)
10. Free tier counter tested with various scenarios

---

## Non-Functional Requirements

- Free tier counter persists across sessions (FR2b)
- Free tier counter updates atomically (no race conditions)
- Free tier counter displayed prominently (FR22)

---

## Technical Notes

- Initialize free_tier_used to 0 on user registration
- Increment atomically using database transactions
- Display prominently in user dashboard
- Test atomic updates to prevent race conditions

---

## Dependencies

- Epic 1: Foundation & Core Infrastructure
- Epic 2: Core Transformation Workflow

---

## Related Stories

- Story 3.2: Free Tier Enforcement (uses free tier counter)

