# 🧠 AI Quiz Builder

A production-quality full-stack MERN application for creating and running AI-powered quizzes with real-time leaderboards.

## ✨ Features

### For Educators
- 🤖 **AI Quiz Generation** via Google Gemini — describe a topic, get 5–20 MCQs instantly
- ✏️ **Quiz Editor** — add, edit, delete questions with live preview
- 📊 **Analytics Dashboard** — score distribution, quiz performance charts, top performers
- 🔒 **Role-Based Access** — teacher-only routes and protected actions
- 📤 **Publish & Share** — one-click publish with auto-generated quiz codes

### For Students
- ⚡ **Join by Code** — enter a quiz code to preview and start
- ⏱️ **Live Timer** — auto-submits when time expires
- 🏆 **Real-Time Leaderboard** — rank updates instantly via Socket.io
- 📈 **Performance Analytics** — score trend, category breakdown, pass rate
- 🔍 **Answer Review** — see correct answers and explanations after submission

### Technical Highlights
- JWT Authentication with bcrypt password hashing
- Role-Based Access Control (teacher / student)
- Socket.io for live leaderboard and participant count
- Google Gemini 1.5 Flash for AI question generation
- Tailwind CSS with dark mode support
- Recharts for analytics visualizations
- Fully responsive (mobile-first)

---

## 🗂️ Project Structure

```
ai-quiz-builder/
├── backend/
│   ├── config/
│   │   └── database.js          # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js    # Register, login, profile
│   │   ├── quizController.js    # CRUD quiz + questions
│   │   ├── attemptController.js # Start/submit quiz, leaderboard
│   │   ├── aiController.js      # Gemini AI generation
│   │   └── analyticsController.js
│   ├── middleware/
│   │   ├── auth.js              # JWT authenticate + authorize
│   │   └── errorHandler.js      # Global error handler
│   ├── models/
│   │   ├── User.js
│   │   ├── Quiz.js              # Embeds Question subdocument
│   │   └── Attempt.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── quiz.js
│   │   ├── attempt.js
│   │   ├── ai.js
│   │   ├── analytics.js
│   │   └── user.js
│   ├── sockets/
│   │   └── socketHandler.js     # Socket.io events + room management
│   ├── .env.example
│   └── server.js
│
└── frontend/
    ├── src/
    │   ├── context/
    │   │   ├── AuthContext.jsx   # Global auth state
    │   │   ├── ThemeContext.jsx  # Dark mode
    │   │   └── SocketContext.jsx # Socket.io client
    │   ├── layouts/
    │   │   ├── MainLayout.jsx    # Sidebar nav
    │   │   └── AuthLayout.jsx    # Split-screen auth
    │   ├── pages/
    │   │   ├── LandingPage.jsx
    │   │   ├── ProfilePage.jsx
    │   │   ├── auth/
    │   │   │   ├── Login.jsx
    │   │   │   └── Register.jsx
    │   │   ├── teacher/
    │   │   │   ├── TeacherDashboard.jsx
    │   │   │   ├── CreateQuiz.jsx
    │   │   │   ├── AIQuizGenerator.jsx
    │   │   │   ├── QuizEditor.jsx
    │   │   │   └── AnalyticsPage.jsx
    │   │   ├── student/
    │   │   │   ├── StudentDashboard.jsx
    │   │   │   └── JoinQuiz.jsx
    │   │   └── quiz/
    │   │       ├── QuizAttempt.jsx     # Full-screen timer quiz
    │   │       ├── AttemptResult.jsx   # Score + answer review
    │   │       └── LeaderboardPage.jsx # Real-time leaderboard
    │   ├── services/
    │   │   └── api.js            # Axios + all API service functions
    │   ├── App.jsx               # Routes + providers
    │   └── index.css             # Tailwind + custom utilities
    └── vite.config.js
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Google Gemini API key (free at [aistudio.google.com](https://aistudio.google.com))

### 1. Clone and Install

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Configure Environment

```bash
cd backend
cp .env.example .env
```

Edit `.env`:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/ai-quiz-builder
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_EXPIRES_IN=7d
GEMINI_API_KEY=your-gemini-api-key-here
FRONTEND_URL=http://localhost:5173
```

Frontend `.env` (optional):
```env
VITE_API_URL=http://localhost:5000
VITE_BACKEND_URL=http://localhost:5000
```

### 3. Run

```bash
# Terminal 1 — Backend
cd backend
npm run dev

# Terminal 2 — Frontend
cd frontend
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## 📡 API Reference

### Auth
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/register` | Register (name, email, password, role) |
| POST | `/api/auth/login` | Login → returns JWT |
| GET | `/api/auth/me` | Current user (auth required) |
| PUT | `/api/auth/update-profile` | Update name/bio |
| PUT | `/api/auth/change-password` | Change password |

### Quiz
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/quiz` | Any | List quizzes |
| POST | `/api/quiz` | Teacher | Create quiz |
| GET | `/api/quiz/:id` | Any | Get quiz by ID |
| GET | `/api/quiz/code/:code` | Student | Get quiz by code |
| PUT | `/api/quiz/:id` | Teacher | Update quiz |
| PUT | `/api/quiz/:id/publish` | Teacher | Publish quiz |
| DELETE | `/api/quiz/:id` | Teacher | Delete quiz |
| POST | `/api/quiz/:id/questions` | Teacher | Add question |
| PUT | `/api/quiz/:id/questions/:qid` | Teacher | Update question |
| DELETE | `/api/quiz/:id/questions/:qid` | Teacher | Delete question |

### Attempts
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/attempts/start` | Student | Start attempt |
| POST | `/api/attempts/:id/submit` | Student | Submit answers |
| GET | `/api/attempts/my` | Student | My attempts |
| GET | `/api/attempts/quiz/:quizId/leaderboard` | Any | Leaderboard |
| GET | `/api/attempts/:id` | Any | Attempt details |

### AI
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/ai/generate-quiz` | Teacher | Generate quiz via Gemini |
| POST | `/api/ai/explain` | Any | Explain answer |

### Analytics
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/analytics/teacher` | Teacher | Teacher dashboard data |
| GET | `/api/analytics/student` | Student | Student analytics |

---

## 🔌 Socket.io Events

### Client → Server
| Event | Payload | Description |
|-------|---------|-------------|
| `join-quiz-room` | `{ quizId, userId, userName, role }` | Join a quiz room |
| `leave-quiz-room` | `{ quizId }` | Leave room |
| `request-leaderboard` | `{ quizId }` | Request current leaderboard |

### Server → Client
| Event | Payload | Description |
|-------|---------|-------------|
| `leaderboard-update` | `{ leaderboard, newSubmission }` | Triggered on every submission |
| `participant-count` | `{ count }` | Active student count |
| `user-joined` | `{ userId, userName, role }` | Someone entered room |
| `user-left` | `{ userId, userName }` | Someone left room |

---

## 🌐 Deployment

### Backend (Railway / Render / Fly.io)
1. Push code to GitHub
2. Connect to Railway or Render
3. Set all environment variables
4. MongoDB URI → use MongoDB Atlas

### Frontend (Vercel / Netlify)
1. Set `VITE_API_URL` to your backend URL
2. Set `VITE_BACKEND_URL` to your backend URL (for Socket.io)
3. Deploy `/frontend` directory

### Docker (Optional)
```dockerfile
# backend/Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["node", "server.js"]
```

---

## 🔐 Security Features
- Passwords hashed with bcrypt (12 salt rounds)
- JWT tokens expire in 7 days
- Rate limiting: 200 req/15 min per IP
- Helmet.js for HTTP security headers
- CORS restricted to frontend origin
- Role-based middleware on every protected route
- Input validation via express-validator

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS v4 |
| State | Context API, useReducer |
| Routing | React Router v6 |
| HTTP | Axios |
| Charts | Recharts |
| Real-time | Socket.io Client |
| Backend | Node.js, Express.js |
| Database | MongoDB, Mongoose |
| Auth | JWT, bcryptjs |
| Real-time | Socket.io |
| AI | Google Gemini 1.5 Flash |
| Security | Helmet, express-rate-limit |

---

## 📝 License

MIT — Built as a portfolio project demonstrating production-quality MERN + AI + Socket.io integration.
