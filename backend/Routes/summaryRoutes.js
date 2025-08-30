// backend/routes/summaryRoutes.js

import express from 'express';
import mongoose from 'mongoose';
import { protect } from '../middleware/authMiddleware.js';
import Task from '../models/Task.js';
import Timelog from '../models/Timelog.js';

const router = express.Router();

router.get('/today', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const dateString = req.query.date;

    if (!dateString || isNaN(new Date(dateString))) {
      return res.status(400).json({ message: 'A valid date parameter is required.' });
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);
    const startOfDay = new Date(`${dateString}T00:00:00.000Z`);
    const endOfDay = new Date(`${dateString}T23:59:59.999Z`);
    
    const [
      totalTimeResult,
      tasksWorkedOn,
      completedTasksResult, // MODIFIED: Renamed variable to reflect it's an array of tasks
      taskBreakdown,
      hourlyActivity,
    ] = await Promise.all([
      Timelog.aggregate([
        { $match: { user: userObjectId, startTime: { $gte: startOfDay, $lte: endOfDay } } },
        { $group: { _id: null, total: { $sum: '$duration' } } },
      ]),
      Timelog.distinct('task', {
        user: userObjectId,
        startTime: { $gte: startOfDay, $lte: endOfDay },
      }),
      // MODIFIED: Changed from countDocuments to find() to get the actual task details.
      // We only select the 'title' field to be efficient.
      Task.find({
        user: userObjectId,
        status: 'completed',
        updatedAt: { $gte: startOfDay, $lte: endOfDay },
      }).select('title'),
      Timelog.aggregate([
        { $match: { user: userObjectId, startTime: { $gte: startOfDay, $lte: endOfDay } } },
        { $group: { _id: '$task', totalDuration: { $sum: '$duration' } } },
        { $lookup: { from: 'tasks', localField: '_id', foreignField: '_id', as: 'taskDetails' } },
        { $unwind: '$taskDetails' },
        { $project: { _id: 0, title: '$taskDetails.title', timeSpent: '$totalDuration' } }
      ]),
      Timelog.aggregate([
        { $match: { user: userObjectId, startTime: { $gte: startOfDay, $lte: endOfDay } } },
        {
          $project: {
            hour: { $hour: { date: "$startTime", timezone: "Asia/Kolkata" } },
            duration: 1
          }
        },
        { $group: { _id: '$hour', totalSeconds: { $sum: '$duration' } } },
        { $sort: { _id: 1 } }
      ])
    ]);
    
    // Process the hourly data into a full 24-hour array
    const hourlyBreakdown = Array(24).fill(0);
    hourlyActivity.forEach(item => {
      hourlyBreakdown[item._id] = item.totalSeconds;
    });

    // MODIFIED: Process the result from our new `find()` query
    const tasksCompletedCount = completedTasksResult.length;
    const completedTaskTitles = completedTasksResult.map(task => task.title);

    res.json({
      totalTimeToday: totalTimeResult[0]?.total || 0,
      tasksWorkedOn: tasksWorkedOn.length,
      tasksCompleted: tasksCompletedCount, // MODIFIED: Send the count
      completedTaskTitles: completedTaskTitles, // NEW: Send the array of titles
      taskBreakdown: taskBreakdown,
      hourlyBreakdown: hourlyBreakdown,
    });

  } catch (error) {
    console.error('Error fetching summary data:', error);
    res.status(500).json({ message: 'Server error while fetching summary' });
  }
});

export default router;