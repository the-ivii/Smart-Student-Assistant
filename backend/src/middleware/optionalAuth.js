import jwt from 'jsonwebtoken';
import { adminAuth } from '../config/firebase.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

/**
 * Optional authentication middleware
 * Supports both Firebase tokens and JWT tokens
 * Sets req.userId if token is valid, but doesn't require it
 */
export async function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (token) {
    // Try Firebase token first
    try {
      const decodedToken = await adminAuth.verifyIdToken(token);
      req.userId = decodedToken.uid;
      req.firebaseUid = decodedToken.uid;
      req.authType = 'firebase';
      return next();
    } catch (firebaseError) {
      // If Firebase verification fails, try JWT
      try {
        jwt.verify(token, JWT_SECRET, (err, decoded) => {
          if (!err && decoded) {
            req.userId = decoded.userId;
            req.authType = 'jwt';
          }
          next();
        });
      } catch (jwtError) {
        // Both failed, continue without auth
        next();
      }
    }
  } else {
    // No token provided, continue without authentication
    next();
  }
}

