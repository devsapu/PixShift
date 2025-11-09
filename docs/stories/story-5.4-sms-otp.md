# Story 5.4: SMS OTP Authentication

**Epic:** Epic 5: User Profile & Enhanced Features  
**Story ID:** 5.4  
**Status:** Pending  
**Estimated Time:** 2-4 hours

---

## User Story

**As a** user,  
**I want** to register and login using my mobile number with SMS OTP,  
**so that** I can access the application without using social media accounts.

---

## Prerequisites

Epic 1 Story 1.4 (Gmail OAuth Authentication)

---

## Acceptance Criteria

1. SMS OTP service integrated (Twilio or AWS SNS)
2. SMS OTP configuration loaded from configuration file
3. Mobile number input UI implemented
4. OTP code input UI implemented
5. OTP generation and sending implemented:
   - Generate 6-digit OTP code
   - Send OTP via SMS
   - OTP expires after 5 minutes (NFR19)
   - OTP is single-use only (NFR19)
6. OTP verification implemented:
   - Verify OTP code
   - Check OTP expiration
   - Check OTP usage status
7. User registration flow: New mobile users are automatically registered
8. User login flow: Existing mobile users can login
9. User record created in database with:
   - phone from mobile number
   - auth_provider set to 'mobile'
   - role set to 'guest' (default)
   - free_tier_used initialized to 0
10. SMS OTP errors handled gracefully with user-friendly messages

---

## Non-Functional Requirements

- OTP codes expire within 5 minutes (NFR19)
- OTP codes are single-use only (NFR19)
- OTP errors logged for debugging (NFR13)
- OTP flow completes within 10 seconds

---

## Technical Notes

- Use Twilio for SMS OTP (as per technical decision)
- Generate 6-digit OTP codes
- Store OTP in Redis with expiration
- Verify OTP before authentication
- Test OTP flow thoroughly

---

## Dependencies

- Story 1.4: Gmail OAuth Authentication

---

## Related Stories

- Story 5.3: Facebook OAuth Authentication (alternative authentication method)

