# ReviewFlow Studio • Automated Review Link Platform

A full-stack, enterprise-grade Google Review Link Generator and customer review funnel built with **React**, **Node.js (Express)**, and a **NoSQL Document Store (MongoDB ready)**.

---

## 🌟 Key Features

1. **Direct Google Maps Review Integration (`!9m1!1b1`)**:
   - Integrates with the official Google Maps review popup parameter.
   - Automatically opens the Google 5-Star Review Dialog on screen without needing to hunt for buttons or experiencing shortlink timeout errors.

2. **Automated Queue Rotation & NoSQL Persistence**:
   - Reviews auto-advance to the next unposted review upon every submission.
   - Submissions are logged with timestamp, account ID, and metadata into the NoSQL `submissions` collection.
   - Unposted review counters update dynamically in real-time.

3. **High-Converting Customer Experience**:
   - Pre-drafted review automatically types itself on screen with realistic pacing.
   - Review text is automatically copied to the customer's clipboard (`✓ Review text copied`).
   - Customer taps **"⭐⭐⭐⭐⭐ Tap to Submit on Google"**, pastes into the box, and clicks Post.
   - Confetti celebration fires, and a countdown timer seamlessly redirects them to **[Webworks Studios](https://webworksstudios.com/)**!

4. **Dynamic Rotating Link vs Fixed Review Mode**:
   - **Dynamic Rotating Link**: One link or QR code can be distributed to hundreds of customers — it automatically serves the next unused review to each person!
   - **Fixed Review Link**: Locks a specific review for a specific recipient.

5. **Master Inventory of 1,233 Real Reviews**:
   - Filterable by 4 Academy locations, status (*Unposted* vs *Submitted*), and language (*English*, *Marathi*, *Hinglish*).
   - Instant search and 1-click link generator.

---

## 🛠️ Technology Stack

* **Frontend**: React 19, Vite, Canvas-Confetti, QRCode, CSS Design System (Outfit + Plus Jakarta Sans).
* **Backend**: Node.js, Express, CORS, Dotenv.
* **Database**: NoSQL Document Store.
  * Connects to **MongoDB Atlas** when `MONGODB_URI` is provided in `.env`.
  * Fallback to a zero-configuration local NoSQL document store when running offline/locally.

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

This repository is pre-configured for 1-click deployment on **Render**, **Railway**, or **Heroku**:

### Deploying to Render
1. Create a **New Web Service** on [Render](https://render.com/).
2. Connect your GitHub repository: `hackwithim/reviewflow-studio`.
3. Set:
   * **Build Command**: `npm install && npm run build`
   * **Start Command**: `npm start`
4. *(Optional)* Add Environment Variable:
   * `MONGODB_URI`: your MongoDB Atlas connection string (or leave empty to use the local NoSQL store).

### Deploying to Railway
1. Click **New Project** ➔ **Deploy from GitHub repo**.
2. Railway detects the `Procfile` and deploys automatically.

---

## 📡 API Endpoints (NoSQL Backend)

* `GET /api/accounts` — Fetch all 4 locations with live unposted counts.
* `GET /api/reviews` — Paginated and filterable list of all 1,233 reviews.
* `GET /api/reviews/next/:accountId` — Get the next unposted review for an account.
* `POST /api/reviews/submit` — Records review submission in NoSQL and marks review as used.
* `POST /api/reviews/advance/:accountId` — Manually advance queue to next review.
* `POST /api/reviews/reset` — Restore all submitted reviews back to unposted.
* `GET /api/health` — Check server and database status.
