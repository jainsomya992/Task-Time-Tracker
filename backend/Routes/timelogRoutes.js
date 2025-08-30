// backend/routes/timelogRoutes.js
import express from "express";
import Timelog from "../models/Timelog.js";
import { protect } from "../middleware/authMiddleware.js";
import Task from "../models/Task.js";

const router = express.Router();

// 🔹 Helper function to get IST day boundaries
function getISTDayBounds(dateString) {
  const start = new Date(`${dateString}T00:00:00+05:30`);
  const end = new Date(`${dateString}T23:59:59.999+05:30`);
  return { startOfDay: start, endOfDay: end };
}

// @desc    Get all active timelogs for a user
// @route   GET /api/timelog/active
// @access  Private
router.get("/active", protect, async (req, res) => {
  try {
    const activeLogs = await Timelog.find({ user: req.user.id, endTime: null })
      .populate("task");
    res.json(activeLogs);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch active logs", error: err.message });
  }
});

// @desc    Start time tracking
// @route   POST /api/timelog/start/:taskId
// @access  Private
router.post("/start/:taskId", protect, async (req, res) => {
  try {
    const existingLog = await Timelog.findOne({
      user: req.user.id,
      endTime: null,
    });
    if (existingLog) {
      return res.status(400).json({
        message: "A task is already being tracked. Please stop it first.",
      });
    }

    const timelog = new Timelog({
      user: req.user.id,
      task: req.params.taskId,
      startTime: new Date(),
    });

    await timelog.save();

    const populatedLog = await Timelog.findById(timelog._id).populate("task");
    res.status(201).json(populatedLog);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to start timelog", error: err.message });
  }
});

// @desc    Stop time tracking
// @route   POST /api/timelog/stop/:logId
// @access  Private
router.post("/stop/:logId", protect, async (req, res) => {
  try {
    const { logId } = req.params;
    const log = await Timelog.findById(logId);

    if (!log || log.user.toString() !== req.user.id || log.endTime) {
      return res.status(400).json({ message: "Invalid request" });
    }

    log.endTime = new Date();
    const durationInSeconds = Math.floor(
      (log.endTime - log.startTime) / 1000
    );
    log.duration = durationInSeconds;
    await log.save();

    await Task.findByIdAndUpdate(log.task, {
      $inc: { timeSpent: durationInSeconds },
    });

    res.json({ message: "Timer stopped successfully", log });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to stop timelog", error: err.message });
  }
});

// @desc    Total time spent on a task
// @route   GET /api/timelog/total/:taskId
// @access  Private
router.get("/total/:taskId", protect, async (req, res) => {
  try {
    const logs = await Timelog.find({
      task: req.params.taskId,
      user: req.user.id,
    });
    let total = 0;
    logs.forEach((log) => {
      if (log.endTime) {
        total += new Date(log.endTime) - new Date(log.startTime);
      }
    });
    res.json({
      totalTimeMs: total,
      totalTimeMinutes: Math.floor(total / 60000),
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to calculate total time", error: err.message });
  }
});

// ✅ NEW ROUTE - Timelogs for a specific day (IST + duration recomputed)
// @route   GET /api/timelog/day
router.get("/day", protect, async (req, res) => {
  try {
    const dateString = req.query.date;
    if (!dateString) {
      return res.status(400).json({ message: "Date parameter is required." });
    }

    const { startOfDay, endOfDay } = getISTDayBounds(dateString);

    const logs = await Timelog.find({
      user: req.user.id,
      startTime: { $gte: startOfDay, $lte: endOfDay },
      endTime: { $ne: null },
    })
      .populate("task", "title")
      .sort({ startTime: -1 });

    // 🔥 Always compute duration from timestamps
    const logsWithDuration = logs.map((log) => {
      const start = new Date(log.startTime);
      const end = new Date(log.endTime);
      const durationSeconds = Math.max(
        1,
        Math.floor((end - start) / 1000) // at least 1 sec
      );

      return {
        ...log.toObject(),
        duration: durationSeconds,
      };
    });

    res.json(logsWithDuration);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch day's logs", error: err.message });
  }
});


// @desc    All timelogs for a task (generic route must come last!)
// @route   GET /api/timelog/:taskId
router.get("/:taskId", protect, async (req, res) => {
  try {
    const logs = await Timelog.find({
      task: req.params.taskId,
      user: req.user.id,
    });
    res.json(logs);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch timelogs", error: err.message });
  }
});

export default router;
