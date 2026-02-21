# XMFCLUB – Force Multiplied 🥋🔥

XMFCLUB is a high-performance training platform and community built for the modern warrior. It combines the heritage of **Extreme Martial Arts (XMF)** with elite fitness methodologies like Calisthenics and MMA to build disciplined, versatile, and high-performance individuals.

## 🚀 The Vision
XMFCLUB is not just a gym; it's a modular ecosystem. We've moved away from the "flat membership" model to an **Alacarte Training System**, allowing athletes to choose specific modules—from Bo-Staff mastery to explosive Calisthenics—and pay only for what they master.

## ✨ Key Features
- **Unified Landing Page:** Mission, Founder Bio, and FAQ integrated into a high-energy, conversion-focused home page.
- **Modular Curriculum:** Explore training modules designed for all levels, from beginners to elite athletes.
- **Founder-Led:** Mentorship from **Farhan Khan XMF**, 3rd Dan Black Belt and national instructor.
- **Elite Tech Stack:** Powered by TanStack Start for lightning-fast, type-safe full-stack performance.

## 🛠 Tech Stack
- **Framework:** [TanStack Start](https://tanstack.com/router/latest/docs/framework/react/start/overview) (Full-stack React with SSR)
- **Routing:** [TanStack Router](https://tanstack.com/router) (Type-safe file-based routing)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/) (Modern, high-performance styling)
- **Auth:** [Better Auth](https://www.better-auth.com/) (Secure, developer-friendly authentication)
- **Icons:** [Lucide React](https://lucide.dev/) (Clean, consistent iconography)

## 📁 Project Structure
```text
src/
├── routes/          # File-based routing (Index, Training, Store, etc.)
├── components/      # Shared UI components (Header, Cards)
├── lib/             # Core logic (Auth clients, Utility functions)
├── styles.css       # Global design system & custom animations
└── utils/           # Helper handlers (MCP, API utilities)
```

## 🛠 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Setup
Create a `.env.local` file:
```bash
# Generate a secret key
npx -y @better-auth/cli secret
```
Then add it to your `.env.local`:
```env
BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_SECRET=your_generated_secret
```

### 3. Run Development Server
```bash
npm run dev
```
*Note: If port 3000 is busy, Vite will automatically try 3001.*

## 🧪 Testing & Quality
```bash
npm run test    # Run Vitest
npm run lint    # Run ESLint
npm run check   # Prettier + ESLint fix
```

## 🏗 Build for Production
```bash
npm run build
npm run preview
```

---
**BUILT FOR THE ELITE.**  
© 2026 XMFCLUB. All rights reserved.
