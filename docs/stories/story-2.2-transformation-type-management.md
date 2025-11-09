# Story 2.2: Transformation Type Management (Admin)

**Epic:** Epic 2: Core Transformation Workflow  
**Story ID:** 2.2  
**Status:** Pending  
**Estimated Time:** 2-4 hours

---

## User Story

**As an** admin user,  
**I want** to add, edit, and delete transformation types,  
**so that** I can manage the transformation options available to users.

---

## Prerequisites

Epic 1 (Authentication & Session Management), Story 2.1 (Image Upload)

---

## Acceptance Criteria

1. Transformation types database table created:
   - id (UUID, primary key)
   - name (VARCHAR, required)
   - description (TEXT, nullable)
   - prompt_template (TEXT, required)
   - enabled (BOOLEAN, default true)
   - created_at (TIMESTAMP)
   - updated_at (TIMESTAMP)
2. Admin interface for transformation type management:
   - Add new transformation type (FR6, FR6a, FR6b)
   - Edit existing transformation type (FR7)
   - Delete transformation type (FR7)
   - Enable/disable transformation type (FR7b)
3. Transformation type validation implemented:
   - Name required and unique
   - Prompt template required and validated (FR6c)
   - Cannot delete if in use by active transformations (FR7a)
   - Cannot delete all transformation types (at least one must exist) (FR31)
4. Admin action logging implemented (FR37, NFR25):
   - Log all transformation type changes
   - Include timestamp, admin user ID, action type, entity details
5. Role-based access control enforced (FR5b):
   - Admin-only endpoints return 403 for Guest users
   - Admin UI elements only visible to Admin users
6. Default transformation types seeded (at least 3 types)
7. Transformation type management tested (add, edit, delete, enable/disable)
8. Admin action logging verified
9. Role-based access control tested
10. Transformation type validation tested

---

## Non-Functional Requirements

- Admin actions logged with timestamp and user ID (NFR25)
- Role-based access control enforced (FR5b)
- Transformation type validation prevents invalid data (FR6c)

---

## Technical Notes

- Create transformation_types table in database
- Implement admin UI for CRUD operations
- Enforce role-based access control
- Log all admin actions
- Seed default transformation types

---

## Dependencies

- Epic 1: Foundation & Core Infrastructure
- Story 2.1: Image Upload & Validation

---

## Related Stories

- Story 2.3: Transformation Type Selection (uses transformation types)
- Story 4.2: Admin UI for Transformation Type Management (extends this story)

