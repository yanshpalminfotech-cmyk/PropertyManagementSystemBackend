# Property Management System - Frontend

A high-performance, interactive dashboard built with **Vite**, **React**, and **Ant Design**.

## Key Technologies
- **Vite**: Ultra-fast build tool and dev server.
- **Ant Design (antd)**: Enterprise-class UI design system.
- **TanStack React Query**: Powerful data fetching, caching, and synchronization for server state.
- **Zustand**: Minimalistic but robust state management for client-side Auth state.
- **Axios**: Configured with interceptors for automatic JWT attachment and token refresh rotation.

---

## Component Architecture
- **AppLayout**: The main shell featuring a responsive sidebar, header, and dynamic navigation based on user roles.
- **Dashboard**: A data-driven centerpiece showcasing system stats via responsive cards and interactive charts.
- **Property Module**:
  - `PropertyList`: Advanced table views with role-based columns and multi-parameter filtering.
  - `PropertyDetail`: Comprehensive views for property information and visit scheduling.
- **Admin Module**:
  - `BrokerManagement`: Tools for managing brokers, resetting passwords, and toggling status.
  - `CustomerManagement`: Oversight of customer accounts and activity.

---

## Getting Started

### 1. Installation
```bash
npm install
```

### 2. Configuration
Create a `.env` file in the root:
```env
VITE_API_BASE_URL=http://localhost:3000/v1
```

### 3. Development
```bash
npm run dev
```

### 4. Build for Production
```bash
npm run build
```

---

## Best Practices
- **Strict Typing**: The frontend uses `Breakpoint[]` for Ant Design responsive features and strictly typed DTOs for all API calls.
- **API Interceptors**: Integrated logic to handle `401 Unauthorized` errors by automatically attempting a token refresh without interrupting the user's flow.
- **Responsive Design**: All tables and cards are optimized for mobile, tablet, and desktop viewports.
