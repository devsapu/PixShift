# Story 3.7: Upgrade Prompts & Billing History

**Epic:** Epic 3: Free Tier & Billing System  
**Story ID:** 3.7  
**Status:** Pending  
**Estimated Time:** 2-4 hours

---

## User Story

**As a** guest user,  
**I want** to see upgrade prompts when free tier is exhausted and view my billing history,  
**so that** I can upgrade to paid tier and track my spending.

---

## Prerequisites

Story 3.6 (Usage Tracking & Billing Records), Story 3.2 (Free Tier Enforcement)

---

## Acceptance Criteria

1. Upgrade prompt displayed when free tier exhausted (FR16):
   - Non-intrusive but visible
   - Clear call-to-action
   - Link to pricing tier selection
2. Upgrade prompt API endpoint (`GET /api/users/:id/upgrade-prompt`)
3. Billing history UI implemented (FR17c):
   - Display past transactions
   - Show transaction date, amount, status
   - Show transformation details
4. Billing history API endpoint (`GET /api/users/:id/billing-history`)
5. Billing history tested:
   - Display billing history correctly
   - Filter by date range
   - Handle empty billing history
6. Upgrade prompt tested:
   - Display when free tier exhausted
   - Link to pricing tier selection
   - Handle various scenarios
7. Upgrade prompt accessible via keyboard (accessibility)
8. Billing history accessible via keyboard (accessibility)
9. Upgrade prompt and billing history tested with various scenarios
10. Upgrade prompt and billing history error handling implemented (FR15)

---

## Non-Functional Requirements

- Upgrade prompt displayed when free tier exhausted (FR16)
- Billing history accessible (FR17c)
- Upgrade prompt and billing history accessible (accessibility)

---

## Technical Notes

- Display upgrade prompt when free tier exhausted
- Show billing history with transaction details
- Allow filtering by date range
- Test accessibility features

---

## Dependencies

- Story 3.6: Usage Tracking & Billing Records
- Story 3.2: Free Tier Enforcement

---

## Related Stories

- None (completes Epic 3)

