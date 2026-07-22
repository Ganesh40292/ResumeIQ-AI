# ResumeIQ AI — Frontend Application

High-performance, modern SaaS frontend for **ResumeIQ AI** built with **React 19**, **Vite 8**, **Tailwind CSS v4**, **Framer Motion**, and **Lucide Icons**.

---

## 🎨 Design System & UI Architecture

### 🌌 Animated Neural Glass Matrix
* **Component**: `NeuralBackground.jsx`
* Interactive HTML5 Canvas particle node network with cursor physics, aurora blur gradients, and subtle noise vignette backdrop.

### 💎 Color System & Design Tokens
* **Background**: `#050816` (Deep Space Dark)
* **Card Surfaces**: `#0F172A` (Slate Glass with `backdrop-filter: blur(16px)`)
* **Primary Accent**: `#3B82F6` (Electric Blue)
* **Secondary Accent**: `#6366F1` (Indigo Glow)
* **Cyber Accent**: `#8B5CF6` (Purple Cyber)
* **Borders**: `rgba(255, 255, 255, 0.08)`

### 📄 Universal Print PDF Overrides
* `index.css` `@media print` rules remove height constraints and scroll wrappers to guarantee 100% of all page content (scorecards, charts, suggestions) prints into clean PDF pages without half-page truncation.

---

## 🛠️ Folder Structure

```text
frontend/src/
├── assets/                  # Logos and branding static media
├── components/
│   ├── common/              # NeuralBackground, Badge, ProgressBar, CommandPalette
│   ├── layout/              # Sidebar, Header, App Shell
│   └── resume/              # DropZone, ResumeCard, UploadProgress, ResumePreviewModal
├── context/                 # AuthContext, ThemeContext
├── hooks/                   # useAuth, useTheme, useUpload, useDebounce
├── layouts/                 # DashboardLayout, AuthLayout
├── pages/                   # Dashboard, ATSReport, JobMatcher, AIReview, ResumeBuilder, InterviewPrep, Profile, Settings
├── routes/                  # AppRoutes router configuration
└── services/                # Axios REST API clients (atsService, resumeService, userService)
```

---

## 📥 Repository Clone & Setup

```bash
# Clone the repository
git clone https://github.com/Ganesh40292/ResumeIQ-AI.git

# Navigate to frontend directory and install dependencies
cd ResumeIQ-AI/frontend
npm install
```

---

## 🚦 Available Scripts

```bash
# Start development server on port 5173
npm run dev

# Run ESLint validation
npm run lint

# Build production bundle
npm run build
```

