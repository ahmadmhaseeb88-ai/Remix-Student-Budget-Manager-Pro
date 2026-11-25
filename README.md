# Student Budget Manager Pro 🎓💼

> A smart, production-oriented personal finance and budgeting platform engineered specifically for university and college students in Pakistan and worldwide.

---

## 🌟 Key Features

1. **Smart Student Money Coach (AI)**:
   - Grounded in authentic database records via server-side Gemini 3.8 Flash.
   - Evaluates daily cash burn rate, analyzes category spikes, and predicts end-of-month cash surplus or deficit.
   - Provides student-specific frugality tips (hostel mess vs food delivery, student software discounts, transport concession cards, book banks).
   - Interactive Q&A consultation chat.

2. **CamScanner-Style Receipt & Document OCR**:
   - Live webcam/phone camera capture or image file upload.
   - Contrast enhancement filters: *Original*, *CamScanner Magic Color*, and *High-Contrast B&W Document*.
   - 90° rotation and multi-page document queue.
   - Multimodal Gemini OCR extracts Merchant, Date, Total Amount, Category, and itemized items.
   - 1-click conversion from scanned receipt into a confirmed ledger transaction.
   - Multi-page PDF receipt booklet export via jsPDF.

3. **Voice-Based Transaction Entry**:
   - Web Speech Recognition API with natural voice input (e.g., *"I spent 350 rupees on cafeteria lunch"*).
   - AI intent parser extracts amounts, categories, and payment methods into a draft.
   - Explicit confirmation before recording to prevent accidental ledger writes.

4. **Semester Survival Planner**:
   - Enter semester start/end dates, tuition & exam fees, hostel rent, books, and monthly pocket money.
   - Calculates **Safe Weekly Spending Allowance** and **Daily Burn Rate**.
   - Interactive Stress Test Sandbox: test scenarios like allowance drops (-20%), emergency laptop repairs (+Rs 15,000), or freelance earnings.
   - Downloadable formal **Semester Survival Plan (PDF)**.

5. **Savings Goal Studio**:
   - Set targets for FYP laptops, cloud certification exam vouchers, hostel security deposits, or emergency buffers.
   - Dynamic pace recommendations: *"Save Rs 1,450/week to reach your target by finals"*.
   - Deposit funds with optional cash deduction and instant confetti celebration upon milestone achievement.

6. **Smart Budget Studio**:
   - Monthly and category spending ceilings (Food, Transport, Books, Hostel & Rent, Internet & Mobile).
   - Configurable alert thresholds (e.g. 80%) with amber warnings and red overspending indicators.

7. **Financial Ledger & Reports**:
   - Search, filter by category/payment method/date, and sort transactions.
   - CSV bulk import and instant CSV export.
   - Downloadable monthly PDF performance statements.

8. **Pakistani & International Payment Methods**:
   - Native support for **PKR (Rs)**, **USD ($)**, **EUR (€)**, **GBP (£)**, **AED**, and **SAR**.
   - Preset payment tags for **EasyPaisa**, **JazzCash**, **Bank Transfer (Nayapay, SadaPay, HBL)**, and **Cash in Hand**.

9. **Subscription & Monetization Tier**:
   - Free Starter, Student Premium (Rs 199/mo), and Student Pro (Rs 299/mo).
   - Simulated Pakistani payment gateway adapter (EasyPaisa, JazzCash, Debit Card) with instant server entitlement upgrade.

10. **Secure Administration Console**:
    - Restricted to administrator role (`admin@budgetpro.edu`).
    - Real-time user roster, subscription telemetry, and system health status.

---

## 🛠️ Technology Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide Icons, Canvas-Confetti, jsPDF.
- **Backend**: Node.js, Express.js REST API with input validation and centralized error handling.
- **AI Engine**: `@google/genai` TypeScript SDK (model: `gemini-3.8-flash`) executed securely on the server side.
- **Security**: `bcryptjs` password hashing, JSON Web Tokens (JWT) with 7-day expiration, and strict user isolation on every query.
- **Database**:
  - Embedded zero-config persistent relational store in `data/budget_pro_db.json`.
  - Full MySQL 8.0+ / MariaDB schema (`db/schema.sql`) and seed data (`db/seed.sql`) ready for XAMPP / phpMyAdmin on Windows.

---

## 🔑 Pre-Configured Test Accounts

| Role | Email | Password | Preloaded Data |
| :--- | :--- | :--- | :--- |
| **Demo Student** | `student@fast.edu.pk` | `student123` | FAST CS Junior student, preloaded with realistic PKR income, cafeteria expenses, semester plan, and savings goals. |
| **Administrator** | `admin@budgetpro.edu` | `admin123` | Full admin privileges to inspect system health, user counts, and subscription telemetry. |

*You can also register your own student account in seconds via the 4-step Onboarding Wizard!*

---

## 💻 Beginner Windows Setup Guide (XAMPP / Node.js)

### 1. Prerequisites
- **Node.js (v18 or v20 LTS)**: Download from [nodejs.org](https://nodejs.org).
- **XAMPP (Optional for local MySQL)**: Download from [apachefriends.org](https://www.apachefriends.org).

### 2. Project Setup
1. Clone or extract the project folder:
   ```cmd
   cd student-budget-manager-pro
   ```
2. Install dependencies:
   ```cmd
   npm install
   ```
3. Copy environment variables:
   ```cmd
   copy .env.example .env
   ```
   *(Note: The embedded database works out of the box without needing external database setup. If you have a Gemini API key, add `GEMINI_API_KEY=your_key` in `.env`)*.

### 3. (Optional) Setup MySQL in XAMPP / phpMyAdmin
1. Open the **XAMPP Control Panel** and click **Start** next to **MySQL** and **Apache**.
2. Open your browser and navigate to `http://localhost/phpmyadmin`.
3. Click on the **Import** tab.
4. Select `db/schema.sql` from the project directory and click **Go** to create the `student_budget_pro` database and tables.
5. Next, import `db/seed.sql` to populate sample student data.

### 4. Running the Application
Run the unified full-stack development server:
```cmd
npm run dev
```
Open your browser at **`http://localhost:3000`**.

---

## 📡 Backend API Reference

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Student registration & 4-step profile setup | No |
| `POST` | `/api/auth/login` | Student / Admin sign in (returns JWT) | No |
| `GET` | `/api/auth/me` | Fetch active user profile | Yes |
| `PUT` | `/api/auth/profile` | Update academic info, budget & currency | Yes |
| `PUT` | `/api/auth/password` | Change user password | Yes |
| `GET` | `/api/dashboard/summary` | Real-time balance, budgets, daily spend | Yes |
| `GET` | `/api/transactions` | Filter, search, paginate ledger entries | Yes |
| `POST` | `/api/transactions` | Record new income, expense, or transfer | Yes |
| `POST` | `/api/transactions/import-csv` | Bulk import transactions from CSV | Yes |
| `GET` | `/api/transactions/export-csv` | Download authentic user ledger as CSV | Yes |
| `GET` | `/api/budgets` | Fetch spending ceilings & utilization % | Yes |
| `POST` | `/api/budgets` | Configure category or overall budget | Yes |
| `GET` | `/api/goals` | Fetch savings goals with pace calculator | Yes |
| `POST` | `/api/goals/:id/deposit` | Deposit savings with optional cash deduction | Yes |
| `GET` | `/api/bills` | Upcoming tuition, rent & utility deadlines | Yes |
| `POST` | `/api/bills/:id/pay` | Mark bill paid & optionally log expense | Yes |
| `GET` | `/api/semester-plans` | Semester survival plans & weekly allowances | Yes |
| `POST` | `/api/receipts/process` | CamScanner image upload & Gemini OCR | Yes |
| `GET` | `/api/ai/coach` | Gemini 3.8 Flash financial intelligence | Yes |
| `POST` | `/api/ai/voice-parse` | Parse natural language voice transcripts | Yes |
| `POST` | `/api/subscriptions/upgrade`| Simulated Pakistani payment gateway checkout | Yes |
| `GET` | `/api/admin/stats` | System telemetry & student roster | Yes (Admin) |

---

## 🔒 Security & Privacy Practices

- **Strict User Isolation**: Every database query enforces `user_id = req.user.id`. No student can inspect another student's ledger.
- **Zero API Key Leaks**: The Gemini API key is strictly isolated on the Node.js server and never transmitted to the browser bundle.
- **Password Protection**: Passwords hashed using standard `bcrypt` with salt rounds.
- **Audit Trails**: Destructive operations require confirmation dialogs and authorization checks.
