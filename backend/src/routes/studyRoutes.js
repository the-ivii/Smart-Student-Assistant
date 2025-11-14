import express from 'express';
import { getStudyMaterial } from '../controllers/studyController.js';
import { optionalAuth } from '../middleware/optionalAuth.js';

const router = express.Router();

router.get('/', optionalAuth, getStudyMaterial);

export default router;
