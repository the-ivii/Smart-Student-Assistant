import jwt from 'jsonwebtoken';
import { adminAuth } from '../config/firebase.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export async function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      const decodedToken = await adminAuth.verifyIdToken(token);
      req.userId = decodedToken.uid;
      req.firebaseUid = decodedToken.uid;
      req.authType = 'firebase';
      return next();
    } catch (firebaseError) {
      try {
        jwt.verify(token, JWT_SECRET, (err, decoded) => {
          if (!err && decoded) {
            req.userId = decoded.userId;
            req.authType = 'jwt';
          }
          next();
        });
      } catch (jwtError) {
        next();
      }
    }
  } else {
    next();
  }
}
