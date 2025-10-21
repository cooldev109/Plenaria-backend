Rules of development (must-follow)

Stack & languages

MERN (MongoDB, Express, React, Node) + TypeScript + TailwindCSS.

Frontend UI text default: Brazilian Portuguese. Code, DB fields, API routes, logs, and developer prompts: English.

Folder & repo layout

Single repo with two top-level folders: /frontend and /backend. Everything else lives inside those.

Auth & roles

Role-based auth (JWT + refresh tokens). Roles: admin, lawyer, customer.

Registration endpoint accepts role (customer or lawyer). Lawyer registrations are held in PENDING until admin approval.

Enforce role checks server-side on every protected API; never rely on client role.

Payments & plans

Plans: Basic, Plus, Premium (monthly; optional annual with discount).

Payment provider integration (Stripe recommended as primary; implement PagSeguro as alternate adapter). Payments trigger real-time permission updates.

SLA & limits

Track consultation quotas and SLAs per user plan. Enforce limits server-side and show counters in UI.

Realtime consultations

Use WebSocket (Socket.IO) for real-time chat, presence, and consultation lifecycle.

Consultation lifecycle: REQUESTED → ACCEPTED/REJECTED. When ACCEPTED, start a 60-minute timed session; if idle (no messages) for 10 consecutive minutes, end automatically.

Data & localization

All user-facing copy in frontend: Portuguese. Schema fields (e.g., title, description, createdAt) remain English.

Store timestamps in UTC (ISO 8601).

Seeding & real data

Seed DB with 3 users (admin/lawyer/customer) and 6–10 real project templates + 6–10 course/video resources (URLs must be real). See seed list included below.

Security

Hash passwords with bcrypt (at least 12 rounds).

Protect all admin mutations with admin role check.

Validate and sanitize uploads (max file size, allowed types).

Rate limit auth endpoints and consultations creation.

Use HTTPS in production; secure cookies for refresh tokens.

Testing

Unit tests for backend services (auth, payments, consultations). Integration tests for key endpoints.

Linting (ESLint), formatting (Prettier), and type checking (tsc) on pre-commit via Husky.

Observability

Request logging, error tracking (Sentry), basic metrics (response times, queue length for lawyer queries).

UX / Accessibility

Professional, mobile-first, accessible (WCAG AA where feasible). Use consistent landing page style across all pages.

Documentation

Keep an API.md and ARCHITECTURE.md at repo root. Maintain Postman/OpenAPI spec for all endpoints.

Privacy & compliance

Store minimal PII. Provide a way to delete user data. Use data retention policy for consultation transcripts.

Project skeleton (exact folder tree to create)
/repo-root
  /frontend
    /src
      /pages
        /landing
        /auth
        /customer
          /dashboard
          /consultations
          /materials
        /lawyer
          /dashboard
          /consultations
        /admin
          /dashboard
          /users
          /consultations
          /materials
      /components
      /layouts
      /i18n (only holds Portuguese text for UI)
      tailwind.config.ts
      tsconfig.json
  /backend
    /src
      /controllers
      /services
      /models
      /routes
      /sockets
      /seeds
      /utils
      /middleware
    tsconfig.json
  README.md
  API.md
  ARCHITECTURE.md

Database schema (high level)

User

_id, email, phone?, passwordHash, role (admin|lawyer|customer), status (ACTIVE|PENDING|SUSPENDED), plan (basic|plus|premium), planExpiresAt, createdAt

ProjectTemplate

_id, title, category, type (PL|motion|request|recommendation), fileUrl, format (pdf|docx), tags, visibility (basic|plus|premium), createdAt

Course

_id, title, description, videoUrl, materials (array of file URLs), visibility

Consultation

_id, customerId, lawyerId, status (REQUESTED|ACCEPTED|REJECTED|IN_PROGRESS|FINISHED), startAt, endAt, messages (subcollection), createdAt

Message

_id, consultationId, senderId, text, attachments, createdAt

Payment — records payments, provider, status.

Seed data (real URLs — used in the seed script)

Below are recommended real materials for Project Templates (municipal models, downloadable PDFs) and Courses/Videos (YouTube content that fits the Education area). Use these exact URLs in the seed.

Project templates (use as ProjectTemplate entries)

Câmara dos Deputados — Modelos de Projeto de Lei (guidelines & templates).
https://www2.camara.leg.br/a-camara/programas-institucionais/experiencias-presenciais/parlamentojovem/sou-estudante/material-de-apoio-para-estudantes/modelo-de-projeto-de-lei
 
Portal da Câmara dos Deputados

Câmara dos Deputados — Modelos de proposta (list of proposal templates).
https://www2.camara.leg.br/atividade-legislativa/participe/sugira-um-projeto/modelos-de-proposta-1
 
Portal da Câmara dos Deputados

Prefeitura de São Paulo — Modelo de Requerimento (DOC).
https://www.prefeitura.sp.gov.br/cidade/secretarias/upload/chamadas/modelo_de_requerimento_inicial_1264087764.doc
 
Prefeitura de São Paulo

Prefeitura de Carnaubal (example municipal PL PDF).
https://camaracarnaubal.ce.gov.br/requerimentos/692/Arquivo_0004_2023_0000001.pdf
 
https://camaracarnaubal.ce.gov.br

Prefeitura de Guarujá — Modelo de Requerimento (PDF/WORD download).
https://www.guaruja.sp.gov.br/modelo-de-requerimento
 
Prefeitura Municipal de Guarujá

SAPL (Chapada Gaúcha) — Indicação (PDF).
https://sapl.chapadagaucha.mg.leg.br/media/sapl/public/materialegislativa/2025/412/indicacao_005.2025_vga.pdf
 
sapl.chapadagaucha.mg.leg.br

Câmara - Example PL (federal) with full PDF (use as example format).
https://www.camara.leg.br/proposicoesWeb/prop_mostrarintegra?codteor=2325379&filename=Avulso+PL+1073%2F2023
 
Portal da Câmara dos Deputados

Prefeitura de Colina — Downloadable model templates.
https://www.colina.sp.gov.br/servicos-online/download-modelo-de-requerimento
 
Prefeitura de Colina

Courses / Videos (use as Course entries)

Curso: Introdução ao Legislativo Municipal (YouTube playlist).
https://www.youtube.com/playlist?list=PLai1-n3JsXj2Lxi7evAyZh3y4yBrbPRTl
 
YouTube

Escola do Legislativo — Noções Básicas das Funções (YouTube video).
https://www.youtube.com/watch?v=HgxuqGzkc9Y
 
YouTube

Curso — Processo Legislativo Municipal: Teoria e técnica (YouTube).
https://www.youtube.com/watch?v=dHFGeArvT-U
 
YouTube

ENM — Gestão de Gabinete e Assessoria Política (YouTube).
https://www.youtube.com/watch?v=8JmkSX3-Ep4
 
YouTube

Public speaking techniques (workshop) — e-Talks (YouTube).
https://www.youtube.com/watch?v=G_CsArW2NFo
 
YouTube

ÓHQUEMFALA — Oratória e gravação para redes (YouTube tips).
https://www.youtube.com/watch?v=29566dj4OJk
 
YouTube

Chefe de Gabinete | Gestão, Liderança e Estratégia (YouTube).
https://www.youtube.com/watch?v=gJ13EFSbUYA
 
YouTube

Aula: Fases do processo legislativo (YouTube).
https://www.youtube.com/watch?v=IrMQNNEMTGc
 
YouTube

Seed users (credentials to include in seeds/*.ts):

admin: admin@gmail.com / futurephantom (role: admin, status ACTIVE)

lawyer: lawyer@gmail.com / futurephantom (role: lawyer, status ACTIVE)

customer: customer@gmail.com / futurephantom (role: customer, status ACTIVE, plan: basic)