# Frontend Architecture & Layout Flow

**ResumeIQ AI** uses a single-page application (SPA) architecture powered by **React 19** and **Vite 8**.

---

## 🏗️ Architectural Layers

1. **Routing & Shell Layer**:
   - `AppRoutes.jsx` handles client-side route guards (Public vs Protected routes).
   - `DashboardLayout.jsx` provides the persistent layout shell (Sidebar, Navbar, `NeuralBackground.jsx`, `CommandPalette`).

2. **State & Context Providers**:
   - `AuthContext.jsx`: Manages JWT tokens, user profiles, login, and registration states.
   - `ThemeContext.jsx`: Manages dark mode and system preferences.

3. **API Service Layer**:
   - Centralized Axios clients in `src/services/` (`atsService.js`, `resumeService.js`, `userService.js`, `interviewPrepService.js`) handle JSON request/response envelope mapping and bearer token injection.

4. **Component Hierarchy**:
   - `pages/`: Page-level containers with Recharts visualization widgets.
   - `components/common/`: Reusable primitives (`NeuralBackground`, `ProgressBar`, `Badge`).

