# UI & Design System Guidelines

This document outlines the visual design system, glassmorphism tokens, component patterns, and responsiveness guidelines for **ResumeIQ AI**.

---

## 🎨 Color Palette & Design Tokens

| Token | Value | Purpose |
| :--- | :--- | :--- |
| **Background Dark** | `#050816` | Main Deep Space layout background |
| **Card Glass** | `#0F172A` (`opacity: 0.7`) | Glassmorphic card surfaces with `backdrop-filter: blur(16px)` |
| **Primary Accent** | `#3B82F6` | Primary action buttons, active states |
| **Secondary Accent** | `#6366F1` | Brand gradients, badges, scorecards |
| **Cyber Accent** | `#8B5CF6` | AI Copilot glow highlights |
| **Border Glass** | `rgba(255, 255, 255, 0.08)` | Subtle high-contrast dividers and card strokes |

---

## 🌌 Neural Glass Matrix Background
Defined in `NeuralBackground.jsx`. Renders:
- Interactive HTML5 Canvas particle network.
- Mouse distance attraction/repulsion dynamics.
- Soft ambient aurora radial glows.

---

## 📄 PDF Print Overrides
Defined in `index.css` under `@media print`. Forces `overflow: visible` and `height: auto` to guarantee 100% of all page details print cleanly into PDF format without scroll cutoff.

