# SAIL VRS Portal — Frontend

React 19 + TypeScript + Vite single-page application.

See the [root README](../README.md) for full setup instructions, demo credentials, API documentation and business rules.

## Quick start

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # type-check (tsc -b) + production build
npm run lint      # eslint
```

Configure the backend URL in `.env`:

```
VITE_API_URL=http://localhost:5001/api
```

## Pages

| Route | Access | Page |
|-------|--------|------|
| `/` | public | Home (scheme overview, eligibility criteria, portal walkthrough) |
| `/login` | public | Sign in (Employee ID + password; role-based redirect) |
| `/dashboard` | employee | Profile, eligibility badge, salary, compensation estimate, ACP |
| `/apply` | employee | Eligibility checklist, ACP summary, submit application |
| `/compensation` | employee | 5-step compensation breakdown |
| `/status` | employee | Application status timeline + history |
| `/admin` | admin | FCFS application queue + statistics |
| `/admin/applications/:id` | admin | Application review, approve/reject |
| `/admin/register` | admin | Register employee (incl. grading history) |
