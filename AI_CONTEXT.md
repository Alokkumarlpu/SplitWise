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
* **Fairness Calculators**:
  * Interactive calculators to compute custom/weighted splits.
  * Supported: Rent Split (room size weights), Travel Split (equal shares).
  * History logging for authenticated users.
* **Support Ticketing**:
  * Submit issues/tickets from a dedicated page.
  * Guest support (enforces name/email validation) & authenticated user tracking.

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
  * `POST /api/auth/login/` - Login, log session details, and receive JWT
  * `POST /api/auth/token/refresh/` - Refresh JWT access token
  * `POST /api/auth/logout-all/` - Clear all session tokens for the user
* **Users**:
  * `GET /api/users/me/` - Retrieve authenticated user's details (ID, username, email)
  * `GET /api/users/?search=<query>` - Autocomplete user lookup for invites (requires minimum 2 characters query)
* **Profile & Settings**:
  * `GET /api/profile/` - Retrieve profile updates and preferences
  * `PUT /api/profile/` - Edit full name, email, phone number
  * `POST /api/profile/avatar/` - Upload Base64-encoded avatar string
  * `PUT /api/profile/preferences/` - Edit default currency, timezone, language
  * `POST /api/profile/change-password/` - Verify current password and update to new password
  * `DELETE /api/profile/delete-account/` - Soft-deactivate user account
  * `GET /api/profile/notifications/` - Get notification preferences
  * `PUT /api/profile/notifications/` - Save notification preferences
  * `GET /api/profile/privacy/` - Get privacy toggles, blocked list, and active devices
  * `PUT /api/profile/privacy/` - Toggle discoverability
  * `POST /api/profile/privacy/block/` - Block a user
  * `POST /api/profile/privacy/unblock/` - Unblock a user
  * `POST /api/profile/privacy/terminate-session/` - Log out a specific device session
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
* **Calculators**:
  * `GET /api/calculators/` - List user calculation logs (requires authentication)
  * `POST /api/calculators/rent/` - Proportional rent splitting with room weights (anonymous allowed)
  * `POST /api/calculators/travel/` - Equal travel splitting (anonymous allowed)
* **Support**:
  * `POST /api/support/` - Submit support ticket (anonymous allowed, enforces name/email validations for guests)
* **Dashboard**:
  * `GET /api/dashboard/` - Retrieve consolidated groups, friendships, dynamic balance totals, and activity feed for current user
* **Friends**:
  * `GET /api/friends/` - Retrieve user friendships (with calculated friend-specific balances across shared groups)
  * `POST /api/friends/` - Add friend by lookup identifier (creates reciprocal friendships)
  * `DELETE /api/friends/<id>/` - Unfriend user (deletes reciprocal friendship records)
  * `POST /api/friends/invite/` - Log a FriendInvite email invitation
* **Activity**:
  * `GET /api/activity/` - Retrieve recent activity logs stream involving the user

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
* `/settings` - Account Settings screen showing profile, notification toggles, active sessions, and data controls
* `/account` - Alias / redirect to `/settings`
* `/groups/create` - Create group page with searchable member invitations
* `/calculators` - Hub for Fairness Calculators and history tracking
* `/calculators/rent` - Rent Split Calculator with room weights inputs
* `/calculators/travel` - Travel Split Calculator
* `/support` - Submit a support ticket page
* `/friends` - Friends management page (shared expenses list, relationship balance summary, and add/remove friend controls)
* `/logout` - Resets AuthContext session state and redirects to login

---

## 7. Testing Strategy
* **Manual QA**: Verifying complete user flows: Registration -> Group Creation -> Add Members -> Create Expense (each split type) -> Debt Simplification -> Settlement -> Expense Chat -> Friendships and Invites -> Dashboard grid modals.
* **Unit Testing**: Unit tests for split math, debt simplification, Settings module, Calculators split logs, Support tickets, Friendship reciprocal structures, and Activity feed triggers.

---

## 8. Dashboard & Friends Subsystem Architecture

### Dynamic Stats Computation
To prevent database synchronization drift, all dashboard stats (Total Owe, Total Owed, Net Balance, and shared friend balances) are calculated dynamically on-the-fly when requested. The system inspects all groups the user participates in, runs the Greedy Debt-Simplification Algorithm on each, and sums the transactions that involve the requesting user.

### Reciprocal Friendships
Friendships are design-symmetrical. When User A adds User B as a friend, the system creates two separate `Friendship` rows (`A -> B` and `B -> A`) in a single database transaction. This enables simple `GET` filtering on the friends relation and provides quick access to individual relationship balances. Removing a friend deletes both rows reciprocally.

### Event-Driven Activity Logging
An inline trigger system logs actions to the `Activity` model whenever core state changes occur:
* **Expenses**: Logs `expense_created`, `expense_updated`, and `expense_deleted` with description and amount details.
* **Settlements**: Logs `settlement_made` with payer and payee usernames.
* **Groups**: Logs `member_added` and `member_removed` when group memberships are updated.
* **Chat**: Logs `chat_message` snippets.

Activity lists are filtered dynamically: users only see logs they personally triggered or that belong to a group of which they are a member.

### Tradeoffs & Limitations
* **Scale Performance**: Dynamic recalculation of balances across large numbers of groups/transactions can cause latency. If group counts scale beyond hundreds, balances must be cached or pre-aggregated with triggers.
* **Email Invites**: There is no SMTP email dispatch backend integrated. Friend invitations are stored locally in the `FriendInvite` table as audit records.

