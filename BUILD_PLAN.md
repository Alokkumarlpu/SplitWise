# Build Plan & Architecture Details

This document explains the technical architecture, database schemas, and engineering design decisions implemented in the Splitwise Clone application.

---

## 1. Directory Structure

The project is structured as a monorepo containing decoupled client and server folders:
* `/backend` - Django REST Framework app. Runs on port 8000. Uses standard ASGI routing via Daphne to support both REST HTTP views and Channels WebSockets.
* `/frontend` - Vite-powered React single page application. Runs on port 5173. Uses Tailwind CSS v4 and Axios with custom interceptors for JWT operations.

---

## 2. Database Models & Schema

The PostgreSQL/SQLite database contains entities for transaction logs and user preferences:

### Core Splitwise Schemas
* **Group**: Name and user membership array.
* **Expense**: Total amount, payer link, description, and group ID.
* **ExpenseSplit**: Calculated share amount owed, type of split (equal, unequal, percentage, shares), and raw split value input.
* **Settlement**: Recorded manual payments (cash, online UPI) that resolve outstanding group debts.
* **ChatMessage**: Chat text, date, and user linkages for real-time expense discussions.

### Account Settings Schemas
* **UserProfile**: Links One-to-One to Django's auth User. Stores default settings (currency, timezone, language) and the user's base64-encoded avatar string.
* **NotificationPreference**: Stores boolean notification settings for groups, expenses, and monthly summary logs.
* **PrivacySettings**: Toggles discoverability.
* **BlockedUser**: Unique linkages representing blocked users.
* **UserSession**: Tracks active JWT logins by storing their unique token identifier (`jti`).

---

## 3. Core Architectural Decisions

### A. Stateless JWT Session Revocation
Because JWT authentication is stateless, standard tokens cannot be revoked before their expiration time. 
* **Design Solution**: We created a `UserSession` database model. When a user successfully authenticates at `/api/auth/login/`, we generate their tokens and log the `jti` (JWT ID claim), IP Address, and User-Agent in `UserSession`.
* **Verification Middleware**: We built `SessionJWTAuthentication` which overrides SimpleJWT's validator to verify that the token's `jti` exists in our `UserSession` database table.
* **Termination**: To sign out from a device (or all devices), we delete the corresponding session records from the database. Any future requests with that token will immediately fail validation and return `401 Unauthorized`.

### B. Avatar Database Persistence
Free-tier deployments on cloud platforms like Render run on ephemeral container filesystems; any uploaded files vanish when the container restarts.
* **Design Solution**: Rather than introducing external S3 object storage (adding complexity to a 3-day assignment), we convert the uploaded avatar image to a compressed Base64 data string in React. This string is sent to the backend and stored in a `TextField` of the `UserProfile` table, ensuring the avatar is fully persisted on Neon PostgreSQL.

### C. Automatic Settings Initialization
To keep registration simple and ensure that all new profiles are fully initialized:
* **Design Solution**: We set up Django `post_save` model signals. Whenever a new `User` is created, it automatically generates a blank `UserProfile`, default `NotificationPreference`, and `PrivacySettings` record linked to that user.

### D. Account Deactivation (Soft Delete)
Rather than executing hard deletions (which would break relational constraints, delete historical expense records, and disrupt calculations of other group members):
* **Design Solution**: Account deletion is handled as a **soft delete**. We set the user's `is_active` attribute to `False` and delete all active sessions from the `UserSession` table. The user is logged out immediately and blocked from authenticating again, but their past expense shares remain in the system for calculation consistency.
