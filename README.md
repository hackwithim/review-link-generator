# ReviewFlow Studio • Automated Google Review Link Platform

A full-stack, enterprise-grade Google Review Link Generator, real-time telemetry auditor, and customer review funnel built with **React 19**, **Node.js (Express)**, and a **NoSQL Document Store (MongoDB Atlas ready)**.

🌐 **Live Production App**: [https://review-link-generator.onrender.com/](https://review-link-generator.onrender.com/)

---

## 🌟 Key Features

1. **Direct Google Maps Review Integration (`!9m1!1b1`)**:
   - Integrates with the official Google Maps review popup parameter.
   - Automatically opens the Google 5-Star Review Dialog on screen without needing to hunt for buttons or experiencing shortlink timeout errors.

2. **Protected Admin Dashboard & 256-Bit Authentication**:
   - The entire dashboard (Link Generator, Master Sheet Inventory, Queue Reset) is fully protected behind a secure login gate.
   - HMAC-SHA256 cryptographically signed JWT tokens with expiration.
   - Recipient review links (`?r=...`) completely bypass the login gate for a zero-friction customer experience.

3. **Copied Message Tracking & Live Reflection**:
   - Real-time audit log of every review message copied to the clipboard.
   - Submissions reflect live on the dashboard within 4 seconds: unposted counters decrease automatically, review statuses update to `Submitted`, and queues advance without manual refresh.
   - Dedicated **Copied & Submissions Log** view with search, event filters, and timestamps.

4. **Automated Queue Rotation & NoSQL Persistence**:
   - Reviews auto-advance to the next unposted review upon every submission.
   - Submissions are logged with timestamp, account ID, and metadata into the NoSQL `submissions` collection.
   - Unposted review counters update dynamically in real-time.

5. **High-Converting Customer Experience**:
   - Pre-drafted review automatically types itself on screen with realistic pacing.
   - Review text is automatically cleaned and sanitized (quotes/escaping stripped).
   - Dedicated **Copy Review Text** button with dual-layer fallback (modern Clipboard API + execCommand).
   - Customer taps **"⭐⭐⭐⭐⭐ Tap to Submit on Google"**, pastes into the box, and clicks Post.
   - Confetti celebration fires, and a countdown timer seamlessly redirects them to **[Webworks Studios](https://webworksstudios.com/)**!

6. **Dynamic Rotating Link vs Fixed Review Mode**:
   - **Dynamic Rotating Link**: One link or QR code can be distributed to hundreds of customers — it automatically serves the next unused review to each person!
   - **Fixed Review Link**: Locks a specific review for a specific recipient.

7. **Master Inventory of 1,233 Real Reviews**:
   - Filterable by 4 Academy locations, status (*Unposted*, *Copied*, *Submitted*), and language (*English*, *Marathi*, *Hinglish*).
   - Instant search and 1-click link generator.

---

## 🛠️ Technology Stack

* **Frontend**: React 19, Vite 6, Canvas-Confetti, QRCode, CSS Design System (Outfit + Plus Jakarta Sans).
* **Backend**: Node.js, Express, CORS, Dotenv, Crypto.
* **Database**: NoSQL Document Store.
  * Connects to **MongoDB Atlas** when `MONGODB_URI` is provided in `.env`.
  * Fallback to a zero-configuration local NoSQL document store (`server/data/nosql_db.json`) when running offline/locally.

---

## 🔐 Admin Authentication Configuration

Default credentials:
* **Username**: `review_admin` *(configurable via `ADMIN_USERNAME`)*
* **Password**: `WebWorks@Admin2026!` *(configurable via `ADMIN_PASSWORD`)*
* **JWT Secret**: `webworks-super-secret-key-2026` *(configurable via `JWT_SECRET`)*

---

## 🚀 Getting Started Locally

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Fullstack Development Environment
```bash
npm run dev
```
* **Frontend**: `http://localhost:5173/`
* **Backend API & NoSQL**: `http://localhost:5000/`

### 3. Production Build & Run
```bash
npm run build
npm start
```

---

## ☁️ Deployment & Hosting

### Deploying to Render
1. Create a **New Web Service** on [Render](https://render.com/).
2. Connect your GitHub repository: `hackwithim/review-link-generator`.
3. Set:
   * **Build Command**: `npm install --legacy-peer-deps && npm run build`
   * **Start Command**: `npm start`
4. *(Optional)* Add Environment Variables:
   * `ADMIN_USERNAME`: your custom admin username
   * `ADMIN_PASSWORD`: your custom admin password
   * `JWT_SECRET`: a random secret string
   * `MONGODB_URI`: your MongoDB Atlas connection string (or leave empty to use the local NoSQL store).

### Deploying to Railway / Heroku
* Repository includes `Procfile` (`web: npm start`) and `.npmrc` (`legacy-peer-deps=true`) for 1-click deployment.

---

## 📡 API Endpoints

### Public Endpoints (Customer Review Funnel)
* `GET /api/health` — Check server and database status.
* `GET /api/reviews/next/:accountId` — Get the next unposted review for an account.
* `POST /api/reviews/copy-event` — Logs review copied action with timestamp and metadata.
* `POST /api/reviews/submit` — Records review submission in NoSQL and marks review as submitted.

### Protected Administrative Endpoints (Require Bearer Token)
* `POST /api/auth/login` — Authenticate admin and receive signed JWT token.
* `GET /api/auth/verify` — Validate session token.
* `GET /api/accounts` — Fetch all 4 locations with live unposted counts.
* `GET /api/reviews` — Paginated and filterable list of all 1,233 reviews.
* `GET /api/activity` — Retrieve live stream of all copied and submitted events.
* `POST /api/reviews/advance/:accountId` — Manually advance queue to next review.
* `POST /api/reviews/reset` — Restore all submitted reviews back to unposted.
* `POST /api/links/generate` — Track generated review links.

---

## 🛡️ License

Built with pride by **[Webworks Studios](https://webworksstudios.com/)**.
