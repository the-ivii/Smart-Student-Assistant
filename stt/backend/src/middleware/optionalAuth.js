import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Allows requests without auth, but if a JWT is provided, attaches userId
export async function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return next();

  try {
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (!err && decoded) {
        req.userId = decoded.userId;
      }
      next();
    });
  } catch (jwtError) {
    next();
  }
}
