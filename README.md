# 💈 Tulook: Barber & Style Loyalty System

A high-performance, premium loyalty ecosystem designed for modern Barbershops and Clothing Stores. Built with **Next.js 16**, **Supabase**, and **Tailwind CSS 4.0**, this PWA (Progressive Web App) delivers a native-like experience for both clients and administrators.

![Tulook Banner](public/blogo.png)

---

## 🌟 Vision & Design
Tulook is crafted with a **"Premium Dark"** aesthetic, utilizing deep zinc tones, golden amber accents, and glassmorphism. Every interaction is powered by **Framer Motion** for silky-smooth transitions and micro-interactions that elevate the user experience.

---

## 🚀 Key Features

### 👤 Client Experience (PWA)
*   **Seamless Onboarding**: Zero-friction registration using WhatsApp Number + 4-digit PIN.
*   **Interactive Stamp Card**: A visual 15-slot loyalty card with milestone highlights (5, 10, 15 points) and unlockable rewards.
*   **Dual-Nature Points**: Earn points via the QR scanner at the Barber Shop or through manual staff updates at the Clothing Store.
*   **Anti-Fraud QR Scanner**: Secure, time-sensitive QR validation to prevent unauthorized point accumulation.
*   **Personal Dashboard**: Track transaction history, current points, and upcoming rewards.

### 🛡️ Admin Suite
*   **Dynamic CRM**: A centralized dashboard to manage all clients, search by name/number, and track engagement.
*   **Precision Adjustments**:
    *   **Manual Modals**: Professional, animated UI for adding or subtracting points with real-time feedback.
    *   **Multiple Reward Tiers**: Dedicated flows for redeeming 5, 10, or 15-point rewards (Descuento, Mitad de Precio, Corte Gratis).
*   **Security Management**: Instant PIN resets for clients and role-based access control.
*   **Real-time QR Generation**: Signed JWT-based QR codes that refresh every 60 seconds for maximum security.

---

## 🛠 Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Framework** | [Next.js 16 (App Router)](https://nextjs.org/) |
| **Core** | [React 19](https://react.dev/) / [TypeScript](https://www.typescriptlang.org/) |
| **Database** | [Supabase](https://supabase.com/) (PostgreSQL) |
| **Styling** | [Tailwind CSS 4.0](https://tailwindcss.com/) / [shadcn/ui](https://ui.shadcn.com/) |
| **Animations** | [Framer Motion](https://www.framer.com/motion/) / [Canvas Confetti](https://www.npmjs.com/package/canvas-confetti) |
| **Auth** | Custom JWT + Supabase Logic |
| **Scanner** | [Html5-Qrcode](https://github.com/mebjas/html5-qrcode) |

---

## 📦 Project Structure

```bash
├── app/
│   ├── admin/           # Admin Dashboard & Client Management
│   ├── dashboard/       # Client Stamp Card & Scanner
│   ├── auth-actions.ts  # Authentication Server Actions
│   └── server-actions.ts# Business Logic Server Actions (Points, PIN)
├── components/
│   ├── admin/           # Admin-specific (QR Gen, CRM Table)
│   ├── auth/            # Login & PIN forms
│   ├── loyalty/         # Stamp card & Point animations
│   ├── ui/              # Premium custom UI (Modals, Buttons)
│   └── QRScanner.tsx    # Optimized camera component
├── lib/
│   └── supabase/        # Database clients & SSR helpers
├── public/              # PWA manifest, Icons, & Store assets
└── supabase/            # SQL Schemas & RLS Migration Scripts
```

---

## 🛠️ Setup & Installation

### 1. Requirements
* Node.js 20+
* Supabase Account

### 2. Environment Configuration
Create a `.env.local` file in the root:
```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
ADMIN_WHATSAPP=your_phone_number
JWT_SECRET=your_secure_random_string
```

### 3. Database Initialization
Execute the SQL scripts in `supabase/` following this order:
1. `schema.sql` (Tables: profiles, transactions)
2. `add_pin_column.sql` (Security layer)
3. `fix_rls_policies.sql` (Privacy & Access)
4. `fix_registration.sql` & `fix_client_login.sql` (Auth triggers)
5. `setup_admin.sql` (Seed initial admin roles)

### 4. Launch
```bash
npm install
npm run dev
```

---

## 📱 PWA Support
Tulook is fully optimized for mobile installation.
1. Open the app on your mobile browser.
2. Select **"Add to Home Screen"** (iOS) or **"Install App"** (Android).
3. Enjoy a full-screen, splash-screened, native experience.

---

## 🎨 Design System Info
*   **Aesthetics**: Deep zinc surfaces (`zinc-950`) with vibrant gold accents (`amber-500`).
*   **Typography**: Optimized for readability on mobile devices.
*   **Status Indicators**: Emerald for success, red for errors, amber for pending/rewards.
*   **Feedback**: [Sonner](https://sonner.stevenly.me/) toasts + [Confetti](https://www.npmjs.com/package/canvas-confetti) for milestones.

---
Built with ❤️ by **Tulook Development Team**
