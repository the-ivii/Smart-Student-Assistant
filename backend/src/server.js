import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDatabase } from './config/database.js';
import './config/firebase.js';
import studyRoutes from './routes/studyRoutes.js';
import authRoutes from './routes/authRoutes.js';
import historyRoutes from './routes/historyRoutes.js';
import firebaseAuthRoutes from './routes/firebaseAuthRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

const allowedOrigins = process.env.FRONTEND_URL 
  ? [process.env.FRONTEND_URL] 
  : ['http://localhost:3001', 'http://localhost:3002', 'http://localhost:5173'];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
      return;
    }
    
    if (origin && origin.startsWith('http://localhost:')) {
      callback(null, true);
      return;
    }
    
    if (process.env.FRONTEND_URL && origin !== process.env.FRONTEND_URL) {
      callback(new Error('Not allowed by CORS'));
      return;
    }
    
    callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

app.get('/', (req, res) => {
  res.json({
    message: 'Smart Study Assistant API',
    version: '1.0.0',
    endpoints: {
      study: '/study?topic=<topic>&mode=<normal|math>',
      health: '/health'
    }
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.use('/study', studyRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/firebase', firebaseAuthRoutes);
app.use('/api/history', historyRoutes);

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: true,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

app.use((req, res) => {
  res.status(404).json({
    error: true,
    message: 'Endpoint not found'
  });
});

async function startServer() {
  try {
    await connectDatabase();
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      if (process.env.RENDER || process.env.VERCEL || process.env.RAILWAY_ENVIRONMENT) {
        console.log(`🌐 Server deployed and accessible via configured domain`);
      } else {
        console.log(`📚 Study endpoint: http://localhost:${PORT}/study?topic=YourTopic`);
        console.log(`🔐 Auth endpoints: http://localhost:${PORT}/api/auth/signup | /api/auth/login`);
        console.log(`🏥 Health check: http://localhost:${PORT}/health`);
      }
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
