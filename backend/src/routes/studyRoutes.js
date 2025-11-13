import express from 'express';
import { getStudyMaterial } from '../controllers/studyController.js';
import { optionalAuth } from '../middleware/optionalAuth.js';

const router = express.Router();

// GET /study?topic=<topic>&mode=<normal|math>
// Optional authentication - saves to MongoDB if user is logged in
router.get('/', optionalAuth, getStudyMaterial);

export default router;

