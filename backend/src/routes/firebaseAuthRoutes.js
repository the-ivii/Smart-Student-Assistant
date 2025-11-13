import express from 'express';
import { getProfile, createUserDocument } from '../controllers/firebaseAuthController.js';
import { verifyFirebaseToken } from '../middleware/firebaseAuth.js';

const router = express.Router();

// Protected routes - require Firebase authentication
router.get('/profile', verifyFirebaseToken, getProfile);

// Create user document in Firestore (called after signup)
router.post('/create-user', verifyFirebaseToken, createUserDocument);

export default router;

