import express from 'express';
import { getProfile, createUserDocument } from '../controllers/firebaseAuthController.js';
import { verifyFirebaseToken } from '../middleware/firebaseAuth.js';

const router = express.Router();

router.get('/profile', verifyFirebaseToken, getProfile);

router.post('/create-user', verifyFirebaseToken, createUserDocument);

export default router;
