# Smart Study Assistant

An AI-powered full-stack web application that generates personalized study materials including summaries, quizzes, and study tips from any topic using Wikipedia and AI APIs.


## Overview

Smart Study Assistant is a comprehensive educational tool that helps students learn any topic efficiently. Simply enter a topic, and the application will:

- **Fetch** relevant information from Wikipedia
- **Generate** a concise 3-point summary using AI
- **Create** 3 multiple-choice quiz questions (or 1 math problem in math mode)
- **Provide** a practical study tip

### Key Features

- **Wikipedia Integration**: Fetches real-time data from Wikipedia API
- **AI-Powered Content**: Uses HuggingFace, Google Gemini, or OpenAI to generate study materials
- **Math Mode**: Solve quantitative/logic problems with step-by-step explanations
- **User Authentication**: Firebase-based login/signup with secure authentication
- **Study History**: Track and revisit past topics (stored in MongoDB/Firestore)
- **Dark Mode**: Beautiful light/dark theme toggle
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Error Handling**: Robust error handling with user-friendly messages

## Quick Start

### Prerequisites

- **Node.js** 18+ and npm
- **MongoDB Atlas** account (or local MongoDB)
- **Firebase** account (for authentication)
- At least one **AI API key** (HuggingFace, Gemini, or OpenAI)

### Installation

1. **Clone the repository**
   ```bash
   git clone [(https://github.com/the-ivii/Smart-Student-Assistant.git)](https://github.com/the-ivii/Smart-Student-Assistant.git)
   cd stt-main
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   cp ENV_EXAMPLE.txt .env
   # Edit .env with your API keys and MongoDB URI
   ```

3. **Frontend Setup**
   ```bash
   cd ../frontend
   npm install
   cp ENV_EXAMPLE.txt .env
   # Edit .env with your Firebase config and API URL
   ```

4. **Start Development Servers**
   ```bash
   # Terminal 1 - Backend
   cd backend
   npm run dev

   # Terminal 2 - Frontend
   cd frontend
   npm run dev
   ```

5. **Open in Browser**
   - Frontend (Local): http://localhost:3001
   - Backend API (Local): http://localhost:4000
   - Frontend (Production): [https://studentstudyyassistant.netlify.app/](https://studentstudyyassistant.netlify.app/)
   - Backend API (Production): https://stt-1hs3.onrender.com

## Project Structure

```
Smart-Student-Assistant-master/
├── backend/
│   ├── src/
│   │   ├── config/          # Database & Firebase configuration
│   │   │   ├── database.js
│   │   │   └── firebase.js
│   │   ├── controllers/      # Request handlers
│   │   │   ├── authController.js
│   │   │   ├── firebaseAuthController.js
│   │   │   ├── historyController.js
│   │   │   └── studyController.js
│   │   ├── middleware/       # Authentication middleware
│   │   │   ├── authMiddleware.js
│   │   │   ├── firebaseAuth.js
│   │   │   └── optionalAuth.js
│   │   ├── models/           # MongoDB models
│   │   │   └── User.js
│   │   ├── routes/           # API routes
│   │   │   ├── authRoutes.js
│   │   │   ├── firebaseAuthRoutes.js
│   │   │   ├── historyRoutes.js
│   │   │   └── studyRoutes.js
│   │   ├── services/         # Business logic services
│   │   │   ├── aiService.js
│   │   │   ├── mathService.js
│   │   │   └── wikipediaService.js
│   │   └── server.js         # Express server entry point
│   ├── ENV_EXAMPLE.txt       # Environment variables template
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/        # Reusable React components
│   │   │   ├── History.jsx
│   │   │   ├── LandingPage.jsx
│   │   │   ├── StudyForm.jsx
│   │   │   ├── StudyResults.jsx
│   │   │   └── ThemeToggle.jsx
│   │   ├── pages/            # Page components
│   │   │   ├── Home.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Signup.jsx
│   │   │   ├── Landing.jsx
│   │   │   └── ForgotPassword.jsx
│   │   ├── config/           # Configuration files
│   │   │   └── api.js
│   │   ├── App.jsx           # Main App component
│   │   └── index.jsx         # Entry point
│   ├── lib/                  # Third-party library configs
│   │   └── firebase.js
│   ├── styles/               # CSS stylesheets
│   │   ├── globals.css
│   │   └── Auth.module.css
│   ├── pages/                # Legacy Next.js pages (if any)
│   ├── ENV_EXAMPLE.txt       # Environment variables template
│   ├── vite.config.js        # Vite configuration
│   └── package.json
├── FRONTEND_ENV_SETUP.md     # Frontend environment setup guide
├── vercel.json               # Vercel deployment configuration
└── README.md
```


## Technologies Used

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **Firebase Admin SDK** - Server-side Firebase services
- **Axios** - HTTP client for API requests
- **JWT** - JSON Web Tokens for authentication
- **dotenv** - Environment variable management

### Frontend
- **React 18** - UI library
- **Vite** - Build tool and dev server
- **React Router DOM** - Client-side routing
- **Firebase Client SDK** - Client-side Firebase services
- **CSS3** - Styling with custom properties and animations

### APIs & Services
- **Wikipedia MediaWiki API** - Content source
- **HuggingFace Inference API** - AI content generation
- **Google Gemini API** - AI content generation
- **OpenAI API** - AI content generation
- **Math.js** - Mathematical expression evaluation

## AI Integration

### Supported AI Providers

1. **HuggingFace** - Primary AI provider (free tier available)
2. **Google Gemini** - Secondary AI provider (free tier available)
3. **OpenAI** - Premium AI provider (paid)

### AI Usage

- **Content Generation**: Summaries, quiz questions, and study tips
- **Problem Solving**: Mathematical expressions and algorithmic problems
- **Context Understanding**: Processing Wikipedia content for relevant study materials

### Models Used

- HuggingFace: `google/flan-t5-large`, `gpt2`, `distilgpt2`
- Google Gemini: `gemini-2.0-flash-exp`
- OpenAI: `gpt-3.5-turbo`, `gpt-4` (if configured)

## Deployment

### Live Application

- **Frontend (Production)**: [https://studentstudyyassistant.netlify.app/](https://studentstudyyassistant.netlify.app/)
- **Backend API (Production)**: [https://stt-1hs3.onrender.com](https://stt-1hs3.onrender.com)

### Backend Deployment (Render)

The backend is deployed on Render at: **https://stt-1hs3.onrender.com**

### Frontend Deployment

The frontend is deployed on:
- **Netlify**: [https://studentstudyyassistant.netlify.app/](https://studentstudyyassistant.netlify.app/)


### Test Cases

- Normal mode topic generation
- Math mode expression evaluation
- User authentication flow
- Study history tracking
- Error handling
- Responsive design




## Live Links

- **Live Application**: [https://studentstudyyassistant.netlify.app/](https://studentstudyyassistant.netlify.app/)
- **Backend API**: [https://stt-1hs3.onrender.com](https://stt-1hs3.onrender.com)

---
