# ICT ACADEMY OF KERALA
## Summer Internship Report
### Full Stack Application Development with ReactJS & the MERN Stack

---

**Project Title:** Student Task & Deadline Manager  
**Internship Domain:** Full Stack Web Development (MERN Stack)  
**Name of Team Member / Candidate:** [Student Name]  
**Candidate Roll / Register No.:** [Candidate ID / Register Number]  
**Name of Institution / College:** [Your College / Institution Name]  
**Submission Date:** October 2026  
**Mentoring Body:** Information & Communication Technology Academy of Kerala (ICTAK)  

---

## EXECUTIVE SUMMARY

The **Student Task & Deadline Manager** is a complete, responsive, full-stack web application engineered using the MERN stack (MongoDB Atlas, Express.js, React.js, and Node.js). The primary purpose of this internship capstone project is to assist college and university students in overcoming academic workload stress by providing a structured digital workspace to organize assignments, track course deadlines, categorize tasks by subject and priority, and receive automated email reminders before critical cutoff dates.

Key development activities carried out during the internship included:
1. Architectural planning and database schema design using Mongoose.
2. Building a modular RESTful API in Node.js and Express with strict JWT authentication, bcrypt password hashing, and user-level data isolation.
3. Constructing an intuitive and accessible frontend in React.js powered by Vite, utilizing semantic HTML, custom purple-blue styling, responsive mobile drawer navigation, and controlled forms.
4. Integrating background scheduling via `node-cron` and automated transactional emails with `Nodemailer` to dispatch 24-hour deadline notifications.
5. Rigorous end-to-end testing across authentication, CRUD operations, multi-criteria filtering, and error handling.

The project successfully delivered a fully functional, production-ready web application meeting all ICTAK capstone guidelines, supported by verifiable test logs, version control history, and comprehensive documentation.

---

## INTRODUCTION

### Background & Context
Modern higher education requires students to navigate multiple concurrent academic obligations, including laboratory assignments, term papers, continuous assessment tests, seminar presentations, and project milestones. Because different faculty members and departments distribute work through varied channels (e.g., classroom announcements, LMS portals, emails, notice boards), students frequently experience difficulty maintaining a unified overview of pending requirements. 

This fragmentation often leads to last-minute cramming, missed deadlines, unnecessary academic penalties, and elevated cognitive fatigue. Existing general-purpose to-do list applications frequently lack features tailored to student workflows, such as subject categorization, priority tracking, deadline proximity warnings, and automated email reminders linked to course cutoff times.

### Project Purpose
The **Student Task & Deadline Manager** was designed and implemented to provide a dedicated, secure, and centralized academic productivity system. The platform allows each enrolled student to:
- Maintain a private and secure user profile.
- Create, view, update, and manage course tasks with detailed metadata (title, subject, description notes, due date, priority level, and status).
- Monitor productivity through real-time statistical analytics (total tasks, pending items, completed assignments, tasks due today, overdue tasks, and overall completion percentage).
- Search and filter records quickly across multiple criteria.
- Rely on automated background notifications dispatched via Nodemailer and node-cron approximately 24 hours prior to deadline cutoffs.

By adhering to the principles outlined in the ICTAK MERN Stack Project Guidelines, this project emphasizes software engineering fundamentals: separation of concerns, secure data storage, resilient input validation on both client and server, and defensive error handling.

---

## OBJECTIVES

### Project Objectives
1. **Full-Stack MERN Architecture:** Build a decoupled, maintainable web application with a React.js client communicating exclusively through an Express/Node.js REST API to a persistent MongoDB database.
2. **Secure Authentication & Data Privacy:** Implement user registration and login using salted password hashing (`bcryptjs`) and stateless token authentication (`jsonwebtoken`), ensuring each student can access only their own task records.
3. **Task CRUD Operations:** Provide full Create, Read, Update, and Delete operations for academic tasks with server-side validation and optimistic UI updates.
4. **Deadline Tracking & Prioritization:** Calculate and categorize tasks dynamically into actionable views (Due Today, Upcoming, Overdue, and Completed) with colored priority and urgency indicators.
5. **Automated Notification Service:** Implement scheduled background processing (`node-cron`) coupled with transactional email delivery (`Nodemailer`) supporting Gmail App Passwords and custom SMTP configurations to notify students 24 hours before deadlines.
6. **Input Validation & Error Resilience:** Enforce validation rules on both frontend forms and backend endpoints, returning standardized JSON error responses and preventing application crashes.
7. **Version Control & Documentation:** Maintain the codebase under Git version control with meaningful commit milestones, structured configuration files (`.gitignore`, `.env.example`), and an official submission report.

### Key Skills Developed
- Designing scalable NoSQL schemas and indexes with Mongoose.
- Building RESTful APIs with route grouping, custom authentication middleware, and helmet/CORS security.
- Advanced React component architecture, Hooks (`useState`, `useEffect`, `useMemo`, `useCallback`), and custom Context providers for global state management.
- Scheduling cron jobs in Node.js and managing asynchronous email queues.
- Defensive software testing and test checklist compilation.

---

## SCOPE AND DELIVERABLES

### Functional Scope
- **User Authentication:** Student registration with full name, email, and password confirmation; password strength validation; secure login; token-based session persistence; and one-click logout.
- **Interactive Dashboard:** Live summary cards displaying real MongoDB metrics: Total Tasks, Due Today, Overdue, In Progress, Completed, and Completion Percentage progress bar.
- **Task Management:** Comprehensive task creation and editing modal supporting title, subject, notes/description, due date, priority (Low, Medium, High), and status (Pending, In Progress, Completed).
- **Fast Search and Multi-Filtering:** Real-time search across task titles, subjects, and descriptions; filtering by status, subject, and priority; and chronological sorting by due date.
- **Deadline Reminders:** Background scanning of upcoming deadlines; delivery of HTML and plaintext email alerts; delivery timestamp tracking in MongoDB to prevent duplicate notifications; and a safe user-triggered test delivery mechanism.
- **Responsive Navigation:** Desktop sidebar with active view counters, top bar with search and quick actions, and mobile slide-out drawer navigation.

### Non-Functional Scope
- **Security:** Hashed passwords (salt rounds = 12), JWT verification on all protected endpoints, HTTP header hardening via `helmet`, origin whitelisting via `cors`, and environment variable encapsulation.
- **Usability & Accessibility:** Semantic HTML5, accessible form labels, keyboard navigation, clear color contrast, and distinct visual indicators for urgent deadlines.
- **Performance:** Optimized Vite build bundling, lean Mongoose queries (`.lean()`), compound indexes on `{ userId, dueDate }`, and debounced search filtering.
- **Reliability:** Graceful error handling for missing databases or unconfigured email services without server crashes.

### Deliverables
1. **Client Application (`client/`):** React 19 + Vite frontend with modular components, Context API, and CSS custom properties styling.
2. **Server API (`server/`):** Node.js + Express.js backend with controllers, models, routes, auth middleware, and reminder services.
3. **Database Specifications:** Mongoose models for `User` and `Task` with validation rules and compound indexes.
4. **Configuration & Environment Templates:** `client/.env.example`, `server/.env.example`, and root `.gitignore`.
5. **Documentation Suite:** `README.md`, `docs/testing-checklist.md`, and this `docs/internship-report.md`.
6. **Git Repository:** Clean repository history with modular commits.

### Limitations
- The local `node-cron` scheduler functions continuously only while the backend Node server process is running. For 24/7 cloud deployment, hosting on a persistent platform (such as Render Web Service, Railway, or VPS) is required rather than serverless functions.
- Email delivery requires valid SMTP or Gmail App Password credentials configured in `server/.env`. If omitted, the application operates in safe fallback mode with email dispatch disabled.

---

## METHODOLOGY

The development lifecycle followed an iterative Agile approach aligned with the ICTAK MERN Stack Project Guidelines:

```
[Phase 1: Planning & Architecture] ──> [Phase 2: Database & REST API]
                  │                                     │
                  ▼                                     ▼
[Phase 4: Reminders & Cron Jobs]  <──  [Phase 3: Frontend UI & State]
                  │
                  ▼
[Phase 5: Testing & Verification] ──>  [Phase 6: Git & Documentation]
```

1. **Planning & Architecture:** Requirements analysis based on student workflows, wireframe sketching for desktop and mobile screens, and definition of the REST API contract.
2. **Backend & Database Foundation:** Setup of Express server, MongoDB Mongoose models (`User` and `Task`), JWT auth middleware, and input sanitization.
3. **Frontend Integration:** Setup of Vite React application, implementation of `AuthContext` for persistent sessions, API client service module, modal dialogs, and responsive CSS theme.
4. **Email & Scheduling Integration:** Configuration of Nodemailer transporter and node-cron scheduled task checking the 24-hour deadline window against MongoDB records.
5. **Testing & Hardening:** Execution of functional test cases for positive, negative, and edge scenarios (documented in `docs/testing-checklist.md`).
6. **Documentation & Version Control:** Finalizing README instructions, environment variables, and internship report.

---

## PROJECT ACTIVITIES

### Detailed Activity Breakdown

| Milestone | Key Activity Performed | Tools / Libraries Utilized |
| :--- | :--- | :--- |
| **Milestone 1** | Workspace analysis, project structuring, and `.gitignore` setup | Windows 10, VS Code, Git |
| **Milestone 2** | MongoDB schema design for `User` and `Task` with validation & indexing | MongoDB Atlas, Mongoose 8 |
| **Milestone 3** | REST API endpoints for Auth (Register/Login/Me) with JWT and bcrypt | Express 5, bcryptjs, jsonwebtoken, helmet, cors |
| **Milestone 4** | REST API endpoints for Task CRUD, stats calculation, and search | Express Router, Mongoose query engine |
| **Milestone 5** | Automated reminder service with node-cron and Nodemailer | node-cron, Nodemailer, Gmail SMTP |
| **Milestone 6** | React UI development: Auth views, Dashboard stats, Task cards, and modals | React 19, Vite 8, CSS3 Custom Properties |
| **Milestone 7** | Multi-factor search, category filtering, and chronological sorting | JavaScript Array APIs, React `useMemo` |
| **Milestone 8** | Comprehensive test execution and documentation compilation | Node.js syntax checker, Vite production bundler, Markdown |

### Challenges Encountered and Solutions Applied

1. **PowerShell Script Execution Restrictions:**
   - *Challenge:* On Windows 10, running `npm` commands directly in PowerShell was restricted by system execution policies (`PSSecurityException`).
   - *Solution:* Executed package installations and build processes using `cmd.exe /c` and `npm.cmd`, ensuring commands run without modifying global Windows security settings.

2. **Cross-User Data Isolation in Multi-Tenant Task Views:**
   - *Challenge:* Ensuring that malicious or accidental URL parameter manipulation (e.g., passing a different task ID in `PUT /api/tasks/:id`) could not alter another student's task.
   - *Solution:* Enforced strict server-side scoping on all task queries using compound filters: `{ _id: taskId, userId: req.userId }`. Unauthorized access returns a clean 404 response.

3. **Prevention of Duplicate Reminder Emails:**
   - *Challenge:* If the cron scheduler runs periodically (e.g., every 15 minutes), repeated emails could be sent for the same approaching deadline.
   - *Solution:* Added a `reminderSentAt` date field to the Task model. The query filter strictly targets `{ reminderSentAt: null }`, and the timestamp is committed immediately upon confirmed delivery by Nodemailer.

4. **Graceful Degradation Without Configured Email Credentials:**
   - *Challenge:* If an evaluator tests the application locally without providing real Gmail credentials, the server should not crash or throw unhandled exceptions.
   - *Solution:* Implemented a configuration check (`config.email.enabled`). If credentials are absent, the scheduler logs an informative message and skips email execution while keeping the full task manager operational.

---

## RESULTS & FINDINGS

### Completed Features Summary
- **Authentication System:** Fully functional student registration and login with bcrypt encryption (12 rounds) and JWT tokens stored securely in browser `localStorage`.
- **Dynamic Dashboard Metrics:** Real-time statistics generated dynamically from MongoDB: Total Tasks, In Progress, Pending, Completed, Due Today, Overdue, and overall Completion Rate percentage.
- **Task Management Engine:** Full CRUD support with Title, Subject, Description, Due Date, Priority (Low, Medium, High), and Status (Pending, In Progress, Completed).
- **Search & Filter Matrix:** Instant search across titles, subjects, and notes, combined seamlessly with status, subject, and priority dropdown filters.
- **Automated Reminders:** Background cron job actively monitoring deadlines within 24 hours and dispatching branded HTML emails via Nodemailer.
- **Responsive Interface:** Modern, polished purple/blue design theme with desktop sidebar and mobile-friendly layouts.

### Real Test Outcomes
As documented in `docs/testing-checklist.md`:
- **Client Build:** Vite production build completed successfully with **0 errors** (26 modules bundled, CSS 18.1 kB, JS 251 kB).
- **Backend Syntax Validation:** `node --check` passed across 100% of server modules without syntax errors.
- **API Security:** Verified that protected routes reject unauthorized requests with HTTP 401, and cross-user modifications are blocked with HTTP 404.
- **Input Validation:** Verified that malformed emails, short passwords, and empty task titles are rejected with HTTP 400.

---

## CONCLUSION

The **Student Task & Deadline Manager** successfully satisfies all requirements for the ICT Academy of Kerala (ICTAK) Full Stack Application Development Internship capstone. By adhering strictly to the MERN stack architectural guidelines, the project demonstrates proficiency in building modern, modular, and secure web applications.

### Objectives Achieved
- Developed an end-to-end MERN application free of hardcoded mock arrays or localStorage database substitutes.
- Enforced industry-standard security practices (bcrypt password hashing, JWT authorization, CORS, and helmet).
- Implemented automated deadline reminders combining node-cron scheduling with Nodemailer email delivery.
- Designed a professional, accessible UI that avoids default starter templates.
- Created complete testing verification logs and submission documentation.

### Lessons Learned
- The critical importance of validating data on both frontend and backend layers.
- How background worker queues and scheduled cron jobs interact with persistent databases.
- Structuring React components for maintainability and clear state separation.

---

## APPENDIX

### A. API Endpoints Reference

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register new student account | Public |
| `POST` | `/api/auth/login` | Authenticate student and issue JWT | Public |
| `GET` | `/api/auth/me` | Fetch authenticated student profile | Protected (JWT) |
| `GET` | `/api/tasks` | Get student tasks (with search, filter & sort) | Protected (JWT) |
| `POST` | `/api/tasks` | Create new academic task | Protected (JWT) |
| `GET` | `/api/tasks/:id` | Retrieve single task by ID | Protected (JWT) |
| `PUT` | `/api/tasks/:id` | Full update of task | Protected (JWT) |
| `PATCH` | `/api/tasks/:id` | Partial update / toggle status | Protected (JWT) |
| `DELETE` | `/api/tasks/:id` | Delete task from database | Protected (JWT) |
| `GET` | `/api/dashboard/stats`| Calculate real-time task statistics | Protected (JWT) |
| `GET` | `/api/reminders/status`| Get email service configuration status | Protected (JWT) |
| `POST` | `/api/reminders/test` | Dispatch test reminder to student's email | Protected (JWT) |
| `POST` | `/api/reminders/process`| Manually trigger deadline check | Protected (JWT) |

### B. MongoDB Schema Definitions

#### 1. User Schema (`User.js`)
```javascript
{
  name: { type: String, required: true, trim: true, maxlength: 80 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true, select: false },
  createdAt: Date,
  updatedAt: Date
}
```

#### 2. Task Schema (`Task.js`)
```javascript
{
  userId: { type: ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true, trim: true, maxlength: 160 },
  subject: { type: String, trim: true, maxlength: 80, default: 'General' },
  description: { type: String, trim: true, maxlength: 1000, default: '' },
  dueDate: { type: Date, required: true },
  priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
  status: { type: String, enum: ['Pending', 'In Progress', 'Completed'], default: 'Pending' },
  completed: { type: Boolean, default: false },
  reminderSentAt: { type: Date, default: null },
  createdAt: Date,
  updatedAt: Date
}
```

### C. Local Execution Quick Reference

```bash
# 1. Start Express Backend (Terminal 1)
cd server
npm start

# 2. Start Vite React Frontend (Terminal 2)
cd client
npm run dev
```

Frontend URL: `http://localhost:5173`  
Backend API: `http://localhost:5000`  
Health Check: `http://localhost:5000/api/health`
