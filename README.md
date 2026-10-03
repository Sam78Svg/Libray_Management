# Library Management API

A REST API for a library catalog, member accounts, book-borrow requests, and librarian workflows. Built with Node.js, Express, MongoDB, and Mongoose.

The interactive API guide is served at `/` and `/docs` when the server is running. It includes copyable cURL examples and the role required for every endpoint.

## Run locally

1. Install Node.js 20 or later and start MongoDB (or use a MongoDB Atlas URI).
2. Install dependencies:

   ```sh
   npm install
   ```

3. Copy `.env.example` to `.env` and set a private `JWT_SECRET`, a `MONGO_URI`, and the librarian credentials. Use a long, random JWT secret and a strong librarian password.
4. Start the API:

   ```sh
   npm run dev
   ```

   For a normal start, use `npm start`. The server listens on port 5000 unless `PORT` is set.

At startup, the service creates the configured librarian account only if that email does not already exist. Public registration always creates a member account; it cannot assign the librarian role. If the configured librarian email already belongs to a member, startup reports the conflict rather than silently granting privileges.

## Access model

| Access | Endpoints |
| --- | --- |
| Public | `GET /books`, `GET /books/:id`, `POST /api/auth/register`, `POST /api/auth/login` |
| Authenticated member | `/api/auth/me`, `/api/cart`, `/api/cart/items`, `/api/borrow-requests` (members see only their own requests) |
| Librarian | Book create/update/delete, all borrow requests, request decisions, and returns |
| API guide | `GET /` or `GET /docs` serves the usage page; these are documentation pages, not data APIs |

Send protected requests with `Authorization: Bearer <token>`. Tokens are returned by registration and login. A member adds catalog books to their cart and submits it as borrow requests. Each request is related to both its member and its book through MongoDB references. Librarians can approve or reject pending requests; approval checks inventory and sets a 14-day due date. Librarians mark approved loans returned, which replenishes the available-copy count.

### Endpoint summary

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| `GET` | `/books?search=&genre=&page=&limit=` | Public | Browse/search catalog |
| `GET` | `/books/:id` | Public | Read one book |
| `POST` | `/books` | Librarian | Add a book |
| `PATCH` | `/books/:id` | Librarian | Update book information and copy count |
| `DELETE` | `/books/:id` | Librarian | Delete a book without pending requests or active loans |
| `POST` | `/api/auth/register` | Public | Create a member |
| `POST` | `/api/auth/login` | Public | Sign in |
| `GET` | `/api/auth/me` | Authenticated | Read current profile |
| `GET` | `/api/cart` | Member | View cart |
| `POST` | `/api/cart/items` | Member | Add `{ "bookId": "..." }` |
| `DELETE` | `/api/cart/items/:bookId` | Member | Remove cart item |
| `POST` | `/api/borrow-requests` | Member | Submit cart for librarian review |
| `GET` | `/api/borrow-requests` | Authenticated | Members see their own; librarians see all |
| `PATCH` | `/api/borrow-requests/:id/decision` | Librarian | Decide with `{ "decision": "approve" }` or `"reject"` |
| `PATCH` | `/api/borrow-requests/:id/return` | Librarian | Mark an approved loan returned |

Book creation accepts `title`, `author`, optional `isbn`, `publisher`, `publishedYear`, `genre`, `description`, and a non-negative integer `totalCopies`. New books start with all copies available.

## Response conventions

Responses are JSON. Errors have the shape `{ "error": "..." }`. The API uses `400` for invalid input, `401` for missing/invalid authentication, `403` for role violations, `404` for missing resources, and `409` for duplicate data, unavailable stock, or invalid state transitions. Successful creates return `201`; deletes return `204`.
