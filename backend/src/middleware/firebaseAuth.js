import { adminAuth } from '../config/firebase.js';

export async function verifyFirebaseToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      error: true,
      message: 'Access token required'
    });
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    
    req.firebaseUid = decodedToken.uid;
    req.firebaseUser = decodedToken;
    
    next();
  } catch (error) {
    console.error('Firebase token verification error:', error);
    return res.status(403).json({
      error: true,
      message: 'Invalid or expired token'
    });
  }
}
