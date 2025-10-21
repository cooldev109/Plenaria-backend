Step-by-step development prompts for Cursor (copy-pasteable)

Below are ordered, explicit prompts you can paste into Cursor to create files and features. Each prompt includes the expected output and files to check.

Step 0 — Initialize repo + scaffolding

Prompt (Cursor):

Create a new Git repo scaffolded for a MERN TypeScript project. Create the folder tree exactly as shown:

/frontend
/backend
README.md
API.md
ARCHITECTURE.md


Add package.json files in both frontend and backend with scripts: dev, build, start, lint, test. Add ESLint + Prettier + Husky pre-commit hooks. Add .gitignore for frontend/backend. Use TypeScript config files.

Expected result: Project with folder tree and working npm scripts.

Step 1 — Backend: core express + auth

Prompt (Cursor):

In /backend, create an Express + TypeScript app. Implement:

JWT auth with access/refresh tokens.

Routes: /auth/register, /auth/login, /auth/refresh, /auth/logout.

User model (MongoDB/Mongoose) with email, phone, passwordHash, role, status, plan, planExpiresAt, createdAt.

Password hashing with bcrypt.

Middleware: requireAuth (check token), requireRole(role).

Seed script src/seeds/seed.ts that inserts the three seed users and project/course seeds (use real URLs provided).

Unit tests for auth flows.

Files to produce: src/index.ts, src/app.ts, src/models/User.ts, src/routes/auth.ts, src/middleware/auth.ts, src/seeds/seed.ts.

Step 2 — Backend: project templates & courses API

Prompt (Cursor):

Add models & REST endpoints:

ProjectTemplate model and CRUD endpoints /api/templates (GET with filters, POST protected admin, download/fileUrl returned).

Course model and endpoints /api/courses (GET for customer/premium filtering).

Implement access restrictions based on visibility field and user plan.

Add search & filter query parameters (keyword, category, date).

Include offline caching headers for file downloads.

Add integration tests for listing templates and course visibility.

Files to produce: src/models/ProjectTemplate.ts, src/models/Course.ts, src/routes/templates.ts, src/routes/courses.ts.

Step 3 — Backend: consultations & real-time Socket.IO

Prompt (Cursor):

Implement consultation flow:

REST: /api/consultations create request (customer), list (by role), admin manage.

WebSocket namespace /consultations using Socket.IO for real-time messages and presence.

Consultation lifecycle logic:

Customer sends request → record REQUESTED.

Lawyer receives request event; can emit ACCEPT or REJECT.

On ACCEPT: set IN_PROGRESS, record startAt, start timers (60 min max; idle 10 min ends).

Messages stored in DB; delivery receipts via socket events.

Server emits notifications for response ready. Add push/email hooks (stubs).

Add SLA metadata in consultation records (responseBy: Date).

Add server-side enforcement of quotas per plan.

Files to produce: src/sockets/consultationsSocket.ts, src/controllers/consultationsController.ts, relevant service tests.

Step 4 — Backend: admin panel API endpoints

Prompt (Cursor):

Implement admin endpoints:

Approve/reject lawyer registrations.

Manage users (list, suspend, change plan).

Manage templates & courses (upload links, change visibility).

Consultation dashboard endpoints: /api/admin/metrics returning average response time, pending counts, SLA breaches.

Files to produce: src/routes/admin.ts, src/services/metricsService.ts.

Step 5 — Frontend: base + landing page (Portuguese)

Prompt (Cursor):

In /frontend, scaffold a React + Vite + TypeScript app with Tailwind. Create landing page in Brazilian Portuguese (no language switcher). Remove any language switching code. Use the professional landing style; create a Layout component used across pages. Ensure default styling follows landing page theme (fonts, color palette).
Pages to scaffold: /auth/login, /auth/register, /customer/dashboard, /lawyer/dashboard, /admin/dashboard, /materials, /consultations.
Use full URLs for sample projects in the materials list per repo memory preference.

Files to produce: src/pages/landing/*, src/layouts/MainLayout.tsx, src/i18n/pt-BR.json (UI strings only).

Step 6 — Frontend: auth + role routing

Prompt (Cursor):

Implement:

Registration form with role choice (lawyer/customer). For customer registration include plan choice (Basic/Plus/Premium).

Login with email or phone.

Save tokens securely (access in memory, refresh in httpOnly cookie).

Protect routes and redirect by role: /admin/* (admin only), /lawyer/* (lawyer), /customer/* (customer).

After lawyer registers, show PENDING state in UI until admin approves.

Files to produce: src/services/auth.ts, src/hooks/useAuth.ts, route wrappers RequireAuth.tsx.

Step 7 — Frontend: consultations UI + Socket integration

Prompt (Cursor):

Build consultations UI:

Customer: request consultation form (title, description, attachments). Show remaining quota and SLA details in "My Plan".

Lawyer: incoming requests panel with Accept / Reject actions. On Accept, open a chat UI.

Chat: realtime messages via Socket.IO, show timers (session remaining), show "idle timer" countdown when no activity; allow customer to end early.

Auto-end session after 10 minutes of inactivity; record as finished.

Show consultation history with transcripts and attachments.

Files to produce: src/pages/customer/consultations/*, src/pages/lawyer/consultations/*, src/components/Chat/*.

Step 8 — Frontend: materials & education area

Prompt (Cursor):

Implement Materials page (Project Database) with search, filters (topic, date, type), download button (opens fileUrl in new tab). Restrict visibility by plan. For Education area (Premium):

Course list (video thumbnails, brief description).

Free introductory module available to non-premium.

Gamification placeholders: quizzes and certificate completion (stubbed).

Files to produce: src/pages/materials/*, src/pages/customer/materials/*, src/components/VideoPlayer/*.

Step 9 — Payments integration

Prompt (Cursor):

Add payments:

Backend: Stripe adapter (and a PagSeguro adapter stub). Endpoints to create subscription, webhook endpoint to listen to invoice.paid, customer.subscription.updated, and update user plan and planExpiresAt.

Frontend: subscription checkout flow (card & Pix option stubbed), Manage subscription in "My Plan".

Implement a 7-day free trial flow for new users (trial flag and expiresAt).

Admin can grant trial / change plans.

Files to produce: src/services/payments/* (backend), src/components/Subscription/* (frontend), /backend/src/routes/webhooks.ts.

Step 10 — Seed & dev data

Prompt (Cursor):

Implement and run node dist/seeds/seed.js (or ts-node) to insert:

The three seed users (admin, lawyer, customer).

8 project templates (use the exact URLs above).

8 course entries with YouTube links (use the exact URLs above).

Ensure seeded customer has plan: basic and quotas set accordingly.

Check: Database contains seeded documents.

Step 11 — Admin UI & metrics dashboard

Prompt (Cursor):

Create Admin UI pages to:

View & approve lawyer registrations.

View users and change plans.

View consultations list and metrics (average response time, pending queries, SLA breaches).

Upload new project templates and courses.

Files: src/pages/admin/*.

Step 12 — Tests, linting, QA pass

Prompt (Cursor):

Add unit and integration tests:

Auth flows, consultations lifecycle, quota enforcement, plan visibility.

Run npm test and fix failures. Ensure 80%+ coverage on core modules.

Add Lighthouse check for landing page.

Example Cursor prompt for a single task (create backend auth route)

You can paste this to Cursor directly to get a ready file:

Create /backend/src/routes/auth.ts (TypeScript, Express router). Implement /register POST that accepts {email, phone, password, role, plan?}. If role === 'lawyer' then set status: 'PENDING' and send admin notification (console log is fine for now). Hash the password with bcrypt (12 rounds). Save user in MongoDB. Return { success: true, message: 'Registration submitted' }. Add input validation. Export router.

Extra notes & recommended priorities (roadmap)

MVP (2–4 weeks) — Auth, project DB (read-only), consultations basic real-time, seed, simple landing + customer dashboard, payments stubbed.

v1 (after MVP) — Lawyer approval flows, SLA enforcement, admin dashboards, course video area, free trial.

v2 — Payments go-live (Stripe + PagSeguro), caching/public API integrations for municipality resources, gamification, certificates, advanced analytics.

Deliverables you should expect from Cursor after following prompts

Working repo with /frontend and /backend.

Seed script populating DB with three users and real templates/videos.

Realtime consultation flow with Socket.IO and timers.

Role-based protected routes and admin approval mechanism.

Payment adapter scaffolding and subscription management.

Readable docs: API.md, ARCHITECTURE.md, README.md.