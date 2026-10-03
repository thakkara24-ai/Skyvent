# Member 2 — Frontend Developer: Events, Ticketing, Merchandise & Admin

## Actual owned code
- `src/pages/public/EventsPage.jsx` and `EventDetailPage.jsx`
- `src/pages/public/MerchandiseShopPage.jsx`
- `src/pages/admin/` — dashboard, members, memberships, events, tickets, attendance, products, orders, announcements, fundraisers, tasks, finance, reports, audit logs and settings
- auth/public shell and shared components are included as integration dependencies

## Run
```powershell
cd frontend
npm install
npm run dev
```
Open `http://localhost:5174/`. API is configured for backend operations workspace on port 8002.

## Reviewer demo
Login as staff → Admin Dashboard → Events → create/manage event → Tickets → QR Check-In → Merchandise → Orders → Finance → Reports.
