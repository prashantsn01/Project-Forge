const express = require('express');
const cors    = require('cors');
const archiver = require('archiver');
const path    = require('path');
const https   = require('https');
require('dotenv').config();

const app  = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.CLIENT_URL || '*' }));
app.use(express.json({ limit: '64mb' }));

// ─────────────────────────────────────────────────────────────
// STACK GUIDE — concise one-liner per stack
// ─────────────────────────────────────────────────────────────
function getStackGuide(stack) {
  const s = stack.toLowerCase();
  if (s.includes('next'))           return 'Next.js 14 App Router + TypeScript + Prisma + PostgreSQL + NextAuth.js v5';
  if (s.includes('vue'))            return 'Vue 3 Composition API + Vite + Pinia + Vue Router 4 + Express + MongoDB + JWT';
  if (s.includes('angular'))        return 'Angular 17 Standalone + NestJS + TypeORM + PostgreSQL + JWT';
  if (s.includes('rest api'))       return 'Node.js + Express + MongoDB (Mongoose) + JWT + Swagger';
  if (s.includes('fastapi'))        return 'Python 3.11 + FastAPI + SQLAlchemy async + Alembic + PostgreSQL + python-jose + passlib';
  if (s.includes('django'))         return 'Python 3.11 + Django 5 + DRF + SimpleJWT + PostgreSQL';
  if (s.includes('spring') || s.includes('java')) return 'Java 17 + Spring Boot 3.2 + Spring Security 6 + JPA + MySQL + JWT';
  if (s.includes('react frontend')) return 'React 18 + Vite + TailwindCSS + React Query v5 + Zustand + React Router 6 + Axios';
  if (s.includes('vanilla'))        return 'Pure HTML5 + CSS3 + Vanilla ES6 — zero frameworks';
  if (s.includes('android'))        return 'Android Kotlin + Jetpack Compose + MVVM + Hilt + Retrofit2 + Room + Coroutines';
  if (s.includes('react native'))   return 'React Native 0.73 + Expo SDK 50 + TypeScript + React Navigation 6 + Zustand + Axios';
  if (s.includes('flutter'))        return 'Flutter 3.19 + Dart 3 + Riverpod 2 + go_router + Firebase Auth + Cloud Firestore';
  return 'React 18 (Vite) + Express.js + MongoDB (Mongoose) + JWT Auth + Axios';
}

// ─────────────────────────────────────────────────────────────
// NVIDIA NIM — raw HTTPS, focused calls
// ─────────────────────────────────────────────────────────────
const httpsAgent = new https.Agent({
  keepAlive: true, keepAliveMsecs: 60000, maxSockets: 20, timeout: 180000
});

function nimCall(messages, maxTokens = 8192) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: 'deepseek-ai/deepseek-r1',
      messages, max_tokens: maxTokens, temperature: 0.15, top_p: 0.90, stream: false
    });
    const options = {
      hostname: 'integrate.api.nvidia.com', path: '/v1/chat/completions', method: 'POST',
      agent: httpsAgent,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.NVIDIA_API_KEY}`,
        'Content-Length': Buffer.byteLength(body), 'Connection': 'keep-alive'
      }
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.socket && res.socket.setTimeout(180000);
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) return reject(new Error(parsed.error.message || JSON.stringify(parsed.error)));
          const content = parsed.choices?.[0]?.message?.content || '';
          if (!content) return reject(new Error('NIM returned empty content. HTTP: ' + res.statusCode));
          resolve(content);
        } catch (e) {
          console.error('NIM raw (500 chars):', data.slice(0, 500));
          reject(new Error('NIM JSON parse failed: ' + data.slice(0, 200)));
        }
      });
      res.on('error', reject);
    });
    req.setTimeout(180000, () => req.destroy(new Error('NIM socket timeout 180s')));
    req.on('error', reject);
    req.write(body); req.end();
  });
}

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────
const sleep = ms => new Promise(r => setTimeout(r, ms));

function fileColor(name) {
  if (/\.(jsx|tsx)$/.test(name)) return '#61dafb';
  if (/\.(js|ts)$/.test(name))   return '#f59e0b';
  if (/\.java$/.test(name))      return '#86efac';
  if (/\.css$/.test(name))       return '#3b82f6';
  if (/\.html$/.test(name))      return '#f97316';
  if (/\.json$/.test(name))      return '#34d399';
  if (/\.env/.test(name))        return '#ff4757';
  if (/\.md$/.test(name))        return '#a78bfa';
  if (/\.py$/.test(name))        return '#3b82f6';
  if (/\.dart$/.test(name))      return '#54c5f8';
  if (/\.(kt|kts)$/.test(name)) return '#7c52ff';
  if (/\.xml$/.test(name))       return '#ff8c42';
  if (/\.gradle$/.test(name))    return '#02569b';
  if (/\.(yaml|yml)$/.test(name))return '#ff6b6b';
  return '#9a8e7a';
}

function replacePlaceholders(s, names) {
  return s
    .replace(/\[DomainList\]|\[Domain\]List/g,    names.PascalPlural)
    .replace(/\[DomainForm\]|\[Domain\]Form/g,    names.Pascal + 'Form')
    .replace(/\[Domain\]/g, names.Pascal)
    .replace(/\[domain\]/g, names.lower)
    .replace(/\[pkg\]/g,    'com.projectforge');
}

// Strip DeepSeek R1 <think>...</think> reasoning blocks
function stripThink(raw) {
  return raw.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
}

async function extractDomainNames(description) {
  const SKIP = new Set(['generate','create','build','make','develop','design','get','an','a','the','for','with','and','that','this','using','based','app','system','platform','tool','website','web','api','mobile','full','stack']);
  try {
    const raw = await nimCall([{
      role: 'user',
      content: `What is the PRIMARY data entity (main thing managed/stored) in: "${description}"?\nReply with ONLY valid JSON, no markdown, no explanation:\n{"singular":"Event","plural":"Events","lower":"event","lowerPlural":"events"}`
    }], 512);
    // DeepSeek R1 wraps reasoning in <think> tags — strip before parsing
    const clean = stripThink(raw).replace(/```[a-z]*\n?/gi,'').trim();
    const j = JSON.parse(clean.slice(clean.indexOf('{'), clean.lastIndexOf('}')+1));
    const pascal = j.singular.trim().charAt(0).toUpperCase() + j.singular.trim().slice(1);
    return { Pascal: pascal, PascalPlural: (j.plural||pascal+'s').trim(), lower: (j.lower||pascal.toLowerCase()).trim(), lowerPlural: (j.lowerPlural||pascal.toLowerCase()+'s').trim() };
  } catch {
    const words = description.toLowerCase().replace(/[^a-z ]/g,'').split(' ').filter(w => w.length > 2 && !SKIP.has(w));
    const noun = words[0] ? words[0].charAt(0).toUpperCase() + words[0].slice(1) : 'Item';
    return { Pascal: noun, PascalPlural: noun+'s', lower: noun.toLowerCase(), lowerPlural: noun.toLowerCase()+'s' };
  }
}

async function nimWithRetry(messages, maxTokens, label) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      console.log(`  → ${label} attempt ${attempt}/3`);
      return await nimCall(messages, maxTokens);
    } catch (err) {
      const is429 = /429|rate.?limit/i.test(err.message || '');
      console.warn(`  ⚠ ${label} attempt ${attempt} failed: ${err.message?.slice(0,100)}`);
      if (attempt < 3) await sleep(is429 ? 65000 : 5000);
      else throw err;
    }
  }
}

// ─────────────────────────────────────────────────────────────
// FILE PLAN — one entry per file to generate
// ─────────────────────────────────────────────────────────────
function getFilePlan(stack, names) {
  const { Pascal, PascalPlural, lower, lowerPlural } = names;
  // React + Node.js + MongoDB (default)
  return [
    { dir:'backend/',            name:'package.json',      role:`package.json: name:"${lower}-backend", scripts:{start:"node server.js",dev:"nodemon server.js"}, dependencies:{express,cors,dotenv,mongoose,bcryptjs,jsonwebtoken,nodemon,archiver} with latest versions.` },
    { dir:'backend/',            name:'.env.example',      role:`MONGO_URI=mongodb://localhost:27017/${lower}db\nJWT_SECRET=changeme_secret_here\nPORT=3001\nCLIENT_URL=http://localhost:5173` },
    { dir:'backend/',            name:'server.js',         role:`Complete Express server. require('dotenv').config() FIRST. Import express,cors,connectDB,authRoutes,${lower}Routes. Call connectDB(). app.use(cors({origin:process.env.CLIENT_URL||'*'})). app.use(express.json()). Mount app.use('/api/auth',authRoutes) and app.use('/api/${lowerPlural}',${lower}Routes). app.use(errorHandler). app.listen(process.env.PORT||3001). Full implementation.` },
    { dir:'backend/config/',     name:'db.js',             role:`const mongoose=require('mongoose'); async function connectDB(){try{await mongoose.connect(process.env.MONGO_URI);console.log('MongoDB connected');}catch(err){console.error(err.message);process.exit(1);}} module.exports=connectDB;` },
    { dir:'backend/middleware/', name:'auth.js',           role:`const jwt=require('jsonwebtoken'); module.exports=function verifyToken(req,res,next){const token=req.headers.authorization?.split(' ')[1]; if(!token)return res.status(401).json({message:'No token'}); try{req.user=jwt.verify(token,process.env.JWT_SECRET);next();}catch{res.status(401).json({message:'Invalid token'});}};` },
    { dir:'backend/middleware/', name:'errorHandler.js',   role:`module.exports=function(err,req,res,next){console.error(err.stack);res.status(err.status||500).json({success:false,message:err.message||'Server error'});};` },
    { dir:'backend/models/',     name:'User.js',           role:`Mongoose User model: name(String required), email(String required unique lowercase trim), password(String required minlength:6), timestamps:true. pre('save'): if modified password bcrypt.hash(password,10). methods.comparePassword(candidate): return bcrypt.compare(candidate,this.password). Export User.` },
    { dir:'backend/models/',     name:`${Pascal}.js`,      role:`Mongoose ${Pascal} model for project: "${names._description}". Choose ALL relevant fields (e.g. for event: title,description,date,location,status,capacity,price,category). user:{type:Schema.Types.ObjectId,ref:'User',required:true}. timestamps:true. Add index on user field. Export ${Pascal}.` },
    { dir:'backend/routes/',     name:'auth.js',           role:`Express Router. POST /register: validate name+email+password exist, check await User.findOne({email}) → 409 if exists, new User({name,email,password}) save, sign JWT({id:user._id},secret,{expiresIn:'7d'}), return {success:true,token,user:{id,name,email}}. POST /login: find by email or 401, user.comparePassword or 401, sign JWT, return token+user. GET /me: verifyToken middleware, find User.findById(req.user.id).select('-password'), return user. try/catch all.` },
    { dir:'backend/routes/',     name:`${lower}.js`,       role:`Express Router. All routes use verifyToken. GET /: ${Pascal}.find({user:req.user.id}).sort({createdAt:-1}), return {success:true,data:items,count}. POST /: validate required fields, new ${Pascal}({...req.body,user:req.user.id}).save(), return {success:true,data:item}. GET /:id: findOne({_id:req.params.id,user:req.user.id}) or 404. PUT /:id: findOneAndUpdate({_id:req.params.id,user:req.user.id},{...req.body},{new:true,runValidators:true}) or 404, return updated. DELETE /:id: findOneAndDelete({_id:req.params.id,user:req.user.id}) or 404, return {success:true,message:'Deleted'}. Full try/catch.` },
    { dir:'frontend/',           name:'package.json',      role:`Vite React package.json. name:"${lower}-frontend". scripts:{dev:"vite",build:"vite build",preview:"vite preview"}. dependencies:{react:"^18.3.0","react-dom":"^18.3.0","react-router-dom":"^6.26.0",axios:"^1.7.0"}. devDependencies:{vite:"^5.4.0","@vitejs/plugin-react":"^4.3.0"}.` },
    { dir:'frontend/',           name:'vite.config.js',    role:`import{defineConfig}from 'vite';import react from '@vitejs/plugin-react';export default defineConfig({plugins:[react()],server:{proxy:{'/api':{target:'http://localhost:3001',changeOrigin:true}}}});` },
    { dir:'frontend/',           name:'.env.example',      role:`VITE_API_URL=http://localhost:3001` },
    { dir:'frontend/',           name:'index.html',        role:`Standard Vite HTML. lang="en". <title>${PascalPlural} Manager</title>. <div id="root"></div>. <script type="module" src="/src/main.jsx"></script>.` },
    { dir:'frontend/src/',       name:'main.jsx',          role:`import React from 'react';import{StrictMode}from 'react';import{createRoot}from 'react-dom/client';import App from './App';import{AuthProvider}from './context/AuthContext';import{ToastProvider}from './context/ToastContext';import'./index.css';createRoot(document.getElementById('root')).render(<StrictMode><AuthProvider><ToastProvider><App/></ToastProvider></AuthProvider></StrictMode>);` },
    { dir:'frontend/src/',       name:'App.jsx',           role:`BrowserRouter+Routes. Route path="/login" element={<Login/>}. Route path="/" element={<ProtectedRoute/>} with children: index→<Dashboard/>, "${lowerPlural}"→<${PascalPlural}Page/>, "${lowerPlural}/new"→<${Pascal}Form/>, "${lowerPlural}/:id/edit"→<${Pascal}Form/>. Wrap all protected routes in <Layout/>. Import all components.` },
    { dir:'frontend/src/',       name:'index.css',         role:`COMPLETE CSS file, minimum 400 lines. Variables:--primary:#6366f1,--primary-dark:#4f46e5,--accent:#f59e0b,--bg:#f8f7f4,--surface:#ffffff,--border:#e5e7eb,--text:#1f2937,--text-muted:#6b7280,--shadow-sm,--shadow-md,--radius:12px. Full reset. .app-layout{display:grid;grid-template-columns:240px 1fr;grid-template-rows:60px 1fr;height:100vh}. .navbar{grid-column:1/-1;position:sticky;top:0;z-index:100;background:var(--surface);border-bottom:1px solid var(--border);display:flex;align-items:center;padding:0 1.5rem;gap:1rem;box-shadow:var(--shadow-sm)}. .sidebar{background:var(--surface);border-right:1px solid var(--border);padding:1rem 0;overflow-y:auto}. .nav-link{display:flex;align-items:center;gap:0.75rem;padding:0.625rem 1.25rem;color:var(--text-muted);text-decoration:none;transition:all 0.15s;border-radius:0 50px 50px 0;margin-right:0.75rem;font-weight:500} .nav-link:hover,.nav-link.active{background:rgba(99,102,241,0.1);color:var(--primary)}. .main-content{overflow-y:auto;padding:2rem;background:var(--bg)}. .card{background:var(--surface);border-radius:var(--radius);padding:1.5rem;box-shadow:var(--shadow-sm);border:1px solid var(--border);transition:transform 0.15s,box-shadow 0.15s} .card:hover{transform:translateY(-2px);box-shadow:var(--shadow-md)}. .stat-card{display:flex;flex-direction:column;gap:0.5rem} .stat-card .stat-value{font-size:2rem;font-weight:700;color:var(--primary)} .stat-card .stat-label{color:var(--text-muted);font-size:0.875rem}. .btn{display:inline-flex;align-items:center;gap:0.5rem;padding:0.5rem 1.25rem;border-radius:8px;font-weight:600;cursor:pointer;border:none;transition:all 0.15s;font-size:0.875rem} .btn-primary{background:linear-gradient(135deg,var(--primary),var(--primary-dark));color:#fff} .btn-primary:hover{opacity:0.9;transform:translateY(-1px)} .btn-secondary{background:transparent;border:2px solid var(--primary);color:var(--primary)} .btn-secondary:hover{background:var(--primary);color:#fff} .btn-danger{background:#ef4444;color:#fff} .btn-danger:hover{background:#dc2626} .btn-ghost{background:transparent;color:var(--text-muted)} .btn-ghost:hover{background:var(--bg);color:var(--text)} .btn:disabled{opacity:0.6;cursor:not-allowed}. .form-group{display:flex;flex-direction:column;gap:0.375rem;margin-bottom:1.25rem} .form-label{font-weight:600;font-size:0.875rem;color:var(--text)} .form-input,.form-textarea,.form-select{width:100%;padding:0.625rem 0.875rem;border:1.5px solid var(--border);border-radius:8px;font-size:0.9rem;transition:border-color 0.15s;background:var(--surface);color:var(--text)} .form-input:focus,.form-textarea:focus,.form-select:focus{outline:none;border-color:var(--primary)} .form-textarea{resize:vertical;min-height:100px}. .page-title{font-size:1.75rem;font-weight:700;color:var(--text);margin-bottom:0.25rem} .page-subtitle{color:var(--text-muted);font-size:0.9rem;margin-bottom:1.5rem}. .table-wrapper{overflow-x:auto;border-radius:var(--radius);border:1px solid var(--border)} table.data-table{width:100%;border-collapse:collapse;background:var(--surface)} .data-table th{padding:0.75rem 1rem;text-align:left;font-size:0.8rem;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:var(--text-muted);background:var(--bg);border-bottom:1px solid var(--border)} .data-table td{padding:0.875rem 1rem;border-bottom:1px solid var(--border);font-size:0.9rem} .data-table tr:hover td{background:rgba(99,102,241,0.03)} .data-table tr:last-child td{border-bottom:none}. .badge{display:inline-flex;align-items:center;padding:0.2rem 0.6rem;border-radius:50px;font-size:0.75rem;font-weight:600} .badge-success{background:#dcfce7;color:#16a34a} .badge-error{background:#fee2e2;color:#dc2626} .badge-warning{background:#fef3c7;color:#d97706} .badge-info{background:#dbeafe;color:#2563eb}. @keyframes spin{to{transform:rotate(360deg)}} .spinner{width:20px;height:20px;border:2.5px solid var(--border);border-top-color:var(--primary);border-radius:50%;animation:spin 0.7s linear infinite;display:inline-block} .loader-wrap{display:flex;justify-content:center;align-items:center;padding:3rem}. .toast-container{position:fixed;bottom:1.5rem;right:1.5rem;z-index:9999;display:flex;flex-direction:column;gap:0.5rem} @keyframes slideIn{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}} .toast{padding:0.875rem 1.25rem;border-radius:10px;box-shadow:var(--shadow-md);font-weight:500;font-size:0.9rem;animation:slideIn 0.25s ease;min-width:280px;display:flex;justify-content:space-between;align-items:center;gap:1rem} .toast-success{background:#dcfce7;color:#166534;border-left:4px solid #16a34a} .toast-error{background:#fee2e2;color:#991b1b;border-left:4px solid #dc2626} .toast-info{background:#dbeafe;color:#1e3a8a;border-left:4px solid #2563eb}. .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:1000;display:flex;align-items:center;justify-content:center;padding:1rem} .modal-box{background:var(--surface);border-radius:var(--radius);padding:2rem;width:100%;max-width:480px;box-shadow:0 25px 50px rgba(0,0,0,0.15)} .modal-title{font-size:1.2rem;font-weight:700;margin-bottom:1rem}. .empty-state{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:4rem 2rem;text-align:center;color:var(--text-muted)} .empty-state-icon{font-size:3rem;margin-bottom:1rem} .empty-state-title{font-size:1.1rem;font-weight:600;color:var(--text);margin-bottom:0.5rem}. .grid-2{display:grid;grid-template-columns:repeat(2,1fr);gap:1.5rem} .grid-3{display:grid;grid-template-columns:repeat(3,1fr);gap:1.5rem} .grid-4{display:grid;grid-template-columns:repeat(4,1fr);gap:1.5rem}. .search-bar{display:flex;gap:0.75rem;align-items:center;margin-bottom:1.5rem} .search-input{flex:1;padding:0.625rem 1rem;border:1.5px solid var(--border);border-radius:8px;font-size:0.9rem} .search-input:focus{outline:none;border-color:var(--primary)}. @media(max-width:768px){.app-layout{grid-template-columns:1fr} .sidebar{display:none} .grid-2,.grid-3,.grid-4{grid-template-columns:1fr}}` },
    { dir:'frontend/src/context/', name:'AuthContext.jsx', role:`createContext AuthContext. AuthProvider component: useState user+token null. useEffect on mount: const t=localStorage.getItem('token'); const u=localStorage.getItem('user'); if(t&&u){setToken(t);setUser(JSON.parse(u))}. function login(token,user){setToken(token);setUser(user);localStorage.setItem('token',token);localStorage.setItem('user',JSON.stringify(user))}. function logout(){setToken(null);setUser(null);localStorage.removeItem('token');localStorage.removeItem('user')}. isAuthenticated: !!token. Provide {user,token,login,logout,isAuthenticated}. export const useAuth=()=>useContext(AuthContext). export AuthProvider.` },
    { dir:'frontend/src/context/', name:'ToastContext.jsx',role:`createContext ToastContext. ToastProvider: useState toasts=[]. function showToast(message,type='success',duration=3000){const id=Date.now();setToasts(prev=>[...prev,{id,message,type}]);setTimeout(()=>setToasts(prev=>prev.filter(t=>t.id!==id)),duration)}. function removeToast(id){setToasts(prev=>prev.filter(t=>t.id!==id))}. Render <><div className="toast-container">{toasts.map(t=><div key={t.id} className={\`toast toast-\${t.type}\`}>{t.message}<button onClick={()=>removeToast(t.id)}>✕</button></div>)}</div>{children}</>. export const useToast=()=>useContext(ToastContext). export ToastProvider.` },
    { dir:'frontend/src/utils/', name:'api.js',            role:`import axios from 'axios'; const api=axios.create({baseURL:import.meta.env.VITE_API_URL||'http://localhost:3001'}); api.interceptors.request.use(config=>{const token=localStorage.getItem('token');if(token)config.headers.Authorization='Bearer '+token;return config}); api.interceptors.response.use(r=>r,err=>{if(err.response?.status===401){localStorage.removeItem('token');localStorage.removeItem('user');window.location.href='/login'}return Promise.reject(err)}); export default api;` },
    { dir:'frontend/src/components/', name:'ProtectedRoute.jsx', role:`import{Navigate,Outlet}from 'react-router-dom';import{useAuth}from '../context/AuthContext';export default function ProtectedRoute(){const{isAuthenticated}=useAuth();return isAuthenticated?<Outlet/>:<Navigate to="/login" replace/>;}` },
    { dir:'frontend/src/components/', name:'Layout.jsx',    role:`import Navbar from './Navbar';import Sidebar from './Sidebar';import{Outlet}from 'react-router-dom';export default function Layout(){return(<div className="app-layout"><Navbar/><Sidebar/><main className="main-content"><Outlet/></main></div>);}` },
    { dir:'frontend/src/components/', name:'Navbar.jsx',    role:`Sticky navbar component. Import useAuth, useNavigate. Left: brand name "${PascalPlural} Manager" with emoji. Right: show user.name from auth, logout button (calls auth.logout() then navigate('/login')). Use className="navbar". Full JSX implementation.` },
    { dir:'frontend/src/components/', name:'Sidebar.jsx',   role:`Sidebar nav. Import NavLink from react-router-dom. Links: <NavLink to="/" end className={({isActive})=>isActive?'nav-link active':'nav-link'}>📊 Dashboard</NavLink>. <NavLink to="/${lowerPlural}" className={({isActive})=>isActive?'nav-link active':'nav-link'}> [relevant emoji for ${Pascal}] ${PascalPlural}</NavLink>. Wrap in <nav className="sidebar">. Full implementation.` },
    { dir:'frontend/src/components/', name:'Loader.jsx',    role:`export default function Loader(){return <div className="loader-wrap"><div className="spinner"></div></div>;}` },
    { dir:'frontend/src/components/', name:'Modal.jsx',     role:`Reusable modal. Props: isOpen,onClose,title,children. useEffect: if isOpen add keydown listener for Escape→onClose, cleanup on return. If !isOpen return null. Return <div className="modal-overlay" onClick={e=>{if(e.target===e.currentTarget)onClose()}}><div className="modal-box"><div className="modal-title">{title}</div>{children}</div></div>. Export default Modal.` },
    { dir:'frontend/src/components/', name:'ConfirmDialog.jsx', role:`import Modal. Props: isOpen,onClose,onConfirm,title='Confirm',message='Are you sure?'. Return <Modal isOpen={isOpen} onClose={onClose} title={title}><p style={{marginBottom:'1.5rem',color:'var(--text-muted)'}}>{message}</p><div style={{display:'flex',gap:'0.75rem',justifyContent:'flex-end'}}><button className="btn btn-ghost" onClick={onClose}>Cancel</button><button className="btn btn-danger" onClick={()=>{onConfirm();onClose();}}>Delete</button></div></Modal>. Export default ConfirmDialog.` },
    { dir:'frontend/src/pages/', name:'Login.jsx',          role:`Login+Register page. useState: email='',password='',name='',isRegister=false,loading=false,error=''. handleSubmit: e.preventDefault, if !email||!password set error return, setLoading true, try api.post('/api/auth/'+(isRegister?'register':'login'), {email,password,...(isRegister?{name}:{})}), on success auth.login(data.token,data.user) navigate('/'), catch setError(err.response?.data?.message||'Failed'), finally setLoading false. Render centered login card: title, if error show red error div, form with inputs (name input only if isRegister), submit button with spinner when loading, toggle link. Beautiful card design using CSS classes.` },
    { dir:'frontend/src/pages/', name:'Dashboard.jsx',      role:`Dashboard. useState: items=[],loading=true,error=''. useEffect: api.get('/api/${lowerPlural}').then(r=>setItems(r.data.data||[])).catch(e=>setError(e.message)).finally(()=>setLoading(false)). If loading return <Loader/>. Calc: total=items.length, recent=items.slice(0,5), thisMonth=items.filter(i=>new Date(i.createdAt).getMonth()===new Date().getMonth()).length. Render: greeting h2 with useAuth user.name. Grid of 4 stat cards (Total ${PascalPlural}, This Month, Most Recent title, Quick Add button). Recent ${PascalPlural} table showing last 5 items with their main fields. Full JSX implementation.` },
    { dir:'frontend/src/pages/', name:`${PascalPlural}Page.jsx`, role:`${Pascal} list page. useState: items=[],loading=true,error='',search='',deleteId=null,showConfirm=false. useEffect fetch GET /api/${lowerPlural} via api.get, setItems(res.data.data||[]). filtered=items.filter by search (match main fields). If loading <Loader/>. Render: page title, search bar input, "Add New ${Pascal}" button (navigate /${lowerPlural}/new). Table or card grid of filtered items showing all main fields. Each row has Edit btn (navigate to /${lowerPlural}/id/edit) and Delete btn (setDeleteId+setShowConfirm). ConfirmDialog: onConfirm calls api.delete('/api/${lowerPlural}/'+deleteId).then(()=>setItems(items.filter(i=>i._id!==deleteId))&&showToast('Deleted','success')). EmptyState if no items. Full implementation with imports.` },
    { dir:'frontend/src/pages/', name:`${Pascal}Form.jsx`,  role:`Create/Edit form. const{id}=useParams(); const isEdit=!!id. useState for ALL form fields relevant to ${Pascal} (initialized to empty). useEffect: if isEdit, api.get('/api/${lowerPlural}/'+id).then(r=>set all fields from r.data.data). handleSubmit: validate required fields, setLoading, if isEdit api.put else api.post('/api/${lowerPlural}'). On success: showToast('Saved!','success'), navigate('/${lowerPlural}'). Render: page title "Add/Edit ${Pascal}". Form with labeled inputs for ALL fields. Submit button + Cancel button (navigate back). Show error if any. Full implementation.` },
    { dir:'',                    name:'README.md',          role:`# ${PascalPlural} Manager\n\nA full-stack ${PascalPlural.toLowerCase()} management application.\n\n## Tech Stack\n- **Frontend**: React 18 + Vite + React Router 6 + Axios\n- **Backend**: Node.js + Express.js\n- **Database**: MongoDB + Mongoose\n- **Auth**: JWT + bcrypt\n\n## Features\n- User authentication (register/login)\n- Full CRUD for ${PascalPlural}\n- Protected routes\n- Toast notifications\n- Responsive design\n\n## Setup\n1. cd backend && npm install\n2. cp .env.example .env (fill MONGO_URI and JWT_SECRET)\n3. cd ../frontend && npm install\n4. cp .env.example .env\n5. Terminal 1: cd backend && npm run dev\n6. Terminal 2: cd frontend && npm run dev\n7. Open http://localhost:5173\n\n## API Endpoints\n| Method | Path | Auth | Description |\n|--------|------|------|-------------|\n| POST | /api/auth/register | No | Register user |\n| POST | /api/auth/login | No | Login |\n| GET | /api/auth/me | Yes | Get current user |\n| GET | /api/${lowerPlural} | Yes | List all ${PascalPlural} |\n| POST | /api/${lowerPlural} | Yes | Create ${Pascal} |\n| GET | /api/${lowerPlural}/:id | Yes | Get one |\n| PUT | /api/${lowerPlural}/:id | Yes | Update |\n| DELETE | /api/${lowerPlural}/:id | Yes | Delete |` },
  ];
}

// ─────────────────────────────────────────────────────────────
// GENERATE A SINGLE FILE via NIM (plain text output — no JSON!)
// ─────────────────────────────────────────────────────────────
async function generateFile(spec, context, stackGuide) {
  const { dir, name, role } = spec;
  const fullPath = (dir||'') + name;
  const raw = await nimWithRetry([
    {
      role: 'system',
      content: `You are an expert software engineer writing production code.\nStack: ${stackGuide}\nOutput ONLY the raw file content. No markdown fences (no \`\`\`). No explanation. No preamble. Start with the very first character of the file.`
    },
    {
      role: 'user',
      content: `Generate file: ${fullPath}\n\nProject context:\n${context}\n\nExact requirements for this file:\n${role}\n\nOutput ONLY the file content now:`
    }
  ], 8192, fullPath);

  // Strip DeepSeek R1 <think> reasoning blocks, then strip markdown fences
  const stripped = raw.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
  return stripped.replace(/^```[a-z]*\n?/im, '').replace(/\n?```\s*$/im, '').trim();
}

// ─────────────────────────────────────────────────────────────
// SSE helpers — keep Render proxy alive
// ─────────────────────────────────────────────────────────────
function sseSetup(res) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();
}
function sseSend(res, event, data) {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

// ─────────────────────────────────────────────────────────────
// GENERATE — SSE streaming endpoint (main)
// GET /api/generate/stream?description=...&stack=...
// ─────────────────────────────────────────────────────────────
app.get('/api/generate/stream', async (req, res) => {
  const { description, stack, features, level, scale } = req.query;
  if (!description || !stack)          { res.status(400).json({ error: 'description and stack required' }); return; }
  if (!process.env.NVIDIA_API_KEY)     { res.status(500).json({ error: 'NVIDIA_API_KEY not configured' }); return; }

  sseSetup(res);

  // Ping every 20s so Render's proxy doesn't kill idle connection
  const ping = setInterval(() => res.write(': ping\n\n'), 20000);
  const done = (event, data) => { clearInterval(ping); sseSend(res, event, data); res.end(); };

  try {
    const stackGuide = getStackGuide(stack);
    console.log(`\n🚀 [ProjectForge V7-SSE] ${description.slice(0,80)}`);

    sseSend(res, 'progress', { step: 0, total: 0, message: '🧠 Extracting domain model…' });
    const names = await extractDomainNames(description);
    names._description = description;
    console.log(`   Domain → ${names.Pascal} / ${names.PascalPlural}`);
    sseSend(res, 'progress', { step: 0, total: 0, message: `✅ Domain: ${names.Pascal}` });

    const featList = features ? (Array.isArray(features) ? features : [features]).join(', ') : 'Auth, CRUD, Dashboard';
    const context  = `Project: ${description}\nStack: ${stack} (${stackGuide})\nDomain: ${names.Pascal} / ${names.PascalPlural} / route: /${names.lowerPlural}\nFeatures: ${featList}\nLevel: ${level||'senior'} | Scale: ${scale||'standard'}`;

    const filePlan   = getFilePlan(stack, names);
    const total      = filePlan.length;
    const folderMap  = {};
    const allFolders = [];

    for (let i = 0; i < filePlan.length; i++) {
      const spec     = filePlan[i];
      const fullPath = (spec.dir||'') + spec.name;

      sseSend(res, 'progress', { step: i+1, total, message: `⚙️ [${i+1}/${total}] ${fullPath}…` });

      let code = '';
      try {
        const raw = await generateFile(spec, context, stackGuide);
        code = replacePlaceholders(raw, names);
      } catch (err) {
        console.warn(`  ⚠ Failed ${fullPath}: ${err.message?.slice(0,80)}`);
        code = `// Auto-generation failed for ${fullPath}.\n// Error: ${err.message}\n// Please implement this file manually based on the project requirements.`;
      }

      const dirKey = spec.dir || '__root__';
      if (!folderMap[dirKey]) {
        folderMap[dirKey] = { dir: spec.dir, files: [] };
        allFolders.push(folderMap[dirKey]);
      }
      folderMap[dirKey].files.push({ name: spec.name, color: fileColor(spec.name), code });

      // Stream each file immediately to frontend for live preview
      sseSend(res, 'file', { dir: spec.dir, name: spec.name, color: fileColor(spec.name), code, progress: { current: i+1, total } });

      if (i < filePlan.length - 1) await sleep(400);
    }

    let totalLines = 0;
    allFolders.forEach(f => f.files.forEach(file => { if (file.code) totalLines += file.code.split('\n').length; }));

    const project = {
      projectName: names.PascalPlural + 'Manager',
      description: `Full-stack ${names.PascalPlural.toLowerCase()} management — ${description}`,
      stack, folders: allFolders, totalLines,
      setupSteps: [
        'cd backend && npm install',
        'cp backend/.env.example backend/.env   # fill MONGO_URI and JWT_SECRET',
        'cd frontend && npm install',
        'cp frontend/.env.example frontend/.env',
        'Terminal 1: cd backend && npm run dev',
        'Terminal 2: cd frontend && npm run dev',
        'Open http://localhost:5173'
      ],
      insights: [
        { t: 'Architecture', b: 'Clean MVC — models, routes, middleware each in own folder. <code>server.js</code> is entry-point only.' },
        { t: 'JWT Auth Flow', b: `<code>POST /api/auth/login</code> returns a signed token stored in localStorage. Every request auto-sends <code>Authorization: Bearer</code> via Axios interceptor.` },
        { t: 'Ownership Security', b: `Every PUT/DELETE query includes <code>user: req.user.id</code> — no user can touch another user's data.` },
        { t: 'React Context', b: 'AuthContext handles auth state globally. ToastContext provides showToast() anywhere — no prop drilling.' },
        { t: 'Axios Interceptors', b: 'Request interceptor auto-attaches token. Response interceptor catches 401 and redirects to login automatically.' }
      ]
    };

    const fileCount = allFolders.reduce((a,f) => a + f.files.length, 0);
    console.log(`✅ ${project.projectName} — ${totalLines.toLocaleString()} lines, ${fileCount} files`);
    done('complete', { ok: true, project });

  } catch (err) {
    console.error('❌ Fatal error:', err.message);
    const is429 = /429|rate.?limit/i.test(err.message || '');
    done('error', { error: is429 ? 'NIM rate limit — wait 60s and retry.' : err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/generate — kept for backward compatibility
// Wraps SSE logic into a single JSON response
// ─────────────────────────────────────────────────────────────
app.post('/api/generate', async (req, res) => {
  const { description, stack, features, level, scale } = req.body;
  if (!description || !stack)      return res.status(400).json({ error: 'description and stack required' });
  if (!process.env.NVIDIA_API_KEY) return res.status(500).json({ error: 'NVIDIA_API_KEY not configured' });

  req.socket.setTimeout(900000);
  res.setTimeout(900000);

  try {
    const stackGuide = getStackGuide(stack);
    const names      = await extractDomainNames(description);
    names._description = description;
    const featList   = (features||[]).join(', ') || 'Auth, CRUD, Dashboard';
    const context    = `Project: ${description}\nStack: ${stack} (${stackGuide})\nDomain: ${names.Pascal} / ${names.PascalPlural} / route: /${names.lowerPlural}\nFeatures: ${featList}`;
    const filePlan   = getFilePlan(stack, names);
    const folderMap  = {};
    const allFolders = [];

    for (let i = 0; i < filePlan.length; i++) {
      const spec = filePlan[i];
      let code = '';
      try {
        const raw = await generateFile(spec, context, stackGuide);
        code = replacePlaceholders(raw, names);
      } catch (err) {
        code = `// Generation failed: ${err.message}`;
      }
      const dirKey = spec.dir||'__root__';
      if (!folderMap[dirKey]) { folderMap[dirKey]={dir:spec.dir,files:[]}; allFolders.push(folderMap[dirKey]); }
      folderMap[dirKey].files.push({ name:spec.name, color:fileColor(spec.name), code });
      if (i < filePlan.length-1) await sleep(400);
    }

    let totalLines = 0;
    allFolders.forEach(f => f.files.forEach(file => { if(file.code) totalLines += file.code.split('\n').length; }));

    const project = {
      projectName: names.PascalPlural+'Manager', description, stack,
      folders: allFolders, totalLines,
      setupSteps:['cd backend && npm install','cp .env.example .env','cd frontend && npm install','npm run dev'],
      insights:[]
    };
    res.json({ ok: true, project });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// DOWNLOAD ZIP
// ─────────────────────────────────────────────────────────────
app.post('/api/download', (req, res) => {
  const { project } = req.body;
  if (!project?.folders) return res.status(400).json({ error: 'No project data' });
  const safeName = (project.projectName||'project').replace(/[^a-zA-Z0-9_-]/g,'_');
  res.setHeader('Content-Type','application/zip');
  res.setHeader('Content-Disposition',`attachment; filename="${safeName}.zip"`);
  const archive = archiver('zip', { zlib:{ level:9 } });
  archive.pipe(res);
  for (const folder of project.folders) {
    for (const file of folder.files||[]) {
      archive.append(file.code||'', { name: path.join(safeName, folder.dir||'', file.name) });
    }
  }
  archive.finalize();
});

// ─────────────────────────────────────────────────────────────
// HEALTH
// ─────────────────────────────────────────────────────────────
app.get('/api/health', (_,res) => res.json({
  status:'ok', version:'7.0.1', engine:'NVIDIA NIM — DeepSeek R1',
  mode:'per-file SSE streaming — no JSON parse failures', developer:'Prashant S Nagani'
}));

app.listen(PORT, () => {
  console.log(`\n╔══════════════════════════════════════════════════════╗`);
  console.log(`║   ProjectForge Elite  v7.0.0                         ║`);
  console.log(`║   Engine : NVIDIA NIM — DeepSeek R1                   ║`);
  console.log(`║   Mode   : Per-file SSE — no JSON parse failures     ║`);
  console.log(`║   Fix    : SSE keep-alive pings every 20s            ║`);
  console.log(`║   Developer: Prashant S Nagani                       ║`);
  console.log(`╚══════════════════════════════════════════════════════╝`);
  console.log(`\n🔥 Backend → http://localhost:${PORT}`);
  console.log(`🔑 NIM Key: ${process.env.NVIDIA_API_KEY ? '✅ Loaded' : '❌ Missing — add NVIDIA_API_KEY to .env'}\n`);
});
