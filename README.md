# VitalSync HMS - Clinical Precision Hospital Management System

VitalSync HMS is an enterprise-grade, internal hospital and clinic management web application engineered with a clean layered architecture, robust role-based security, and a cohesive **Clinical Precision** design language.

---

## 🌟 System Overview

VitalSync HMS streamlines multi-role clinical operations with speed, reliability, and precision. It provides distinct operational workflows for three primary hospital roles:

1. **ADMIN**: Full institutional authority, physician and staff management, clinical analytics & financial KPIs, hospital institutional profile configuration, and audit access.
2. **DOCTOR**: Attending physician workspace, patient file lookups, appointment schedule management, multi-medicine clinical prescription issuance, and personal profile management.
3. **RECEPTIONIST**: Front-desk operations, new patient registration and intake, appointment scheduling & slot booking with conflict detection, and invoice generation with Indian Rupee (₹ / INR) tax invoicing.

---

## 🏗️ Architecture & Technology Stack

### Frontend Architecture
- **Framework**: React 18 + Vite
- **Routing**: React Router 6 with nested layouts and role-based route guards (`ProtectedRoute`)
- **Styling**: Vanilla Tailwind CSS styled strictly following the **Clinical Precision Design System** (Inter font, 4px/8px rhythm, HSL color tokens, dark mode and high-contrast support, responsive layout without horizontal overflow)
- **Icons**: Google Material Symbols Outlined + Lucide React
- **API Client**: Axios instance configured with auto token injection, automatic 401 redirection, and unified error handling
- **Notifications**: Toast notification context with 4px left-border status accents (Success, Error, Warning, Info)

### Backend Architecture
- **Framework**: Spring Boot 3.2.4 (Java 17)
- **Security**: Spring Security 6 + JJWT (0.12.5) stateless token authentication + BCrypt password hashing + Method-level role authorization (`@PreAuthorize`)
- **Data Access**: Spring Data JPA / Hibernate
- **Database**:
  - **Development Mode**: Embedded H2 in-memory database with automatic schema creation and realistic seed data
  - **Production Mode**: MySQL database configured via production profiles and environment variables
- **Exception Handling**: Unified `@RestControllerAdvice` emitting standardized JSON error payloads

---

## 🔐 Role-Based Access Control (RBAC) Matrix

| Feature / Endpoint | ADMIN | DOCTOR | RECEPTIONIST |
| :--- | :---: | :---: | :---: |
| **Login / Session Validation** (`/api/auth/**`) | ✅ | ✅ | ✅ |
| **Dashboard Metrics** (`/api/dashboard/stats`) | ✅ (with Revenue) | ✅ | ✅ |
| **Patient Directory - View** (`GET /api/patients/**`) | ✅ | ✅ | ✅ |
| **Patient Registration & Edit** (`POST/PUT /api/patients`) | ✅ | ❌ | ✅ |
| **Doctor Directory - View** (`GET /api/doctors/**`) | ✅ | ✅ | ✅ |
| **Doctor Management (Add/Edit/Delete)** (`POST/PUT/DELETE /api/doctors/**`) | ✅ | ❌ | ❌ |
| **Appointments - Book / Reschedule / Cancel** (`/api/appointments/**`) | ✅ | ✅ | ✅ |
| **Prescriptions - Create & Edit** (`POST/PUT /api/prescriptions/**`) | ✅ | ✅ | ❌ |
| **Prescriptions - View & Print** (`GET /api/prescriptions/**`) | ✅ | ✅ | ✅ |
| **Billing & Invoices - Create & Mark Paid** (`/api/bills/**`) | ✅ | ❌ | ✅ |
| **Analytics Reports & CSV Export** (`/api/reports/**`) | ✅ | ❌ | ❌ |
| **Hospital Profile Settings** (`/api/settings/hospital`) | ✅ | ❌ | ❌ |
| **User Profile & Password Change** (`/api/settings/**`) | ✅ | ✅ | ✅ |

---

## 🔑 Default Credentials (Development Mode)

All accounts share the default development password: **`password123`**

| Role | Username | Password | Full Name | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **ADMIN** | `admin` | `password123` | Dr. Sarah Mitchell | Full Administrative Access |
| **DOCTOR** | `dr.chen` | `password123` | Dr. Robert Chen | Attending Cardiologist |
| **DOCTOR** | `dr.stanton` | `password123` | Dr. Emily Stanton | Attending Pediatrician |
| **RECEPTIONIST** | `receptionist` | `password123` | Alex Vance | Front Desk Reception Desk |

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js**: v18.0.0 or higher (`npm` package manager)
- **Java**: OpenJDK 17 or higher
- **Maven**: 3.8.0 or higher

---

### 1. Running Backend (Spring Boot)

#### Development Mode (Default with H2 Database)
```bash
cd backend
mvn spring-boot:run
```
- The backend starts on `http://localhost:8080`
- Embedded H2 Console is accessible at: `http://localhost:8080/h2-console`
  - **JDBC URL**: `jdbc:h2:mem:vitalsyncdb`
  - **User**: `sa`
  - **Password**: *(leave blank)*

#### Running Backend Tests
```bash
cd backend
mvn test
```

#### Production Mode (with MySQL)
Set the following environment variables and launch with the `prod` profile:
```bash
export SPRING_PROFILES_ACTIVE=prod
export DB_URL="jdbc:mysql://localhost:3306/vitalsync_db?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC"
export DB_USERNAME="your_mysql_username"
export DB_PASSWORD="your_mysql_password"
export JWT_SECRET="your_production_secure_jwt_key_at_least_256_bits_long"
export CORS_ALLOWED_ORIGINS="https://yourhospitaldomain.com"

mvn spring-boot:run -Dspring-boot.run.profiles=prod
```

---

### 2. Running Frontend (Vite + React)

```bash
# In the repository root:
npm install
npm run dev
```
- The frontend will launch at `http://localhost:5173`
- API calls to `/api` are automatically proxied to the backend at `http://localhost:8080`.

#### Building Frontend for Production
```bash
npm run build
```
Build assets will be generated in `dist/`.

---

## 🩺 Business Rules & Precision Safeguards

1. **Authoritative Code Generation**:
   - Patient ID: `PT-1001`, `PT-1002`, ...
   - Doctor ID: `DOC-2001`, `DOC-2002`, ...
   - Appointment ID: `APT-2045`, `APT-2046`, ...
   - Prescription ID: `RX-4001`, `RX-4002`, ...
   - Invoice ID: `INV-2026-0001`, `INV-2026-0002`, ...
2. **Double-Booking & Conflict Detection**:
   - The backend validates doctor availability and prevents overlapping appointments for the same physician at identical date and time slots.
3. **Server-Side Financial Calculations**:
   - Invoices recalculate `subtotal = consultationFee + medicineCharges + otherCharges`, `taxableAmount = max(0, subtotal - discount)`, and `total = taxableAmount + tax` authoritatively on the backend. Frontend values are never blindly trusted.
   - All monetary values are formatted using the Indian Rupee standard (`₹` / INR).
4. **Relational Integrity Safeguards**:
   - Deleting a patient or doctor with active appointments or prescriptions automatically transitions their status to `Inactive` or `Unavailable` to prevent cascading database corruption.
5. **Printable Documents**:
   - Prescriptions and Invoices include custom `@media print` stylesheets for professional hard-copy dispensing.

---

## 📡 REST API Reference

| Endpoint | Method | Role Allowed | Description |
| :--- | :--- | :--- | :--- |
| `/api/auth/login` | `POST` | Public | Authenticate username/password & receive JWT |
| `/api/auth/logout` | `POST` | Authenticated | Terminate session |
| `/api/auth/me` | `GET` | Authenticated | Get current authenticated user profile |
| `/api/dashboard/stats` | `GET` | All Roles | Retrieve real-time operational KPIs |
| `/api/patients` | `GET` | All Roles | List & filter patients (supports pagination) |
| `/api/patients/{id}` | `GET` | All Roles | Get patient medical record |
| `/api/patients` | `POST` | ADMIN, RECEPTIONIST | Register new patient |
| `/api/patients/{id}` | `PUT` | ADMIN, RECEPTIONIST | Update patient file |
| `/api/patients/{id}` | `DELETE` | ADMIN | Safe delete or deactivate patient |
| `/api/doctors` | `GET` | All Roles | List doctors & specialties |
| `/api/doctors/{id}` | `GET` | All Roles | Get doctor profile |
| `/api/doctors` | `POST` | ADMIN | Add new attending physician |
| `/api/doctors/{id}` | `PUT` | ADMIN | Update doctor schedule & specialty |
| `/api/doctors/{id}` | `DELETE` | ADMIN | Safe delete or mark unavailable |
| `/api/appointments` | `GET` | All Roles | Filter consultations by doctor/date/status |
| `/api/appointments` | `POST` | All Roles | Book appointment with conflict check |
| `/api/appointments/{id}` | `PUT` | All Roles | Update appointment |
| `/api/appointments/{id}/status` | `PATCH` | All Roles | Fast update consultation status |
| `/api/prescriptions` | `GET` | All Roles | List prescriptions |
| `/api/prescriptions` | `POST` | ADMIN, DOCTOR | Issue multi-item medication prescription |
| `/api/prescriptions/{id}` | `PUT` | ADMIN, DOCTOR | Update prescription |
| `/api/bills` | `GET` | ADMIN, RECEPTIONIST | List billing invoices |
| `/api/bills` | `POST` | ADMIN, RECEPTIONIST | Generate bill with backend calculation |
| `/api/bills/{id}/status` | `PATCH` | ADMIN, RECEPTIONIST | Mark invoice as Paid / Partial |
| `/api/reports/summary` | `GET` | ADMIN | Aggregate clinical and financial analytics |
| `/api/reports/export` | `GET` | ADMIN | Export analytics data as CSV |
| `/api/settings/hospital` | `GET, PUT` | ADMIN | Manage hospital institution profile |
| `/api/settings/user` | `GET, PUT` | Authenticated | Manage user profile |
| `/api/settings/change-password` | `POST` | Authenticated | Change user password with current check |

---

## 📄 License & Compliance
VitalSync HMS is developed for internal clinical healthcare workflows adhering to data protection and clinical security best practices.
