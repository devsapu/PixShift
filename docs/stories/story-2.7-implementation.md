# Story 2.7: Image Cleanup & Deletion - Implementation Guide

## Overview

This document describes the implementation of image cleanup and deletion functionality for PixShift. The implementation ensures that images are deleted according to privacy requirements and storage cost minimization.

## Implementation Summary

### Files Created

1. **`src/services/imageStorage.ts`** - Image storage service with S3 and local filesystem support
2. **`src/services/imageCleanup.ts`** - Image cleanup service with deletion logic
3. **`src/services/cleanupJob.ts`** - Scheduled cleanup job that runs every 5 minutes
4. **`src/utils/logger.ts`** - Centralized logging utility
5. **`src/utils/sessionCleanup.ts`** - Session expiration cleanup utility
6. **`src/pages/api/cleanup/run.ts`** - API endpoint for manual cleanup trigger
7. **`src/pages/api/transformations/[id]/download.ts`** - Download endpoint with immediate deletion
8. **`prisma/schema.prisma`** - Updated database schema with `downloadedAt` and `deletedAt` fields

### Key Features

1. **Immediate Deletion After Download (NFR6)**
   - Images are deleted immediately after download completion
   - Implemented in the download endpoint with a 1-second delay to ensure download starts

2. **Scheduled Cleanup Job (NFR6a)**
   - Runs every 5 minutes
   - Deletes images older than 5 minutes
   - Can be manually triggered via API endpoint

3. **Session Expiration Cleanup**
   - Deletes all user images when session expires
   - Integrated with session management system

4. **Comprehensive Logging**
   - All deletion operations are logged
   - Includes metadata for audit purposes

5. **Error Handling**
   - Graceful error handling for all deletion operations
   - Continues operation even if individual deletions fail

## Configuration

### Environment Variables

```bash
# Image Storage Configuration
IMAGE_STORAGE_TYPE=local  # or 's3'

# S3 Configuration (if using S3)
S3_BUCKET=pixshift-temp
S3_REGION=us-east-1
S3_ACCESS_KEY_ID=your-access-key
S3_SECRET_ACCESS_KEY=your-secret-key

# Local Storage Configuration (if using local)
LOCAL_STORAGE_PATH=./storage/images

# Cleanup Job Configuration
ENABLE_CLEANUP_JOB=true  # Set to 'true' to enable automatic cleanup job

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/pixshift
```

## Database Schema Updates

The `Transformation` model has been updated with two new fields:

```prisma
model Transformation {
  // ... existing fields ...
  downloadedAt  DateTime?  // Timestamp when image was downloaded
  deletedAt     DateTime?  // Timestamp when image was deleted
  // ... rest of fields ...
}
```

## Usage

### Starting the Cleanup Job

The cleanup job automatically starts when:
- `ENABLE_CLEANUP_JOB=true` is set, OR
- `NODE_ENV=production` is set

To manually trigger cleanup:
```bash
POST /api/cleanup/run
```

### Downloading Images

When a user downloads an image:
1. The download endpoint is called: `GET /api/transformations/:id/download`
2. Image is served to the user
3. `downloadedAt` timestamp is recorded
4. Image is deleted after 1 second (to ensure download starts)

### Session Expiration

To cleanup images when a session expires:
```typescript
import { onSessionExpiration } from '@/utils/sessionCleanup';

// In your session management code
onSessionExpiration(userId);
```

## API Endpoints

### Download Transformation
```
GET /api/transformations/:id/download
```
- Downloads the transformed image
- Triggers immediate deletion after download
- Returns download URL or redirects to signed URL

### Manual Cleanup Trigger
```
POST /api/cleanup/run
```
- Manually triggers the cleanup job
- Returns number of deleted images
- Useful for testing or admin operations

## Testing

### Manual Testing

1. **Test Immediate Deletion:**
   - Upload and transform an image
   - Download the transformed image
   - Verify image is deleted within 1-2 seconds

2. **Test Scheduled Cleanup:**
   - Create a transformation
   - Wait 5+ minutes
   - Verify image is deleted by cleanup job

3. **Test Session Expiration:**
   - Create transformations for a user
   - Expire the session
   - Verify all user images are deleted

### Automated Testing

```typescript
// Example test
import { getImageCleanupService } from '@/services/imageCleanup';

describe('Image Cleanup', () => {
  it('should delete image immediately after download', async () => {
    const cleanupService = getImageCleanupService();
    const result = await cleanupService.deleteAfterDownload(transformationId);
    expect(result).toBe(true);
  });
});
```

## Monitoring

### Logs

All deletion operations are logged with:
- Timestamp
- Image URL
- Transformation ID
- Reason for deletion
- Success/failure status

### Metrics to Monitor

- Number of images deleted per cleanup cycle
- Cleanup job execution time
- Failed deletion attempts
- Storage space freed

## Error Handling

The implementation includes comprehensive error handling:

1. **Storage Errors:** Logged but don't stop the cleanup process
2. **Database Errors:** Logged with full stack traces
3. **Network Errors:** Retried automatically (for S3)
4. **File Not Found:** Treated as success (already deleted)

## Performance Considerations

1. **Cleanup Job Frequency:** Runs every 5 minutes (configurable)
2. **Batch Processing:** Processes multiple images per cycle
3. **Non-blocking:** Cleanup doesn't block user operations
4. **Efficient Queries:** Uses indexed database queries

## Security Considerations

1. **Access Control:** Download endpoint should verify user ownership
2. **Signed URLs:** S3 signed URLs expire after 5 minutes
3. **Audit Logging:** All deletions are logged for compliance
4. **Error Messages:** Don't expose sensitive information

## Future Enhancements

1. **Retry Logic:** Add retry mechanism for failed deletions
2. **Metrics Dashboard:** Create admin dashboard for cleanup metrics
3. **Configurable Retention:** Allow configurable retention periods
4. **Backup Before Deletion:** Optional backup before deletion
5. **Notification System:** Notify users before deletion (if needed)

## Dependencies

- `@aws-sdk/client-s3` - AWS S3 client
- `@aws-sdk/s3-request-presigner` - S3 signed URL generation
- `@prisma/client` - Database ORM
- `uuid` - UUID generation (for image IDs)

## Notes

- The cleanup job runs in the same process as the application
- For production, consider running cleanup as a separate service
- Local storage is suitable for development, S3 recommended for production
- The 1-second delay for immediate deletion ensures download starts before deletion

