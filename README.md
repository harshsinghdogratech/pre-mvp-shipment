# Pre-MVP Shipment Workflow

End-to-end **workflow validation demo** for package shipment (FastAPI + PostgreSQL/SQLite + Next.js): admin creates packages and reviews invoices; clients upload invoices, request shipment to Aruba after approval, and track shipped items. No email, websockets, payments, or OCR.

## Workflow

1. Admin creates a package and assigns a **client** (dropdown of all `client` users).
2. Client sees the package (`pending_invoice`).
3. Client uploads an invoice → package `invoice_uploaded`, invoice `pending`.
4. Admin approves or rejects the invoice.
   - **Reject:** invoice `rejected`, package returns to `pending_invoice` (client may upload again).
   - **Approve:** invoice `approved`, package `approved`.
5. Client clicks **Request Shipment to Aruba** → package `shipment_requested`.
6. Admin marks the package **Shipped** → package `shipped`.
7. Client views shipped packages on **Shipment Status**.

## Repository layout

```
pre-mvp-shipment/
  backend/           FastAPI app (under app/)
  frontend/          Next.js App Router + Tailwind
  README.md
  .gitignore
```

## Seeded credentials

| Role   | Email           | Password   |
|--------|-----------------|------------|
| Admin  | admin@test.com  | password   |
| Client | client@test.com | password   |

On first startup (empty `users` table), two demo packages are created for the client.

## Local setup (Windows PowerShell)

### PostgreSQL

Create a database (example name `shipment`) and note the connection string. You can use local PostgreSQL, Docker, or a Railway Postgres instance.

### Backend

```powershell
cd backend
Copy-Item .env.example .env
# Edit .env: DATABASE_URL, JWT_SECRET, CORS_ORIGINS (comma-separated if multiple)
# Optional: set USE_SQLITE=true to run without PostgreSQL (SQLite file ./shipment.db).
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Default `DATABASE_URL` in `.env.example`:

`postgresql+psycopg2://postgres:postgres@localhost:5432/shipment`

### Frontend

```powershell
cd frontend
Copy-Item .env.local.example .env.local
# Optional: set NEXT_PUBLIC_API_BASE_URL (default http://localhost:8000/api)
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). API health: [http://localhost:8000/api/health](http://localhost:8000/api/health).

## Environment variables

**Backend (`.env`):**

| Variable              | Description                                      |
|-----------------------|--------------------------------------------------|
| `DATABASE_URL`        | SQLAlchemy URL (Postgres via psycopg2)           |
| `JWT_SECRET`          | Strong secret for signing JWTs                   |
| `JWT_ALGORITHM`       | Default `HS256`                                  |
| `JWT_EXPIRES_MINUTES` | Default `480` (8 hours)                          |
| `CORS_ORIGINS`        | Comma-separated origins, e.g. `http://localhost:3000` |
| `USE_SQLITE`          | `true` to use local `shipment.db` instead of Postgres |

**Frontend (`.env.local`):**

| Variable                     | Description                          |
|------------------------------|--------------------------------------|
| `NEXT_PUBLIC_API_BASE_URL`   | API base including `/api` prefix     |

## Railway deploy (notes)

- Create **two** Railway services: **backend** (Python) and **frontend** (Node), plus **Railway Postgres**.
- Attach Postgres to the backend; set `DATABASE_URL` to the provided connection string (ensure driver is `postgresql+psycopg2://...` as in `.env.example`).
- Backend env: `JWT_SECRET`, `JWT_ALGORITHM`, `JWT_EXPIRES_MINUTES`, `CORS_ORIGINS` = your **frontend public URL** (and any preview URLs you need).
- Frontend env: `NEXT_PUBLIC_API_BASE_URL` = backend **public URL** + `/api`, e.g. `https://your-backend.up.railway.app/api`.
- Start commands: backend `uvicorn app.main:app --host 0.0.0.0 --port $PORT` (Railway sets `PORT`); frontend `npm run build` then `npm start` (or platform-specific).
- **Uploads:** files are stored under `backend/uploads/invoices/` on the server filesystem. On Railway this is **ephemeral** and acceptable for this demo; production would use object storage.

## API overview

All routes are under `/api` (see FastAPI `app.main`).

- Auth: `POST /api/auth/login`, `GET /api/auth/me`
- Users (admin): `GET /api/users/clients`
- Stats: `GET /api/stats`
- Packages: `POST/GET /api/packages`, `GET /api/packages/{id}`, `PATCH .../request-shipment`, `PATCH .../ship`
- Invoices: `POST /api/invoices/upload`, `GET /api/invoices/pending` (admin list), `GET /api/invoices/{id}`, `GET /api/invoices/{id}/file`, `PATCH .../approve`, `PATCH .../reject`

Tables are created on startup (`Base.metadata.create_all`). No Alembic.

## Deviations from the written spec

1. **`GET /api/invoices/pending`:** Added so the admin “Invoice Reviews” page can list pending invoices in one call without overloading the packages endpoint.
2. **`latest_invoice.rejection_reason`:** Included in package list/detail payloads so the client upload modal can show the admin’s rejection text without an extra invoice fetch.
3. **Primary keys:** Integer autoincrement IDs (instead of UUID) for simplicity in a pre-MVP demo.
4. **Package status `rejected`:** Present on the enum for schema alignment; the implemented reject flow sets the package back to **`pending_invoice`** as specified (invoice carries `rejected`).
5. **SQLite optional mode:** Set `USE_SQLITE=true` in `.env` to use a local `shipment.db` file when PostgreSQL is not available. Production and Railway should use PostgreSQL (`USE_SQLITE=false`).
6. **Password hashing:** Uses the `bcrypt` library directly instead of `passlib` (avoids compatibility issues with newer `bcrypt` wheels while meeting the same requirement).
