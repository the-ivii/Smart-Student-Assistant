import express from 'express';
import { getHistory, deleteHistoryItem, clearHistory } from '../controllers/historyController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', getHistory);
router.delete('/:id', deleteHistoryItem);
router.delete('/', clearHistory);

export default router;
