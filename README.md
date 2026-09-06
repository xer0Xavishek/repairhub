# RepairHub: Smart Circular Economy Platform for Community & Professional Repairs

[![BRAC University](https://img.shields.io/badge/BRAC_University-CSE470_Software_Engineering-blue)](https://www.bracu.ac.bd/)
[![Node.js](https://img.shields.io/badge/Node.js-v20+-green)](https://nodejs.org/)
[![React](https://img.shields.io/badge/Frontend-React_18_+_TailwindCSS-61DAFB)](https://react.dev/)
[![Tests](https://img.shields.io/badge/Automated_Tests-145_Passed_(100%25)-brightgreen)](file:///tests/)
[![License](https://img.shields.io/badge/License-MIT-purple)](LICENSE)

---

## 👥 Academic Course & Group Information
- **Course**: CSE470 — Software Engineering (Summer 2026)
- **Section**: 06
- **Group Number**: 06

### **Team Members & Workload Distribution (25% Each)**
| Student ID | Student Name | Assigned Module & Role |
| :---: | :---: | :---: |
| **23201227** | **Tabassum Subah Upoma** |  Multi-Step Request Wizard, Category Engine, Environmental Impact CO2 Calculator, 5-Stage Status Pipeline, Audit Log |
| **23201444** | **Sreema Roy** |   Global Search (Ctrl+K) and Filters, Multi-Quote Bidding, Appointment Booking Calendar, Slot Cancellation/Reschedule, Review & 3-Axis Rating, |
| **23201427** | **Avishek Biswas** | Landing Page & Design System, Interactive Geolocation Map (Leaflet), AI Repair Copilot, AI Vision Damage Assessment, Stripe Payment Gateway, Socket.io Real-Time Chat |
| **23201436** | **Mohammad Zubair Zaman** | QR Code Handover Generator, Repair Café Events & Waitlists, Requester Dashboard, DIY Community Guidelines, Admin Moderation Panel |

---

## 🏛️ System Architecture (MVC Pattern)

```
repairhub/
├── client/                     # Frontend View Layer (React 18 + Vite + TailwindCSS)
│   ├── src/
│   │   ├── components/         # StatusPipeline, AIRepairCopilotDrawer, QRCodeModal, ImpactCard, Navbar
│   │   ├── App.jsx             # Main Application Container & Dashboards
│   │   └── main.jsx
│   └── package.json
│
├── server/                     # Backend MVC Server (Node.js + Express + Mongoose)
│   ├── src/
│   │   ├── config/             # DB Connection & SSLCommerz Sandbox keys
│   │   ├── models/             # User, RepairRequest, ItemHistoryLog, Event, Booking, Quote, Payment, Message, Review
│   │   ├── controllers/        # authController, repairController, bookingController, eventController, quoteController, paymentController, chatController, reviewController, impactController, adminController, aiController
│   │   ├── routes/             # REST API routes mapped to Controllers
│   │   ├── middlewares/        # JWT Protect, Role Authorize, Error Handling
│   │   └── utils/              # QR Token Helper, CO2 Math Calculator, Database Seeder
│   └── package.json
│
├── tests/                      # Gated Automated Test Suites (Jest + Supertest + In-Memory Mongo)
│   ├── module1_repair_lifecycle.test.js
│   ├── module2_discovery_booking.test.js
│   ├── module3_events_sustainability.test.js
│   ├── module4_quotes_escrow_chat.test.js
│   ├── module5_reviews_admin.test.js
│   ├── profile_and_rbac.test.js
│   ├── auth_security.test.js
│   └── testHelper.js
│
└── docs/
    └── SRS_RepairHub_CSE470.md # Formal CSE470 Software Requirements Specification Document
```

---

## 🧪 Automated Testing & Quality Gates

RepairHub implements strict Test-Driven Development (TDD) with **145 automated unit and integration tests (21 test suites)** passing (100% pass rate):

```bash
# Run all automated test suites from project root
npm test

# Alternatively using --prefix
npm --prefix server test

# Run individual module test suites
npm --prefix server test -- ../tests/interactive_services.test.js
npm --prefix server test -- ../tests/module1_repair_lifecycle.test.js
npm --prefix server test -- ../tests/module2_discovery_booking.test.js
npm --prefix server test -- ../tests/module3_events_sustainability.test.js
npm --prefix server test -- ../tests/module4_quotes_escrow_chat.test.js
npm --prefix server test -- ../tests/module5_reviews_admin.test.js
```

---

## 🚀 Quickstart & Development (Using `--prefix`)

You can run, test, and build the entire project directly from the root directory on any PC without manually navigating between folders.

### 1. Install Dependencies
```bash
# Install backend dependencies
npm --prefix server install

# Install frontend dependencies
npm --prefix client install
```

### 2. Start Application (Run in 2 Separate Terminals)

**Terminal 1 — Backend API Server** (starts on `http://localhost:5000`):
```bash
npm --prefix server run dev
```

**Terminal 2 — Frontend Client** (starts on `http://localhost:5173`):
```bash
npm --prefix client run dev
```

### 3. Database Seeding (Optional)
> The backend server automatically seeds verified accounts and demo records if MongoDB is empty, but you can also seed manually anytime:
```bash
npm --prefix server run seed
```

### 4. Production Build Verification
```bash
npm --prefix client run build
```

---

## 🔐 Demo Credentials (Seeded)
- **Customer / Requester**: `avishek@bracu.ac.bd` / `password123`
- **Technician / Workshop**: `rafiq@repairhub.com` / `password123`
- **Freelance Repairer**: `bikedoctor@repairhub.com` / `password123`
- **Platform Admin**: `admin@repairhub.com` / `admin123`
