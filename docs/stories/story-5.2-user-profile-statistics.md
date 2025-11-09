# Story 5.2: User Profile Statistics & Pricing Tier Display

**Epic:** Epic 5: User Profile & Enhanced Features  
**Story ID:** 5.2  
**Status:** Pending  
**Estimated Time:** 2-4 hours

---

## User Story

**As a** guest user,  
**I want** to view my current pricing tier and usage statistics in my profile,  
**so that** I can track my usage and understand my account status.

---

## Prerequisites

Story 5.1 (User Profile Management), Epic 3 (Billing System)

---

## Acceptance Criteria

1. User profile statistics display implemented (FR28):
   - Current pricing tier displayed
   - Usage statistics displayed:
     - Total transformations
     - Free tier usage (used/remaining)
     - Total spending
     - Current pricing tier
2. User profile statistics API endpoint (`GET /api/users/:id/statistics`)
3. Usage statistics calculated from database:
   - Total transformations: COUNT(*) FROM transformations WHERE user_id = ?
   - Free tier usage: free_tier_used FROM users WHERE id = ?
   - Total spending: SUM(amount) FROM billing_records WHERE user_id = ? AND status = 'completed'
   - Current pricing tier: pricing_tier FROM users WHERE id = ?
4. Usage statistics updated in real-time or cached appropriately
5. Usage statistics displayed with clear formatting
6. Usage statistics tested:
   - Display correct statistics
   - Update statistics correctly
   - Handle empty data
7. Usage statistics accessible only to profile owner
8. Usage statistics accessible via keyboard (accessibility)
9. Usage statistics tested with various scenarios
10. Usage statistics performance verified

---

## Non-Functional Requirements

- Usage statistics calculated efficiently (within 500ms)
- Usage statistics accessible only to profile owner
- Usage statistics accessible (accessibility)

---

## Technical Notes

- Calculate statistics from database
- Display in user profile
- Cache statistics appropriately
- Test performance
- Test accessibility

---

## Dependencies

- Story 5.1: User Profile Management
- Epic 3: Free Tier & Billing System

---

## Related Stories

- None (extends profile)

