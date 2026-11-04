# 🌾 KrishiLink Server

Backend API for **KrishiLink**, a MERN-based agricultural marketplace that connects farmers directly with customers, eliminating unnecessary middlemen.

## 🚀 Features

- RESTful API
- Product Management (CRUD)
- Category Management
- MongoDB Integration
- TypeScript
- Express.js
- Firebase Authentication (Coming Soon)
- Role-based Authorization (Coming Soon)

---

## 🛠️ Tech Stack

- Node.js
- Express.js
- TypeScript
- MongoDB
- Firebase Admin SDK (Upcoming)

---

## 📁 Project Structure

```text
src/
│
├── app/
│   ├── config/
│   ├── errors/
│   ├── middlewares/
│   ├── routes/
│   └── utils/
│
├── modules/
│   ├── category/
│   ├── product/
│   ├── user/
│   ├── order/
│   └── review/
│
├── app.ts
└── server.ts
```

---

## ⚙️ Environment Variables

Create a `.env` file and add:

```env
PORT=5000

DATABASE_URL=your_mongodb_connection_string
DATABASE_NAME=krishilink
```

---

## 📦 Installation

```bash
git clone https://github.com/your-username/krishilink-server.git

cd krishilink-server

npm install
```

---

## ▶️ Run Locally

```bash
npm run dev
```

---

## 🧑‍💻 API Endpoints

### Product

| Method | Endpoint | Description |
| ------- | -------- | ----------- |
| GET | /api/v1/products | Get all products |
| GET | /api/v1/products/:id | Get single product |
| POST | /api/v1/products | Create product |
| PATCH | /api/v1/products/:id | Update product |
| DELETE | /api/v1/products/:id | Delete product |

### Category

| Method | Endpoint | Description |
| ------- | -------- | ----------- |
| GET | /api/v1/categories | Get all categories |
| POST | /api/v1/categories | Create category |

### Dashboard

All dashboard endpoints require a Firebase ID token:

```http
Authorization: Bearer <firebase-id-token>
```

The caller is identified from the token. Role dashboards ignore any `email`
query parameter, so a user can only read their own dashboard data.

| Method | Endpoint | Role | Description |
| ------ | -------- | ---- | ----------- |
| GET | /api/v1/dashboard | Any authenticated | Role-aware overview payload |
| GET | /api/v1/dashboard/admin | admin | Revenue, orders, farmers, riders, applications, top products, recent orders |
| GET | /api/v1/dashboard/farmer | farmer | Sales, orders, products, inventory alerts, pending orders, top products |
| GET | /api/v1/dashboard/rider | rider | Active delivery, delivery queue, completed deliveries, earnings |
| GET | /api/v1/dashboard/user | authenticated user | Spending, order counts, current order, recent orders |

---

## 📌 Upcoming Features

- Firebase Authentication
- Role-based Authorization
- Order Management
- Review System
- Search & Filtering
- Pagination

---

## 👨‍💻 Author

Developed by **Apu Paul**
