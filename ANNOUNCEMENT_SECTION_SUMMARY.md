# Announcement Section Implementation - Summary

## Overview
Added a complete Announcement section to the admin panel with the following workflow:
- **Admin** can post announcements visible to all students
- **Students** can view announcements and send requests
- **Admin** can approve or reject user requests for announcements
- Pending request counts decrease automatically after each action

## Database Changes

### New Table: `ANNOUNCEMENTREQUESTS`
Created in `backend/db/schema.js`:
```sql
CREATE TABLE dbo.ANNOUNCEMENTREQUESTS (
  request_id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
  announcement_id UNIQUEIDENTIFIER NOT NULL,
  user_id UNIQUEIDENTIFIER NOT NULL,
  status NVARCHAR(30) NOT NULL DEFAULT 'pending',
  requested_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  CONSTRAINT FK_ANNOUNCEMENTREQUESTS_ANNOUNCEMENTS FOREIGN KEY (announcement_id) REFERENCES dbo.ANNOUNCEMENTS(announcement_id) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT FK_ANNOUNCEMENTREQUESTS_USERS FOREIGN KEY (user_id) REFERENCES dbo.USERS(user_id) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT CK_ANNOUNCEMENTREQUESTS_STATUS_BASE CHECK (LOWER(status) IN ('pending', 'approved', 'rejected'))
)
```

## Backend Routes

### Admin Routes (`backend/routes/admin.js`)

**GET /api/admin/announcement-requests**
- Retrieves all pending announcement requests
- Returns: List of requests with announcement and requester details
- Sample response fields: `request_id`, `announcement_id`, `announcement_title`, `requester_name`, `requester_email`, `status`, `requested_at`

**POST /api/admin/announcement-requests/:requestId/review**
- Approves or rejects an announcement request
- Parameters:
  - `:requestId` - UUID of the request
  - `decision` - "approved" or "rejected" (in request body)
- Logs admin action to `USERACTIVITIES` table
- Returns: Updated request object

Additionally, existing announcement endpoints:
- **GET /api/admin/announcements** - List all announcements
- **POST /api/admin/announcements** - Create new announcement
- **PUT /api/admin/announcements/:id** - Update announcement
- **DELETE /api/admin/announcements/:id** - Delete announcement

### Student Routes (`backend/routes/student.js`)

**GET /api/student/announcements**
- Retrieves all announcements
- Returns: List of all announcements with creator information
- Sample response fields: `announcement_id`, `title`, `message`, `created_at`, `created_by`, `created_by_name`

**POST /api/student/announcements/:announcementId/request**
- Student creates a request for an announcement
- Parameters:
  - `:announcementId` - UUID of the announcement
- Business logic:
  - Checks if announcement exists
  - Prevents duplicate pending requests from same user
  - Creates new request with "pending" status
  - Logs activity to `USERACTIVITIES`
- Returns: Created request object

## Frontend Components

### Admin Pages

**`frontend/src/pages/admin/AdminAnnouncementPage.jsx`**
Features:
- **Post Announcement Form**
  - Input fields: Title, Message
  - Post button with loading state
  - Error display
  
- **Recent Announcements Table**
  - Columns: Title, Created By, Created At, Pending Requests Count
  - Shows pending request count as a badge
  
- **User Requests Table**
  - Columns: Announcement, Requester Name, Email, Status, Requested At, Actions
  - Approve/Reject buttons only visible for "pending" requests
  - Loading states on buttons during action
  - Success/Error messages displayed

### Student Pages

**`frontend/src/pages/student/StudentAnnouncementPage.jsx`**
Features:
- **Announcements List Table**
  - Columns: Title, Message (truncated), Posted By, Posted At, Actions
  - Action button: "Send Request" or "Requested" (disabled if already sent)
  - Loading state during submission
  - Success/Error messages displayed
- Prevents users from sending duplicate requests

## Navigation & Routing

### Admin Sidebar (`frontend/src/components/admin/AdminLayout.jsx`)
Added menu item:
```javascript
{ to: '/admin/announcements', label: 'Announcements', icon: 'bi-megaphone' }
```
Position: Between "Marketplace Review" and "Payments"

### Student Sidebar (`frontend/src/components/student/StudentLayout.jsx`)
Added menu item:
```javascript
{ to: '/student/announcements', label: 'Announcements', icon: 'bi-megaphone' }
```
Position: Between "Marketplace" and "My Activity"

### Routes (`frontend/src/routes/router.jsx`)
Added routes:
- `/admin/announcements` → `AdminAnnouncementPage`
- `/student/announcements` → `StudentAnnouncementPage`

Updated `appShellRoutes` set to include both new paths.

## Workflow Steps

### 1. Admin Creates Announcement
1. Navigate to Admin Panel → Announcements
2. Fill in Title and Message
3. Click "Post Announcement"
4. Announcement becomes immediately visible to students

### 2. Student Sends Request
1. Navigate to Student Panel → Announcements
2. View all posted announcements
3. Click "Send Request" on an announcement
4. Confirmation message shown
5. Button changes to "Requested" (disabled)

### 3. Admin Approves/Rejects Request
1. Navigate to Admin Panel → Announcements
2. Scroll to "User Requests" section
3. For each pending request:
   - Click "Approve" or "Reject"
   - Request status updates
   - Button visibility changes (buttons disappear after action)
4. Pending request count in "Recent Announcements" table decreases

## Error Handling

### Backend
- Returns appropriate HTTP status codes (400, 404, 500)
- Returns error messages in JSON format with `msg` and optional `error` fields
- Transaction-based approach ensures data consistency

### Frontend
- Displays error messages in red text
- Shows loading states on buttons during actions
- Prevents double submissions
- Prevents duplicate request submissions

## Files Modified

1. **Backend Database**
   - `backend/db/schema.js` - Added ANNOUNCEMENTREQUESTS table

2. **Backend Routes**
   - `backend/routes/admin.js` - Added announcement request endpoints
   - `backend/routes/student.js` - Added announcement endpoints

3. **Frontend Components**
   - `frontend/src/components/admin/AdminLayout.jsx` - Added menu item
   - `frontend/src/components/student/StudentLayout.jsx` - Added menu item

4. **Frontend Pages** (New)
   - `frontend/src/pages/admin/AdminAnnouncementPage.jsx` - Admin announcement management
   - `frontend/src/pages/student/StudentAnnouncementPage.jsx` - Student announcement browsing

5. **Frontend Router**
   - `frontend/src/routes/router.jsx` - Added routes and imports

## Testing Checklist

- [x] Frontend builds successfully (527 modules)
- [ ] Backend server starts without errors
- [ ] Admin can post announcements
- [ ] Students can view announcements
- [ ] Students can send requests for announcements
- [ ] Admin can approve requests
- [ ] Admin can reject requests
- [ ] Pending count decreases after action
- [ ] Duplicate request prevention works
- [ ] Error messages display properly
- [ ] Navigation links work

## Notes

- All new routes follow the existing pattern in the codebase
- Error handling matches other admin/student pages
- Loading states and disabled buttons prevent user confusion
- Activity logging integrated for audit trail
- Trigger-safe SQL patterns used (no OUTPUT on trigger-enabled tables)
