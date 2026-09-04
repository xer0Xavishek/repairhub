# RepairHub: Complete Setup & Execution Guidelines

This document provides step-by-step instructions to clone, configure, run, test, and demonstrate **RepairHub** on any operating system (Windows, macOS, Linux).

---

## 👥 Academic & Project Information
- **Course**: CSE470 — Software Engineering (Summer 2026)
- **Section**: 06
- **Group Number**: 06
- **Project Title**: RepairHub — Circular Economy Platform for Community & Professional Item Repairs

### **Author Group & Module Responsibilities**
| Student ID | Student Name | GitHub / Email | Assigned Module |
| :---: | :--- | :--- | :--- |
| **23201227** | **Tabassum Subah Upoma** | `tabassum.subah.upoma@g.bracu.ac.bd` | **Module 1**: Repair Request Wizard, QR Handover Tokens, Status Tracking, History Log, Multi-Quote Bidding Engine |
| **23201444** | **Sreema Roy** | `sreema.roy@g.bracu.ac.bd` | **Module 2**: Faceted Search & Filters, Appointment Booking Calendar, Slot Cancellation/Reschedule, Review & Ratings, Global Search |
| **23201436** | **Mohammad Zubair Zaman** | `mohammad.zubair.zaman@g.bracu.ac.bd` | **Module 3**: Community Repair Cafés, FIFO Waitlists, Carbon & E-Waste Calculator, Admin Moderation Panel |
| **23201427** | **Avishek Biswas** | `xeroxavishek@gmail.com` | **Core UI, Maps, Payment & AI**: UI/UX Design System, Landing Page, Interactive Geolocation Map (Leaflet), AI Diagnostic Tool, Vision Damage Analyzer, Stripe Payment Gateway,Socket.io Real-Time Chat |

---

## 📋 System Prerequisites

Before running the application, make sure you have the following installed on your PC:

1. **Node.js** (v18.x or v20.x+): [Download Node.js](https://nodejs.org/)
2. **Git**: [Download Git](https://git-scm.com/)
3. **MongoDB** (Choose either option):
   - **Local MongoDB Community Server**: Running on `mongodb://127.0.0.1:27017` ([Download](https://www.mongodb.com/try/download/community)), **OR**
   - **MongoDB Atlas** (Free Cloud Database): Obtain your connection URI string.

---

## Setup & Execution Steps

### Step 1: Clone the Repository
```bash
git clone https://github.com/YOUR_USERNAME/repairhub.git
cd repairhub
```

---

### Step 2: Configure & Start the Backend Server

1. Open a terminal and navigate to the `server/` directory:
   ```bash
   cd server
   npm install
   ```

2. Create your environment file from the provided template:
   ```bash
   # On Windows (CMD / PowerShell)
   copy .env.example .env

   # On macOS / Linux
   cp .env.example .env
   ```

   > **Note on MongoDB**: If using local MongoDB, the default `MONGO_URI=mongodb://127.0.0.1:27017/repairhub` works out of the box. If using MongoDB Atlas, edit `server/.env` and replace `MONGO_URI` with your Atlas connection string.

3. Seed initial demo data (Users, repair tickets, workshops, repair cafes):
   ```bash
   npm run seed
   ```

4. Launch the backend API server:
   ```bash
   npm run dev
   ```
   *The server will start on **`http://localhost:5000`** with real-time Socket.io support.*

---

### Step 3: Configure & Start the Frontend Client

1. Open a **second terminal window** and navigate to the `client/` directory:
   ```bash
   cd client
   npm install
   ```

2. Launch the frontend development server:
   ```bash
   npm run dev
   ```
   *The client web application will be accessible at **`http://localhost:5173`**.*

---
```bash
   npm --prefix client run build
   npm --prefix server run dev
   npm --prefix client run dev
   npm test
```

##  Automated Testing & Verification

The project includes **40 automated integration and unit tests** across all 5 functional modules. To run the full test suite from the repository root:

```bash
# Run all 40 automated tests
npm test
```

### Running Individual Module Test Suites:
```bash
# Module 1: Repair Request & QR Tracking Lifecycle
npm run test:module1

# Module 2: Geolocation Discovery & Appointment Booking
npm run test:module2

# Module 3: Repair Café Events & Environmental Impact
npm run test:module3

# Module 4: Multi-Quote Bidding, Escrow & Live Chat
npm run test:module4

# Module 5: Customer Reviews & Admin Governance
npm run test:module5
```

---

## 🔐 Seeded Demo Credentials

| Role | Email | Password | Access / Permissions |
| :--- | :--- | :--- | :--- |
| **Customer / Requester** | `avishek@bracu.ac.bd` | `password123` | Create repair orders, accept bids, view QR handover tokens, live chat with technicians |
| **Technician / Repairer** | `rafiq@repairhub.com` | `password123` | Technician workspace, submit bids, scan customer QR tokens, manage repair queue |
| **System Admin** | `admin@repairhub.com` | `admin123` | Admin governance dashboard, KYC verification, dispute mediation, platform metrics |

*(Tip: In the frontend UI, you can also use the one-click **"Demo Persona Switcher"** buttons inside the Sign In modal).*

---

## 📂 Project Architecture

```text
repairhub/
├── client/                     # Frontend View Layer (React 18 + Vite + TailwindCSS)
│   ├── src/
│   │   ├── components/         # StatusPipeline, InteractiveMap, AIAssistantDrawer, AdminDashboard, etc.
│   │   ├── App.jsx             # Main Application Container & Route Switching
│   │   └── main.jsx
│   └── package.json
│
├── server/                     # Backend MVC Server (Node.js + Express + Mongoose)
│   ├── src/
│   │   ├── config/             # MongoDB Connection & SSLCommerz Sandbox keys
│   │   ├── models/             # User, RepairRequest, ItemHistoryLog, Event, Booking, Quote, Payment, Message, Review
│   │   ├── controllers/        # Business logic for all 22 Functional Requirements
│   │   ├── routes/             # REST API routes mapped to Controllers
│   │   ├── middlewares/        # JWT Authentication, Role Authorization & Rate Limiting
│   │   └── utils/              # QR Token Helper, Carbon Impact Math, Database Seeder
│   └── package.json
│
├── tests/                      # Automated Jest + Supertest Integration Test Suites (129 Tests, 20 Suites)
└── docs/
    └── SRS_RepairHub_CSE470.md # Formal CSE470 Software Requirements Specification Document
```

---

## 🛠️ Troubleshooting Common Issues

1. **Port 5000 or 5173 already in use**:
   - Change `PORT=5001` in `server/.env` or run `npm run dev -- --port 5174` in `client/`.
2. **MongoDB Connection Failed**:
   - Ensure MongoDB service is running (`net start MongoDB` on Windows, or `brew services start mongodb-community` on macOS).
3. **Running Production Build**:
   ```bash
   cd client
   npm run build
   npm run preview
   ```
