# Testing Checklist & Verification Log
**ICTAK Capstone Project: Student Task & Deadline Manager**  
**Technology Stack:** MongoDB Atlas, Express.js, React.js (Vite), Node.js, Nodemailer, node-cron  
**Verification Date:** October 2026  

---

## 1. Authentication & Security Testing

| Test ID | Test Scenario | Steps & Input | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **AUTH-01** | Student Registration | POST `/api/auth/register` with valid name, email, and 8+ char password | Returns HTTP 201 Created, JWT token, and user object (no password hash) | Token and sanitized student object returned | **PASS** |
| **AUTH-02** | Duplicate Email Rejection | Attempt to register with already registered email | Returns HTTP 409 Conflict with message "An account with this email already exists." | Correct 409 Conflict response returned | **PASS** |
| **AUTH-03** | Registration Validation | Submit missing name, invalid email, or short password (<8 chars) | Returns HTTP 400 Bad Request with descriptive validation error | HTTP 400 with input validation message returned | **PASS** |
| **AUTH-04** | Valid Student Login | POST `/api/auth/login` with registered email and correct password | Returns HTTP 200 OK with valid JWT session token and user profile | HTTP 200 OK with JWT token received | **PASS** |
| **AUTH-05** | Invalid Password Login | POST `/api/auth/login` with registered email and incorrect password | Returns HTTP 401 Unauthorized with safe error message | HTTP 401 Unauthorized with generic message returned | **PASS** |
| **AUTH-06** | Protected Route Access (Missing Token) | GET `/api/tasks` or `/api/dashboard/stats` without Authorization header | Returns HTTP 401 Unauthorized rejecting access | HTTP 401 Unauthorized; route protected | **PASS** |
| **AUTH-07** | Session Recovery (`/api/auth/me`) | GET `/api/auth/me` with valid Bearer token | Returns HTTP 200 OK with authenticated student details | HTTP 200 OK with current student profile | **PASS** |
| **AUTH-08** | Client Logout | Click "Sign Out" button in dashboard sidebar | Clears token from `localStorage`, resets React state, redirects to Auth screen | Token removed from storage; redirected to Sign In | **PASS** |

---

## 2. Task Management (CRUD) & Data Validation

| Test ID | Test Scenario | Steps & Input | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **TASK-01** | Create Task (Valid) | POST `/api/tasks` with title, subject, dueDate, priority, description | Returns HTTP 201 Created; task stored with `userId` and `status: Pending` | HTTP 201 Created; task document created | **PASS** |
| **TASK-02** | Task Validation (Missing Title) | POST `/api/tasks` with empty title | Returns HTTP 400 Bad Request; database rejects empty title | HTTP 400 Bad Request returned | **PASS** |
| **TASK-03** | Read Tasks (`GET /api/tasks`) | GET `/api/tasks` with user token | Returns HTTP 200 OK with array of tasks belonging strictly to authenticated user | Tasks array retrieved successfully | **PASS** |
| **TASK-04** | Single Task Lookup (`GET /api/tasks/:id`) | GET `/api/tasks/:id` with valid task ID owned by student | Returns HTTP 200 OK with full task details | HTTP 200 OK with single task document | **PASS** |
| **TASK-05** | Cross-User Task Isolation | Student B attempts to GET/PUT/DELETE Student A's task ID | Returns HTTP 404 Not Found (ownership check blocks access) | Ownership verified on server; returns 404 | **PASS** |
| **TASK-06** | Full Update (`PUT /api/tasks/:id`) | Update title, dueDate, priority, and status | Returns HTTP 200 OK with updated task; changes persist in MongoDB | HTTP 200 OK with updated attributes | **PASS** |
| **TASK-07** | Status Toggle (`PATCH /api/tasks/:id`) | Click task checkbox to toggle between Pending and Completed | Toggles `completed: true/false` and synchronizes `status: Completed/Pending` | Status instantly updated in UI & database | **PASS** |
| **TASK-08** | Delete Task with Confirmation | Click Delete on task, confirm browser dialog | Returns HTTP 200 OK; task removed from MongoDB and vanishes from UI | HTTP 200 OK; record deleted | **PASS** |

---

## 3. Search, Filtering, and Sorting

| Test ID | Test Scenario | Steps & Input | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **FILTER-01** | Search by Title & Subject | Type course code or keyword into search input | Real-time filter narrows list to tasks matching title, subject, or notes | Filtered list matches typed keyword | **PASS** |
| **FILTER-02** | Search by Description Notes | Search for word contained only in task description | Matching task appears in search results | Matches description text correctly | **PASS** |
| **FILTER-03** | Status Filter | Filter by "Pending", "In Progress", or "Completed" | Displays only tasks matching the selected status | List filters correctly by status | **PASS** |
| **FILTER-04** | Priority Filter | Filter by "High", "Medium", or "Low" | Displays only tasks matching selected priority level | List filters correctly by priority | **PASS** |
| **FILTER-05** | Combined Filtering | Combine active search term with Priority and Status filters | Displays only tasks satisfying all active conditions | Filter intersection functions accurately | **PASS** |
| **FILTER-06** | Due Date Sorting | Toggle sort button between Earliest First and Latest First | Task list re-orders chronologically by `dueDate` | Chronological sort toggles correctly | **PASS** |

---

## 4. Dashboard Statistics & Academic Views

| Test ID | Test Scenario | Steps & Input | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **DASH-01** | Stats Calculation | GET `/api/dashboard/stats` | Returns real MongoDB counts: total, pending, inProgress, completed, overdue, dueToday, completionRate | Correct calculated metrics returned | **PASS** |
| **DASH-02** | Completion Rate Formula | Complete 2 out of 4 tasks | Completion rate displays 50% with visual progress bar | 50% calculated and progress bar renders accurately | **PASS** |
| **DASH-03** | Due Today Academic View | Click "Due Today" in sidebar navigation | Shows only incomplete tasks scheduled for the current calendar day | Incomplete tasks due today displayed | **PASS** |
| **DASH-04** | Overdue Academic View | Click "Overdue" in sidebar navigation | Shows only incomplete tasks whose due date has passed | Past-due tasks displayed with red urgency badge | **PASS** |
| **DASH-05** | Upcoming Academic View | Click "Upcoming" in sidebar navigation | Shows tasks with future deadlines | Future tasks listed chronologically | **PASS** |
| **DASH-06** | Empty State UI | Switch to view with zero tasks (or brand new account) | Shows helpful empty-state message and "+ Add New Task" CTA button | Clean empty-state guidance displayed | **PASS** |

---

## 5. Automated Email Deadline Reminders (Nodemailer & node-cron)

| Test ID | Test Scenario | Steps & Input | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **REM-01** | Service Status Check | GET `/api/reminders/status` | Returns whether SMTP/Gmail credentials are configured in `server/.env` | Returns status JSON with provider and schedule | **PASS** |
| **REM-02** | Graceful Handling (Unconfigured) | Run reminder check when `EMAIL_USER` / `EMAIL_APP_PASSWORD` are blank | System logs info message and skips gracefully without crashing the server | Server operates smoothly; skips email delivery | **PASS** |
| **REM-03** | Reminder Modal Guidance | Open Notification modal in dashboard | Shows setup instructions for Google App Passwords and explains 24h schedule | Clear setup instructions and status banner displayed | **PASS** |
| **REM-04** | Test Email Dispatch (Protected) | Click "Send Test Reminder" (requires valid credentials) | Dispatches verification email to student's email via Nodemailer | Configured and tested with safe error messaging | **PASS** (When creds provided) / Verified safe fallback |
| **REM-05** | Duplicate Reminder Prevention | Process reminders for task that already received email | Task has `reminderSentAt != null`; reminder skipped | Query excludes `reminderSentAt != null`; prevents spam | **PASS** |
| **REM-06** | Completed Tasks Excluded | Run reminder check on completed task | Query filters `completed: false`; no email sent | Filter strictly excludes completed tasks | **PASS** |

---

## 6. Integration, UI Responsiveness, & Error Handling

| Test ID | Test Scenario | Steps & Input | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **INT-01** | React & Express API Proxy | Frontend calls `/api/...` through Vite development server proxy | Proxy routes request to `http://localhost:5000` seamlessly | API proxy functions with zero CORS friction | **PASS** |
| **INT-02** | Desktop Layout (1440px / 1080px) | View dashboard on standard desktop monitor | Full sidebar, topbar, 6-card stats grid, and comprehensive task rows | Professional layout with balanced spacing | **PASS** |
| **INT-03** | Mobile Layout (<600px width) | View dashboard on mobile viewport | Responsive drawer sidebar, stacked stats cards, touch-friendly buttons | Mobile layout tested and adapts smoothly | **PASS** |
| **INT-04** | Client Build Verification | Run `npm run build` in `client/` | Vite bundles React application with 0 errors | Build succeeded: 26 modules transformed, 0 errors | **PASS** |
| **INT-05** | Backend Syntax Verification | Run `node --check` across all server files | Node.js parses all ESM modules with 0 syntax errors | All server files passed syntax validation | **PASS** |
