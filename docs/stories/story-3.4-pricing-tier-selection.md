# Story 3.4: Pricing Tier Selection

**Epic:** Epic 3: Free Tier & Billing System  
**Story ID:** 3.4  
**Status:** Pending  
**Estimated Time:** 2-4 hours

---

## User Story

**As a** guest user,  
**I want** to select my pricing tier and pricing model,  
**so that** I can choose how to pay for transformations.

---

## Prerequisites

Story 3.3 (Pricing Tier Configuration), Story 3.2 (Free Tier Enforcement)

---

## Acceptance Criteria

1. Pricing tier selection UI implemented:
   - Pricing tier comparison table (FR4d2)
   - Pricing information displayed clearly (FR4d1):
     - Cost per image (if per-image model)
     - Monthly limit (if monthly limit model)
   - Pricing model selection (per-image cost or monthly limit) (FR4d)
2. Pricing tier selection API endpoint (`POST /api/users/:id/pricing-tier`)
3. User pricing tier stored in database (FR4b)
4. Pricing tier selection validated:
   - Pricing tiers must be configured (FR4d3)
   - Selected tier must exist
   - Pricing model must be valid
5. Pricing tier selection tested:
   - Display pricing tiers correctly
   - Select pricing tier successfully
   - Validate pricing tier selection
   - Handle invalid selections
6. Pricing tier selection persisted in user profile
7. Pricing tier selection accessible via keyboard (accessibility)
8. Pricing tier selection tested with various scenarios
9. Pricing tier selection error handling implemented (FR15)
10. Pricing tier selection logged for audit purposes

---

## Non-Functional Requirements

- Pricing tiers must be configured before selection (FR4d3)
- Pricing information displayed clearly (FR4d1)
- Pricing tier selection accessible (accessibility)

---

## Technical Notes

- Display pricing tiers in comparison table
- Allow user to select pricing tier
- Store selection in database
- Validate selection
- Test accessibility

---

## Dependencies

- Story 3.3: Pricing Tier Configuration
- Story 3.2: Free Tier Enforcement

---

## Related Stories

- Story 3.5: Payment Gateway Integration (uses selected pricing tier)

