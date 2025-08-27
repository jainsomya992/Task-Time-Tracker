import express from 'express';
const router = express.Router();
import { getTasks, addTask, updateTask, deleteTask } from '../Controllers/taskController.js';
import { protect } from '../middleware/authMiddleware.js';

router.route('/').get(protect, getTasks).post(protect, addTask);
router.route('/:id').put(protect, updateTask).delete(protect, deleteTask);

export default router;