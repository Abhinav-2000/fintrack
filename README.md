# 💰 FinTrack — Full Stack Finance Manager

A production-ready personal finance tracker built with React, Node.js, Express, and MongoDB.

---

## 🚀 Features

### Core
- ✅ JWT Authentication (Signup / Login / Logout)
- ✅ Income & Expense Transactions (Add, Edit, Delete)
- ✅ Custom & Default Categories (with icons & colors)
- ✅ Dashboard with live summaries
- ✅ Filters (type, category, date range, tags)
- ✅ Pagination

### Advanced
- 📊 Analytics: Monthly bar chart, category pie chart, net trend line
- 🎯 Budget Limits: Set per category per month, with exceeded alerts
- 🔁 Recurring Transactions (daily/weekly/monthly/yearly)
- 🏷️ Notes & Tags on transactions
- 🧠 Smart Insights: "You spent 30% more on Food this month"
- 📥 Export to CSV
- 💱 Multi-currency support (INR, USD, EUR, GBP, JPY)
- 🌑 Dark mode UI (default)

---

## 🛠️ Tech Stack

| Layer      | Tech                              |
|------------|-----------------------------------|
| Frontend   | React 18, Tailwind CSS, Chart.js  |
| Backend    | Node.js, Express.js               |
| Database   | MongoDB + Mongoose                |
| Auth       | JWT (7-day tokens)                |
| Charts     | react-chartjs-2                   |
| Toasts     | react-hot-toast                   |

---

## 📁 Project Structure

```
fintrack/
├── backend/
│   ├── models/         # Mongoose schemas (User, Transaction, Category, Budget)
│   ├── routes/         # Express routes (auth, transactions, categories, budgets, analytics)
│   ├── middleware/     # JWT auth middleware
│   ├── server.js       # Entry point
│   └── .env            # Environment variables
└── frontend/
    ├── public/
    └── src/
        ├── context/    # AuthContext (global state)
        ├── pages/      # Dashboard, Transactions, Analytics, Budgets, Categories, Profile
        ├── components/ # Layout, TransactionModal
        └── utils/      # api.js (axios), helpers.js (formatters)
```

---

## ⚙️ Setup & Installation

### Prerequisites
- Node.js v18+
- MongoDB (local or MongoDB Atlas)
- npm or yarn

### 1. Clone / Download the project

```bash
cd fintrack
```

### 2. Setup Backend

```bash
cd backend
npm install
```

Edit `.env`:
```env
MONGO_URI=mongodb://localhost:27017/fintrack
JWT_SECRET=your_super_secret_key_change_this
PORT=5000
CLIENT_URL=http://localhost:3000
```

Start backend:
```bash
npm run dev
```

### 3. Setup Frontend

```bash
cd ../frontend
npm install
npm start
```

### 4. Open in browser

```
http://localhost:3000
```

---

## 🗄️ Database Design

### User
```json
{ "name": "string", "email": "string", "password": "hashed", "currency": "INR" }
```

### Transaction
```json
{ "userId": "ref", "amount": 500, "type": "expense", "category": "Food", "date": "2024-01-15", "notes": "Lunch", "tags": ["work"], "isRecurring": false }
```

### Category
```json
{ "userId": "ref|null", "name": "Food & Dining", "icon": "🍔", "color": "#f97316", "type": "expense" }
```

### Budget
```json
{ "userId": "ref", "category": "Food & Dining", "amount": 5000, "month": 0, "year": 2024 }
```

---

## 🔌 API Reference

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register new user |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user |
| PUT | `/api/auth/profile` | Update profile |
| PUT | `/api/auth/change-password` | Change password |

### Transactions
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/transactions` | List with filters & pagination |
| POST | `/api/transactions` | Create transaction |
| PUT | `/api/transactions/:id` | Update transaction |
| DELETE | `/api/transactions/:id` | Delete transaction |
| GET | `/api/transactions/summary` | Get balance totals |
| GET | `/api/transactions/export/csv` | Download CSV |

### Categories, Budgets, Analytics
All protected by JWT. Full CRUD on categories/budgets. Analytics endpoints for monthly, category breakdown, and insights.

---

## 🚀 Deployment

### Backend → Railway / Render
1. Push to GitHub
2. Connect to Railway/Render
3. Set environment variables
4. Deploy

### Frontend → Vercel / Netlify
1. Update `proxy` in `frontend/package.json` → your backend URL
2. Deploy via Vercel CLI or GitHub integration

### Database → MongoDB Atlas
1. Create free cluster on mongodb.com/atlas
2. Replace `MONGO_URI` in `.env`

---

## 🔮 Future Features
- [ ] Push notifications (budget exceeded)
- [ ] PDF export
- [ ] Multi-account support
- [ ] Google OAuth login
- [ ] Mobile app (React Native)

---

Built with ❤️ for learning full-stack development.
