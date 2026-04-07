# DevLink

A full-stack developer portfolio and job application tracker. Users sign up, track job applications through a Kanban-style pipeline, build a public shareable profile, and get AI-powered resume tips — all backed by a production-grade REST API with PostgreSQL, Redis caching, and JWT authentication.

**Live demo:** `https://devlink.onrender.com` *(deploy to get your own URL)*

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router v6, Vite |
| Backend | Node.js, Express 4 |
| Database | PostgreSQL 16 |
| Caching | Redis 7 |
| Auth | JWT (jsonwebtoken + bcryptjs) |
| AI | Anthropic Claude API |
| DevOps | Docker, Docker Compose, Nginx (multi-stage) |
| Testing | Jest, Supertest |

## Features

- **JWT Authentication** — register, login, protected routes, token expiry handling
- **Job Application Tracker** — full CRUD with status pipeline (wishlist → applied → interview → offer → rejected), search, filtering, pagination
- **Public Profile Page** — shareable URL at `/profile/:username` with skills and projects
- **Redis Caching** — profile routes cached with 5-minute TTL, AI tips cached for 1 hour
- **AI Career Coach** — Claude-powered resume tips and chat assistant based on real profile data
- **Rate Limiting** — global API limiter + strict auth endpoint limiter
- **Security** — Helmet.js headers, bcrypt password hashing, input validation throughout
- **Docker** — one-command deployment with PostgreSQL + Redis + app services

## Project Structure

```
devlink/
├── backend/
│   ├── db/
│   │   ├── pool.js          # PostgreSQL connection pool
│   │   └── migrate.js       # Schema migration (users, jobs, skills, projects)
│   ├── cache/
│   │   └── redis.js         # Redis helper with graceful fallback
│   ├── middleware/
│   │   ├── auth.js          # JWT verification middleware
│   │   └── errorHandler.js
│   ├── routes/
│   │   ├── auth.js          # register, login, /me, profile update
│   │   ├── jobs.js          # CRUD + status patch + filter + pagination
│   │   ├── profile.js       # public profile (cached), skills, projects
│   │   └── ai.js            # resume tips + chat
│   ├── tests/
│   │   └── api.test.js
│   ├── server.js
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/index.js         # API client with auth header injection
│   │   ├── context/AuthContext  # Global auth state
│   │   ├── pages/
│   │   │   ├── AuthPage.jsx     # Login + Register
│   │   │   ├── Dashboard.jsx    # Job tracker
│   │   │   └── ProfilePage.jsx  # Public profile
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── JobCard.jsx
│   │   │   ├── AddJobModal.jsx
│   │   │   └── AITips.jsx
│   │   └── App.jsx              # Routing
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
├── docker-compose.yml
└── .env.example
```

## Quick Start

### Option 1 — Docker (recommended)

```bash
git clone https://github.com/your-username/devlink.git
cd devlink

cp .env.example .env
# Edit .env — set ANTHROPIC_API_KEY and JWT_SECRET

docker-compose up --build
```

App runs at **http://localhost** — PostgreSQL and Redis start automatically, DB migration runs on first boot.

### Option 2 — Local dev

```bash
# Start PostgreSQL and Redis (or use Docker just for those)
docker-compose up postgres redis -d

# Backend
cd backend
npm install
cp ../.env.example .env   # fill in values
npm run db:migrate
npm run dev               # http://localhost:3001

# Frontend (new terminal)
cd frontend
npm install
npm run dev               # http://localhost:5173
```

## API Reference

### Auth
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/auth/register | — | Create account |
| POST | /api/auth/login | — | Login, returns JWT |
| GET | /api/auth/me | ✓ | Get current user |
| PUT | /api/auth/profile | ✓ | Update profile |

### Jobs
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/jobs | ✓ | Get jobs (filter, search, pagination) |
| GET | /api/jobs/:id | ✓ | Get one job |
| POST | /api/jobs | ✓ | Create job |
| PUT | /api/jobs/:id | ✓ | Update job |
| DELETE | /api/jobs/:id | ✓ | Delete job |
| PATCH | /api/jobs/:id/status | ✓ | Quick status update |

### Profile
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/profile/:username | — | Public profile (Redis cached) |
| PUT | /api/profile/me/skills | ✓ | Update skills |
| PUT | /api/profile/me/projects | ✓ | Update projects |

### AI
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/ai/tips | ✓ | AI resume tips (cached 1hr) |
| POST | /api/ai/chat | ✓ | Career coach chat |

## Tests

```bash
cd backend && npm test
```

## Deploy to Render (free tier)

1. Push to GitHub
2. Create a new **Web Service** on Render → connect your repo → set root to `backend/`
3. Add env vars: `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `ANTHROPIC_API_KEY`
4. Create a **Static Site** for the frontend → root `frontend/` → build command `npm run build` → publish dir `dist`
5. Your public profile URL: `https://your-app.onrender.com/profile/yourusername`

---

## Resume Bullets

- Built a full-stack developer portfolio platform (DevLink) with React, Node.js/Express, PostgreSQL, and Redis, featuring JWT authentication, role-based route protection, and a shareable public profile URL
- Designed and implemented 13 REST API endpoints with filtering, pagination, input validation, and centralized error handling; secured auth routes with bcrypt hashing and rate limiting
- Integrated Redis caching on public profile routes (5-minute TTL) and AI tips (1-hour TTL), reducing redundant database queries and Anthropic API calls
- Embedded Anthropic Claude API as an AI career coach that generates personalized resume tips and chat responses based on the user's live job application data and profile
- Containerized the full stack (React + Express + PostgreSQL + Redis) with Docker Compose using a multi-stage Nginx frontend build, enabling single-command local and cloud deployment
