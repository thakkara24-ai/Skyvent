# SKYVENT — Student Organization Management Platform
> **"One Campus. One Community. One Platform."**  
> *Connect. Organize. Celebrate.*

---

## 🏛️ Executive Summary

**SKYVENT** is an enterprise-grade full-stack student organization management platform built specifically for university clubs, student unions, campus societies, and collegiate councils. 

Student organizations traditionally manage operations using disconnected spreadsheets, WhatsApp messages, paper tickets, cash boxes, and Google forms. **SKYVENT** unites all organizational operations into **one connected workflow**:

```
MEMBER → MEMBERSHIP PLAN → EVENT DISCOVERY → DYNAMIC MEMBER PRICING → DEMO PAYMENT 
       → TICKET ISSUANCE → SECURE QR CODE → SCAN & CHECK-IN → ATTENDANCE LEDGER 
       → MERCHANDISE & INVENTORY → FINANCIAL AUDIT & REPORTING
```

---

## 🚀 Key Features & Connected Workflows

### 1. 🔐 Cryptographic Authentication & Real OTP
- Custom User model with strict Role-Based Access Control (**SUPER_ADMIN**, **PRESIDENT**, **TREASURER**, **VOLUNTEER**, **MEMBER**).
- JWT (JSON Web Tokens) access & refresh token rotation.
- Real 6-digit cryptographic email OTP (SHA-256 hashed, 5-minute expiry, max 5 attempts, 60s cooldown). *No plaintext OTPs in responses or client state.*

### 2. 🎖️ Membership System & Dynamic Pricing Engine
- Membership tiers (e.g. *Student Pro*, *Campus Explorer*) with real validity dates, perks, and discount structures.
- **Server-Side Member Pricing**: Tickets automatically evaluate whether the purchasing user holds an active membership. Expired or non-members pay regular pricing; active members receive server-computed discounts.

### 3. 🎟️ Event Ticketing & Secure QR Passes
- Real-time capacity validation and duplicate purchase prevention.
- Instant ticket generation with encrypted unique verification identifiers (`SKY-EVT-2026-XXXX`).
- Live QR pass modal rendered on web & mobile viewports.

### 4. 📱 Volunteer Check-In Station & Realtime Attendance
- Dedicated high-speed Volunteer check-in interface with camera QR scanner simulation & manual ticket number validation.
- Live anti-duplicate check-in enforcement.
- Instant WebSocket broadcast updates admin dashboards with zero manual refresh.

### 5. 👕 Merchandise Store & Auto-Inventory Management
- Multi-size student apparel and accessories catalog (`S`, `M`, `L`, `XL`, `XXL`).
- Real-time stock decrement upon confirmed checkout.
- Automated low-stock alerts triggering the "Needs Attention" engine.

### 6. 💰 Financial Treasury & Reimbursement Workflow
- Double-entry transaction audit log tracking all income (Memberships, Event Tickets, Merchandise, Fundraisers) and expenses.
- Submitter & Treasurer reimbursement review pipeline (Submit → Review → Approve/Reject → Ledger Disbursement).
- Dynamic Net Balance calculation: $\text{Net Balance} = \text{Total Income} - \text{Total Expenses}$.

### 7. 🚨 Dynamic "NEEDS ATTENTION" Engine
- Real-time heuristic monitoring on the SQLite database:
  - Expiring memberships within 7 days.
  - Events reaching $>80\%$ capacity.
  - Merchandise stock reaching low-stock thresholds ($\le 5$ units).
  - Pending reimbursement claims awaiting Treasurer sign-off.
  - Overdue volunteer fundraiser tasks.

### 8. ⚡ Realtime WebSockets (Django Channels)
- Live WebSocket channel `ws://localhost:8000/ws/live/` streaming:
  - `ticket_purchased`
  - `attendance_updated`
  - `inventory_updated`
  - `finance_updated`
  - `announcement_created`

---

## 🛠️ Architecture & Tech Stack

```
                        SKYVENT ARCHITECTURE

                 ┌───────────────────────────────┐
                 │       React.js (Vite)         │
                 │   Tailwind CSS (Warm Academic)│
                 │   Lucide Icons + Recharts     │
                 │   Sonner Toasts + Date-fns    │
                 └──────────────┬────────────────┘
                                │
                        REST API & WebSockets
                                │
                 ┌──────────────▼────────────────┐
                 │        Django 5.x / DRF       │
                 │   Django Channels (ASGI)      │
                 │   JWT Auth + SHA-256 OTP      │
                 │   QRCode + Audit Logging      │
                 └──────────────┬────────────────┘
                                │
                            Django ORM
                                │
                 ┌──────────────▼────────────────┐
                 │         SQLite Database       │
                 │      (backend/db.sqlite3)     │
                 └───────────────────────────────┘
```

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | React 18, Vite | High-performance SPA with client-side routing |
| **Styling** | Tailwind CSS | Custom Warm Academic design system |
| **Charts & Data** | Recharts | Revenue, Attendance, and Source visualizations |
| **Backend** | Python 3.11+, Django 5.x, DRF | Robust REST API and business logic |
| **Realtime** | Django Channels, Daphne | High-concurrency WebSockets stream |
| **Database** | SQLite (`backend/db.sqlite3`) | Fast, zero-config relational database |
| **Security** | SimpleJWT, SHA-256 Hashing | Safe authentication & tamper-proof tokens |

---

## 🎨 Warm Academic Design System

SKYVENT uses a bespoke, non-generic **Warm Academic** palette designed for collegiate institutions:
- **Ink Brown** (`#2A1E18`): Deep typography and dark accents
- **Coffee Brown** (`#6B4A38`): Primary action buttons and navigation highlights
- **Sand** (`#E8DCCE`): Crisp borders, subtle badges, and dividers
- **Cream** (`#FAF8F5`): Warm canvas background
- **Clay Brown** (`#8B6353`): Secondary accents and tags
- **Warm Gray** (`#7A6A5E`): Metadata and muted copy

---

## 👥 Demo Accounts (Development & Evaluation)

All seeded demo accounts share the password: `Skyvent@2026`

| Role | Email | Password | Access Scope |
|---|---|---|---|
| **Super Admin** | `admin@skyvent.demo` | `Skyvent@2026` | Full platform control, audit logs, system settings |
| **President** | `president@skyvent.demo` | `Skyvent@2026` | Members, Events, Tickets, Merchandise, Announcements |
| **Treasurer** | `treasurer@skyvent.demo` | `Skyvent@2026` | Financial ledger, Expense approvals, Reports |
| **Volunteer** | `volunteer@skyvent.demo` | `Skyvent@2026` | Event check-in station, Task boards |
| **Member (Active)** | `member@skyvent.demo` | `Skyvent@2026` | Tickets, Merchandise, Membership discounts |

---

## 📦 Project Structure

```
Skyvent/
├── backend/
│   ├── manage.py
│   ├── requirements.txt
│   ├── .env.example
│   ├── .env
│   ├── db.sqlite3
│   ├── config/             # Django settings, ASGI, WSGI, URLs
│   ├── accounts/           # User model, Auth, OTP verification, Tests
│   ├── common/             # Responses, Permissions, Helpers, Consumers
│   ├── memberships/        # Membership plans and active subscriptions
│   ├── events/             # Events, Capacity, Server-side pricing
│   ├── tickets/            # Ticket issuance, QR tokens, Cancellations
│   ├── attendance/         # QR Check-in station and attendance logs
│   ├── merchandise/        # Products, sizes, inventory alerts
│   ├── orders/             # Checkout, order items, stock decrement
│   ├── announcements/      # Campus bulletin board
│   ├── fundraisers/        # Campaigns & Kanban task boards
│   ├── finance/            # Payments, Transactions, Reimbursements
│   ├── notifications/      # Realtime user notification feeds
│   └── dashboard/          # Dynamic admin & member KPI aggregators
│
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── .env.example
│   ├── .env
│   ├── index.html
│   └── src/
│       ├── assets/         # Branding and SVGs
│       ├── components/     # UI kit (Buttons, Badges, Modals, StatCards, QR)
│       ├── context/        # AuthContext, SocketContext
│       ├── layouts/        # PublicLayout, MemberLayout, AdminLayout
│       ├── pages/          # 20+ responsive pages (Public, Member, Admin)
│       ├── routes/         # AppRoutes and Role-Based Guards
│       ├── services/       # Centralized API service layer (Axios)
│       └── index.css       # Tailwind CSS & design tokens
│
└── README.md
```

---

## ⚡ Quickstart Setup Guide

### Prerequisites
- **Python 3.10+**
- **Node.js 18+** & **npm**

---

### Step 1: Backend Setup (Django + Channels + SQLite)

```bash
cd backend

# 1. Create and activate a Python virtual environment
python -m venv venv

# Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# macOS/Linux:
source venv/bin/activate

# 2. Install backend dependencies
pip install -r requirements.txt

# 3. Create .env configuration
cp .env.example .env

# 4. Run database migrations
python manage.py migrate

# 5. Populate realistic database seed data
python manage.py seed_data

# 6. Run automated test suite (Integration test verification)
python manage.py test

# 7. Start the ASGI server (Daphne with WebSockets)
daphne -b 127.0.0.1 -p 8000 config.asgi:application
# Or standard runserver:
python manage.py runserver 8000
```
*Backend will be running at `http://127.0.0.1:8000/` and WebSocket at `ws://127.0.0.1:8000/ws/live/`.*

---

### Step 2: Frontend Setup (React + Vite + Tailwind)

```bash
cd frontend

# 1. Install frontend dependencies
npm install

# 2. Verify environment configuration
cp .env.example .env

# 3. Start development server
npm run dev

# 4. Production build test (optional)
npm run build
```
*Frontend will be running at `http://localhost:5173/`.*

---

## 🏆 Golden Demonstration Walkthrough

Follow these steps for the complete end-to-end hackathon demonstration:

1. **Public Landing**: Open `http://localhost:5173/` to showcase the hero banner, community statistics, upcoming events, and value pillars.
2. **Member Login**: Log in as `member@skyvent.demo` (`Skyvent@2026`).
3. **Membership Verification**: View active *Student Pro* membership badge and valid expiry dates.
4. **Member Pricing**: Open **Campus Gala Night 2026**. Observe the server automatically applying the **₹300** member rate instead of the **₹500** regular rate.
5. **Ticket Booking**: Click *Reserve Ticket* and confirm the Demo Payment modal. Instant ticket pass and cryptographic QR code are rendered.
6. **Volunteer Check-In**: Open an incognito window or switch user to `volunteer@skyvent.demo`. Open `/admin/attendance` (Check-In Station) and enter the ticket number or scan the QR pass.
7. **Realtime Broadcast**: Observe attendance increase instantly and double check-in prevention immediately flag duplicates.
8. **Merchandise Store**: Add the *SKYVENT Heavyweight Hoodie* to your cart and checkout. Notice inventory decrease from 8 to 7 units.
9. **Admin Dashboard**: Log in as `admin@skyvent.demo`. Review dynamic KPIs, real-time revenue breakdowns, expense disbursements, and the reactive **NEEDS ATTENTION** alert center.

---

## 📡 REST API Endpoint Summary

| Endpoint | Method | Role | Description |
|---|---|---|---|
| `/api/auth/register/` | POST | Public | Register new student profile |
| `/api/auth/send-otp/` | POST | Public | Issue 6-digit cryptographic email OTP |
| `/api/auth/verify-otp/` | POST | Public | Verify OTP and activate account |
| `/api/auth/login/` | POST | Public | Authenticate and obtain JWT tokens |
| `/api/events/` | GET, POST | Public / Staff | List upcoming events with dynamic prices |
| `/api/events/:id/tickets/` | POST | Member | Purchase ticket at computed server rate |
| `/api/attendance/check-in/` | POST | Volunteer / Staff | Verify QR token & register attendance |
| `/api/products/` | GET, POST | Public / Staff | Merchandise catalog & stock levels |
| `/api/orders/` | POST, GET | Member / Staff | Place merchandise orders with stock decrement |
| `/api/expenses/` | GET, POST | Auth | Submit reimbursement claim |
| `/api/expenses/:id/review/` | POST | Treasurer / Admin | Approve or reject expense claim |
| `/api/finance/summary/` | GET | Treasurer / Admin | Realtime financial summary & balance |
| `/api/dashboard/admin/` | GET | Staff | Complete KPI overview & Needs Attention |

---

## 🔒 Security & Best Practices

- **Never Trust the Client**: Event ticket prices, member status discounts, stock availability, and user roles are strictly validated server-side in Django.
- **Hashed OTPs**: OTPs are never stored in plaintext and never leaked in API responses.
- **Strict Role Permissions**: DRF permission classes protect all sensitive mutations (e.g. `IsTreasurerOrAdmin`, `IsVolunteerOrStaff`).
- **Database Consistency**: All transactional actions (orders, payments, ticket issuance) execute atomic database transactions with SQLite integrity.

---

## 📄 License & Credits

Developed with ❤️ for collegiate organizations worldwide.  
**SKYVENT** — *Connect. Organize. Celebrate.*
