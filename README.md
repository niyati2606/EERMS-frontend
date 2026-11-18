# EERMS – Employee Expense Reimbursement Management System (ABC Solutions)

React 18 + Vite + Bootstrap 5 frontend (`eerms-frontend`, port 5173) and Node/Express backend (`eerms-backend`, port 5000).

## Run (Windows, two terminals)
    cd eerms-backend  && npm install && copy .env.example .env && (edit .env with your SMTP settings) && npm start
    cd eerms-frontend && npm install && npm run dev
Open http://localhost:5173

## Deploy to Vercel
Deploy `eerms-frontend` as the Vercel project root. The Express API is a separate service; deploy `eerms-backend` to a Node.js host and configure:

- `VITE_API_BASE_URL` in the Vercel frontend project to the backend URL (for example, `https://your-api-host.example`). The frontend adds `/api` automatically; including `/api` in the value is also supported.
- `CLIENT_ORIGIN` on the backend to the exact deployed frontend origin (for example, `https://your-app.vercel.app`).

Set `VITE_API_BASE_URL` in the Vercel frontend project's Environment Variables for the Production environment (and Preview if used), then redeploy. A `.env` file in the backend does not configure the frontend build. The frontend defaults to `/api` for local development, where Vite proxies requests to `http://localhost:5000`. For local development, the backend stores application data in `eerms-backend/data/store.json`. This file is not suitable for serverless or ephemeral hosting. Set `DATABASE_URL` (or `POSTGRES_URL`) to a PostgreSQL database on Vercel or another provider. The backend automatically creates and uses the `eerms_store` table. JSON `/tmp` storage is only a temporary fallback and may reset on cold starts or redeployments.

## SMTP email setup
Copy `eerms-backend/.env.example` to `eerms-backend/.env`, then set `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, and `SMTP_FROM`. For Gmail, use `smtp.gmail.com`, port `587`, `SMTP_SECURE=false`, your Gmail address, and a Google App Password (not your regular Gmail password). Use that same Gmail address in `SMTP_FROM`. Employee onboarding fails with an explicit error if the setup email cannot be sent.

## Demo logins (password `Password@123`)
| Role | Email |
|---|---|
| Finance Officer | finance@abcsolutions.com (peer: finance2@abcsolutions.com) |
| HR Administrator | hr@abcsolutions.com |
| Admin / Executive | admin@abcsolutions.com |

## Implemented (per BRD v2.0)
- 4 roles, JWT + RBAC, no manager approval: claims go straight to the Finance Shared Queue (oldest first)
- Multi-line claim form, 6 categories, Ola/Uber/Rapido + Booking ID for road, mandatory receipt per line (PDF/JPG/PNG < 200 KB)
- SHA-256 duplicate receipt alert + 12-month Emp+Date+Amount+Category duplicate warning
- [Assign to Me] one-hour lease lock, remark-required release, no self-audit (BRULE-05), split-screen receipt audit with zoom and 90° rotation, Approve / Request Info / Reject (note mandatory)
- Employee revision worklist + resubmit, timeline, notifications (bell + toast; employee password setup links are delivered by SMTP)
- HR-created employees receive a one-time, 24-hour password setup link by SMTP email; employees set their own password and can update personal and bank details from My Profile
- EFT/CSV batch export (verified bank + active employee only), UTR entry to mark PAID
- Flags: > ₹25,000, 72 business-hour aging (Mon–Fri, 9:00–17:00 IST) with in-app digests to active Finance users, meals/hotel caps, 45-day grace, GST breakdown, and ₹50/km road policy check
- HR: employee list/freeze, 3-step Add Employee wizard, Bank Verification page
- Admin: monthly budget + all-category tracker, branch/department/trend charts, SLA, hash-chained audit trail, CSV export

## Notes
- Data is kept in memory and persisted every 2 s. Locally it is saved to `eerms-backend/data/store.json`; on Vercel it requires `DATABASE_URL`/`POSTGRES_URL` and is saved to PostgreSQL. Delete the local JSON file to reset local demo data.
- Fresh data stores include bootstrap admin, HR, and finance logins only; employees, banks, and claims are created through the app.
- PDF/Excel export, SSO, TLS/AES-at-rest and transactional emails other than the employee password setup email are not implemented (Phase 2 / infrastructure).
