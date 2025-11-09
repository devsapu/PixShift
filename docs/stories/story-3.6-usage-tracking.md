# Story 3.6: Usage Tracking & Billing Records

**Epic:** Epic 3: Free Tier & Billing System  
**Story ID:** 3.6  
**Status:** Pending  
**Estimated Time:** 2-4 hours

---

## User Story

**As a** system,  
**I want** to track user usage and generate billing records,  
**so that** I can bill users accurately for paid transformations.

---

## Prerequisites

Story 3.5 (Payment Gateway Integration), Epic 2 (Transformation Processing)

---

## Acceptance Criteria

1. Usage tracking database table created:
   - user_id (UUID, foreign key to users)
   - pricing_tier (VARCHAR)
   - transformations_count (INT)
   - total_cost (DECIMAL)
   - last_updated (TIMESTAMP)
2. Billing records database table created:
   - id (UUID, primary key)
   - user_id (UUID, foreign key to users)
   - transformation_id (UUID, foreign key to transformations)
   - amount (DECIMAL)
   - currency (VARCHAR, default 'USD')
   - status (ENUM: 'pending', 'completed', 'failed', 'refunded')
   - payment_gateway_transaction_id (VARCHAR, nullable)
   - created_at (TIMESTAMP)
3. Usage tracking implemented (FR17, FR17a):
   - Track transformations per user
   - Track pricing tier per user
   - Track cost per transformation
   - Update usage after each paid transformation
4. Billing record generation implemented (FR17b):
   - Create billing record after successful payment
   - Link billing record to transformation
   - Store payment gateway transaction ID
5. Usage tracking tested:
   - Track usage correctly
   - Update usage after transformation
   - Handle concurrent requests
6. Billing record generation tested:
   - Create billing record on payment success
   - Link billing record to transformation
   - Handle payment failures
7. Usage tracking and billing records logged for audit purposes
8. Usage tracking and billing records tested with various scenarios
9. Usage tracking and billing records performance verified
10. Usage tracking and billing records error handling implemented (FR15)

---

## Non-Functional Requirements

- Usage tracking accurate (FR17, FR17a)
- Billing records generated correctly (FR17b)
- Usage tracking and billing records logged for audit

---

## Technical Notes

- Create usage tracking and billing records tables
- Track usage after each paid transformation
- Generate billing records after successful payment
- Log all transactions for audit
- Test with concurrent requests

---

## Dependencies

- Story 3.5: Payment Gateway Integration
- Epic 2: Core Transformation Workflow

---

## Related Stories

- Story 3.7: Upgrade Prompts & Billing History (displays billing history)

