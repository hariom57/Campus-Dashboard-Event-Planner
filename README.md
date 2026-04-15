# IITR Campus Dashboard

IITR Campus Dashboard is a visionary, all-in-one digital ecosystem designed to unify the fragmented pulse of IIT Roorkee’s campus life into a single, intuitive interface. By consolidating scattered updates from Slack, WhatsApp, and email into a centralized feed, the platform empowers students with seamless event discovery through smart filtering, real-time RSVP tracking, and an integrated official academic calendar. It bridges the gap between organizer clubs and attendees, transforming chaotic "information overload" into a streamlined experience where high-octane cultural fests, critical recruitment talks, and late-night hackathons coexist in one synchronized view. Built to eliminate the need for constant app switching, it ensures that every member of the IITR community stays organized, informed, and connected to the heartbeat of the campus.

## 🚀 Live Links

- **Frontend:** [https://campus-dashboard-event-planner.vercel.app/](https://campus-dashboard-event-planner.vercel.app/)
- **Backend API:** [https://campus-event-planner-backend.onrender.com/](https://campus-event-planner-backend.onrender.com/)

---

## 🛠️ Tech Stack

### **Frontend**
- **Framework:** React 19
- **Build Tool:** Vite
- **Routing:** React Router v7
- **Styling:** Vanilla CSS
- **Icons:** Lucide React
- **Mobile Support:** PWA (Progressive Web App)
- **Deployment:** Vercel

### **Backend**
- **Runtime:** Node.js
- **Framework:** Express 5
- **Database:** PostgreSQL
- **ORM:** Sequelize
- **Authentication:** JWT & Cookie-based sessions
- **Integration:** Channel-i OAuth (IIT Roorkee)

---

## 📂 Project Structure

This repository is organized as a monorepo containing both the frontend and the backend development files.

- `/src`: Frontend React application.
- `/temp_backend`: Node.js Express backend and database configurations.

---

## 🏃 Getting Started

### Prerequisites
- Node.js (Latest LTS recommended)
- PostgreSQL (for local backend development)

### Frontend Setup
1. From the root directory, install dependencies:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd temp_backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure your `.env` file (refer to `.env.example`).
4. Start the backend:
   ```bash
   npm run dev
   ```

---

## 📎 Notes
Ensure your `VITE_API_URL` in `.env.local` points to the correct backend endpoint (either local or deployed).
