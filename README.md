# 🏠 Property Management System (PMS)

A robust, full-stack enterprise solution for managing real estate properties, scheduling site visits, and facilitating communication between Brokers, Customers, and Administrators.

## 🚀 Overview

This project is built with security, scalability, and performance in mind. It uses a modern tech stack featuring a high-performance **NestJS** backend (decoupled from traditional ORMs for raw SQL performance) and a sleek, interactive **React** frontend powered by **Ant Design**.

### Key Features
- **Unified Dashboard**: Real-time system-wide statistics (Properties, Brokers, Customers) visible to all registered roles.
- **Smart Property Management**: Complete CRUD flow for property listings with advanced filtering (Price, Location, Category, Transaction Type).
- **Site Visit Lifecycle**: 
  - Customers can request site visits on available slots.
  - Brokers can confirm, re-schedule, or complete visits.
  - One-time **Visit Feedback** system for customers after visit completion.
- **Role-Based Access Control (RBAC)**:
  - **Admin**: Full system control, user management (Broker/Customer management), and audit logging.
  - **Broker**: Property management, visit scheduling, and client feedback tracking.
  - **Customer**: Property search, visit booking, and interest tracking.
- **Enterprise Security**: 
  - JWT Authentication (15m Access / 7d Refresh rotation).
  - Brute-force protection (Account lockout after 5 failures).
  - Strictly typed data flow (Project-wide TypeScript strict mode).

---

## 🛠 Tech Stack

### Backend
- **Framework**: [NestJS](https://nestjs.com/) (Node.js)
- **Database**: MySQL (Raw SQL queries via `DatabaseService`)
- **Validation**: `class-validator` & `class-transformer`
- **Documentation**: [Swagger / OpenAPI](https://swagger.io/)
- **Security**: `bcrypt`, `passport-jwt`, `helmet`, `csurf` (optional)
- **Utilities**: `mysql` (pool integration), `uuid`, `dotenv`

### Frontend
- **Framework**: [Vite](https://vitejs.dev/) + [React](https://react.dev/)
- **UI Library**: [Ant Design (antd)](https://ant.design/)
- **State Management**: [Zustand](https://docs.pmnd.rs/zustand/getting-started/introduction) (Auth Store) & [TanStack React Query](https://tanstack.com/query/latest) (Server State)
- **Routing**: React Router v6
- **Styling**: Vanilla CSS + Ant Design Tokens

---

## 🏗 Project Structure

```bash
.
├── PropertyManagementSystembackend/  # NestJS Server
│   ├── src/
│   │   ├── auth/              # JWT, Guard & Refresh logic
│   │   ├── common/            # DatabaseService, Global Exception Filters
│   │   ├── dashboard/         # Shared statistics logic
│   │   ├── properties/        # Property CRUD & Filtering
│   │   └── visit-requests/    # Visit scheduling lifecycle
│   └── report.sql             # Complex reporting queries
└── frontend part/             # Vite + React Client
    ├── src/
    │   ├── api/               # Axios instances & endpoint definitions
    │   ├── components/        # Reusable UI components
    │   ├── pages/             # Authenticated & Admin views
    │   └── stores/            # Zustand auth state
```

---

## ⚙️ Setup & Installation

### Prerequisites
- Node.js (v18+)
- MySQL (v8.0+)
- npm or yarn

### 1. Database Setup
Create a MySQL database named `property_management_system` and configure your credentials in the backend `.env`.

### 2. Backend Installation
```bash
cd PropertyManagementSystembackend
npm install
npm run start:dev
```
*The server will run on `http://localhost:3000` (by default).*

### 3. Frontend Installation
```bash
cd "frontend part"
npm install
npm run dev
```
*The client will run on `http://localhost:5173`.*

---

## 🔐 Environment Variables

### Backend (`.env`)
```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASS=yourpassword
DB_NAME=property_management_system

# Auth
JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret
```

### Frontend (`.env`)
```env
VITE_API_BASE_URL=http://localhost:3000/v1
```

---

## 📜 Standards & Architecture

- **Raw SQL Philosophy**: To ensure maximum performance and total control over execution plans, this project avoids heavy ORMs. All queries are handled via a centralized `DatabaseService` using parameterized SQL.
- **Type Safety**: The project enforces **TypeScript Strict Mode**. All `any` types have been removed in favor of strict interfaces for DTOs, Query Results, and UI Props.
- **RESTful API**: Follows standard REST conventions with semantic status codes and a global response wrapper.

---

## 🤝 Contribution
1. Branch from `main`.
2. Ensure all changes are strictly typed.
3. Run `npm run lint` and `npm run build` before submitting PRs.
