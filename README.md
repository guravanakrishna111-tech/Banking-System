# Online Banking Management System (OBMS)

A complete, modern, responsive, and secure Online Banking Management System with separate **Customer** and **Administrator** portals. Built with a Python **Django REST Framework (DRF)** backend and a **React.js + Tailwind CSS** frontend.

> **DISCLAIMER:** This application is an educational banking simulation. All transactions, accounts, and currency are simulated for academic and training purposes. It is not connected to real banking or payment networks.

---

## 🌟 Key Features

### 👤 Customer Banking Portal
- **Authentication & Security:** Register new accounts, login with email or username, secure password hashing (PBKDF2), profile management, and simulated password recovery.
- **Multi-Account Support:** Manage multiple bank accounts (Savings & Current accounts) with automatically generated 12-digit account numbers and bank IFSC codes.
- **Atomic Money Transfers:**
  - Real-time recipient verification modal displaying account holder name before confirmation.
  - Strict balance and active account status validation.
  - Row-locked ACID database transactions (`select_for_update()`) preventing race conditions, negative balances, and double-spending.
  - Generates synchronized debit and credit records.
- **Simulated Deposits & Withdrawals:** Instant deposit and cash withdrawal simulators with balance updates.
- **Transaction History:** Searchable and filterable by date, type, and transaction ID.
- **Official Electronic Receipts:** Instant client-side and backend PDF receipt generation (ReportLab & jsPDF) with verification disclaimers.
- **Beneficiary Management:** Save frequent payees with 1-click money transfer shortcuts.
- **Notification Drawer:** Real-time credit/debit alerts, account updates, and bank-wide announcements.

### 🛡️ Administrator Operations Console
- **Dedicated Admin Login:** Role-Based Access Control (RBAC) preventing unauthorized access.
- **Executive Analytics Dashboard:**
  - Real-time KPIs: Total users, total accounts, active vs. frozen accounts, total transaction volume, total deposits, and total withdrawals.
  - Interactive Chart.js visualizations: 7-day transfer/deposit trend lines, deposit vs. withdrawal comparison bars, and account portfolio distribution doughnut chart.
  - Most active accounts table ranked by transaction events.
- **Customer Management:** Search and filter registered users, inspect linked accounts and balances, and toggle user activation status.
- **Bank Account Management:** View all accounts across the bank, search by account number or owner, and freeze/unfreeze accounts.
- **Transaction Ledger Audit:** Monitor all transactions across the entire banking system with advanced date and status filters.
- **Security Audit Logs:** Immutable audit log tracking all administrative actions, targets, operator IDs, IP addresses, and timestamps.
- **System Announcements:** Broadcast messages and security advisories to all customer dashboards.
- **Compliance CSV Exports:** One-click downloads for Users Registry, Accounts Portfolio, and Transactions Ledger CSVs.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite, Tailwind CSS, Lucide React Icons, Chart.js, react-chartjs-2, jsPDF, jspdf-autotable, Axios |
| **Backend** | Python 3.13, Django 6.1, Django REST Framework, django-cors-headers, PyMySQL, ReportLab |
| **Database** | SQLite (zero-config local runtime) & MySQL (production-ready with PyMySQL and `database_schema.sql` export) |
| **Security** | Token Authentication, Session Authentication, PBKDF2 Password Hashing, Atomic Row Locking, Server-side Validation |

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Python 3.10+**
- **Node.js 18+ & npm**
- *(Optional)* MySQL Server 8.0+ or XAMPP / MariaDB

---

### 2. Backend Setup

Open a terminal in the project root directory:

```bash
# 1. Activate the Python virtual environment
# Windows PowerShell:
.\venv\Scripts\Activate.ps1
# Windows Command Prompt:
.\venv\Scripts\activate.bat
# Linux / macOS:
source venv/bin/activate

# 2. Navigate to backend directory
cd backend

# 3. Apply database migrations
python manage.py migrate

# 4. Populate sample accounts, users, and transactions
python seed_data.py

# 5. Start the Django API server
python manage.py runserver 127.0.0.1:8000
```
Backend API server will run at: **`http://127.0.0.1:8000/`**

---

### 3. Frontend Setup

Open a second terminal window in the project root directory:

```bash
# 1. Navigate to frontend directory
cd frontend

# 2. Install dependencies (if not already installed)
npm install

# 3. Start Vite development server
npm run dev
```
Frontend Web Portal will run at: **`http://localhost:5173/`**

---

### 4. Running with MySQL Database (Optional)

By default, the application runs on SQLite with zero setup. To run against a MySQL database:

1. Create a MySQL database:
   ```sql
   CREATE DATABASE online_banking_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
2. *(Alternative)* Import the included `database_schema.sql` directly into phpMyAdmin or MySQL Workbench.
3. In your environment or PowerShell before starting the backend, set:
   ```powershell
   $env:USE_MYSQL="True"
   $env:DB_NAME="online_banking_db"
   $env:DB_USER="root"
   $env:DB_PASSWORD="your_password"
   $env:DB_HOST="127.0.0.1"
   $env:DB_PORT="3306"
   python manage.py migrate
   python seed_data.py
   python manage.py runserver
   ```

---

## 🔑 Default Demo Credentials

Pre-seeded accounts are provided for instant evaluation:

### Administrator Portal
| Role | Username | Password | Email |
|---|---|---|---|
| **Bank Administrator** | `admin` | `admin123` | `admin@onlinebank.com` |

### Customer Portal
| Customer Name | Username | Password | Account Number | Initial Balance |
|---|---|---|---|---|
| **John Doe** | `john_doe` | `password123` | `100188234912` (Savings)<br/>`100199341256` (Current) | $14,500.00<br/>$6,200.00 |
| **Alice Smith** | `alice_smith` | `password123` | `100177452390` (Savings) | $9,850.00 |
| **Robert Brown** | `robert_brown` | `password123` | `100166348911` (Savings) | $4,300.00 |

> *Tip: The login screens include convenient **1-Click Demo Buttons** to automatically fill credentials.*

---

## 📡 REST API Endpoints Overview

### Customer & Auth Endpoints
- `POST /api/accounts/auth/register/` - Register new customer profile & open initial bank account.
- `POST /api/accounts/auth/login/` - Customer authentication (returns token & profile).
- `POST /api/accounts/auth/admin-login/` - Administrator authentication with RBAC check.
- `POST /api/accounts/auth/logout/` - Invalidate session / token.
- `GET /api/accounts/auth/profile/` - Get customer profile & account summaries.
- `PATCH /api/accounts/auth/profile/` - Update personal contact details.
- `POST /api/accounts/auth/change-password/` - Update account password.
- `POST /api/accounts/auth/forgot-password/` - Trigger password reset simulation.
- `GET /api/accounts/verify/?account_number=...` - Verify recipient account exists & retrieve holder name.
- `GET/POST /api/accounts/my-accounts/` - List user bank accounts or open a new account.
- `GET/POST/DELETE /api/accounts/beneficiaries/` - Manage saved transfer recipients.
- `GET /api/accounts/notifications/` - List personal notifications & announcements.
- `POST /api/accounts/notifications/mark-all-read/` - Mark all notifications as read.

### Transactions Endpoints
- `GET /api/transactions/history/` - List user transactions with filters.
- `POST /api/transactions/transfer/` - Atomic money transfer with row-locking.
- `POST /api/transactions/deposit/` - Simulated deposit funds.
- `POST /api/transactions/withdraw/` - Simulated withdrawal funds.
- `GET /api/transactions/receipt/<txn_id>/` - Download official PDF transaction receipt.

### Admin Operations Endpoints
- `GET /api/analytics/dashboard-stats/` - Aggregated KPIs, daily charts, and liquidity metrics.
- `GET /api/analytics/export-csv/?type=transactions|accounts|users` - Export CSV datasets.
- `GET /api/accounts/admin/users/` - View all customers with linked account details.
- `POST /api/accounts/admin/users/<id>/toggle-status/` - Activate or deactivate customer profile.
- `GET /api/accounts/admin/accounts/` - View all bank accounts in system.
- `POST /api/accounts/admin/accounts/<id>/toggle-status/` - Freeze or unfreeze bank account.
- `GET /api/transactions/admin/all/` - System-wide transaction audit ledger.
- `GET /api/accounts/admin/audit-logs/` - View administrative audit log entries.
- `POST /api/accounts/admin/broadcast/` - Publish system-wide announcements.

---

## 🛡️ ACID Concurrency & Security Architecture

Money transfer operations implement strict database transactions:
```python
with transaction.atomic():
    sender = BankAccount.objects.select_for_update().get(id=sender_id, user=user)
    receiver = BankAccount.objects.select_for_update().get(account_number=receiver_number)
    # 1. Verify accounts active
    # 2. Verify sender.balance >= amount
    # 3. Atomic deduction and addition
    sender.balance -= amount
    receiver.balance += amount
    sender.save()
    receiver.save()
    # 4. Generate transaction record & notifications
```
This guarantees zero race conditions, prevents overdrafts, ensures balance consistency, and records atomic debit/credit history.
