# Member 3 — Backend Lead: Authentication & Membership

## Actual owned code
- `backend/accounts/` — User model, JWT auth, email OTP, password reset, verification
- `backend/memberships/` — MembershipPlan and Membership workflows
- `backend/finance/` — payment/transaction dependency used by membership checkout
- `backend/notifications/` — membership notifications dependency
- `backend/common/` — shared permissions, responses, audit/WebSocket helpers

## Run
```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_data
python manage.py runserver 8001
```

## Reviewer demo
1. Register a user.
2. Receive real email OTP through SMTP.
3. Verify OTP and obtain JWT.
4. Login.
5. Open membership plans.
6. Activate/view membership and expiry.

This folder contains the real implementation, not a documentation-only split.
