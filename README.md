# RecipeScale — SaaS Multi-Tenant F&B Costing & Kitchen Scaling Platform

<div align="center">

[![Go](https://img.shields.io/badge/Go_1.26-00ADD8?logo=go&logoColor=white&style=for-the-badge)](https://go.dev/)
[![React](https://img.shields.io/badge/React_19-20232A?logo=react&logoColor=61DAFB&style=for-the-badge)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white&style=for-the-badge)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite_8-646CFF?logo=vite&logoColor=white&style=for-the-badge)](https://vitejs.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white&style=for-the-badge)](https://www.postgresql.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS_4-06B6D4?logo=tailwind-css&logoColor=white&style=for-the-badge)](https://tailwindcss.com/)
[![Vercel](https://img.shields.io/badge/Vercel-000000?logo=vercel&logoColor=white&style=for-the-badge)](https://vercel.com/)
[![Render](https://img.shields.io/badge/Render-46E3B7?logo=render&logoColor=black&style=for-the-badge)](https://render.com/)

</div>

**RecipeScale** is a production-oriented SaaS platform for F&B micro, small, and medium enterprises (MSMEs). It solves three core operational problems in one integrated tool:

1. **What is the real COGS per portion?** — Accurate recipe costing built from raw ingredients.
2. **How do I scale production?** — Instant kitchen scaling sheets for bulk orders.
3. **Which menus are at risk?** — Margin analysis when ingredient prices fluctuate.

Built with a **Go Fiber** backend and a **React + TypeScript + Vite** frontend, RecipeScale demonstrates multi-tenant SaaS architecture, secure authentication with JWT blacklisting, advanced UI performance optimizations, and real-world deployment on Vercel + Render.

---

## ✨ Key Features

### 1. Nested Recipe Costing Engine
- **Unlimited nesting** — half-finished bases (sauces, broths, spice pastes) can be ingredients in main recipes.
- **XOR validation** — prevents duplicate raw materials and **circular dependencies** at the backend level.
- Automatic roll-up of component costs into the final Cost of Goods Sold (COGS / HPP).

### 2. Multi-Tenant Workspace Isolation
- Every team works inside its own workspace; all data is scoped by `workspace_id`.
- Composite index `idx_workspace_ing` on high-frequency tables (`StockMovement`) keeps multi-tenant queries fast even as data grows.

### 3. Production & Margin Simulator
- **Markup calculator** — set target food cost % and instantly get recommended selling price.
- **Tax & service simulation** — PB1 (10%), service charge (5%), net profit, and gross margin.
- **Kitchen scaling sheet** — enter target portions and get precise weighing lists in real time.
- **Donut cost chart** — Recharts-powered breakdown of recipe cost components.

### 4. Indonesia Locale & UX
- Universal formatting with thousand separators and comma decimals (`12.500,75`).
- Custom `NumericInput` component formats thousands while typing and maps numpad dot to comma without cursor flicker.

### 5. High-Performance Data Tables
- Migrated to **TanStack Table v8** for ingredients, recipes, stock availability, and menu analysis.
- Multi-column sorting, instant global search, and headless pagination with dark-mode stability.

### 6. Secure Authentication
- **HttpOnly cookie sessions** with `Secure` and dynamic `SameSite` policy for cross-domain production.
- **JWT blacklist** stored in PostgreSQL — logged-out tokens are blocked until expiry.
- **Automated cleanup worker** — hourly goroutine purges expired blacklisted tokens to keep indexes healthy.

---

## 🛠️ Tech Stack

### Backend
| Technology | Purpose |
|------------|---------|
| Go 1.26 | High-performance backend language |
| Fiber v2 | Fast HTTP web framework |
| GORM | ORM for PostgreSQL |
| golang-jwt/jwt/v5 | JWT signing and validation |
| bcrypt | Password hashing |
| go-playground/validator | Request validation |
| godotenv | Environment configuration |

### Frontend
| Technology | Purpose |
|------------|---------|
| React 19 | UI library |
| TypeScript | Static type safety |
| Vite 8 | Build tooling and dev server |
| Tailwind CSS v4 | Utility-first styling |
| React Router v7 | Client-side routing |
| TanStack Table v8 | Advanced data tables |
| Recharts | Cost visualization |
| Axios | HTTP client with interceptors |
| SweetAlert2 | Confirmation dialogs |
| Oxlint | Fast linting |

### Infrastructure
| Technology | Purpose |
|------------|---------|
| Vercel | Static SPA frontend hosting |
| Render | Persistent Go backend hosting |
| Aiven PostgreSQL | Managed production database |
| Docker | Containerized local development |

---

## 🏗️ Architecture

RecipeScale uses a **split-deployment architecture** optimized for cost and performance: the frontend is a static Single Page Application (SPA) on Vercel, while the backend is a persistent Go service on Render.

```mermaid
graph LR
    Browser[Browser / Mobile] -->|Static Assets| Vercel[React SPA<br/>Vercel]
    Browser -->|REST API / Auth| Render[Go Fiber Backend<br/>Render]
    Render -->|GORM + AutoMigrate| DB[(PostgreSQL<br/>Aiven)]
    Render -->|Blacklist Cleanup| Worker[Hourly Goroutine]
```

### Backend Clean Architecture
```text
recipe-scale/backend/
├── cmd/api/main.go             # Server entrypoint
├── internal/
│   ├── config/                 # Database configuration & AutoMigrate
│   ├── domain/                 # GORM models
│   ├── handler/                # REST handlers & router
│   ├── middleware/             # JWT auth session guard
│   ├── service/                # Business logic (HPP, scaling, units)
│   ├── repository/             # Data access layer
│   ├── apperror/               # Application error types
│   ├── jwtutil/                # JWT utilities
│   └── validation/             # Input validators
└── go.mod
```

---

## 📁 Project Structure

```text
recipe-scale/
├── backend/
│   ├── cmd/api/main.go
│   ├── internal/
│   │   ├── config/
│   │   ├── domain/
│   │   ├── handler/
│   │   ├── middleware/
│   │   ├── repository/
│   │   ├── service/
│   │   ├── apperror/
│   │   ├── jwtutil/
│   │   └── validation/
│   ├── go.mod
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── lib/
│   │   ├── pages/
│   │   ├── types/
│   │   └── App.tsx
│   ├── vercel.json             # SPA rewrite rules
│   └── package.json
├── render.yaml                 # Render backend specification
├── .env.render                 # Render environment template
├── .env.vercel                 # Vercel environment template
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- Go 1.26+
- Node.js 20+
- PostgreSQL server running locally (default port `5432`)

### 1. Clone the repository
```bash
git clone https://github.com/Rauf74/recipe-scale.git
cd recipe-scale
```

### 2. Backend setup
```bash
cd backend
```
Create a `.env` file:
```env
DB_DSN="postgres://user:password@127.0.0.1:5432/recipescale?sslmode=disable"
JWT_SECRET="your_random_secure_jwt_secret"
PORT="8085"
FRONTEND_URL="http://localhost:5173"
APP_ENV="development"
```
Run the server:
```bash
go run cmd/api/main.go
```
Backend will be available at `http://localhost:8085`.

### 3. Frontend setup
```bash
cd ../frontend
cp .env.example .env
# Set VITE_API_URL=http://localhost:8085
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173).

---

## 🧪 Testing

Run Go unit tests for services and validators:

```bash
cd backend
go test ./...
```

---

## 🌍 Deployment

### Frontend — Vercel
1. Import the repository and set **Root Directory** to `frontend/`.
2. Ensure `vercel.json` is present inside `frontend/` for SPA rewrite rules.
3. Add environment variable:
   - `VITE_API_URL=https://your-backend.onrender.com`
4. Trigger a redeploy after any environment variable change (Vite variables are injected at build time).

### Backend — Render
1. Create a new **Web Service** and connect the repository.
2. Set **Root Directory** to `backend/`.
3. Use the Go runtime with:
   - Build command: `cd backend && go build -o main ./cmd/api/main.go`
   - Start command: `cd backend && ./main`
4. Add environment variables:
   - `APP_ENV=production`
   - `DB_DSN=your_postgres_connection_string`
   - `JWT_SECRET=your_random_secret`
   - `FRONTEND_URL=https://your-frontend.vercel.app`
   - `PORT=10000`

See [`DEPLOYMENT_STORY.md`](./DEPLOYMENT_STORY.md) for a detailed post-mortem of the deployment journey, including serverless pitfalls, SPA routing, Vite build-time variables, and cross-domain cookie fixes.

---

## 🔒 Security Highlights

- **HttpOnly JWT cookies** protect tokens from XSS.
- **Dynamic SameSite policy** switches to `None` + `Secure` in production for cross-domain auth.
- **JWT blacklist** in PostgreSQL prevents reuse of logged-out tokens.
- **Hourly cleanup worker** removes expired blacklisted tokens.
- **CORS** configured to allow only the registered frontend origin.
- **Request validation** via `go-playground/validator`.

---

## 📈 Roadmap

- Inventory stock movement ledger
- Purchase order and supplier management
- Menu profit-margin alerts and notifications
- Multi-unit conversion engine expansion
- Mobile-responsive PWA support

---

## 🙋‍♂️ Author

**Abdur Rauf Al Farras**
- GitHub: [@Rauf74](https://github.com/Rauf74)
- LinkedIn: *(add your profile link)*

---

*Built as a portfolio project to demonstrate SaaS architecture, multi-tenant backend engineering, advanced React UX, and production deployment discipline for the F&B industry.*
