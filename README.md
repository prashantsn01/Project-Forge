# ⚡ ProjectForge — Engineer Edition

> **The World's Most Powerful AI Project Builder**  
> Built by **Prashant S Nagani** · Powered by **Groq AI + LLaMA 3.3 70B**

Generate any software project — fullstack, backend API, frontend app, mobile — in seconds with zero errors and zero TODOs.

---

## 🚀 Quick Start

### 1. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env — add your GROQ_API_KEY from https://console.groq.com
npm run dev
# → Running on http://localhost:3001
```

### 2. Frontend Setup (New React + Vite UI)

```bash
cd frontend
npm install
npm run dev
# → Running on http://localhost:5173
```

### 3. Connect & Generate

1. Open **http://localhost:5173**
2. Click **Connect** (uses `http://localhost:3001` by default)
3. Describe your project idea
4. Pick your tech stack (React+Node, Spring Boot, FastAPI, Vue, Next.js, and more)
5. Select features & settings
6. Click **⚡ Generate with Groq AI** — your complete project is ready in seconds!

---

## 🛠 Supported Stacks

| Category | Stacks |
|----------|--------|
| **Fullstack** | React + Node.js + MongoDB, Next.js 14, Vue.js + Node, Angular + NestJS |
| **Backend API** | Node.js REST API, Java Spring Boot, Python FastAPI, Python Django |
| **Frontend** | React App, Vanilla HTML/CSS/JS, Flutter Web, React Native |

---

## ✨ Features

- ⚡ **Groq AI** — LLaMA 3.3 70B for fastest generation
- 🏗 **Production-grade** — real architecture, no stubs, no TODOs
- 🎨 **Stunning UI** — premium dark theme, fully responsive, mobile-first
- 📦 **ZIP Download** — download and run instantly
- 🐙 **Git Push** — push generated projects directly to GitHub
- 🗂 **History** — last 20 projects saved in browser
- ⚙️ **Settings** — configure backend URL, export history
- 📱 **Mobile-ready** — hamburger menu, stacked layouts, touch-friendly

---

## 📁 Structure

```
ProjectForge-Engineer/
├── backend/
│   ├── server.js            ← Express + Groq AI integration
│   ├── package.json
│   └── .env.example         ← Add your GROQ_API_KEY here
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   ├── index.css        ← Full design system
│   │   ├── context/
│   │   │   └── AppContext.jsx
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   └── Toast.jsx
│   │   └── pages/
│   │       ├── GeneratePage.jsx
│   │       ├── HistoryPage.jsx
│   │       ├── GitPage.jsx
│   │       └── SettingsPage.jsx
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── .gitignore
└── README.md
```

---

## 🔑 Getting Your Groq API Key

1. Go to [https://console.groq.com](https://console.groq.com)
2. Sign up for free
3. Create an API key
4. Paste it in `backend/.env` as `GROQ_API_KEY=your_key`

Groq is **free** for development use with generous rate limits.

---

## 🐙 Push to GitHub

1. Navigate to **Git Push** in the sidebar
2. Select a generated project from history
3. Enter your GitHub repo URL and a Personal Access Token (`repo` scope)
4. Click **Push to GitHub** — files are uploaded via the GitHub API

---

## 👨‍💻 Developer

**Prashant S Nagani**  
ProjectForge Engineer Edition v4.0.0  
AI Engine: Groq + LLaMA 3.3 70B Versatile
