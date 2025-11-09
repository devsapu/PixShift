# Story 2.1: Image Upload & Validation

**Epic:** Epic 2: Core Transformation Workflow  
**Story ID:** 2.1  
**Status:** Pending  
**Estimated Time:** 2-4 hours

---

## User Story

**As a** guest user,  
**I want** to upload image files with validation,  
**so that** I can transform my images.

---

## Prerequisites

Epic 1 (Authentication & Session Management)

---

## Acceptance Criteria

1. Image upload UI component implemented (drag-and-drop and click-to-upload)
2. Client-side validation implemented:
   - File type validation (JPG, PNG, WebP only)
   - File size validation (max 10MB) (NFR1)
   - Image dimension validation (min 100x100, max 5000x5000 pixels)
3. Image preview displayed before upload confirmation (FR10c)
4. Validation errors displayed immediately upon upload attempt (FR10b)
5. Server-side validation implemented:
   - MIME type verification
   - File signature validation
   - Dimension validation using image library (Sharp or ImageMagick)
6. Invalid images rejected with clear error messages
7. Image upload API endpoint implemented (`POST /api/upload`)
8. Uploaded images stored temporarily (in-memory or temporary storage)
9. Image upload progress indicator displayed
10. Image upload tested with various file types and sizes

---

## Non-Functional Requirements

- Image upload size limit: Maximum 10MB (NFR1)
- Supported formats: JPG, PNG, WebP (NFR3)
- Validation errors displayed within 100ms (FR10b)
- Image dimensions validated (min 100x100, max 5000x5000)

---

## Technical Notes

- Use Sharp library for image validation
- Implement both client-side and server-side validation
- Store images temporarily in S3 or local storage
- Display progress indicator during upload
- Test with various file types and sizes

---

## Dependencies

- Epic 1: Foundation & Core Infrastructure

---

## Related Stories

- Story 2.3: Transformation Type Selection (uses uploaded images)
- Story 2.4: Gemini API Integration (uses uploaded images)

