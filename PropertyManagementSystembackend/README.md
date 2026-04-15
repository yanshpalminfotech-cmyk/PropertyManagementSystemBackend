# Property Management System - Backend

The core API service for the Property Management System, built with **NestJS** and **MySQL**.

## Architectural Choice: Raw SQL
To maintain peak performance and fine-grained control over complex reporting queries (like site visit conversions and system-wide stats), this project intentionally avoids a heavy ORM. Instead, it uses a custom `DatabaseService` to manage connection pools and execute parameterized raw SQL queries.

### Key Benefits:
- **Zero Overhead**: No abstraction layers between the code and the database.
- **Explain Plans**: Complete visibility into SQL execution plans.
- **Complex Joins**: Simplified handling of multi-table joins for statistics and dashboards.

---

## Security Features
- **JWT Rotation**: Implements a secure Access/Refresh token pattern.
- **Brute-Force Lockout**: Automatically locks user accounts after 5 failed login attempts within a window.
- **Input Validation**: Global `ValidationPipe` with strict whitelisting to prevent payload injection.
- **Exception Filters**: Consistent global error handling for all API responses.

---

## Project Structure

- `src/auth`: Authentication controllers, JWT strategies, and guarding logic.
- `src/common`: Core utilities, including the `DatabaseService` and shared types.
- `src/dashboard`: Aggregation logic for system metrics.
- `src/properties`: Property CRUD operations and advanced search filters.
- `src/visit-requests`: The state machine for managing site visit lifecycles.
- `src/user`: User management and role-based access control.

---

## Getting Started

### 1. Installation
```bash
npm install
```

### 2. Configuration
Create a `.env` file in the root based on the following:
```env
# Database Configuration
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_USER=root
DATABASE_PASS=password
DATABASE_NAME=property_management_system

# JWT Configuration
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
```

### 3. Run the Server
```bash
# development mode
npm run start:dev

# production build
npm run build
npm run start:prod
```

## API Documentation
Once the server is running, you can access the interactive **Swagger** documentation at:
`http://localhost:3000/api` (or your configured port).
