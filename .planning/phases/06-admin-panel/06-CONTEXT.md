# Context: Phase 6 - Admin Panel

## Requirements
- ADM-01: Route protection — only users with role='admin' access admin endpoints/pages
- ADM-02: Admin dashboard — platform-wide stats (total users, total questions, average score)
- ADM-03: Question CRUD — add, edit, delete, bulk import (JSON textarea)
- ADM-04: Role management — add role, toggle isActive, update description
- ADM-05: User progress overview — list students with their stats

## Design Decisions
1. **Admin Middleware**: `server/src/middleware/adminOnly.js` — checks `req.user.role === 'admin'`, returns 403 otherwise. Chains after `protect`.
2. **Admin Routes**: `server/src/routes/admin.js` mounted at `/api/admin`.
3. **Stats Aggregation**: Uses MongoDB aggregation pipelines across User, Question, PracticeAttempt models.
4. **Bulk Import**: JSON textarea input on ManageQuestions page; parsed client-side, POSTed as array.
5. **Frontend**: Single `AdminLayout` wrapper with sidebar navigation across:
   - `/admin` — Dashboard stats
   - `/admin/questions` — Question CRUD table + Add/Edit modal + Bulk Import
   - `/admin/roles` — Role table with isActive toggle + Add form
   - `/admin/users` — User list with score stats
6. **Route Guard**: `AdminRoute` component in React checks `user.role === 'admin'`, redirects non-admins to `/questions`.
