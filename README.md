# 📚 Library Management System API (LiApi)

A RESTful Library Management System API built with **Node.js**, **Express.js**, and **MongoDB Atlas** using **mongoose**.

This project provides a complete backend for managing books, users, borrowing, returns, and library administration.

---

## 🚀 Features

* 📖 Book Management

  * Add new books
  * Update book details
  * Delete books
  * Search books by title, author, genre, ISBN, or publisher

* 👥 User Management

  * Register users
  * Login with JWT Authentication
  * Role-based access (Admin / Member)

* 📚 Borrowing System

  * Borrow books
  * Return books
  * Track due dates
  * View borrowing history

* 📊 Library Dashboard

  * Total books
  * Available books
  * Borrowed books
  * Active members
  * Popular books

* 🔍 Advanced Search

  * Full-text search
  * Filtering
  * Pagination
  * Sorting

* ⭐ Book Information

  * ISBN
  * Author
  * Publisher
  * Genre
  * Language
  * Publication Year
  * Number of Pages
  * Series (if applicable)
  * Book Cover URL

---

# 🛠 Tech Stack

* Node.js
* Express.js
* MongoDB Atlas
* MongoDB Node.js Driver
* JWT Authentication
* bcrypt
* dotenv

---

# 📁 Project Structure

```
library-management-api
│
├── src
│   ├── controllers
│   ├── routes
│   ├── middleware
│   ├── database
│   ├── utils
│   └── config
│
├── public
├── uploads
├── package.json
└── README.md
```

---

# 📦 Installation

Clone the repository

```bash
git clone https://github.com/Sam78Svg/Libray_Management.git
```

Install dependencies

```bash
npm install
```

Create a `.env` file

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
```

Start the server

```bash
npm run server
```

Development mode

```bash
npm run dev
```

---

# 📖 Book Schema

```json
{
    "isbn13": "",
    "isbn10": "",
    "name": "",
    "subtitle": "",
    "author": "",
    "publisher": "",
    "published": "",
    "language": "",
    "genre": [],
    "pages": 0,
    "series": "",
    "description": "",
    "image": "",
    "copies": 0,
    "available": 0,
    "shelf": "",
    "rating": 0
}
```

---

# 🌐 API Endpoints

## Books

| Method | Endpoint       | Description    |
| ------ | -------------- | -------------- |
| GET    | /api/books     | Get all books  |
| GET    | /api/books/:id | Get book by ID |
| POST   | /api/books     | Add new book   |
| PUT    | /api/books/:id | Update book    |
| DELETE | /api/books/:id | Delete book    |

---

## Users

| Method | Endpoint           |
| ------ | ------------------ |
| POST   | /api/auth/register |
| POST   | /api/auth/login    |
| GET    | /api/users/profile |

---

## Borrow

| Method | Endpoint     |
| ------ | ------------ |
| POST   | /api/borrow  |
| POST   | /api/return  |
| GET    | /api/history |

---

# 🗄 Database

The application uses **MongoDB Atlas** and stores:

* Books
* Users
* Borrow Records
* Categories
* Reviews
* Library Statistics

---

# 📈 Sample Dataset

The project includes a sample collection containing a diverse catalog of books for development and testing. Each book includes metadata such as title, author, publication year, genre, ISBN, publisher, page count, language, and availability information.

---

# 🔒 Authentication

Protected routes use **JSON Web Tokens (JWT)**.

---

# 📄 License

This project is developed for educational purposes and can be modified for personal or academic use.

---

# 👨‍💻 Author

Developed by **Sangam**

MCA BATCH 2025-27 STUDENT

