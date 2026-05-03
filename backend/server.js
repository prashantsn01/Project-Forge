const express = require('express');
const cors = require('cors');
const archiver = require('archiver');
const path = require('path');
const Groq = require('groq-sdk');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.CLIENT_URL || '*' }));
app.use(express.json({ limit: '4mb' }));

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

app.post('/api/generate', async (req, res) => {
  const { description, stack, features, level, commentMode } = req.body;

  if (!description || !stack) {
    return res.status(400).json({ error: 'description and stack are required' });
  }

  if (!process.env.GROQ_API_KEY) {
    return res.status(500).json({ error: 'GROQ_API_KEY not configured on server' });
  }

  const featList = (features || []).join(', ') || 'auth, REST API, database';
  const levelMap = {
    '1': '1st year (clean, well-commented fundamentals)',
    '2': '2nd year (design patterns)',
    '3': '3rd year (industry architecture)',
    '4': 'Final year (production-grade)'
  };
  const commentMap = {
    learning: 'every line explained with why, not just what',
    standard: 'key architectural decisions only',
    clean: 'professional minimal comments'
  };

  const systemPrompt = `You are ProjectForge, the world's best fullstack code generator. You produce PERFECT, PRODUCTION-GRADE, FULLY WORKING projects that score 100/100 on every dimension.

ABSOLUTE RULES — NEVER BREAK THESE:
- ZERO placeholders. ZERO TODOs. ZERO stubs. ZERO "// implement later". Every single function body must be fully written.
- Every file must be 100% complete and runnable on first try with zero modifications.
- Respond ONLY with a valid JSON object. No markdown fences. No explanation text. No preamble.
- Name EVERYTHING after the actual project domain — not generic names like "Item" but "Patient", "Doctor", "Appointment" etc.

BACKEND — PERFECT ARCHITECTURE:
Structure EVERY backend like this:
  backend/server.js        — only app setup, middleware, listen. NO routes here.
  backend/routes/auth.js   — register, login, logout
  backend/routes/[domain].js — all domain routes
  backend/models/User.js   — bcrypt pre-save hook, never plain passwords
  backend/models/[Domain].js — full schema with validation
  backend/middleware/auth.js — JWT verification, always a separate file
  backend/.env.example     — all env vars documented

BACKEND CODE RULES:
- Always use express.Router() — never inline routes in server.js
- Always hash passwords with bcrypt in a mongoose pre-save hook
- Always verify JWT in middleware/auth.js — never inline in routes
- Always use process.env for ALL secrets
- Always wrap every async route in try/catch with meaningful error messages
- Always add mongoose schema validation (required, minlength, enum, etc.)
- Always use proper HTTP status codes (201 create, 404 not found, 401 unauth, 400 bad input)
- Always return consistent JSON: { success: true, data: ... } or { success: false, message: "..." }
- Always populate related documents with .populate()

FRONTEND — STUNNING PROFESSIONAL UI:
Every frontend must look like a $10,000 professionally designed product.

Use this design system in every project:
:root {
  --primary: #6366f1;
  --primary-dark: #4f46e5;
  --primary-light: #e0e7ff;
  --accent: #06b6d4;
  --success: #10b981;
  --warning: #f59e0b;
  --danger: #ef4444;
  --bg: #f8fafc;
  --card: #ffffff;
  --border: #e2e8f0;
  --text: #1e293b;
  --text-muted: #64748b;
  --shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
  --shadow-lg: 0 20px 25px -5px rgba(0,0,0,0.1);
  --radius: 12px;
  --radius-sm: 8px;
  --transition: all 0.2s cubic-bezier(0.4,0,0.2,1);
}

MANDATORY UI FEATURES — every frontend must have ALL of these:
1. NAVBAR — sticky, with logo, nav links, user avatar, logout button, mobile hamburger
2. SIDEBAR — collapsible with icons + labels, active state highlight
3. DASHBOARD — gradient header, stats cards with icons and numbers
4. CARDS — rounded with shadows, hover lift effect (transform: translateY(-2px))
5. FORMS — styled inputs with focus rings, label, validation error states in red
6. BUTTONS — gradient primary, outlined secondary, danger red — all with hover + loading spinner
7. TABLES — striped rows, hover highlight, pagination
8. BADGES — colored status tags (green=active, red=inactive, yellow=pending)
9. LOADING STATES — spinner during every API call
10. TOAST NOTIFICATIONS — success/error toasts that auto-dismiss after 3s
11. EMPTY STATES — friendly message when no data
12. RESPONSIVE — works on mobile with breakpoints

REACT FILE STRUCTURE:
  frontend/src/components/  — Navbar.jsx, Sidebar.jsx, Toast.jsx, Button.jsx, Card.jsx
  frontend/src/pages/       — Login.jsx, Dashboard.jsx, [Domain]List.jsx, [Domain]Detail.jsx
  frontend/src/context/     — AuthContext.jsx
  frontend/src/utils/       — api.js (axios with interceptors)
  frontend/src/App.jsx      — router with protected routes
  frontend/src/index.css    — global styles + CSS variables

REACT RULES:
- Protected routes: redirect to /login if no token in localStorage
- AuthContext: stores user, token, login(), logout() functions
- api.js: axios instance with baseURL from env, interceptor adds Bearer token, 401 interceptor redirects to login
- Every page handles loading and error states
- After create/update/delete, auto-refresh the list

INTEGRATION RULES:
- axios base URL must use import.meta.env.VITE_API_URL or a config constant
- Token stored in localStorage as 'token', sent as Authorization: Bearer header
- axios request interceptor automatically attaches token to every request
- axios response interceptor catches 401 and redirects to /login
- All form submits disable button + show spinner
- All errors show toast notification
- All API responses follow { success, data, message } pattern

QUALITY CHECKLIST — every generated project must pass ALL:
- Backend routes in separate /routes files
- Auth middleware in separate /middleware/auth.js
- Passwords hashed with bcrypt pre-save hook
- JWT secret from process.env.JWT_SECRET
- Every async route has try/catch
- Frontend has navbar, sidebar/nav, dashboard with stats cards
- All forms have validation and error display
- All buttons have hover + loading states
- All API calls show loading spinner
- Errors show toast notification
- Token in localStorage, sent as Bearer
- Protected routes redirect to login
- .env.example has all variables
- Mobile responsive`;

  const userPrompt = `Generate a PERFECT 100/100 fullstack project:

PROJECT: ${description}
TECH STACK: ${stack}
FEATURES: ${featList}
ACADEMIC LEVEL: ${levelMap[level] || levelMap['3']}
CODE COMMENTS: ${commentMap[commentMode] || commentMap['standard']}

Return ONLY this exact JSON — no other text before or after:
{
  "projectName": "CamelCaseName",
  "description": "one sentence",
  "stack": "${stack}",
  "totalLines": 0,
  "folders": [
    {
      "dir": "backend/",
      "files": [
        { "name": "server.js", "color": "#fbbf24", "code": "FULL FILE" },
        { "name": ".env.example", "color": "#f87171", "code": "FULL FILE" }
      ]
    },
    {
      "dir": "backend/routes/",
      "files": [
        { "name": "auth.js", "color": "#fbbf24", "code": "FULL FILE" },
        { "name": "[actualDomain].js", "color": "#fbbf24", "code": "FULL FILE" }
      ]
    },
    {
      "dir": "backend/models/",
      "files": [
        { "name": "User.js", "color": "#fbbf24", "code": "FULL FILE" },
        { "name": "[ActualDomain].js", "color": "#fbbf24", "code": "FULL FILE" }
      ]
    },
    {
      "dir": "backend/middleware/",
      "files": [
        { "name": "auth.js", "color": "#fbbf24", "code": "FULL FILE" }
      ]
    },
    {
      "dir": "frontend/src/",
      "files": [
        { "name": "App.jsx", "color": "#61dafb", "code": "FULL FILE" },
        { "name": "main.jsx", "color": "#61dafb", "code": "FULL FILE" },
        { "name": "index.css", "color": "#3b82f6", "code": "FULL STUNNING CSS" }
      ]
    },
    {
      "dir": "frontend/src/utils/",
      "files": [
        { "name": "api.js", "color": "#fbbf24", "code": "FULL axios instance with interceptors" }
      ]
    },
    {
      "dir": "frontend/src/context/",
      "files": [
        { "name": "AuthContext.jsx", "color": "#61dafb", "code": "FULL FILE" }
      ]
    },
    {
      "dir": "frontend/src/components/",
      "files": [
        { "name": "Navbar.jsx", "color": "#61dafb", "code": "FULL FILE" },
        { "name": "Sidebar.jsx", "color": "#61dafb", "code": "FULL FILE" },
        { "name": "Toast.jsx", "color": "#61dafb", "code": "FULL FILE" }
      ]
    },
    {
      "dir": "frontend/src/pages/",
      "files": [
        { "name": "Login.jsx", "color": "#61dafb", "code": "FULL stunning login page" },
        { "name": "Dashboard.jsx", "color": "#61dafb", "code": "FULL dashboard with stats" },
        { "name": "[ActualDomain]List.jsx", "color": "#61dafb", "code": "FULL list page with table, search, add button" }
      ]
    }
  ],
  "insights": [
    { "t": "Why routes are separated from server.js", "b": "detail with <code>example</code>" },
    { "t": "How JWT middleware protects every route", "b": "detail with <code>example</code>" },
    { "t": "How axios interceptors auto-attach tokens", "b": "detail with <code>example</code>" }
  ],
  "setupSteps": [
    "cd backend && npm install",
    "cp backend/.env.example backend/.env",
    "Edit backend/.env and fill in MONGO_URI and JWT_SECRET",
    "cd frontend && npm install",
    "In a terminal: cd backend && npm run dev",
    "In another terminal: cd frontend && npm run dev"
  ]
}

IMPORTANT: Replace [actualDomain] and [ActualDomain] with the real domain name from this project.
COLOR GUIDE: .js/.ts=#fbbf24, .jsx/.tsx=#61dafb, .java=#86efac, .css=#3b82f6, .html=#f97316, .json=#34d399, .env=#f87171, .md=#a78bfa`;

  try {
    console.log('→ Request received:', description.slice(0, 60));
    console.log('→ Calling Groq API...');

    const chatCompletion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 8192,
      temperature: 0.4,
      top_p: 0.95,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ]
    });

    console.log('→ Got response from Groq');

    const rawText = chatCompletion.choices?.[0]?.message?.content || '';
    const cleaned = rawText.replace(/^```json\s*/i, '').replace(/\s*```$/, '').trim();

    let project;
    try {
      project = JSON.parse(cleaned);
    } catch {
      return res.status(502).json({ error: 'Model returned invalid JSON', raw: rawText.slice(0, 500) });
    }

    console.log('→ Done! Sending project:', project.projectName);
    res.json({ ok: true, project });

  } catch (err) {
    console.error('Generate error:', err.message);
    if (err.message?.includes('timed out')) {
      return res.status(504).json({ error: 'Generation timed out — please try again with a simpler description' });
    }
    res.status(500).json({ error: err.message });
  }
});

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

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', version: '3.0.0', aiPowered: true });
});

app.listen(PORT, () => {
  console.log(`\n🔥 ProjectForge backend running on http://localhost:${PORT}`);
  console.log(`   AI-powered project generation via Groq (llama-3.3-70b-versatile)`);
  console.log(`   Set GROQ_API_KEY in .env to enable generation\n`);
});
