# Smart Study Assistant

An AI-powered full-stack web application that generates personalized study materials including summaries, quizzes, and study tips from any topic using Wikipedia and AI APIs.

![Status](https://img.shields.io/badge/Status-Active-success)
![React](https://img.shields.io/badge/React-18.2.0-blue)
![Node.js](https://img.shields.io/badge/Node.js-Express-green)
![Vite](https://img.shields.io/badge/Vite-5.0.0-purple)
![Firebase](https://img.shields.io/badge/Firebase-Authentication-orange)

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
   git clone https://github.com/guptapratykshh/stt.git
   cd Smart-Student-Assistant-master
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

## API Documentation

### Base URL

- **Development**: `http://localhost:4000`
- **Production**: `https://stt-1hs3.onrender.com`

### Main Endpoint

**GET** `/study?topic=<topic>&mode=<normal|math>`

Generates study materials for a given topic.

#### Parameters

- `topic` (required): The study topic (e.g., "Python", "Photosynthesis", "2 + 5")
- `mode` (optional): `normal` (default) or `math`

#### Response Format

**Normal Mode:**
```json
{
  "success": true,
  "topic": "Python",
  "mode": "normal",
  "timestamp": "2024-11-14T10:30:00.000Z",
  "source": "https://en.wikipedia.org/wiki/Python",
  "summary": [
    "Python is a high-level programming language known for its simplicity.",
    "It supports multiple programming paradigms including procedural and object-oriented.",
    "Python has a large standard library and active community."
  ],
  "quiz": [
    {
      "question": "What is Python primarily known for?",
      "options": [
        "A) Speed",
        "B) Simplicity and readability",
        "C) Memory efficiency",
        "D) Low-level access"
      ],
      "correctAnswer": "B",
      "explanation": "Python is primarily known for its simplicity and readability."
    }
    // ... 2 more questions
  ],
  "studyTip": "Practice coding regularly and work on small projects to reinforce concepts."
}
```

**Math Mode:**
```json
{
  "success": true,
  "topic": "2 + 5",
  "mode": "math",
  "timestamp": "2024-11-14T10:30:00.000Z",
  "source": null,
  "summary": [
    "The expression evaluates to 7",
    "Mathematical expressions follow PEMDAS order of operations",
    "Basic arithmetic is fundamental to advanced mathematics"
  ],
  "mathQuestion": {
    "question": "What is the result of: 2 + 5?",
    "answer": "7",
    "explanation": "2 + 5 = 7. Adding 2 and 5 gives us 7."
  },
  "studyTip": "Practice mental math regularly to improve calculation speed."
}
```

#### Error Responses

**400 Bad Request:**
```json
{
  "error": true,
  "message": "Topic parameter is required"
}
```

**500 Internal Server Error:**
```json
{
  "error": true,
  "message": "Failed to generate study materials",
  "details": "Error details"
}
```

### Other Endpoints

#### Health Check
- **GET** `/health` - Returns server health status
  ```json
  {
    "status": "healthy",
    "timestamp": "2024-11-14T10:30:00.000Z"
  }
  ```

#### Authentication (Firebase)
- **POST** `/api/firebase/create-user` - Create user in Firestore
- **GET** `/api/firebase/user/:uid` - Get user information

#### Study History
- **GET** `/api/history` - Get user's study history (requires authentication)
- **DELETE** `/api/history` - Clear all history (requires authentication)
- **DELETE** `/api/history/:id` - Delete specific history item (requires authentication)

## Usage Examples

### Normal Mode

1. **Simple Topic:**
   ```
   GET /study?topic=Python&mode=normal
   ```

2. **Question Format:**
   ```
   GET /study?topic=What%20is%20Machine%20Learning?&mode=normal
   ```

3. **Complex Topic:**
   ```
   GET /study?topic=Quantum%20Computing&mode=normal
   ```

### Math Mode

1. **Simple Expression:**
   ```
   GET /study?topic=2+5&mode=math
   ```

2. **Complex Expression:**
   ```
   GET /study?topic=(10+5)/3&mode=math
   ```

3. **Algorithmic Problem:**
   ```
   GET /study?topic=What%20is%20the%20time%20complexity%20of%20linear%20search?&mode=math
   ```

## Environment Variables

### Backend (.env)

Create a `.env` file in the `backend/` directory:

```env
# Server Configuration
PORT=4000
NODE_ENV=development
FRONTEND_URL=https://studentstudyyassistant.netlify.app
# For local development: FRONTEND_URL=http://localhost:3001

# AI API Keys (at least one required)
HUGGINGFACE_API_KEY=your_huggingface_key_here
GEMINI_API_KEY=your_gemini_key_here
OPENAI_API_KEY=your_openai_key_here

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority
JWT_SECRET=your_jwt_secret_key_here

# Firebase Admin SDK (for authentication)
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY_ID=your_private_key_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your_client_email
FIREBASE_CLIENT_ID=your_client_id
```

### Frontend (.env)

Create a `.env` file in the `frontend/` directory:

```env
# Backend API URL
VITE_API_URL=https://stt-1hs3.onrender.com
# For local development: VITE_API_URL=http://localhost:4000

# Firebase Configuration (Client-side)
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

> **Note**: See `FRONTEND_ENV_SETUP.md` for detailed Firebase setup instructions.

## Technologies Used

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **MongoDB** - NoSQL database (via Mongoose)
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
- **Vercel**: (Can be deployed using `vercel.json` configuration)

#### Deployment Configuration

- **Netlify**: See `frontend/netlify.toml` for configuration
- **Vercel**: See `frontend/vercel.json` for configuration

Both platforms are configured with:
- Build command: `npm run build`
- Output directory: `dist`
- SPA routing: All routes redirect to `index.html`

## Testing

### Manual Testing

1. **Health Check**
   ```bash
   curl https://stt-1hs3.onrender.com/health
   ```

2. **Normal Mode Request**
   ```bash
   curl "https://stt-1hs3.onrender.com/study?topic=Python&mode=normal"
   ```

3. **Math Mode Request**
   ```bash
   curl "https://stt-1hs3.onrender.com/study?topic=2+5&mode=math"
   ```

### Test Cases

- Normal mode topic generation
- Math mode expression evaluation
- User authentication flow
- Study history tracking
- Error handling
- Responsive design

## Scripts

### Backend Scripts

```bash
npm run dev    # Start development server with auto-reload
npm start      # Start production server
npm test       # Run tests
```

### Frontend Scripts

```bash
npm run dev    # Start development server (http://localhost:3001)
npm run build  # Build for production
npm run preview # Preview production build
```

## Security

- Environment variables are stored securely and not committed to git
- Firebase authentication with secure token management
- CORS configured for allowed origins only
- Input validation and sanitization
- Error messages don't expose sensitive information

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Author

**Pratyksh Gupta**

- GitHub: [@guptapratykshh](https://github.com/guptapratykshh)
- Repository: [stt](https://github.com/guptapratykshh/stt)

## Acknowledgments

- Wikipedia for providing comprehensive educational content
- HuggingFace, Google, and OpenAI for AI services
- Firebase for authentication infrastructure
- All contributors and users of this project

## Support

For questions, issues, or feature requests, please open an issue on [GitHub](https://github.com/guptapratykshh/stt/issues).

## Live Links

- **Live Application**: [https://studentstudyyassistant.netlify.app/](https://studentstudyyassistant.netlify.app/)
- **Backend API**: [https://stt-1hs3.onrender.com](https://stt-1hs3.onrender.com)
- **GitHub Repository**: [https://github.com/guptapratykshh/stt](https://github.com/guptapratykshh/stt)

---