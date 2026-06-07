# HumanEdge — Multi HR Company Tool

A full-stack SaaS HR management platform built with **Next.js 15**, **Firebase**, and **Tailwind CSS**. HumanEdge enables organizations to manage employees, companies, clients, contracts, invoices, attendance, and finances — all from a single, role-based platform.

---

## Table of Contents

- [About the Project](#about-the-project)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [User Roles](#user-roles)
- [Project Structure](#project-structure)
- [Database Collections](#database-collections)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Available Scripts](#available-scripts)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

---

## About the Project

**HumanEdge** is an enterprise-grade HR management system designed for multi-company environments. It provides dedicated portals for Super Admins, Employees, and Accountants — each with tailored functionality and access controls.

Key highlights:
- Multi-company architecture with per-company data isolation
- Role-based dashboards (Admin, Employee, Accounts)
- Real-time attendance tracking with check-in / check-out
- Contract and template management with a visual canvas editor
- Invoicing with Stripe payment integration
- Full accounting module (banks, expenses, loans, taxes)
- PWA-ready for mobile use

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15.5.7 (App Router) |
| UI | React 18.3.1, Tailwind CSS 4.1.17 |
| Component Library | shadcn/ui (Radix UI primitives) |
| Icons | Lucide React |
| Charts | Recharts 3.4.1 |
| Data Tables | TanStack React Table 8.21.3 |
| State Management | Redux Toolkit 2.9.0 + Redux Persist |
| Database | Firebase Firestore (NoSQL) |
| Authentication | Firebase Auth (email/password) |
| File Storage | Cloudinary (images), Firebase Storage |
| Email | Nodemailer (Gmail SMTP) |
| Payments | Stripe 19.1.0 |
| Rich Text Editor | Tiptap, React Quill |
| Canvas Editor | Fabric.js |
| Calendar | FullCalendar 6.1.20 |
| Drag & Drop | dnd-kit |
| Document Export | jsPDF, ExcelJS, PPTX Gen JS |
| PDF Rendering | @react-pdf/renderer 4.3.1 |
| Animations | Framer Motion |
| HTTP Client | Axios |
| JWT | Jose |
| PWA | next-pwa 5.6.0 |
| Build Tool | Turbopack |

---

## Features

### Authentication & Authorization
- Email/password login via Firebase Auth
- Role-based access control: `superAdmin`, `admin`, `employee`, `accounts`
- JWT-based session management (access + refresh tokens)
- Automatic token refresh via Next.js middleware
- Forgot password and password reset via email
- Invitation system with secure token links

### Admin Dashboard
- KPI overview cards (companies, employees, departments, clients, invoices, expenses)
- Interactive area charts, bar charts, and pie charts
- Quick-action navigation
- Admin notification center
- Global search functionality

### Employee Management
- Create, view, update, and deactivate employees
- Assign employees to one or multiple companies
- Employee profile: contact info, salary, designation, bank details, CNIC
- Employee self-service profile updates and password change
- Bulk operations and export

### Multi-Company Management
- Create and manage unlimited companies
- Per-company isolation of clients, invoices, contracts, and employees
- Company logo upload via Cloudinary
- Company social media links (Facebook, Instagram, LinkedIn)
- Timezone configuration per company

### Attendance & Time Tracking
- One-tap check-in / check-out for employees
- Real-time attendance status
- Daily attendance records with timestamps
- Attendance history and reports
- Bulk attendance import
- Admin-side attendance management and status overrides

### Department Management
- Create departments and associate them with companies
- Link employees to departments
- Department status management

### Client Management
- Create and manage clients per company
- Client contact information and status tracking
- Both admin and employee portals can manage clients

### Invoicing & Billing
- Create invoices with line items
- Invoice status tracking: draft → sent → paid / expired
- Email invoices directly to clients
- Stripe payment integration for online invoice payments
- Export invoices to PDF or Excel
- Employee-assigned invoices

### Contract & Template Management
- Create reusable contract templates with dynamic fields
- Generate contracts from templates
- Rich-text contract editing (Tiptap)
- Visual canvas-based contract design (Fabric.js)
- Contract signing workflow (draft → sent → signed)
- Email contracts to recipients
- Employee and company contract history

### Financial Management (Accounts Portal)
- Bank account creation and balance management
- Fund transfers between accounts
- Loan tracking and repayment management
- Expense categorization and reporting
- Tax calculation module
- Salary export reports
- Currency management

### Project & Task Management
- Create projects and assign team members
- Task creation with priority and status (to-do, in-progress, completed)
- Task comments and collaboration
- Project invitation system via email
- Project-based task grouping

### Announcements & Notifications
- Company-wide announcements
- In-app employee notifications (read/unread tracking)
- Email notifications via Nodemailer
- Holiday/leave calendar with FullCalendar

### Additional Features
- Progressive Web App (PWA) support
- Drag-and-drop interfaces (dnd-kit)
- IP whitelist management
- Image proxy for optimized external image loading
- OTP verification system

---

## User Roles

| Role | Access |
|---|---|
| **Super Admin** | Full platform access — manages all companies, employees, settings |
| **Admin** | Company-level management — employees, departments, clients, contracts, invoices |
| **Employee** | Personal dashboard — attendance, company data, clients, contracts, invoices |
| **Accounts** | Financial portal — banks, expenses, loans, tax, transfers |

---

## Project Structure

```
multi_hr_company_tool/
├── public/                    # Static assets, PWA icons & manifests
├── src/
│   ├── app/
│   │   ├── page.js            # Login page
│   │   ├── register/          # Employee registration
│   │   ├── forgot-password/   # Password recovery
│   │   ├── reset-password/    # Password reset
│   │   ├── accept-invite/     # Invitation acceptance
│   │   │
│   │   ├── admin/             # Admin portal
│   │   │   ├── page.jsx       # Admin dashboard
│   │   │   ├── employees/     # Employee management
│   │   │   ├── companies/     # Company management
│   │   │   ├── departments/   # Department management
│   │   │   ├── clients/       # Client management
│   │   │   ├── invoices/      # Invoice management
│   │   │   ├── contracts/     # Contract management
│   │   │   ├── templates/     # Contract templates
│   │   │   ├── projects/      # Project management
│   │   │   ├── attendance/    # Attendance records
│   │   │   ├── expenses/      # Expense tracking
│   │   │   ├── banks/         # Bank management
│   │   │   ├── holidays/      # Holiday management
│   │   │   ├── announcements/ # Announcements
│   │   │   ├── members/       # Admin team members
│   │   │   ├── taxes/         # Tax management
│   │   │   └── settings/      # Admin settings
│   │   │
│   │   ├── employee/[slug]/   # Employee portal
│   │   │   ├── page.jsx       # Employee dashboard
│   │   │   ├── attendance/    # Check-in/out & history
│   │   │   ├── companies/     # Assigned companies
│   │   │   └── company/[id]/  # Company-specific data
│   │   │       ├── clients/
│   │   │       ├── contracts/
│   │   │       └── invoices/
│   │   │
│   │   ├── accounts/[slug]/   # Accounts portal
│   │   │   ├── banks/         # Bank management
│   │   │   ├── expenses/      # Expenses
│   │   │   ├── tax/           # Tax calculations
│   │   │   └── settings/
│   │   │
│   │   ├── contract-editor/   # Visual contract editor (Fabric.js)
│   │   ├── template-editor/   # Template designer
│   │   ├── invoice/           # Invoice detail view
│   │   │
│   │   └── api/               # Next.js API routes
│   │       ├── check-in/
│   │       ├── check-out/
│   │       ├── create-employee/
│   │       ├── create-company/
│   │       ├── create-invoice/
│   │       ├── create-contract/
│   │       ├── templates/
│   │       ├── projects/
│   │       ├── tasks/
│   │       ├── acounts/        # Accounting APIs
│   │       ├── admin/          # Admin-specific APIs
│   │       └── ...
│   │
│   ├── components/            # Shared React components
│   ├── features/              # Redux state slices
│   ├── lib/                   # Firebase config, utilities, Redux store
│   ├── middleware.js           # JWT auth & role-based routing
│   └── globals.css            # Global Tailwind styles
│
├── .env.local                 # Environment variables
├── next.config.mjs            # Next.js config (PWA, image optimization)
├── tailwind.config.js         # Tailwind CSS config
├── components.json            # shadcn/ui config
├── vercel.json                # Vercel deployment config
└── package.json               # Dependencies & scripts
```

---

## Database Collections

HumanEdge uses **Firebase Firestore** with the following main collections:

| Collection | Purpose |
|---|---|
| `employees` | Employee profiles, salary, bank info, attendance |
| `companies` | Company details, assigned employees, logo, social links |
| `departments` | Departments linked to companies |
| `clients` | Clients associated with companies |
| `invoices` | Invoices with status, amounts, client/company links |
| `contracts` | Contract instances generated from templates |
| `templates` | Contract templates with dynamic fields |
| `expenses` | Expense records by employee and company |
| `banks` | Bank accounts managed by accountants |
| `projects` | Projects with assigned team members |
| `tasks` | Tasks under projects with status and comments |
| `announcements` | Company-wide announcements |
| `holidays` | Holiday/leave records per company |
| `notifications` | Employee in-app notifications |

---

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Firebase project with Firestore and Authentication enabled
- Cloudinary account (for image uploads)
- Stripe account (for payment processing)
- Gmail account with App Password (for email sending)

### Installation

```bash
# Clone the repository
git clone https://github.com/khanbasiq16/multi_hr_company_tool.git
cd multi_hr_company_tool

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Fill in your keys in .env.local

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

---

## Environment Variables

Create a `.env.local` file in the project root with the following variables:

```env
# Firebase Client Config
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Firebase Admin SDK (Service Account)
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

# JWT
JWT_SECRET=

# Email (Nodemailer / Gmail SMTP)
EMAIL_USER=
EMAIL_PASS=

# Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Stripe
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# App Base URL
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

---

## Available Scripts

```bash
npm run dev       # Start development server with Turbopack
npm run build     # Build for production
npm run start     # Start production server
npm run lint      # Run ESLint
```

---

## Deployment

### Deploy to Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

Add all environment variables from `.env.local` to your Vercel project settings.

A `vercel.json` file is already included for configuration.

---

## Contributing

Contributions are welcome!

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m "Add your feature"`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

---

## License

This project is open-source and available under the [MIT License](LICENSE).
