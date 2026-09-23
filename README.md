# BuildLedger

Construction budget dashboard with a React frontend and Django backend. Accounts have separate projects and expenses. New accounts receive three sample projects so the dashboard is ready to explore.

## Project roles

Each project has one owner. The owner can add existing registered users from **Team & Roles** and assign them a manager or viewer role.

| Role | Permissions |
| --- | --- |
| Owner | Read and update the project, budget, and expenses; manage team access |
| Manager | Read and update the project, budget, and expenses |
| Viewer | Read project data only |

Use **Budget vs Actual → Manage budget** to update the budget, estimate, project name, or contractor count. Use **Costs & Expenses** to add or edit expense rows. Role permissions are checked by Django on every write request.

## Project layout

```text
backend/
  config/              Django settings and URL routes
  ledger/              Models, API views, migrations, and tests
  demo_projects.json   Sample data used for new accounts
  manage.py
  requirements.txt
src/
  components/          Dashboard and page components
  lib/api.js           Fetch and CSRF helper
  App.jsx              Authentication and page state
  index.css            Layout and responsive styling
```

## Run locally

Use two terminals from the project root:

```powershell
python -m pip install -r backend/requirements.txt
python backend/manage.py migrate
python backend/manage.py runserver 127.0.0.1:5000
```

```powershell
npm install
npm.cmd run dev
```

Open the URL printed by Vite, usually `http://localhost:5173`. On Windows PowerShell, use `npm.cmd` if script execution policy blocks `npm`.

To serve the built frontend from Django on port 5000 instead:

```powershell
npm.cmd run build
python backend/manage.py runserver 127.0.0.1:5000
```

The SQLite database is created at `backend/db.sqlite3` and is ignored by Git. Set `BUILDLEDGER_DB` to use another path. For deployment, set `BUILDLEDGER_SECRET_KEY`, `BUILDLEDGER_DEBUG=0`, allowed hosts, HTTPS, and a production WSGI server.

## Checks

```powershell
python backend/manage.py test ledger
npm.cmd run lint
npm.cmd run build
```

The report page's **Export PDF Report** button opens the browser print dialog; choose **Save as PDF** there. Sample payment schedules are read-only. Project changes, role assignments, and expenses are persisted in SQLite.
