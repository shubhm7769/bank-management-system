# 🏦 Bank Management System

A complete, production-ready **Bank Management System** web application built with HTML, CSS, JavaScript, Node.js, Express.js, and MySQL.

![Banking App](https://img.shields.io/badge/Banking-Application-blue?style=for-the-badge)
![Node.js](https://img.shields.io/badge/Node.js-Express-green?style=for-the-badge)
![MySQL](https://img.shields.io/badge/MySQL-Database-orange?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)

---

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Setup Instructions](#setup-instructions)
- [Running the Application](#running-the-application)
- [Default Credentials](#default-credentials)
- [API Endpoints](#api-endpoints)
- [Screenshots](#screenshots)

---

## ✨ Features

### 👤 User Module
- ✅ User registration with name, email, and password
- ✅ Secure login and logout with JWT authentication
- ✅ Dashboard with account summary and analytics
- ✅ View account balance
- ✅ Deposit money
- ✅ Withdraw money (with balance check)
- ✅ Transfer money to another account
- ✅ Detailed transaction history with filters & pagination
- ✅ Change password

### 🔑 Admin Module
- ✅ Admin login (separate portal)
- ✅ Admin dashboard with analytics
- ✅ View all users with search
- ✅ View all transactions
- ✅ Block / Unblock user accounts

### 🎨 UI / Design
- ✅ Modern, premium banking-style UI
- ✅ Fully responsive (mobile, tablet, desktop)
- ✅ Animated login & register pages
- ✅ Dashboard cards for balance, deposits, withdrawals
- ✅ Sidebar navigation
- ✅ CSS Flexbox / Grid layouts
- ✅ Smooth hover effects and micro-animations
- ✅ Toast notification system
- ✅ Form validation with user-friendly messages

### 🔒 Security
- ✅ Password encryption with bcrypt (12 salt rounds)
- ✅ JWT-based authentication
- ✅ Role-based access control (user/admin)
- ✅ Protected API routes
- ✅ Input validation and sanitization
- ✅ SQL injection prevention (parameterized queries)
- ✅ Database transactions for financial operations
- ✅ Row-level locking (FOR UPDATE) for concurrent safety

---

## 🛠️ Tech Stack

| Layer      | Technology              |
|------------|------------------------|
| Frontend   | HTML5, CSS3, JavaScript |
| Backend    | Node.js, Express.js    |
| Database   | MySQL                  |
| Auth       | JWT (JSON Web Tokens)  |
| Security   | bcryptjs, express-validator |
| Typography | Inter, Outfit (Google Fonts) |

---

## 📁 Project Structure

```
Bank Management System/
├── backend/
│   ├── config/
│   │   └── db.js              # MySQL connection pool
│   ├── middleware/
│   │   └── auth.js            # JWT auth & role middleware
│   ├── routes/
│   │   ├── auth.js            # Login & Register APIs
│   │   ├── user.js            # User banking operations
│   │   └── admin.js           # Admin management APIs
│   ├── .env                   # Environment variables
│   ├── package.json           # Node.js dependencies
│   ├── seed.js                # Database seeder (admin account)
│   └── server.js              # Express server entry point
├── frontend/
│   ├── css/
│   │   └── style.css          # Complete CSS design system
│   ├── js/
│   │   └── app.js             # Frontend JavaScript logic
│   ├── index.html             # User login page
│   ├── register.html          # User registration page
│   ├── dashboard.html         # User dashboard
│   ├── admin-login.html       # Admin login page
│   └── admin-dashboard.html   # Admin dashboard
├── database/
│   └── schema.sql             # MySQL database schema
└── README.md                  # This file
```

---

## 📋 Prerequisites

Before running this project, make sure you have:

1. **Node.js** (v16 or higher) - [Download](https://nodejs.org/)
2. **MySQL** (v8.0 or higher) - [Download](https://dev.mysql.com/downloads/)
3. **Git** (optional) - [Download](https://git-scm.com/)

---

## 🚀 Setup Instructions

### Step 1: Set up the Database

1. Open MySQL command line or MySQL Workbench
2. Run the SQL schema file:

```sql
SOURCE C:/Users/shubham/Desktop/Bank Management System/database/schema.sql;
```

Or copy-paste the contents of `database/schema.sql` into your MySQL client.

### Step 2: Configure Environment Variables

1. Open `backend/.env`
2. Update the database credentials:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=bank_management
JWT_SECRET=your_secret_key_here
```

### Step 3: Install Backend Dependencies

```bash
cd "Bank Management System/backend"
npm install
```

### Step 4: Seed Admin Account

```bash
npm run seed
```

This creates the default admin account:
- 📧 Email: `admin@bankms.com`
- 🔑 Password: `Admin@123`

### Step 5: Start the Server

```bash
npm start
```

Or for development with auto-reload:

```bash
npm run dev
```

### Step 6: Open in Browser

Navigate to: **http://localhost:5000**

---

## 🔐 Default Credentials

### Admin Account
| Field    | Value              |
|----------|--------------------|
| Email    | admin@bankms.com   |
| Password | Admin@123          |

### Test User
Register a new user through the registration page to test user features.

---

## 📡 API Endpoints

### Authentication
| Method | Endpoint            | Description     |
|--------|---------------------|-----------------|
| POST   | `/api/auth/register`| Register user   |
| POST   | `/api/auth/login`   | Login           |

### User (Protected - JWT Required)
| Method | Endpoint                    | Description          |
|--------|-----------------------------|----------------------|
| GET    | `/api/user/dashboard`       | Dashboard data       |
| GET    | `/api/user/balance`         | Account balance      |
| POST   | `/api/user/deposit`         | Deposit money        |
| POST   | `/api/user/withdraw`        | Withdraw money       |
| POST   | `/api/user/transfer`        | Transfer money       |
| GET    | `/api/user/transactions`    | Transaction history  |
| PUT    | `/api/user/change-password` | Change password      |
| GET    | `/api/user/profile`         | User profile         |

### Admin (Protected - Admin JWT Required)
| Method | Endpoint                         | Description        |
|--------|----------------------------------|--------------------|
| GET    | `/api/admin/dashboard`           | Admin analytics    |
| GET    | `/api/admin/users`               | All users          |
| GET    | `/api/admin/transactions`        | All transactions   |
| PUT    | `/api/admin/users/:id/block`     | Block user         |
| PUT    | `/api/admin/users/:id/unblock`   | Unblock user       |

---

## 🖼️ Screenshots

### Login Page
- Modern animated login page with gradient background
- Email and password fields with inline SVG icons
- Password toggle visibility
- Links to register and admin login

### User Dashboard
- Balance card with gradient background
- Stats cards: Total Deposits, Withdrawals, Transfers
- Quick action cards
- Recent transactions table

### Deposit / Withdraw / Transfer
- Clean forms with current balance display
- Input validation with toast notifications
- Real-time balance updates

### Admin Dashboard
- Analytics: Total Users, Active, Blocked, Total Balance
- Recent users and transactions tables
- User management with search and block/unblock

---

## 📝 Notes

- All financial operations use MySQL transactions for data consistency
- Row-level locking prevents race conditions during concurrent transfers
- Passwords are hashed with bcrypt (12 salt rounds)
- JWT tokens expire after 24 hours
- The application is suitable for BCA/MCA/Final Year projects

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

## 👨‍💻 Author

**Bank Management System** - A complete full-stack banking application  
Built with ❤️ using Node.js, Express.js, and MySQL
