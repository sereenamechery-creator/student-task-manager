# Student Task & Deadline Manager
> **ICTAK Capstone Project — Full Stack MERN Application**  
> A centralized, secure academic productivity platform built with MongoDB, Express.js, React, and Node.js.

---

## 1. Project Overview

### Problem Statement
College and university students juggle numerous assignments, continuous assessment tests, projects, and lab submissions across multiple courses. Without a unified system, deadlines are frequently missed, resulting in academic penalties and high cognitive stress.

### Solution & Purpose
The **Student Task & Deadline Manager** provides students with a private digital workspace to organize tasks, track due dates, visualize progress through dynamic statistics, and receive automated email reminders before critical deadlines.

### Target Users
- Students seeking to manage coursework, projects, and submissions.
- Academic evaluators and mentors reviewing capstone project implementations.
- Each student account is private: students can view, edit, and receive reminders only for their own tasks.

---

## 2. Features

- **Authentication & Security:**
  - Secure registration and login with bcryptjs password hashing (12 rounds).
  - Stateless JSON Web Tokens (JWT) for protected routes.
  - Strict resource ownership verification on all task operations.
- **Interactive Dashboard:**
  - Live statistics calculated directly from MongoDB: Total Tasks, Due Today, Overdue, In Progress, Completed, and Completion Percentage.
  - Quick task creation from anywhere on the dashboard.
  - Informative empty states and loading feedback.
- **Task Management (Full CRUD):**
  - Title, Subject / Course Category, Description Notes, Due Date, Priority (Low, Medium, High), and Status (Pending, In Progress, Completed).
  - One-click task completion toggling (Pending ↔ Completed).
  - Edit and Delete with confirmation modals.
- **Search, Filtering & Sorting:**
  - Fast search across titles, subjects, and description notes.
  - Filter by Subject, Priority level, and Task Status.
  - Dedicated views for "Due Today", "Upcoming", "Overdue", and "Completed".
  - Chronological due date sorting (Earliest / Latest).
- **Automated Email Deadline Reminders:**
  - Background scheduler (`node-cron`) checking approaching deadlines every 15 minutes.
  - Professional HTML + plaintext email notifications via `Nodemailer`.
  - Dispatched approximately 24 hours prior to deadline cutoffs.
  - MongoDB reminder timestamp tracking (`reminderSentAt`) to prevent duplicate emails.
  - Safe in-app test email trigger for quick verification.
- **Responsive UI:**
  - Custom purple-blue aesthetic with light neutral cards and accessible typography.
  - Desktop sidebar navigation with live category count badges.
  - Touch-friendly mobile drawer navigation.

---

## 3. Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | React 19, Vite 8 | Fast, modern Single-Page Application (SPA) |
| **Styling** | CSS3 Custom Properties | Responsive layout, purple-blue theme, clean card designs |
| **State & API** | React Context API, Fetch API | Global auth state management and centralized API client |
| **Backend** | Node.js, Express.js 5 | Modular REST API and middleware pipeline |
| **Database** | MongoDB Atlas, Mongoose 8 | Persistent cloud NoSQL database with indexing |
| **Authentication** | bcryptjs, jsonwebtoken (JWT) | Password hashing and stateless token authorization |
| **Scheduling** | node-cron | Scheduled deadline checks in background |
| **Email Delivery**| Nodemailer | Transactional deadline alert delivery (Gmail SMTP) |
| **Security** | Helmet, CORS | HTTP security headers and configurable CORS origins |

---

## 4. MERN Architecture

```
┌────────────────────────────────┐         HTTP / JSON          ┌───────────────────────────────┐
│     React 19 Frontend (Vite)   │ ◄──────────────────────────► │    Express / Node.js API      │
│  - AuthContext & API Client    │                              │  - Auth & Task Routes         │
│  - Dashboard & Modals          │                              │  - JWT Middleware & Helmet    │
└────────────────────────────────┘                              └──────────────┬────────────────┘
                                                                               │
                                                                               ▼ Mongoose 8
                                                                ┌───────────────────────────────┐
                                                                │        MongoDB Atlas          │
                                                                │  - User Collection            │
                                                                │  - Task Collection            │
                                                                └───────────────────────────────┘
                                                                               ▲
                                                                               │ 24h Deadline Scan
                                                                ┌──────────────┴────────────────┐
                                                                │ node-cron & Nodemailer Worker │
                                                                │  - Sends email to student     │
                                                                │  - Updates reminderSentAt     │
                                                                └───────────────────────────────┘
```

---

## 5. Folder Structure

```
student-task-manager/
├── client/                     # Vite React Frontend
│   ├── src/
│   │   ├── components/         # Header, Sidebar, TaskCard, TaskModal, ReminderModal, StatsGrid
│   │   ├── context/            # AuthContext.jsx
│   │   ├── pages/              # AuthPage.jsx, DashboardPage.jsx
│   │   ├── services/           # api.js (Centralized REST API client)
│   │   ├── App.jsx             # Root component with Auth routing
│   │   ├── main.jsx            # React entry point
│   │   └── styles.css          # Custom theme styles
│   ├── .env.example            # Frontend environment variable template
│   ├── index.html              # HTML shell
│   ├── package.json            # Frontend dependencies
│   └── vite.config.js          # Vite config with /api proxy
│
├── server/                     # Express Backend
│   ├── src/
│   │   ├── middleware/         # auth.js (JWT verification middleware)
│   │   ├── models/             # User.js, Task.js (Mongoose schemas)
│   │   ├── routes/             # auth.js, tasks.js, dashboard.js, reminders.js
│   │   ├── services/           # reminders.js (node-cron & Nodemailer worker)
│   │   ├── app.js              # Express app setup, CORS, Helmet, Error handler
│   │   ├── config.js           # Environment configuration loader
│   │   └── server.js           # MongoDB connection and server startup
│   ├── .env.example            # Backend environment variable template
│   └── package.json            # Backend dependencies
│
├── docs/                       # Project Documentation
│   ├── internship-report.md    # ICTAK Summer Internship Report
│   ├── testing-checklist.md    # Verification matrix with test outcomes
│   └── screenshots/            # UI and test evidence screenshots
│
├── .gitignore                  # Git ignore rules
└── README.md                   # This project guide
```

---

## 6. Installation & Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher installed)
- [Git](https://git-scm.com/)
- A free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) account (or local MongoDB)

### Step 1: Clone or Open the Workspace
```bash
cd student-task-manager
```

### Step 2: Install Backend Dependencies
```cmd
cd server
npm install
```

### Step 3: Install Frontend Dependencies
```cmd
cd ..\client
npm install
```

---

## 7. Environment Variables Setup

### Backend (`server/.env`)
Create a file named `.env` inside the `server/` directory:
```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/student_task_manager?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key_minimum_32_characters_long
CLIENT_URL=http://localhost:5173

# Email Reminder Configuration (Gmail App Password)
EMAIL_USER=your_email@gmail.com
EMAIL_APP_PASSWORD=your_16_character_app_password
```

> **Note on Gmail App Password:**
> 1. Go to your Google Account > **Security** > enable **2-Step Verification**.
> 2. Search for **App passwords** > Create a new app name (e.g., `StudentTaskManager`).
> 3. Copy the 16-character generated password into `EMAIL_APP_PASSWORD` without spaces.
> 4. If credentials are left blank, the server runs normally in safe mode and skips email delivery.

### Frontend (`client/.env`)
Create an optional `.env` inside `client/` if connecting to a custom backend host:
```env
VITE_API_URL=/api
```
*(In local development, the Vite dev server automatically proxies `/api` requests to `http://localhost:5000`)*.

---

## 8. Running the Application

### Start the Express Backend (Terminal 1)
```cmd
cd server
npm start
```
*The server will verify the MongoDB connection, initialize the REST API at `http://localhost:5000`, and launch the deadline scheduler.*

### Start the React Frontend (Terminal 2)
```cmd
cd client
npm run dev
```
*Open your browser and navigate to `http://localhost:5173`.*

---

## 9. API Endpoints

| Method | Endpoint | Description | Protected |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/auth/register` | Register student account | No |
| `POST` | `/api/auth/login` | Student login (returns JWT) | No |
| `GET` | `/api/auth/me` | Fetch authenticated student profile | Yes |
| `GET` | `/api/tasks` | Get student tasks (supports search & filters) | Yes |
| `POST` | `/api/tasks` | Create new academic task | Yes |
| `GET` | `/api/tasks/:id` | Get single task by ID | Yes |
| `PUT` | `/api/tasks/:id` | Full update of task | Yes |
| `PATCH` | `/api/tasks/:id` | Partial update (toggle status/completed) | Yes |
| `DELETE` | `/api/tasks/:id` | Delete task | Yes |
| `GET` | `/api/dashboard/stats`| Calculate real-time MongoDB task stats | Yes |
| `GET` | `/api/reminders/status`| Check email reminder status | Yes |
| `POST` | `/api/reminders/test` | Send test reminder to logged-in student | Yes |
| `POST` | `/api/reminders/process`| Manually trigger deadline scan | Yes |

---

## 10. Testing Instructions

Comprehensive test scenarios are documented in `docs/testing-checklist.md`.

To run syntax verification and frontend bundle checks locally:

```cmd
# Verify backend JavaScript syntax
cd server
node --check src/server.js
node --check src/app.js

# Verify frontend production build
cd ..\client
npm run build
```

---

## 11. Known Limitations & Future Improvements

- **Local Scheduler Limitation:** The `node-cron` background scheduler runs while the Node.js backend process is active. When deploying to production, host on a continuously running platform (e.g., Render Web Service, Railway, VPS) rather than serverless functions.
- **Future Improvements:**
  - Push notifications via Web Push API.
  - Calendar view (monthly/weekly assignment schedule).
  - File attachments for assignment rubrics.
  - Multi-student study group collaboration.
