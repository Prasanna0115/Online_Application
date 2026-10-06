# Harbor Health patient portal

A responsive React sign-in/sign-up page backed by a FastAPI authentication API and PostgreSQL. Patient accounts store a name, email address, phone number, Argon2 password hash, and creation timestamp. Passwords are never stored in plaintext.

## Run with Docker Compose

1. Copy `.env.example` to `.env` and set `JWT_SECRET` to at least 32 random characters. The local `.env` is git-ignored and must not be committed.
2. Start the services from the project root:

   ```sh
   docker compose up --build
   ```

3. Open [http://localhost:5173](http://localhost:5173). The API docs are at [http://localhost:8000/docs](http://localhost:8000/docs).

The local Compose database is published on port 5433 so it does not conflict with PostgreSQL already running on the standard port. Credentials are for development only. Change them before deploying. The API creates the patient table on startup; use a migration tool such as Alembic when evolving the schema in production.

## Run services separately

For a direct local API run, set `DATABASE_URL` in the root `.env` to your PostgreSQL host, port, database, user, and password. The API loads this root `.env` even when started from the `backend` directory. The example targets an existing local PostgreSQL server at `127.0.0.1:5432/Online_Appointment` as user `postgres`. Replace `YOUR_POSTGRES_PASSWORD` locally and URL-encode reserved characters in it (for example, `@` as `%40`). Ensure that database exists and the user has permission to create tables, then:

```sh
cd backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload
```

In another terminal:

```sh
cd frontend
npm install
npm run dev
```

Vite proxies `/api` requests to `http://localhost:8000`. Configure `DATABASE_URL`, `JWT_SECRET`, and `CORS_ORIGINS` through environment variables for other environments.
When running the API directly, set `JWT_SECRET` (at least 32 random characters) in the environment before starting it (for example, `$env:JWT_SECRET = "<long-random-value>"` in PowerShell).

## Authentication endpoints

- `POST /api/auth/register` — create an account and return a bearer access token.
- `POST /api/auth/login` — verify credentials and return a bearer access token.
- `GET /api/auth/me` — return the signed-in patient profile; requires `Authorization: Bearer <token>`.
- `GET /api/health` — API health check.

Access tokens expire after 60 minutes by default. Passwords require at least eight characters.
