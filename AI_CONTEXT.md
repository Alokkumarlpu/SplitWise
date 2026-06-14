# Splitwise Clone - Project Context

This document is the single source of truth for the Splitwise Clone application. The entire project is buildable solely from the context defined below.

## 1. Product Goals & Personas
### Primary Goal
Build a simplified Splitwise-style web application that allows users to:
* Create groups
* Add expenses
* Split expenses among members
* Track balances
* Record settlements
* Chat within expense-specific discussions

### Target User Personas
1. **Students & Flatmates**: Sharing rent, electricity, internet, and groceries.
2. **Trip Groups**: Sharing hotel costs, transportation, food, and activity expenses.
3. **Friends**: Sharing restaurant bills, party expenses, and event tickets.

---

## 2. Scope & Features
### MVP Features (In-Scope)
* **Authentication**: Register, Login, Logout using JWT.
* **Group Management**:
  * Create a group.
  * Invite/Add members to a group.
  * Remove members from a group.
  * View group details.
  * Edit group name.
* **Expense Management**:
  * Create expense (only inside a group).
  * Edit expense.
  * Delete expense.
  * Single payer per expense.
  * Supported split methods: Equal, Unequal, Percentage, and Shares.
* **Balances**:
  * Group balances.
  * User balance summary.
  * Debt simplification algorithm (minimizing transactions).
* **Settlements**:
  * Record cash/external payments to update balances.
* **Expense Chat**:
  * Real-time messaging per expense via WebSockets.

### Out of Scope
* ❌ Recurring expenses
* ❌ Multi-currency (restricted to ₹ / INR)
* ❌ OCR receipt scanning & file uploads
* ❌ Push & email notifications
* ❌ Search functionality & activity feed
* ❌ Payment gateway integration (manual recording only)
* ❌ Mobile application & dark mode
* ❌ Advanced analytics

---

## 3. Core Business & Calculation Logic
### Expense Location
* Expenses **only exist inside Groups**. There are no direct 1-on-1 individual expenses.

### Splitting Methods
1. **Equal**: Split the amount equally among all selected group members.
   * *Example*: ₹100 split among 4 members results in ₹25 each.
2. **Unequal**: Assign custom absolute amounts to each member.
   * *Example*: Bob owes ₹70, Charlie owes ₹30.
3. **Percentage**: Assign percentages to members (must sum to exactly 100%).
   * *Example*: Bob owes 60%, Charlie owes 40%.
4. **Shares**: Specify relative weights for splitting.
   * *Example*: Total is ₹300. Bob has 1 share, Charlie has 2 shares. Bob owes ₹100, Charlie owes ₹200.

### Balance Calculation & Debt Simplification
* A balance simplification engine must run whenever expenses or settlements are added, edited, or deleted.
* It uses debt simplification:
  * *Example*: If A owes B ₹100 and B owes C ₹100, the system simplifies this to: A owes C ₹100.
* Display simplified balances globally and within groups.

### Settlements
* A settlement records that an external payment (e.g., Cash, UPI) has occurred.
* Creating a settlement updates balances. It does not interface with actual payment processors.

---

## 4. Technical Stack
### Frontend
* **Framework**: React (Vite)
* **Styling**: Tailwind CSS v4 (using `@tailwindcss/postcss` compilation)
* **Routing**: React Router
* **API Client**: Axios

### Backend
* **Framework**: Django 5.x with Django REST Framework (DRF)
* **Authentication**: SimpleJWT (JSON Web Tokens)
* **Real-time**: Django Channels (WebSockets for chat)
* **Database**: PostgreSQL (hosted on Neon)

### Deployment Target
* **Frontend**: Vercel
* **Backend**: Render
* **Database**: Neon PostgreSQL

---

## 5. System Architecture & API Design
### Authentication Flow
1. Register/Login requests are sent to Django.
2. Django issues access and refresh JWT tokens.
3. Tokens are stored in frontend `localStorage`.
4. The access token is attached as a Bearer token in the `Authorization` header of Axios API requests.
5. Password hashing uses default Django bcrypt/PBKDF2.

### API Endpoints
* **Auth**:
  * `POST /api/auth/register/` - Register a new user
  * `POST /api/auth/login/` - Login and receive JWT
  * `POST /api/auth/token/refresh/` - Refresh JWT access token
* **Users**:
  * `GET /api/users/me/` - Retrieve authenticated user's details (ID, username, email)
  * `GET /api/users/?search=<query>` - Autocomplete user lookup for invites (requires minimum 2 characters query)
* **Groups**:
  * `GET /api/groups/` - List current user's groups
  * `POST /api/groups/` - Create a group
  * `GET /api/groups/<id>/` - Retrieve group details, member balances, and expenses
  * `PATCH /api/groups/<id>/` - Edit group name
  * `POST /api/groups/<id>/add-member/` - Add/invite a member by username/email
  * `POST /api/groups/<id>/remove-member/` - Remove a member by `user_id`
* **Expenses**:
  * `POST /api/expenses/` - Create an expense (and splits)
  * `PUT/PATCH /api/expenses/<id>/` - Edit an expense (and splits)
  * `DELETE /api/expenses/<id>/` - Delete an expense
* **Settlements**:
  * `POST /api/settlements/` - Record a settlement
* **Balances**:
  * `GET /api/balances/` - Retrieve overall balance summary (net owe/owed) for the user

### Real-Time Chat WebSocket
* `ws://<backend-domain>/ws/chat/expense/<expense_id>/`
* Real-time text messages pushed to all active users viewing the expense details screen.

---

## 6. Frontend Routing & UI Screens
### Routes
* `/` - Landing / Root (Redirects to `/dashboard` if authenticated, `/login` if not)
* `/login` - Login screen
* `/register` - Registration screen
* `/dashboard` - Overview of user groups, net balance summary (overall owe/owed status)
* `/groups/:id` - Group details, showing members, expenses, and simplified group balances
* `/groups/:id/expense/new` - Form to create a new expense with splitting options
* `/expenses/:id` - Expense details showing description, payer, splits, and the chat section
* `/groups/:id/settle` - Settle up page to record a payment between group members

---

## 7. Testing Strategy
* **Manual QA**: Verifying complete user flows: Registration -> Group Creation -> Add Members -> Create Expense (each split type) -> Debt Simplification -> Settlement -> Expense Chat.
* **Unit Testing**: Unit tests for the balance calculation and split validation engines.
