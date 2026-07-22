# ResumeIQ AI — Premium AI Resume Analyzer & Career Platform

> **ResumeIQ AI** is a world-class, production-hardened AI career platform built with a high-performance **Spring Boot** Java backend and a sleek, glassmorphic **React + Vite** frontend inspired by top-tier SaaS design standards (Apple, OpenAI, Linear, Stripe, Vercel). Candidates can analyze ATS scores, build multi-template resumes, identify skill gaps against target JDs, practice recruiter-style AI mock interviews, and evaluate career readiness parameters in a unified workspace.

---

## 🌟 Next-Generation UI/UX & Design System

### 🌌 Animated Neural Glass Matrix Background
* **Dynamic Canvas Engine**: Interactive HTML5 Canvas particle network (`NeuralBackground.jsx`) with glowing distance-based vector links, mouse cursor repulsion forces, soft aurora gradient mesh, and subtle noise overlay.

### 🎨 Glassmorphism Palette & Design Tokens
* **Background**: Deep Space Dark (`#050816`)
* **Cards & Surfaces**: Slate Glass (`#0F172A`) with `backdrop-filter: blur(16px)` and glowing borders (`rgba(255,255,255,0.08)`).
* **Accents**: Electric Blue (`#3B82F6`), Indigo Glow (`#6366F1`), and Cyber Purple (`#8B5CF6`).
* **Typography**: Clean, high-contrast headings, text-gradient accents, and JetBrains Mono code tags.

### 📄 Universal High-Precision PDF Print Overrides
* **Full-Page PDF Exports**: Custom `@media print` rules remove height constraints, scroll boundaries, and sidebars, ensuring 100% of all page details (charts, scorecards, suggestions) print into clean PDF pages without half-page clipping or cutoffs.

---

## 🚀 Key Modules & System Capabilities

### 1. Interactive Career Analytics Dashboard
* **KPI Metric Shortcuts**: Clickable metric cards (Current ATS Score, Average Job Match, Mock Interviews, Profile Completion) with hover lift animations and direct routing to detail views.
* **Recharts Progress Timelines**: Area & line trend charts plotting ATS improvement vs. mock interview scores over time.
* **Goals Checklist**: Interactive task manager to add, complete, or remove career goals.

### 2. Deep Parsing & Rule-Based ATS Scoring Engine
* **High-Fidelity Document Scanner**: Uses Apache PDFBox (`3.0.3`) and Apache POI (`5.2.5`) to extract raw text lines from PDFs and DOCX files.
* **Deterministic ATS Scorecard**: Rule-based calculation out of 100 across Formatting, Education, Experience, Technical Skills, Readability, and Keyword Densities.
* **Filterable Keywords & Suggestions**: Filter keywords by *All*, *Detected*, and *Missing*, with 1-click **Copy Suggestion** buttons.

### 3. Job Matcher & Skill Gap Analyzer
* **Compatibility Radar Chart**: Computes candidate skill fit against target job descriptions.
* **Categorized Gap Tabs**: Missing skills grouped into *Critical*, *Important*, and *Optional* tabs with interactive "Learning" state toggles.
* **1-Click Copy Suggestions**: Copy individual bullet points or full AI recommendations with a single click.

### 4. AI-Enhanced Resume Builder
* **Split-Screen Live Preview**: Live side-by-side A4 paper sheet rendering with interactive font selection, color themes, and margin controls.
* **One-Click Native PDF Export**: Connected print styles trigger native browser print/PDF compilation without UI toolbar clutter.

### 5. AI Mock Interview Prep & Voice Mode
* **Recruiter-Style Mock Screening**: 5 AI-generated technical/behavioral interview questions based on candidate resume + target role.
* **Interactive Countdown Timer Ring**: 2-minute circular timer ring with *Pause/Resume*, *Reset*, and color-coded feedback (indigo → amber → pulsing red).
* **Voice Mode Support**: Web Speech API audio playback and speech-to-text response recording.

### 6. User Profile & Account Settings
* **Accurate Registration Date**: Displays true account creation date (`Joined MM/DD/YYYY`).
* **SaaS Preferences**: Dark mode toggle, email notification reminders, language selector, and danger zone account management.

---

## 🛠️ Tech Stack & Architecture

```text
ResumeIQ AI/
├── backend/
│   └── resumeiq-api/            # Spring Boot 3.5 + Java 21 REST API
│       ├── src/main/java/com/resumeiq/
│       │   ├── config/          # Spring Security, Actuator, CORS
│       │   ├── security/        # JWT Authentication provider & filters
│       │   ├── controller/      # REST API Controllers
│       │   ├── service/         # Business logic implementations
│       │   ├── entity/          # JPA Hibernate entities
│       │   ├── parser/          # PDFBox & POI document scanners
│       │   └── ai/              # Gemini 1.5 Flash REST client
├── frontend/                    # React 19 + Vite 8 + Tailwind CSS v4
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/          # NeuralBackground, Badge, ProgressBar
│   │   │   ├── layout/          # Sidebar, Navbar, App Shell
│   │   │   └── resume/          # DropZone, ResumeCard, UploadProgress
│   │   ├── pages/               # Dashboard, ATSReport, JobMatcher, Prep, Profile
│   │   ├── services/            # Axios REST API wrappers
│   │   └── context/             # AuthContext, ThemeContext
└── docker-compose.yml
```

---

## 🚦 Local Development Setup

### Backend (Spring Boot):
1. Requirements: Java 21 JDK, Maven 3.x, MySQL 8
2. Start server:
   ```bash
   cd backend/resumeiq-api
   ./mvnw.cmd spring-boot:run
   ```
3. API Base URL: `http://localhost:8080`
4. Health Check: `http://localhost:8080/actuator/health`

### Frontend (React + Vite):
1. Requirements: Node.js v20+
2. Install & Run:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
3. Web Application URL: `http://localhost:5173`

---

## 🧪 Verification Commands
* **Frontend Lint Check**: `npm run lint` (0 errors, 0 warnings)
* **Frontend Production Build**: `npm run build` (Clean Vite compilation)
* **Backend Java Build**: `./mvnw.cmd clean compile` (Build Success)

   ```bash
   cd frontend
   npm install
   npm run dev
   ```
2. Client dev port: `http://localhost:5173`

---

## 🐳 Docker Deployment Setup

Launch the database, API backend, and frontend proxy locally using Compose:
```bash
# Export your API key first
export GEMINI_API_KEY="your-api-key"

# Build and start services
docker-compose up --build -d
```
- Frontend Access: `http://localhost`
- Backend API Access: `http://localhost:8080`

---

## ⚡ Deployment Channels
* **Frontend**: Deploy static Vite `dist` output directory directly to **Vercel** or **Netlify**.
* **Backend API**: Package Jar and deploy on **Render**, **Railway**, or **Azure Web Apps**, feeding database URL secrets in environment variables.
* **Database**: Integrate **Supabase PostgreSQL** or **Neon Serverless PostgreSQL** details directly.

---

## 📝 License
Distributed under the MIT License. See `LICENSE` for details.
