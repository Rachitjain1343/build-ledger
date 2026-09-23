# BuildLedger

React dashboard with a Django API, Supabase Auth, and Supabase Postgres for project data. The Django API sends database requests with the signed-in user's token. Supabase row level security enforces project roles.

## Set up Supabase

1. In the Supabase SQL editor for your project, run [supabase/schema.sql](supabase/schema.sql). This creates the project, member, expense, and payment tables plus their row policies.
2. Copy `.env.example` to `.env` in the project root and set `SUPABASE_URL` and `SUPABASE_ANON_KEY`. Use the project URL ending in `.supabase.co`, without `/rest/v1/`.
3. In Supabase Auth settings, configure the site URL and email confirmation behavior for your environment. When confirmation is enabled, users must confirm their email before logging in.

Only the anon/public key is needed. Never put a service role key in frontend code or Git. The provided `.env` is ignored by Git.

## Run locally

From the project root, use two terminals:

```powershell
python -m pip install -r backend/requirements.txt
python backend/manage.py runserver 127.0.0.1:5000
```

```powershell
npm install
npm.cmd run dev
```

Open `http://127.0.0.1:5173/`. The frontend proxies `/api` to Django. On Windows PowerShell, use `npm.cmd` if script execution policy blocks `npm`.

For a single local server, build the frontend with `npm.cmd run build` and open `http://127.0.0.1:5000/` while Django runs.

## Project roles

| Role | Permissions |
| --- | --- |
| Owner | Read and update the project, budget, and expenses; manage team access |
| Manager | Read and update the project, budget, and expenses |
| Viewer | Read project data only |

The owner can add a teammate by email in **Team & Roles** once that teammate has registered and confirmed the email. Access is tied to the Supabase user ID. Use **Budget vs Actual → Manage budget** to edit project details and **Costs & Expenses** to add or edit expenses. Payment schedules are currently read-only. **Export PDF Report** opens the browser print dialog.

New accounts start with no projects. Accounts and project records from the previous local SQLite implementation are not automatically migrated to Supabase. Project data and account identities live in Supabase; Django stores login sessions as files in the ignored `backend/.sessions/` directory.

## Checks

```powershell
python backend/manage.py test ledger
python backend/manage.py check
npm.cmd run lint
npm.cmd run build
```
