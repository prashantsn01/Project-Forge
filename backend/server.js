const express = require('express');
const cors = require('cors');
const archiver = require('archiver');
const path = require('path');
const Groq = require('groq-sdk');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.CLIENT_URL || '*' }));
app.use(express.json({ limit: '16mb' }));

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ─────────────────────────────────────────────────────────────
// SYSTEM PROMPTS — ultra-precise per stack
// ─────────────────────────────────────────────────────────────
function getSystemPrompt(stack) {
  const base = `You are ProjectForge Elite — the world's most accurate AI software engineer. Your SOLE purpose is to output COMPLETE, RUNNABLE, ZERO-ERROR projects on the first try.

═══════════════════════════════════════════════════
ABSOLUTE NON-NEGOTIABLE ACCURACY RULES (MEMORIZE)
═══════════════════════════════════════════════════
1. ZERO placeholders. ZERO "// TODO". ZERO "// implement later". ZERO stubs. Every function body must be fully implemented.
2. Every import statement must reference a module that IS declared in package.json / build.gradle / pom.xml / pubspec.yaml / requirements.txt in the SAME project.
3. All file paths, component names, and function names must be CONSISTENT across every file. If App.jsx imports from './pages/Login', that file must be frontend/src/pages/Login.jsx — exact match.
4. No circular imports. No missing exports. Every exported symbol must have a matching import somewhere.
5. Every async function must have try/catch with a proper error response — never a bare async without error handling.
6. For React: no missing hook dependencies, no useState called conditionally, no missing key props on lists.
7. For Node.js: every route file must use express.Router() and be mounted in server.js with app.use('/api/routename', require('./routes/routename')).
8. For databases: connection strings, model names, and query field names must match exactly between model definitions and CRUD usage.
9. JSON output must be valid — escape all backslashes, newlines, and quotes inside string values. Never use raw newlines in JSON strings.
10. COLOR KEY for file icons: .js/.ts=#f59e0b, .jsx/.tsx=#61dafb, .java=#86efac, .css=#3b82f6, .html=#f97316, .json=#34d399, .env=#ff4757, .md=#a78bfa, .py=#3b82f6, .dart=#54c5f8, .kt=#7c52ff, .xml=#ff8c42, .gradle=#02569b, .yaml/.yml=#ff6b6b

═══════════════════════════════════════════════
BEAUTIFUL UI RULES (every frontend)
═══════════════════════════════════════════════
- Premium light theme: warm off-white backgrounds, gold/amber accents, crisp typography
- OR rich dark theme with deep navy/slate, electric accent colors
- NEVER plain gray/white flat design — always use subtle gradients, shadows, depth
- Font hierarchy: serif/display heading + clean body font + monospace for code
- Cards with soft shadows, hover lift transitions (translateY -2px), border-radius 12-20px
- Sticky navbar, collapsible sidebar with active states
- Gradient stat cards on dashboard showing REAL API data
- Tables: striped, hover highlight, sort indicators, pagination
- All buttons: gradient primary, outlined secondary, ghost tertiary — all with hover states
- Loading spinners on every async op; toast notifications for success/error
- Empty states with icon + message + CTA
- Fully responsive — mobile hamburger, stacked layouts`;

  const stacks = {

'React + Node.js + MongoDB': `
STACK: React 18 (Vite) + Express.js + MongoDB (Mongoose) + JWT Auth + Axios

BACKEND FILE LIST (generate ALL of these):
  backend/server.js           — express app, cors, json, mount ALL routes, listen
  backend/config/db.js        — mongoose.connect with error handling, export connectDB
  backend/middleware/auth.js  — jwt.verify middleware, attach req.user, export verifyToken
  backend/models/User.js      — mongoose schema: name,email,password; pre('save') bcrypt.hash; methods.comparePassword
  backend/models/[Domain].js  — domain schema with user ref, timestamps:true, proper indexes
  backend/routes/auth.js      — Router(): POST /register (hash+save+token), POST /login (find+compare+token), GET /me (verifyToken)
  backend/routes/[domain].js  — Router(): GET/(verifyToken,getAll), POST/(verifyToken,create), PUT/:id/(verifyToken,update), DELETE/:id/(verifyToken,delete)
  backend/.env.example        — MONGO_URI=mongodb://localhost:27017/dbname\\nJWT_SECRET=your_secret_here\\nPORT=3001\\nCLIENT_URL=http://localhost:5173
  backend/package.json        — scripts:{start:"node server.js",dev:"nodemon server.js"}, deps:{express,mongoose,bcryptjs,jsonwebtoken,cors,dotenv,nodemon}

BACKEND CODING RULES:
- server.js MUST import and call connectDB() from config/db.js
- server.js MUST mount: app.use('/api/auth', require('./routes/auth')); app.use('/api/[domain]', require('./routes/[domain]'));
- Every route handler: async (req,res) => { try { ... res.json({success:true,data:result}) } catch(err) { res.status(500).json({success:false,message:err.message}) } }
- jwt.sign payload: {id:user._id}, secret: process.env.JWT_SECRET, {expiresIn:'7d'}
- verifyToken: const token=req.headers.authorization?.split(' ')[1]; if(!token) return res.status(401).json({message:'No token'}); req.user=jwt.verify(token,process.env.JWT_SECRET)

FRONTEND FILE LIST (generate ALL of these):
  frontend/src/App.jsx              — BrowserRouter, Routes: /login→Login, /→ProtectedRoute→Layout with nested routes
  frontend/src/main.jsx             — createRoot(document.getElementById('root')).render(<StrictMode><App/></StrictMode>)
  frontend/src/index.css            — COMPLETE CSS: variables, layout, all components
  frontend/src/context/AuthContext.jsx — createContext, useState(user/token), login(token,user), logout(), isAuthenticated, useEffect restore from localStorage
  frontend/src/utils/api.js         — axios.create({baseURL:import.meta.env.VITE_API_URL||'http://localhost:3001'}); request interceptor add Bearer token; response interceptor handle 401→logout
  frontend/src/components/Navbar.jsx    — sticky nav, logo, user name, logout button, mobile hamburger
  frontend/src/components/Sidebar.jsx   — nav links with icons, active highlight, collapse on mobile
  frontend/src/components/Toast.jsx     — context or simple component, success/error/info variants, auto-dismiss 3s
  frontend/src/components/Loader.jsx    — centered spinner component
  frontend/src/pages/Login.jsx          — email+password form, toggle to register, call POST /api/auth/login or /register, store token, navigate to /
  frontend/src/pages/Dashboard.jsx      — useEffect fetch stats from API, 4 stat cards with real numbers, recent items list
  frontend/src/pages/[Domain]List.jsx   — fetch+display all items in table, search bar, Add button→modal/navigate, Edit/Delete per row
  frontend/src/pages/[Domain]Form.jsx   — controlled form for create/edit, all fields validated, submit calls API, show errors
  frontend/vite.config.js              — defineConfig({plugins:[react()],server:{proxy:{'/api':'http://localhost:3001'}}})
  frontend/.env.example                — VITE_API_URL=http://localhost:3001
  frontend/package.json                — scripts:{dev:"vite",build:"vite build"}, deps:{react,react-dom,react-router-dom,axios,vite,@vitejs/plugin-react}

FRONTEND CODING RULES:
- AuthContext: const token=localStorage.getItem('token'); if(token) setToken(token); — restore on mount
- api.js interceptor: config.headers.Authorization = token ? \`Bearer \${token}\` : ''
- Every page that fetches data: const [data,setData]=useState([]); const [loading,setLoading]=useState(true); useEffect(()=>{api.get('/api/...').then(r=>setData(r.data.data)).finally(()=>setLoading(false))},[])
- Protected route: if(!isAuthenticated) return <Navigate to="/login" />`,

'Next.js Full-Stack': `
STACK: Next.js 14 App Router + TypeScript + Prisma + PostgreSQL + NextAuth.js v5

GENERATE ALL FILES:
  app/layout.tsx, app/page.tsx, app/loading.tsx, app/error.tsx
  app/api/auth/[...nextauth]/route.ts  — NextAuth config with Credentials provider
  app/api/[domain]/route.ts            — GET(list), POST(create) with auth check
  app/api/[domain]/[id]/route.ts       — GET, PUT, DELETE with auth check
  app/(auth)/login/page.tsx            — login form using signIn()
  app/(dashboard)/layout.tsx           — sidebar + navbar layout
  app/(dashboard)/dashboard/page.tsx   — server component, fetch stats
  app/(dashboard)/[domain]/page.tsx    — server component, list with client table
  prisma/schema.prisma                 — User + Domain models with relations
  lib/prisma.ts                        — PrismaClient singleton
  lib/auth.ts                          — NextAuth options export
  components/ui/Button.tsx, Card.tsx, Input.tsx, Table.tsx
  components/layout/Navbar.tsx, Sidebar.tsx
  middleware.ts                        — protect /dashboard routes
  .env.example                         — DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL
  package.json                         — all deps including prisma, @prisma/client, next-auth, typescript, @types/react, @types/node`,

'Vue.js + Node.js': `
STACK: Vue 3 Composition API + Vite + Pinia + Vue Router 4 + Express + MongoDB + JWT

BACKEND: Same structure as React+Node (Express+Mongoose+JWT)

FRONTEND FILES:
  frontend/src/main.js         — createApp, use(router), use(pinia), mount
  frontend/src/App.vue         — <RouterView/> with layout wrapper
  frontend/src/router/index.js — createRouter, routes with navigation guard: check auth store
  frontend/src/stores/auth.js  — defineStore: state(user,token), actions(login,logout,fetchUser), persist to localStorage
  frontend/src/api/axios.js    — axios instance, request interceptor (Bearer), response 401 interceptor
  frontend/src/components/AppNavbar.vue, AppSidebar.vue, AppToast.vue
  frontend/src/views/LoginView.vue, DashboardView.vue, [Domain]ListView.vue, [Domain]FormView.vue
  frontend/package.json        — deps: vue, vue-router, pinia, axios, vite, @vitejs/plugin-vue`,

'Angular + Node.js': `
STACK: Angular 17 Standalone + NestJS + TypeORM + PostgreSQL + JWT + class-validator

BACKEND (NestJS):
  src/app.module.ts             — TypeOrmModule.forRoot, imports all feature modules
  src/auth/auth.module.ts, auth.controller.ts, auth.service.ts, jwt.strategy.ts, jwt-auth.guard.ts
  src/[domain]/[domain].module.ts, [domain].controller.ts, [domain].service.ts, [domain].entity.ts, dto/create-[domain].dto.ts
  src/main.ts                   — NestFactory.create, CORS, ValidationPipe, listen(3001)
  src/.env.example

FRONTEND (Angular):
  src/app/app.config.ts         — provideRouter, provideHttpClient, provideAnimations
  src/app/app.routes.ts         — Routes array with canActivate guards
  src/app/core/services/auth.service.ts
  src/app/core/interceptors/auth.interceptor.ts
  src/app/core/guards/auth.guard.ts
  src/app/features/[domain]/components/[domain]-list.component.ts, [domain]-form.component.ts
  src/app/shared/components/navbar.component.ts, sidebar.component.ts`,

'Node.js REST API': `
STACK: Node.js + Express.js + MongoDB (Mongoose) + JWT + Swagger (swagger-jsdoc + swagger-ui-express)

GENERATE ALL:
  server.js              — app setup, mount routes, Swagger UI at /api-docs, listen
  config/db.js           — mongoose connect
  config/swagger.js      — swaggerJsdoc definition with info, servers, components/securitySchemes
  middleware/auth.js     — verifyToken middleware
  middleware/validate.js — express-validator result checker middleware
  models/User.js, models/[Domain].js
  routes/auth.js         — with @swagger JSDoc comments on each endpoint
  routes/[domain].js     — full CRUD with @swagger JSDoc comments
  utils/pagination.js    — helper: {page,limit,skip} from req.query
  .env.example, package.json, README.md — full API reference with curl examples`,

'Python FastAPI': `
STACK: Python 3.11 + FastAPI + SQLAlchemy 2.0 (async) + Alembic + PostgreSQL + python-jose + passlib[bcrypt]

GENERATE ALL:
  main.py                — FastAPI app, include routers, CORS middleware, startup event
  app/database.py        — async engine, AsyncSessionLocal, Base, get_db dependency
  app/models.py          — SQLAlchemy ORM models: User, [Domain] with relationships
  app/schemas.py         — Pydantic v2 BaseModel schemas: [Domain]Base, [Domain]Create, [Domain]Response, UserCreate, Token
  app/crud.py            — async CRUD functions using select(), scalars(), session.commit()
  app/auth.py            — create_access_token, verify_token, get_current_user dependency, oauth2_scheme
  app/routers/auth.py    — /register, /login (returns JWT)
  app/routers/[domain].py — full CRUD routes with Depends(get_current_user)
  alembic.ini, alembic/env.py
  requirements.txt       — fastapi, uvicorn[standard], sqlalchemy[asyncio], asyncpg, alembic, python-jose[cryptography], passlib[bcrypt], pydantic[email]
  .env.example, README.md`,

'Python Django': `
STACK: Python 3.11 + Django 5.0 + Django REST Framework 3.15 + SimpleJWT + PostgreSQL + django-cors-headers

GENERATE ALL:
  manage.py
  config/settings.py     — INSTALLED_APPS (rest_framework, corsheaders, simplejwt, apps.users, apps.[domain]), REST_FRAMEWORK settings, SIMPLE_JWT config, CORS config
  config/urls.py         — include auth URLs, api/[domain]/ URLs, simplejwt token URLs
  config/wsgi.py
  apps/users/models.py, serializers.py, views.py, urls.py, apps.py
  apps/[domain]/models.py, serializers.py, views.py, urls.py, apps.py, admin.py
  requirements.txt       — django, djangorestframework, djangorestframework-simplejwt, django-cors-headers, psycopg2-binary, python-decouple
  .env.example, README.md`,

'Java Spring Boot': `
STACK: Java 17 + Spring Boot 3.2 + Spring Security 6 + Spring Data JPA + MySQL 8 + Maven + JWT (jjwt 0.12)

GENERATE ALL JAVA FILES (complete class bodies, no stubs):
  src/main/java/com/projectforge/Application.java
  src/main/java/com/projectforge/config/SecurityConfig.java   — SecurityFilterChain bean, BCryptPasswordEncoder bean, AuthenticationManager bean
  src/main/java/com/projectforge/config/CorsConfig.java
  src/main/java/com/projectforge/security/JwtUtil.java        — generateToken(UserDetails), validateToken, extractUsername — using io.jsonwebtoken
  src/main/java/com/projectforge/security/JwtFilter.java      — OncePerRequestFilter, extract+validate JWT, set SecurityContext
  src/main/java/com/projectforge/security/UserDetailsServiceImpl.java — loadUserByUsername
  src/main/java/com/projectforge/model/User.java              — @Entity, fields, implements UserDetails
  src/main/java/com/projectforge/model/[Domain].java          — @Entity with @ManyToOne User
  src/main/java/com/projectforge/repository/UserRepository.java, [Domain]Repository.java
  src/main/java/com/projectforge/dto/LoginRequest.java, RegisterRequest.java, AuthResponse.java, [Domain]Dto.java
  src/main/java/com/projectforge/service/AuthService.java, [Domain]Service.java
  src/main/java/com/projectforge/controller/AuthController.java, [Domain]Controller.java
  src/main/java/com/projectforge/exception/GlobalExceptionHandler.java  — @ControllerAdvice
  src/main/resources/application.properties — spring.datasource.*, spring.jpa.*, jwt.secret, jwt.expiration
  pom.xml — all deps: spring-boot-starter-web, security, data-jpa, mysql-connector-j, jjwt-api 0.12.3, jjwt-impl, jjwt-jackson, lombok, validation`,

'React Frontend': `
STACK: React 18 + Vite + TailwindCSS (via CDN in index.html) + React Query v5 + Zustand + React Router 6 + Axios

GENERATE ALL:
  src/main.jsx            — createRoot, QueryClientProvider wrapping App
  src/App.jsx             — BrowserRouter, routes, layout
  src/index.css           — complete professional CSS
  src/store/useStore.js   — Zustand store: user, theme, notifications
  src/hooks/useApi.js     — React Query useQuery/useMutation wrappers
  src/api/client.js       — axios instance, mock interceptor returning realistic data
  src/components/ui/Button.jsx, Card.jsx, Modal.jsx, Table.jsx, Badge.jsx, Input.jsx
  src/components/layout/Layout.jsx, Navbar.jsx, Sidebar.jsx, Footer.jsx
  src/pages/Home.jsx, Dashboard.jsx, [Domain]List.jsx, [Domain]Detail.jsx
  package.json, vite.config.js, index.html`,

'HTML/CSS/JS Vanilla': `
STACK: Pure HTML5 + CSS3 + Vanilla ES6+ — zero frameworks, zero dependencies, runs by opening index.html

GENERATE ALL:
  index.html         — complete SPA shell with all navigation, modals markup, link to css/styles.css and js/app.js
  css/styles.css     — COMPLETE: CSS variables, reset, layout, navbar, sidebar, cards, tables, forms, modals, animations, responsive
  js/app.js          — SPA router (hashchange), state management (plain object), init, render pages
  js/api.js          — fetch wrapper: get/post/put/delete, auth headers, error handling; uses localStorage mock data if no backend
  js/auth.js         — login(), logout(), getToken(), isAuthenticated(), saveUser()
  js/pages/dashboard.js, [domain]-list.js, [domain]-form.js
  js/components/navbar.js, sidebar.js, toast.js, modal.js, table.js
  README.md

CSS RULES: CSS Grid + Flexbox, smooth transitions, no external deps`,

'Flutter Web App': `
STACK: Flutter 3.19 + Dart 3 + Riverpod 2 (flutter_riverpod) + go_router + Dio + Firebase Auth + Cloud Firestore

GENERATE ALL DART FILES (complete, compilable):
  lib/main.dart                           — runApp(ProviderScope(child:MyApp()))
  lib/app.dart                            — MaterialApp.router with GoRouter, ThemeData
  lib/firebase_options.dart               — DefaultFirebaseOptions (stub values, clearly marked)
  lib/models/[domain]_model.dart          — Dart class with fromJson/toJson
  lib/services/auth_service.dart          — FirebaseAuth signIn/signUp/signOut
  lib/services/[domain]_service.dart      — Firestore CRUD operations
  lib/providers/auth_provider.dart        — StateNotifierProvider
  lib/providers/[domain]_provider.dart    — FutureProvider / StateNotifierProvider
  lib/screens/login_screen.dart, dashboard_screen.dart, [domain]_list_screen.dart, [domain]_form_screen.dart
  lib/widgets/custom_drawer.dart, custom_appbar.dart, [domain]_card.dart, loading_widget.dart
  pubspec.yaml                            — flutter_riverpod, go_router, firebase_core, firebase_auth, cloud_firestore, dio
  README.md`,

'React Native Mobile': `
STACK: React Native 0.73 + Expo SDK 50 + TypeScript + React Navigation 6 + Zustand + Axios + AsyncStorage + Expo SecureStore

GENERATE ALL (complete TypeScript, no errors):
  App.tsx                                    — NavigationContainer, stack/tab navigator setup
  src/navigation/AppNavigator.tsx            — root stack: Auth stack vs Main tab
  src/navigation/AuthNavigator.tsx           — Login, Register screens
  src/navigation/MainNavigator.tsx           — Tab: Home, [Domain], Profile
  src/screens/auth/LoginScreen.tsx           — form, validation, call auth store login()
  src/screens/auth/RegisterScreen.tsx        — form, validation
  src/screens/main/HomeScreen.tsx            — dashboard cards, recent activity
  src/screens/main/[Domain]Screen.tsx        — FlatList of items, pull-to-refresh
  src/screens/main/[Domain]DetailScreen.tsx  — detail view, edit/delete actions
  src/screens/main/ProfileScreen.tsx         — user info, logout
  src/components/ui/Button.tsx, Card.tsx, Input.tsx, Avatar.tsx, EmptyState.tsx
  src/store/authStore.ts                     — Zustand: user, token, login()/logout(), persist with AsyncStorage
  src/store/[domain]Store.ts                 — Zustand: items, fetchItems(), createItem(), deleteItem()
  src/api/client.ts                          — axios instance, interceptors for auth token + 401 refresh
  src/api/[domain]Api.ts                     — typed API calls
  src/utils/storage.ts                       — SecureStore wrapper
  src/utils/constants.ts                     — API_URL, colors, sizes
  src/types/index.ts                         — TypeScript interfaces: User, [Domain], ApiResponse
  app.json, package.json, tsconfig.json, babel.config.js
  README.md`,

'Android Studio (Kotlin)': `
STACK: Android (Kotlin) + Jetpack Compose + MVVM + Hilt DI + Retrofit2 + Room Database + Coroutines + Flow + Navigation Component

CRITICAL ANDROID RULES:
- ALL Kotlin files must have correct package declarations matching directory structure
- AndroidManifest.xml must declare ALL activities, permissions, and the application class
- build.gradle (app) must include ALL required dependencies with EXACT versions that are compatible
- Hilt: @HiltAndroidApp on Application, @AndroidEntryPoint on Activities/Fragments, @HiltViewModel on ViewModels
- Room: @Database annotation with entities list and version, @Dao with all query methods, @Entity with proper keys
- Compose: ALL @Composable functions must have correct parameter types; use rememberSaveable for state
- Navigation: NavHost with all destinations defined; use sealed class for routes
- Retrofit: interface methods must return suspend fun or Call<>; use @GET/@POST/@PUT/@DELETE annotations
- Coroutines: viewModelScope.launch for UI actions; withContext(Dispatchers.IO) for database/network

GENERATE ALL FILES:
  app/src/main/AndroidManifest.xml        — application, activities, INTERNET permission, Hilt application class
  app/src/main/java/com/[pkg]/
    MyApplication.kt                      — @HiltAndroidApp class
    MainActivity.kt                       — @AndroidEntryPoint, setContent{}, NavHost setup
    navigation/
      NavGraph.kt                         — NavHost composable with all routes as sealed class
      Screen.kt                           — sealed class Screen with route strings
    ui/theme/
      Theme.kt                            — MaterialTheme with light/dark color schemes
      Color.kt                            — Color definitions
      Type.kt                             — Typography
    ui/screens/
      HomeScreen.kt                       — @Composable, LazyColumn, FAB, TopAppBar
      [Domain]ListScreen.kt               — @Composable list screen with ViewModel
      [Domain]DetailScreen.kt             — @Composable detail/edit screen
      LoginScreen.kt                      — @Composable login form if auth needed
    ui/components/
      [Domain]Card.kt                     — @Composable card component
      LoadingIndicator.kt                 — @Composable CircularProgressIndicator
      ErrorMessage.kt                     — @Composable error display
    viewmodel/
      [Domain]ViewModel.kt                — @HiltViewModel, StateFlow<UiState>, functions for CRUD
      [Domain]UiState.kt                  — sealed class / data class for UI state
    data/
      local/
        AppDatabase.kt                    — @Database(entities=[...], version=1) abstract class, RoomDatabase
        [Domain]Entity.kt                 — @Entity data class with @PrimaryKey(autoGenerate=true)
        [Domain]Dao.kt                    — @Dao interface: @Query/@Insert/@Update/@Delete
      remote/
        ApiService.kt                     — Retrofit @interface with suspend fun endpoints
        [Domain]Dto.kt                    — data class matching API response JSON
      repository/
        [Domain]Repository.kt             — @Inject constructor, combine Room + Retrofit, return Flow<>
    di/
      AppModule.kt                        — @Module @InstallIn(SingletonComponent) providing Retrofit, OkHttp, Room, Dao
      RepositoryModule.kt                 — @Module binding Repository interface to impl
    model/
      [Domain].kt                         — domain model data class (separate from Entity/DTO)
    utils/
      Resource.kt                         — sealed class Resource<T>(data, message): Loading, Success, Error
      Constants.kt                        — BASE_URL and other constants
  app/src/main/res/
    values/strings.xml                    — app_name and all string resources
    values/colors.xml                     — color resources
    drawable/ic_launcher_background.xml   — vector drawable
  app/build.gradle                        — compileSdk 34, minSdk 24, targetSdk 34, ALL Hilt/Compose/Room/Retrofit/Coroutines deps with EXACT versions
  build.gradle (project)                  — classpath for Hilt plugin
  gradle/wrapper/gradle-wrapper.properties — distributionUrl for Gradle 8.2
  settings.gradle                         — app module include
  README.md                               — setup instructions, architecture diagram in ASCII`
  };

  const match = Object.keys(stacks).find(k => stack && stack.toLowerCase().includes(k.toLowerCase().split(' ')[0]));
  const guide = stacks[stack] || stacks[match] || stacks['React + Node.js + MongoDB'];
  return base + '\n\n' + guide;
}

// ─────────────────────────────────────────────────────────────
// GENERATE ENDPOINT
// ─────────────────────────────────────────────────────────────
app.post('/api/generate', async (req, res) => {
  const { description, stack, features, level, commentMode, scale } = req.body;
  if (!description || !stack) return res.status(400).json({ error: 'description and stack are required' });
  if (!process.env.GROQ_API_KEY) return res.status(500).json({ error: 'GROQ_API_KEY not configured. Add it to backend/.env' });

  const featList = (features || []).join(', ') || 'auth, CRUD, dashboard';
  const levelMap = {
    '1': 'Junior — heavy comments, simple patterns, explain every architectural decision',
    '2': 'Mid-level — Repository pattern, service layer, moderate comments',
    '3': 'Senior — SOLID principles, clean code, comments only for non-obvious logic',
    '4': 'Principal — production-grade, logging, rate limiting, health checks, observability'
  };
  const commentMap = {
    learning: 'Add a comment above EVERY logical block explaining what AND why',
    standard: 'Comment architectural decisions and non-obvious logic only',
    clean: 'JSDoc/KDoc/docstrings on public APIs only, no inline comments'
  };
  const scaleMap = {
    mvp: 'MVP — core features only, optimise for speed of development',
    standard: 'Production-ready — full feature set, proper error handling',
    enterprise: 'Enterprise — add structured logging (winston/slf4j), rate limiting, caching layer, Docker Compose, CI/CD yaml, health check endpoints'
  };

  const systemPrompt = getSystemPrompt(stack);

  // fileTemplate removed — replaced by chunked generation below
  const _isAndroid_unused = stack.toLowerCase().includes('android'); // kept for reference
  const fileTemplate_UNUSED = `
{
  "projectName": "PascalCaseName",
  "description": "one sentence",
  "stack": "${stack}",
  "totalLines": 1800,
  "folders": [
    { "dir": "app/src/main/", "files": [{ "name": "AndroidManifest.xml", "color": "#ff8c42", "code": "FULL XML" }] },
    { "dir": "app/src/main/java/com/projectforge/", "files": [{ "name": "MyApplication.kt", "color": "#7c52ff", "code": "FULL KOTLIN" }] },
    { "dir": "app/src/main/java/com/projectforge/ui/theme/", "files": [
      { "name": "Theme.kt", "color": "#7c52ff", "code": "FULL" },
      { "name": "Color.kt", "color": "#7c52ff", "code": "FULL" }
    ]},
    { "dir": "app/src/main/java/com/projectforge/navigation/", "files": [
      { "name": "NavGraph.kt", "color": "#7c52ff", "code": "FULL" },
      { "name": "Screen.kt", "color": "#7c52ff", "code": "FULL" }
    ]},
    { "dir": "app/src/main/java/com/projectforge/ui/screens/", "files": [
      { "name": "HomeScreen.kt", "color": "#7c52ff", "code": "FULL composable" },
      { "name": "[Domain]ListScreen.kt", "color": "#7c52ff", "code": "FULL composable" }
    ]},
    { "dir": "app/src/main/java/com/projectforge/viewmodel/", "files": [
      { "name": "[Domain]ViewModel.kt", "color": "#7c52ff", "code": "FULL HiltViewModel" }
    ]},
    { "dir": "app/src/main/java/com/projectforge/data/local/", "files": [
      { "name": "AppDatabase.kt", "color": "#7c52ff", "code": "FULL Room" },
      { "name": "[Domain]Entity.kt", "color": "#7c52ff", "code": "FULL Entity" },
      { "name": "[Domain]Dao.kt", "color": "#7c52ff", "code": "FULL DAO" }
    ]},
    { "dir": "app/src/main/java/com/projectforge/data/remote/", "files": [
      { "name": "ApiService.kt", "color": "#7c52ff", "code": "FULL Retrofit interface" }
    ]},
    { "dir": "app/src/main/java/com/projectforge/data/repository/", "files": [
      { "name": "[Domain]Repository.kt", "color": "#7c52ff", "code": "FULL" }
    ]},
    { "dir": "app/src/main/java/com/projectforge/di/", "files": [
      { "name": "AppModule.kt", "color": "#7c52ff", "code": "FULL Hilt module" }
    ]},
    { "dir": "app/src/main/java/com/projectforge/utils/", "files": [
      { "name": "Resource.kt", "color": "#7c52ff", "code": "FULL" },
      { "name": "Constants.kt", "color": "#7c52ff", "code": "FULL" }
    ]},
    { "dir": "app/src/main/res/values/", "files": [
      { "name": "strings.xml", "color": "#ff8c42", "code": "FULL" }
    ]},
    { "dir": "app/", "files": [{ "name": "build.gradle", "color": "#02569b", "code": "FULL with all deps and exact versions" }]},
    { "dir": "", "files": [
      { "name": "build.gradle", "color": "#02569b", "code": "project-level build.gradle" },
      { "name": "settings.gradle", "color": "#02569b", "code": "include :app" },
      { "name": "README.md", "color": "#a78bfa", "code": "FULL setup guide" }
    ]}
  ],
  "setupSteps": ["Open project in Android Studio", "Sync Gradle files", "Run on emulator/device"],
  "insights": [{"t": "Architecture explanation", "b": "MVVM + Repository pattern explanation with <code>example</code>"}]
}` : `
{
  "projectName": "PascalCaseName",
  "description": "one sentence",
  "stack": "${stack}",
  "totalLines": 1400,
  "folders": [
    { "dir": "backend/", "files": [
      { "name": "server.js", "color": "#f59e0b", "code": "FULL server setup" },
      { "name": "package.json", "color": "#34d399", "code": "FULL" },
      { "name": ".env.example", "color": "#ff4757", "code": "FULL" }
    ]},
    { "dir": "backend/config/", "files": [{ "name": "db.js", "color": "#f59e0b", "code": "FULL" }]},
    { "dir": "backend/middleware/", "files": [{ "name": "auth.js", "color": "#f59e0b", "code": "FULL JWT middleware" }]},
    { "dir": "backend/models/", "files": [
      { "name": "User.js", "color": "#f59e0b", "code": "FULL mongoose model" },
      { "name": "[DomainModel].js", "color": "#f59e0b", "code": "FULL mongoose model — replace [DomainModel] with real name" }
    ]},
    { "dir": "backend/routes/", "files": [
      { "name": "auth.js", "color": "#f59e0b", "code": "FULL auth routes" },
      { "name": "[domainRoute].js", "color": "#f59e0b", "code": "FULL CRUD routes — replace [domainRoute] with real name" }
    ]},
    { "dir": "frontend/src/", "files": [
      { "name": "App.jsx", "color": "#61dafb", "code": "FULL" },
      { "name": "main.jsx", "color": "#61dafb", "code": "FULL" },
      { "name": "index.css", "color": "#3b82f6", "code": "COMPLETE professional CSS" }
    ]},
    { "dir": "frontend/src/context/", "files": [{ "name": "AuthContext.jsx", "color": "#61dafb", "code": "FULL" }]},
    { "dir": "frontend/src/utils/", "files": [{ "name": "api.js", "color": "#f59e0b", "code": "FULL axios instance with interceptors" }]},
    { "dir": "frontend/src/components/", "files": [
      { "name": "Navbar.jsx", "color": "#61dafb", "code": "FULL" },
      { "name": "Sidebar.jsx", "color": "#61dafb", "code": "FULL" },
      { "name": "Toast.jsx", "color": "#61dafb", "code": "FULL" },
      { "name": "Loader.jsx", "color": "#61dafb", "code": "FULL" }
    ]},
    { "dir": "frontend/src/pages/", "files": [
      { "name": "Login.jsx", "color": "#61dafb", "code": "FULL login+register page" },
      { "name": "Dashboard.jsx", "color": "#61dafb", "code": "FULL dashboard with real API data" },
      { "name": "[DomainList].jsx", "color": "#61dafb", "code": "FULL list page — replace with real name" },
      { "name": "[DomainForm].jsx", "color": "#61dafb", "code": "FULL form page — replace with real name" }
    ]},
    { "dir": "frontend/", "files": [
      { "name": "vite.config.js", "color": "#f59e0b", "code": "FULL with proxy" },
      { "name": "package.json", "color": "#34d399", "code": "FULL" },
      { "name": ".env.example", "color": "#ff4757", "code": "VITE_API_URL=http://localhost:3001" }
    ]},
    { "dir": "", "files": [{ "name": "README.md", "color": "#a78bfa", "code": "FULL setup guide with all commands" }]}
  ],
  "setupSteps": [
    "cd backend && npm install",
    "cp backend/.env.example backend/.env  (fill MONGO_URI + JWT_SECRET)",
    "cd frontend && npm install",
    "Terminal 1: cd backend && npm run dev",
    "Terminal 2: cd frontend && npm run dev",
    "Open http://localhost:5173 — register an account to begin"
  ],
  "insights": [
    { "t": "Why modular route files?", "b": "Each resource gets its own Router file, keeping server.js clean. <code>app.use('/api/auth', require('./routes/auth'))</code> mounts the entire auth sub-router." },
    { "t": "How JWT auth middleware works", "b": "Every protected route runs <code>verifyToken</code> first. It extracts the Bearer token, calls <code>jwt.verify()</code>, and attaches the decoded user to <code>req.user</code>." },
    { "t": "Axios interceptors explained", "b": "The request interceptor automatically adds <code>Authorization: Bearer token</code> from localStorage. The 401 interceptor catches expired tokens and redirects to login." },
    { "t": "bcrypt password security", "b": "Passwords are hashed in a Mongoose <code>pre('save')</code> hook with <code>bcrypt.hash(password, 12)</code>. Plain text is never stored, only the hash." }
  ]
}`;

  // ─────────────────────────────────────────────────────────────
  // CHUNKED GENERATION — stays within Groq's 12k TPM rate limit
  // Strategy: split into 3 sequential calls of ≤6k output tokens
  //   Chunk 1 → project metadata + backend files
  //   Chunk 2 → frontend files (components, pages, context)
  //   Chunk 3 → config files + README + insights
  // A 62s cooldown between chunks resets the 1-min token bucket.
  // ─────────────────────────────────────────────────────────────

  const CHUNK_MAX_TOKENS = 6000;   // well under 12k/min limit
  const COOLDOWN_MS      = 62000;  // 62s ensures the minute window resets

  /** Sleep helper */
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  /** Extract + repair JSON from a raw LLM string */
  function extractJSON(raw) {
    let s = raw.replace(/^```json\s*/i,'').replace(/^```\s*/i,'').replace(/\s*```$/,'').trim();
    const f = s.indexOf('{'), l = s.lastIndexOf('}');
    if (f !== -1 && l !== -1) s = s.slice(f, l + 1);
    try { return JSON.parse(s); } catch (_) {
      // repair unclosed brackets/braces
      const opens = (s.match(/\[/g)||[]).length - (s.match(/\]/g)||[]).length;
      const openB = (s.match(/\{/g)||[]).length - (s.match(/\}/g)||[]).length;
      s += ']'.repeat(Math.max(0,opens)) + '}'.repeat(Math.max(0,openB));
      return JSON.parse(s); // throws if still broken
    }
  }

  /** Single Groq call — max_tokens capped at CHUNK_MAX_TOKENS */
  async function groqCall(messages) {
    const resp = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: CHUNK_MAX_TOKENS,
      temperature: 0.15,
      top_p: 0.9,
      messages
    });
    return resp.choices?.[0]?.message?.content || '';
  }

  const isAndroid = stack.toLowerCase().includes('android');
  const levelStr   = levelMap[level]      || levelMap['3'];
  const commentStr = commentMap[commentMode] || commentMap['standard'];
  const scaleStr   = scaleMap[scale]      || scaleMap['standard'];

  const projectContext = `PROJECT: ${description}
STACK: ${stack}
FEATURES: ${featList}
LEVEL: ${levelStr}
COMMENTS: ${commentStr}
SCALE: ${scaleStr}`;

  const accuracyRules = `ACCURACY RULES (mandatory):
- Zero placeholders, zero TODOs, zero stubs — every function body fully implemented
- All imports match actual files or package.json deps
- All component/class names consistent across files — no spelling drift
- Every async has try/catch with proper error response
- All [Domain] / [DomainModel] / [domainRoute] placeholders replaced with REAL names from description
- Return ONLY valid JSON — escape all backslashes, newlines, quotes inside strings`;

  try {
    console.log(`\n→ [ProjectForge Elite] ${description.slice(0,80)}`);
    console.log(`→ Stack: ${stack} | Chunked mode (3×${CHUNK_MAX_TOKENS} tokens) | Scale: ${scale}`);

    // ── CHUNK 1: metadata + backend (or Android core) ──────────
    console.log('→ Chunk 1/3: metadata + backend …');
    const chunk1Prompt = isAndroid
      ? `${projectContext}\n\n${accuracyRules}\n\nGenerate ONLY the following JSON — no markdown, no extra text:\n{\n  "projectName": "PascalCaseName",\n  "description": "one sentence",\n  "stack": "${stack}",\n  "folders": [\n    { "dir": "app/src/main/", "files": [{"name":"AndroidManifest.xml","color":"#ff8c42","code":"FULL XML"}] },\n    { "dir": "app/src/main/java/com/projectforge/", "files": [{"name":"MyApplication.kt","color":"#7c52ff","code":"FULL @HiltAndroidApp"}] },\n    { "dir": "app/src/main/java/com/projectforge/navigation/", "files": [{"name":"NavGraph.kt","color":"#7c52ff","code":"FULL NavHost"},{"name":"Screen.kt","color":"#7c52ff","code":"FULL sealed class"}] },\n    { "dir": "app/src/main/java/com/projectforge/ui/theme/", "files": [{"name":"Theme.kt","color":"#7c52ff","code":"FULL MaterialTheme"},{"name":"Color.kt","color":"#7c52ff","code":"FULL colors"}] }\n  ]\n}`
      : `${projectContext}\n\n${accuracyRules}\n\nGenerate ONLY the following JSON — no markdown, no extra text:\n{\n  "projectName": "PascalCaseName",\n  "description": "one sentence",\n  "stack": "${stack}",\n  "folders": [\n    { "dir": "backend/", "files": [{"name":"server.js","color":"#f59e0b","code":"FULL express server"},{"name":"package.json","color":"#34d399","code":"FULL"},{"name":".env.example","color":"#ff4757","code":"FULL"}] },\n    { "dir": "backend/config/", "files": [{"name":"db.js","color":"#f59e0b","code":"FULL mongoose connect"}] },\n    { "dir": "backend/middleware/", "files": [{"name":"auth.js","color":"#f59e0b","code":"FULL JWT middleware"}] },\n    { "dir": "backend/models/", "files": [{"name":"User.js","color":"#f59e0b","code":"FULL mongoose User model"},{"name":"[DomainModel].js","color":"#f59e0b","code":"FULL domain model — replace [DomainModel]"}] },\n    { "dir": "backend/routes/", "files": [{"name":"auth.js","color":"#f59e0b","code":"FULL auth routes"},{"name":"[domainRoute].js","color":"#f59e0b","code":"FULL CRUD routes — replace [domainRoute]"}] }\n  ]\n}`;

    const raw1 = await groqCall([
      { role: 'system', content: getSystemPrompt(stack) },
      { role: 'user',   content: chunk1Prompt }
    ]);
    let part1;
    try { part1 = extractJSON(raw1); }
    catch(e) { return res.status(502).json({ error: 'Chunk 1 parse failed: ' + e.message, raw: raw1.slice(0,400) }); }

    // ── COOLDOWN ────────────────────────────────────────────────
    console.log(`→ Cooldown ${COOLDOWN_MS/1000}s (rate-limit reset) …`);
    await sleep(COOLDOWN_MS);

    // ── CHUNK 2: frontend files ─────────────────────────────────
    console.log('→ Chunk 2/3: frontend …');
    const domainHint = `Project is "${description}". Use the same projectName "${part1.projectName}" and replace all [Domain] placeholders with the real domain name.`;
    const chunk2Prompt = isAndroid
      ? `${domainHint}\n${accuracyRules}\n\nGenerate ONLY the following JSON (folders array only, no outer object) — no markdown:\n[\n  { "dir": "app/src/main/java/com/projectforge/ui/screens/", "files": [{"name":"HomeScreen.kt","color":"#7c52ff","code":"FULL composable"},{"name":"[Domain]ListScreen.kt","color":"#7c52ff","code":"FULL composable — replace [Domain]"},{"name":"[Domain]DetailScreen.kt","color":"#7c52ff","code":"FULL — replace [Domain]"}] },\n  { "dir": "app/src/main/java/com/projectforge/viewmodel/", "files": [{"name":"[Domain]ViewModel.kt","color":"#7c52ff","code":"FULL @HiltViewModel — replace [Domain]"},{"name":"[Domain]UiState.kt","color":"#7c52ff","code":"FULL sealed class — replace [Domain]"}] },\n  { "dir": "app/src/main/java/com/projectforge/ui/components/", "files": [{"name":"[Domain]Card.kt","color":"#7c52ff","code":"FULL composable — replace [Domain]"},{"name":"LoadingIndicator.kt","color":"#7c52ff","code":"FULL"},{"name":"ErrorMessage.kt","color":"#7c52ff","code":"FULL"}] }\n]`
      : `${domainHint}\n${accuracyRules}\n\nGenerate ONLY the following JSON (folders array only) — no markdown:\n[\n  { "dir": "frontend/src/", "files": [{"name":"App.jsx","color":"#61dafb","code":"FULL BrowserRouter + routes"},{"name":"main.jsx","color":"#61dafb","code":"FULL createRoot"},{"name":"index.css","color":"#3b82f6","code":"COMPLETE professional CSS"}] },\n  { "dir": "frontend/src/context/", "files": [{"name":"AuthContext.jsx","color":"#61dafb","code":"FULL context with localStorage restore"}] },\n  { "dir": "frontend/src/utils/", "files": [{"name":"api.js","color":"#f59e0b","code":"FULL axios instance + interceptors"}] },\n  { "dir": "frontend/src/components/", "files": [{"name":"Navbar.jsx","color":"#61dafb","code":"FULL sticky nav"},{"name":"Sidebar.jsx","color":"#61dafb","code":"FULL sidebar with active states"},{"name":"Toast.jsx","color":"#61dafb","code":"FULL toast notifications"},{"name":"Loader.jsx","color":"#61dafb","code":"FULL spinner"}] },\n  { "dir": "frontend/src/pages/", "files": [{"name":"Login.jsx","color":"#61dafb","code":"FULL login+register form"},{"name":"Dashboard.jsx","color":"#61dafb","code":"FULL dashboard with real API data"},{"name":"[DomainList].jsx","color":"#61dafb","code":"FULL list page — replace [DomainList]"},{"name":"[DomainForm].jsx","color":"#61dafb","code":"FULL form page — replace [DomainForm]"}] }\n]`;

    const raw2 = await groqCall([
      { role: 'system', content: getSystemPrompt(stack) },
      { role: 'user',   content: chunk2Prompt }
    ]);
    let part2Folders;
    try {
      const s = raw2.replace(/^```json\s*/i,'').replace(/^```\s*/i,'').replace(/\s*```$/,'').trim();
      const f = s.indexOf('['), l = s.lastIndexOf(']');
      part2Folders = JSON.parse(f !== -1 && l !== -1 ? s.slice(f, l+1) : s);
    } catch(e) { return res.status(502).json({ error: 'Chunk 2 parse failed: ' + e.message, raw: raw2.slice(0,400) }); }

    // ── COOLDOWN ────────────────────────────────────────────────
    console.log(`→ Cooldown ${COOLDOWN_MS/1000}s …`);
    await sleep(COOLDOWN_MS);

    // ── CHUNK 3: config + readme + insights ─────────────────────
    console.log('→ Chunk 3/3: config + README + insights …');
    const chunk3Prompt = isAndroid
      ? `${domainHint}\n${accuracyRules}\n\nGenerate ONLY the following JSON — no markdown:\n{\n  "folders": [\n    { "dir": "app/src/main/java/com/projectforge/data/local/", "files": [{"name":"AppDatabase.kt","color":"#7c52ff","code":"FULL @Database Room"},{"name":"[Domain]Entity.kt","color":"#7c52ff","code":"FULL @Entity — replace [Domain]"},{"name":"[Domain]Dao.kt","color":"#7c52ff","code":"FULL @Dao — replace [Domain]"}] },\n    { "dir": "app/src/main/java/com/projectforge/data/remote/", "files": [{"name":"ApiService.kt","color":"#7c52ff","code":"FULL Retrofit interface"},{"name":"[Domain]Dto.kt","color":"#7c52ff","code":"FULL DTO — replace [Domain]"}] },\n    { "dir": "app/src/main/java/com/projectforge/data/repository/", "files": [{"name":"[Domain]Repository.kt","color":"#7c52ff","code":"FULL repository — replace [Domain]"}] },\n    { "dir": "app/src/main/java/com/projectforge/di/", "files": [{"name":"AppModule.kt","color":"#7c52ff","code":"FULL @Module Hilt"},{"name":"RepositoryModule.kt","color":"#7c52ff","code":"FULL binding module"}] },\n    { "dir": "app/src/main/java/com/projectforge/utils/", "files": [{"name":"Resource.kt","color":"#7c52ff","code":"FULL sealed class"},{"name":"Constants.kt","color":"#7c52ff","code":"FULL BASE_URL etc"}] },\n    { "dir": "app/src/main/res/values/", "files": [{"name":"strings.xml","color":"#ff8c42","code":"FULL"},{"name":"colors.xml","color":"#ff8c42","code":"FULL"}] },\n    { "dir": "app/", "files": [{"name":"build.gradle","color":"#02569b","code":"FULL with exact dep versions"}] },\n    { "dir": "", "files": [{"name":"build.gradle","color":"#02569b","code":"project-level"},{"name":"settings.gradle","color":"#02569b","code":"include :app"},{"name":"README.md","color":"#a78bfa","code":"FULL setup guide"}] }\n  ],\n  "setupSteps": ["Open in Android Studio","Sync Gradle","Run on emulator"],\n  "insights": [{"t":"Architecture","b":"MVVM + Repository with <code>example</code>"}]\n}`
      : `${domainHint}\n${accuracyRules}\n\nGenerate ONLY the following JSON — no markdown:\n{\n  "folders": [\n    { "dir": "frontend/", "files": [{"name":"vite.config.js","color":"#f59e0b","code":"FULL with /api proxy"},{"name":"package.json","color":"#34d399","code":"FULL with all deps"},{"name":".env.example","color":"#ff4757","code":"VITE_API_URL=http://localhost:3001"}] },\n    { "dir": "", "files": [{"name":"README.md","color":"#a78bfa","code":"FULL setup guide with all commands"}] }\n  ],\n  "setupSteps": [\n    "cd backend && npm install",\n    "cp backend/.env.example backend/.env  (fill MONGO_URI + JWT_SECRET)",\n    "cd frontend && npm install",\n    "Terminal 1: cd backend && npm run dev",\n    "Terminal 2: cd frontend && npm run dev",\n    "Open http://localhost:5173"\n  ],\n  "insights": [\n    {"t":"Modular routes","b":"Each resource gets its own Router. <code>app.use('/api/auth', require('./routes/auth'))</code>"},\n    {"t":"JWT middleware","b":"verifyToken extracts the Bearer token, calls <code>jwt.verify()</code>, attaches decoded user to <code>req.user</code>."},\n    {"t":"Axios interceptors","b":"Request interceptor adds <code>Authorization: Bearer token</code>. 401 interceptor catches expired tokens and redirects."},\n    {"t":"bcrypt hashing","b":"Passwords hashed in Mongoose <code>pre('save')</code> with <code>bcrypt.hash(password, 12)</code>. Plain text never stored."}\n  ]\n}`;

    const raw3 = await groqCall([
      { role: 'system', content: getSystemPrompt(stack) },
      { role: 'user',   content: chunk3Prompt }
    ]);
    let part3;
    try { part3 = extractJSON(raw3); }
    catch(e) { return res.status(502).json({ error: 'Chunk 3 parse failed: ' + e.message, raw: raw3.slice(0,400) }); }

    // ── MERGE all chunks ────────────────────────────────────────
    const project = {
      projectName: part1.projectName || 'ProjectForge',
      description: part1.description || description,
      stack,
      folders: [
        ...(part1.folders     || []),
        ...(part2Folders      || []),
        ...(part3.folders     || [])
      ],
      setupSteps: part3.setupSteps || [],
      insights:   part3.insights   || []
    };

    // Count real lines
    let totalLines = 0;
    project.folders.forEach(f =>
      (f.files || []).forEach(file => {
        if (file.code) totalLines += file.code.split('\n').length;
      })
    );
    project.totalLines = totalLines;

    const fileCount = project.folders.reduce((a,f)=>a+(f.files||[]).length, 0);
    console.log(`→ ✅ ${project.projectName} — ${totalLines} lines, ${fileCount} files (3 chunks merged)`);
    res.json({ ok: true, project });

  } catch (err) {
    console.error('→ Error:', err.message);
    if (err.status === 429 || err.message?.includes('rate limit') || err.message?.includes('Rate limit')) {
      return res.status(429).json({ error: 'Groq rate limit hit — please wait 60 seconds and try again.' });
    }
    if (err.code === 'ETIMEDOUT' || err.message?.includes('timed out')) {
      return res.status(504).json({ error: 'Generation timed out — try a shorter description.' });
    }
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// DOWNLOAD ZIP
// ─────────────────────────────────────────────────────────────
app.post('/api/download', (req, res) => {
  const { project } = req.body;
  if (!project?.folders) return res.status(400).json({ error: 'No project data' });

  const safeName = (project.projectName || 'project').replace(/[^a-zA-Z0-9_-]/g, '_');
  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', `attachment; filename="${safeName}.zip"`);

  const archive = archiver('zip', { zlib: { level: 9 } });
  archive.pipe(res);

  for (const folder of project.folders) {
    for (const file of folder.files || []) {
      const filePath = path.join(safeName, folder.dir || '', file.name);
      archive.append(file.code || '', { name: filePath });
    }
  }
  archive.finalize();
});

// ─────────────────────────────────────────────────────────────
// HEALTH
// ─────────────────────────────────────────────────────────────
app.get('/api/health', (_, res) => res.json({
  status: 'ok', version: '5.1.0',
  engine: 'Groq + LLaMA 3.3 70B',
  accuracy: '85%+',
  mode: 'chunked-3x6k (rate-limit safe)',
  developer: 'Prashant S Nagani'
}));

app.listen(PORT, () => {
  console.log(`\n╔════════════════════════════════════════════════╗`);
  console.log(`║   ProjectForge Elite  v5.1.0                   ║`);
  console.log(`║   Accuracy: 85%+ | Chunked Gen: ✅             ║`);
  console.log(`║   Developer: Prashant S Nagani                 ║`);
  console.log(`╚════════════════════════════════════════════════╝`);
  console.log(`\n🔥 Backend → http://localhost:${PORT}`);
  console.log(`⚡ AI: Groq + LLaMA 3.3 70B | 3×6k chunks (12k TPM safe)`);
  console.log(`🔑 API Key: ${process.env.GROQ_API_KEY ? '✅' : '❌ Missing — add to .env'}\n`);
});
