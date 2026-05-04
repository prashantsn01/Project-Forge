const express = require('express');
const cors = require('cors');
const archiver = require('archiver');
const path = require('path');
const Groq = require('groq-sdk');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.CLIENT_URL || '*' }));
app.use(express.json({ limit: '8mb' }));

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ───────────────────────────────────────────────
// STACK-SPECIFIC SYSTEM PROMPTS
// ───────────────────────────────────────────────
function getSystemPrompt(stack) {
  const base = `You are ProjectForge, the world's most elite AI software engineer. You generate COMPLETE, PRODUCTION-GRADE, 100% WORKING projects with ZERO errors.

ABSOLUTE NON-NEGOTIABLE RULES:
- ZERO placeholders. ZERO TODOs. ZERO "// implement later". ZERO stubs. Every single function must be fully written.
- Every file must be 100% complete and runnable on first try with ZERO modifications.
- Respond ONLY with valid JSON — no markdown fences, no preamble, no explanation, nothing before or after.
- Name EVERYTHING after the actual domain — never generic names like "Item", use "Patient", "Order", "Product" etc.
- All imports must be correct. All dependencies must exist in npm/pip/maven.
- Every async operation has proper error handling. Every route has try/catch.
- No broken JSX. No syntax errors. Code must parse and compile.

BEAUTIFUL UI RULES — every frontend must look like a $50,000 Figma design:
- Use a stunning dark theme with gradient accents OR a crisp, premium light theme
- Beautiful typography: large headings, proper hierarchy, good spacing
- Glassmorphism cards, smooth hover transitions, micro-animations
- Sidebar navigation with icons + labels + active state
- Sticky top navbar with user avatar, breadcrumbs, notifications icon
- Dashboard with gradient stat cards showing real numbers from the API
- Data tables with striped rows, sort icons, hover highlight, pagination
- Forms with floating labels OR proper labels, focus rings, error states in red
- Buttons: gradient primary, outlined secondary, danger red — all with hover states
- Loading spinners on every async operation
- Toast notifications for success/error (auto-dismiss 3s)
- Empty states with friendly icons and CTAs
- Fully responsive — mobile hamburger menu, stacked layouts
- NEVER use plain gray or white backgrounds — always use subtle gradients or texture`;

  const stackInstructions = {
    'React + Node.js + MongoDB': `
STACK: React (Vite) + Express.js + MongoDB (Mongoose) + JWT Auth

BACKEND STRUCTURE (Node.js/Express):
  backend/server.js           — app setup, middleware, mount routes, listen
  backend/routes/auth.js      — POST /register, POST /login, GET /me
  backend/routes/[domain].js  — full CRUD for domain with auth middleware
  backend/models/User.js      — mongoose schema, bcrypt pre-save hook
  backend/models/[Domain].js  — domain schema with validation, indexes
  backend/middleware/auth.js  — JWT verifyToken middleware
  backend/config/db.js        — mongoose connection
  backend/.env.example        — MONGO_URI, JWT_SECRET, PORT, CLIENT_URL
  backend/package.json        — all dependencies

BACKEND CODE RULES:
- express.Router() for every route file
- bcrypt.hash in mongoose pre-save, compare in login route
- jwt.sign with 7d expiry, jwt.verify in middleware
- Every route: try { ... } catch(err) { res.status(500).json({ success:false, message:err.message }) }
- Always return: { success:true, data:... } or { success:false, message:'...' }
- Use .populate() for referenced documents
- Proper HTTP codes: 201 create, 200 ok, 400 bad input, 401 unauth, 404 not found, 500 error

FRONTEND STRUCTURE (React + Vite):
  frontend/src/App.jsx              — BrowserRouter, routes, ProtectedRoute
  frontend/src/main.jsx             — createRoot, StrictMode
  frontend/src/index.css            — CSS variables, global styles, animations
  frontend/src/context/AuthContext.jsx — user, token, login(), logout(), isAuth
  frontend/src/utils/api.js         — axios instance, baseURL, request interceptor (Bearer token), 401 response interceptor
  frontend/src/components/Navbar.jsx     — sticky, logo, user info, logout, mobile menu
  frontend/src/components/Sidebar.jsx    — collapsible, icon+label, active highlight
  frontend/src/components/Toast.jsx      — success/error toast, auto-dismiss
  frontend/src/components/Loader.jsx     — full-screen or inline spinner
  frontend/src/pages/Login.jsx           — stunning login form, register toggle
  frontend/src/pages/Dashboard.jsx       — stats cards with API data, charts
  frontend/src/pages/[Domain]List.jsx    — table, search, add button, pagination
  frontend/src/pages/[Domain]Form.jsx    — create/edit form with validation
  frontend/vite.config.js               — proxy setup
  frontend/.env.example                 — VITE_API_URL
  frontend/package.json                 — all dependencies`,

    'Next.js Full-Stack': `
STACK: Next.js 14 (App Router) + Prisma + PostgreSQL + NextAuth.js + TypeScript

STRUCTURE:
  app/layout.tsx                    — root layout, providers
  app/page.tsx                      — landing/home
  app/api/auth/[...nextauth]/route.ts — NextAuth configuration
  app/api/[domain]/route.ts         — GET/POST handlers
  app/api/[domain]/[id]/route.ts    — GET/PUT/DELETE handlers
  app/(auth)/login/page.tsx         — login page
  app/(dashboard)/dashboard/page.tsx — dashboard
  app/(dashboard)/[domain]/page.tsx  — list page
  prisma/schema.prisma              — full schema with relations
  lib/prisma.ts                     — prisma client singleton
  lib/auth.ts                       — nextauth options
  components/ui/Button.tsx          — styled button component
  components/ui/Card.tsx            — card component
  components/layout/Navbar.tsx      — navigation
  components/layout/Sidebar.tsx     — sidebar
  middleware.ts                     — route protection
  .env.example                      — DATABASE_URL, NEXTAUTH_SECRET, etc.`,

    'Vue.js + Node.js': `
STACK: Vue 3 (Composition API, Vite) + Express.js + MongoDB + JWT

BACKEND: Same as React+Node (Express + Mongoose + JWT)
FRONTEND:
  frontend/src/main.js
  frontend/src/App.vue
  frontend/src/router/index.js   — vue-router with navigation guards
  frontend/src/stores/auth.js    — Pinia auth store
  frontend/src/api/axios.js      — axios instance with interceptors
  frontend/src/components/AppNavbar.vue
  frontend/src/components/AppSidebar.vue
  frontend/src/views/LoginView.vue
  frontend/src/views/DashboardView.vue
  frontend/src/views/[Domain]ListView.vue`,

    'Angular + Node.js': `
STACK: Angular 17 (standalone components) + NestJS + TypeORM + PostgreSQL + JWT

BACKEND (NestJS):
  src/app.module.ts
  src/auth/auth.module.ts, auth.controller.ts, auth.service.ts, jwt.strategy.ts
  src/[domain]/[domain].module.ts, .controller.ts, .service.ts, .entity.ts
  src/main.ts
FRONTEND (Angular):
  src/app/app.config.ts
  src/app/app.routes.ts
  src/app/core/services/auth.service.ts
  src/app/core/interceptors/auth.interceptor.ts
  src/app/core/guards/auth.guard.ts
  src/app/features/[domain]/[domain].component.ts`,

    'Node.js REST API': `
STACK: Node.js + Express.js + MongoDB (Mongoose) + JWT — Backend API only with full Swagger docs

STRUCTURE:
  server.js
  routes/auth.js, routes/[domain].js
  models/User.js, models/[Domain].js
  middleware/auth.js, middleware/validate.js
  config/db.js, config/swagger.js
  utils/sendEmail.js, utils/pagination.js
  .env.example
  package.json
  README.md — full API docs with example requests`,

    'Java Spring Boot': `
STACK: Java 17 + Spring Boot 3 + Spring Security + JPA + MySQL + Maven

STRUCTURE:
  src/main/java/com/[project]/
    Application.java
    config/SecurityConfig.java, JwtConfig.java, CorsConfig.java
    controller/AuthController.java, [Domain]Controller.java
    service/AuthService.java, [Domain]Service.java
    repository/UserRepository.java, [Domain]Repository.java
    model/User.java, [Domain].java
    dto/LoginRequest.java, RegisterRequest.java, [Domain]Dto.java
    security/JwtUtil.java, JwtFilter.java, UserDetailsServiceImpl.java
    exception/GlobalExceptionHandler.java
  src/main/resources/application.properties
  pom.xml

JAVA RULES:
- Use @RestController, @Service, @Repository annotations
- JPA @Entity with @Column(nullable=false), @ManyToOne etc.
- BCryptPasswordEncoder for passwords
- @Valid on request bodies with javax.validation
- ResponseEntity<ApiResponse<T>> return type
- @ControllerAdvice for global exception handling`,

    'Python FastAPI': `
STACK: Python 3.11 + FastAPI + SQLAlchemy 2.0 + Alembic + PostgreSQL + JWT

STRUCTURE:
  main.py
  app/
    database.py         — engine, SessionLocal, Base
    models.py           — SQLAlchemy models
    schemas.py          — Pydantic schemas (request/response)
    crud.py             — database operations
    auth.py             — JWT, password hashing, OAuth2
    routers/auth.py, routers/[domain].py
  alembic/              — migrations
  requirements.txt
  .env.example
  README.md

PYTHON RULES:
- Type hints everywhere
- Pydantic BaseModel for all schemas
- Depends() for dependency injection
- HTTPException with proper status codes
- passlib[bcrypt] for hashing
- python-jose for JWT`,

    'Python Django': `
STACK: Python 3.11 + Django 4.2 + Django REST Framework + PostgreSQL + SimpleJWT + Celery

STRUCTURE:
  manage.py
  config/settings.py, urls.py, celery.py
  apps/users/models.py, serializers.py, views.py, urls.py
  apps/[domain]/models.py, serializers.py, views.py, urls.py, tasks.py
  requirements.txt
  .env.example

DJANGO RULES:
- ModelViewSet or APIView with proper permission_classes
- serializers.ModelSerializer with validation
- AbstractUser for custom user model
- SimpleJWT for auth
- @action for custom endpoints`,

    'React Frontend': `
STACK: React 18 + Vite + TailwindCSS + React Query + Zustand + React Router 6

Frontend-only with JSON Server or mock API.
STRUCTURE:
  src/App.jsx, src/main.jsx
  src/store/useStore.js         — Zustand global state
  src/hooks/useApi.js           — React Query hooks
  src/api/client.js             — axios instance
  src/components/ui/            — Button, Card, Modal, Table, Badge
  src/components/layout/        — Layout, Navbar, Sidebar
  src/pages/                    — all pages`,

    'HTML/CSS/JS Vanilla': `
STACK: Pure HTML5 + CSS3 + Vanilla JavaScript (ES6+) — No frameworks, no dependencies

STRUCTURE:
  index.html           — main SPA shell
  css/styles.css       — complete professional CSS with variables
  js/app.js            — app entry, router, state management
  js/api.js            — fetch wrapper with auth headers
  js/auth.js           — login, logout, token management
  js/pages/            — individual page modules
  js/components/       — navbar, sidebar, toast, modal
  README.md

CSS RULES:
- CSS custom properties for theming
- CSS Grid + Flexbox layouts
- Smooth transitions on all interactive elements
- CSS animations for page transitions, loading states`,

    'Flutter Web App': `
STACK: Flutter 3 + Dart + Provider/Riverpod + HTTP + Firebase Auth + Cloud Firestore

STRUCTURE:
  lib/main.dart
  lib/app.dart                  — MaterialApp, routes, theme
  lib/models/user.dart, [domain].dart
  lib/services/auth_service.dart, [domain]_service.dart, api_service.dart
  lib/providers/auth_provider.dart, [domain]_provider.dart
  lib/screens/login_screen.dart, dashboard_screen.dart, [domain]_screen.dart
  lib/widgets/custom_drawer.dart, custom_appbar.dart, [domain]_card.dart
  pubspec.yaml
  README.md`,

    'React Native Mobile': `
STACK: React Native + Expo SDK 50 + React Navigation + Zustand + Axios + AsyncStorage

STRUCTURE:
  App.js
  src/navigation/AppNavigator.js, AuthNavigator.js, TabNavigator.js
  src/screens/LoginScreen.js, HomeScreen.js, [Domain]Screen.js
  src/components/Button.js, Card.js, Header.js, Input.js
  src/store/authStore.js, [domain]Store.js
  src/api/client.js, [domain]Api.js
  src/utils/storage.js, constants.js
  app.json, package.json`
  };

  const stackKey = Object.keys(stackInstructions).find(k => stack && stack.includes(k.split(' ')[0])) || 'React + Node.js + MongoDB';
  const stackGuide = stackInstructions[stack] || stackInstructions[stackKey] || stackInstructions['React + Node.js + MongoDB'];

  return base + '\n\n' + stackGuide;
}

// ───────────────────────────────────────────────
// GENERATE ENDPOINT
// ───────────────────────────────────────────────
app.post('/api/generate', async (req, res) => {
  const { description, stack, features, level, commentMode, scale } = req.body;

  if (!description || !stack) {
    return res.status(400).json({ error: 'description and stack are required' });
  }

  if (!process.env.GROQ_API_KEY) {
    return res.status(500).json({ error: 'GROQ_API_KEY not configured on server. Add it to your .env file.' });
  }

  const featList = (features || []).join(', ') || 'auth, REST API, database';

  const levelMap = {
    '1': 'Junior developer — clean, heavily commented, simple patterns, step-by-step explanations',
    '2': 'Mid-level developer — design patterns (Repository, Service Layer), some abstraction',
    '3': 'Senior engineer — industry-standard architecture, clean code, SOLID principles',
    '4': 'Principal/Staff engineer — production-grade, scalable, microservice-ready, observability, full error handling'
  };

  const commentMap = {
    learning: 'Explain EVERY line — what it does and WHY. Perfect for learning.',
    standard: 'Comment key architectural decisions and non-obvious logic only.',
    clean: 'Professional minimal — only JSDoc/docstrings on public APIs.'
  };

  const scaleMap = {
    mvp: 'MVP scope — implement core features only, keep it simple and fast to build',
    standard: 'Standard production app — full feature set, proper architecture',
    enterprise: 'Enterprise scale — add logging, rate limiting, caching, health checks, Docker, CI/CD'
  };

  const systemPrompt = getSystemPrompt(stack);

  const userPrompt = `Generate a COMPLETE, WORKING, PRODUCTION-GRADE project with ZERO errors:

PROJECT DESCRIPTION: ${description}

TECH STACK: ${stack}
FEATURES TO IMPLEMENT: ${featList}
DEVELOPER EXPERIENCE LEVEL: ${levelMap[level] || levelMap['3']}
COMMENT STYLE: ${commentMap[commentMode] || commentMap['standard']}
PROJECT SCALE: ${scaleMap[scale] || scaleMap['standard']}

Return ONLY this exact JSON — nothing before or after:
{
  "projectName": "PascalCaseName",
  "description": "One-sentence description of the project",
  "stack": "${stack}",
  "totalLines": 1200,
  "folders": [
    {
      "dir": "backend/",
      "files": [
        { "name": "server.js", "color": "#f59e0b", "code": "COMPLETE FILE CONTENT HERE" },
        { "name": "package.json", "color": "#34d399", "code": "COMPLETE FILE CONTENT HERE" },
        { "name": ".env.example", "color": "#ff4757", "code": "COMPLETE FILE CONTENT HERE" }
      ]
    },
    {
      "dir": "backend/config/",
      "files": [
        { "name": "db.js", "color": "#f59e0b", "code": "COMPLETE FILE CONTENT HERE" }
      ]
    },
    {
      "dir": "backend/middleware/",
      "files": [
        { "name": "auth.js", "color": "#f59e0b", "code": "COMPLETE FILE CONTENT HERE" }
      ]
    },
    {
      "dir": "backend/models/",
      "files": [
        { "name": "User.js", "color": "#f59e0b", "code": "COMPLETE FILE CONTENT HERE" },
        { "name": "[ActualDomainName].js", "color": "#f59e0b", "code": "COMPLETE FILE CONTENT HERE" }
      ]
    },
    {
      "dir": "backend/routes/",
      "files": [
        { "name": "auth.js", "color": "#f59e0b", "code": "COMPLETE FILE CONTENT HERE" },
        { "name": "[actualDomainName].js", "color": "#f59e0b", "code": "COMPLETE FILE CONTENT HERE" }
      ]
    },
    {
      "dir": "frontend/src/",
      "files": [
        { "name": "App.jsx", "color": "#61dafb", "code": "COMPLETE FILE CONTENT HERE" },
        { "name": "main.jsx", "color": "#61dafb", "code": "COMPLETE FILE CONTENT HERE" },
        { "name": "index.css", "color": "#3b82f6", "code": "STUNNING COMPLETE CSS WITH ALL STYLES" }
      ]
    },
    {
      "dir": "frontend/src/context/",
      "files": [
        { "name": "AuthContext.jsx", "color": "#61dafb", "code": "COMPLETE FILE CONTENT HERE" }
      ]
    },
    {
      "dir": "frontend/src/utils/",
      "files": [
        { "name": "api.js", "color": "#f59e0b", "code": "COMPLETE axios instance with interceptors" }
      ]
    },
    {
      "dir": "frontend/src/components/",
      "files": [
        { "name": "Navbar.jsx", "color": "#61dafb", "code": "COMPLETE FILE" },
        { "name": "Sidebar.jsx", "color": "#61dafb", "code": "COMPLETE FILE" },
        { "name": "Toast.jsx", "color": "#61dafb", "code": "COMPLETE FILE" }
      ]
    },
    {
      "dir": "frontend/src/pages/",
      "files": [
        { "name": "Login.jsx", "color": "#61dafb", "code": "STUNNING complete login/register page" },
        { "name": "Dashboard.jsx", "color": "#61dafb", "code": "COMPLETE dashboard with real API data, stat cards" },
        { "name": "[ActualDomain]List.jsx", "color": "#61dafb", "code": "COMPLETE list page with table, search, pagination, add/edit/delete" },
        { "name": "[ActualDomain]Form.jsx", "color": "#61dafb", "code": "COMPLETE create/edit form with full validation" }
      ]
    },
    {
      "dir": "",
      "files": [
        { "name": "README.md", "color": "#a78bfa", "code": "COMPLETE README with setup, API docs, screenshots description" }
      ]
    }
  ],
  "setupSteps": [
    "cd backend && npm install",
    "cp .env.example .env — fill in MONGO_URI and JWT_SECRET",
    "cd frontend && npm install",
    "Terminal 1: cd backend && npm run dev",
    "Terminal 2: cd frontend && npm run dev",
    "Open http://localhost:5173 — register an account and start using the app"
  ],
  "insights": [
    { "t": "Why routes are separated from server.js", "b": "Explanation with <code>example</code>" },
    { "t": "How JWT middleware protects routes", "b": "Explanation with <code>code</code>" },
    { "t": "How axios interceptors auto-attach tokens", "b": "Explanation with <code>code</code>" },
    { "t": "Why passwords are hashed with bcrypt", "b": "Explanation with <code>code</code>" }
  ]
}

CRITICAL REMINDERS:
- Replace ALL [ActualDomain] and [actualDomain] placeholders with real domain names from this project
- EVERY file.code field must contain FULL, COMPLETE, WORKING code — never put "// ..." or "rest of implementation"
- The frontend CSS must be BEAUTIFUL — professional gradients, smooth animations, responsive layout
- COLOR KEY: .js/.ts=#f59e0b, .jsx/.tsx=#61dafb, .java=#86efac, .css=#3b82f6, .html=#f97316, .json=#34d399, .env/#ff4757, .md=#a78bfa, .py=#3b82f6, .dart=#61dafb`;

  try {
    console.log('\n→ [ProjectForge] Request:', description.slice(0, 80));
    console.log('→ Stack:', stack);
    console.log('→ Features:', featList);
    console.log('→ Calling Groq API (llama-3.3-70b-versatile)...');

    const chatCompletion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 8192,
      temperature: 0.3,
      top_p: 0.95,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ]
    });

    console.log('→ Got response from Groq');

    const rawText = chatCompletion.choices?.[0]?.message?.content || '';
    const cleaned = rawText
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/, '')
      .trim();

    let project;
    try {
      project = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error('→ JSON parse failed:', parseErr.message);
      console.error('→ Raw (first 500):', rawText.slice(0, 500));
      return res.status(502).json({
        error: 'AI returned invalid JSON. Try again — this sometimes happens with very complex prompts.',
        raw: rawText.slice(0, 300)
      });
    }

    // Calculate actual line count
    let totalLines = 0;
    if (project.folders) {
      project.folders.forEach(f => {
        (f.files || []).forEach(file => {
          if (file.code) totalLines += file.code.split('\n').length;
        });
      });
      project.totalLines = totalLines;
    }

    console.log('→ Done! Project:', project.projectName, '—', totalLines, 'lines,', project.folders?.reduce((a, f) => a + (f.files?.length || 0), 0), 'files');
    res.json({ ok: true, project });

  } catch (err) {
    console.error('→ Generate error:', err.message);
    if (err.message?.includes('timed out') || err.code === 'ETIMEDOUT') {
      return res.status(504).json({ error: 'Generation timed out — try a shorter description or simpler stack.' });
    }
    res.status(500).json({ error: err.message });
  }
});

// ───────────────────────────────────────────────
// DOWNLOAD ZIP
// ───────────────────────────────────────────────
app.post('/api/download', (req, res) => {
  const { project } = req.body;
  if (!project || !project.folders) {
    return res.status(400).json({ error: 'No project data provided' });
  }

  const safeName = (project.projectName || 'project').replace(/[^a-zA-Z0-9_-]/g, '_');
  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', `attachment; filename="${safeName}.zip"`);

  const archive = archiver('zip', { zlib: { level: 9 } });
  archive.pipe(res);

  for (const folder of project.folders) {
    for (const file of folder.files) {
      const filePath = path.join(safeName, folder.dir || '', file.name);
      archive.append(file.code || '', { name: filePath });
    }
  }

  archive.finalize();
});

// ───────────────────────────────────────────────
// HEALTH CHECK
// ───────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    version: '4.0.0',
    engine: 'Groq + LLaMA 3.3 70B',
    aiPowered: true,
    developer: 'Prashant S Nagani'
  });
});

app.listen(PORT, () => {
  console.log(`\n╔══════════════════════════════════════════════╗`);
  console.log(`║   ProjectForge — Engineer Edition  v4.0.0    ║`);
  console.log(`║   Developed by: Prashant S Nagani            ║`);
  console.log(`╚══════════════════════════════════════════════╝`);
  console.log(`\n🔥 Backend running → http://localhost:${PORT}`);
  console.log(`⚡ AI Engine: Groq + LLaMA 3.3 70B`);
  console.log(`🔑 Groq API Key: ${process.env.GROQ_API_KEY ? '✅ Set' : '❌ Missing — add to .env'}\n`);
});
