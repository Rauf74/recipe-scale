# RecipeScale Frontend

React + TypeScript + Vite SPA for the RecipeScale F&B costing platform.

## Tech Stack

- **React 19** — UI library
- **TypeScript** — Static type safety
- **Vite 8** — Build tooling and dev server
- **Tailwind CSS v4** — Utility-first styling
- **React Router v7** — Client-side routing
- **TanStack Table v8** — Advanced data tables
- **Recharts** — Cost visualization
- **Axios** — HTTP client with interceptors
- **Oxlint** — Fast linting

## Getting Started

```bash
npm install
npm run dev
```

The dev server will start at `http://localhost:5173`.

## Environment Variables

Create a `.env` file:

```env
VITE_API_URL=http://localhost:8085
```

> **Important:** Vite injects environment variables at build time. If you change this value in production (e.g., Vercel dashboard), you must trigger a redeploy.

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run Oxlint |

## Deployment Notes

This frontend is deployed as a static SPA on **Vercel**. The `vercel.json` file ensures all routes are rewritten to `index.html` so client-side routing works correctly on refresh.

For the full deployment guide, see the root [`README.md`](../README.md).
