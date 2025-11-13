import express from 'express';
import { getHistory, deleteHistoryItem, clearHistory } from '../controllers/historyController.js';
import { adminAuth } from '../config/firebase.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Support both Firebase and JWT authentication
router.use(async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      error: true,
      message: 'Access token required'
    });
  }

  // Try Firebase first
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    req.userId = decodedToken.uid;
    req.firebaseUid = decodedToken.uid;
    req.authType = 'firebase';
    return next();
  } catch (firebaseError) {
    // If Firebase fails, try JWT
    try {
      jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
          return res.status(403).json({
            error: true,
            message: 'Invalid or expired token'
          });
        }
        req.userId = decoded.userId;
        req.authType = 'jwt';
        next();
      });
    } catch (jwtError) {
      return res.status(403).json({
        error: true,
        message: 'Invalid or expired token'
      });
    }
  }
});

router.get('/', getHistory);
router.delete('/:id', deleteHistoryItem);
router.delete('/', clearHistory);

export default router;

