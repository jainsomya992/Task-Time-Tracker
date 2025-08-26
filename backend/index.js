import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import Task from "./models/Task.js";
import cors from "cors";   // <-- added
dotenv.config();

const app = express();


// Middleware
app.use(express.json());

// ✅ Middleware
app.use(express.json());
app.use(cors({ origin: "http://localhost:5173" })); // allow frontend

// ✅ Health check
app.get("/", (req, res) => {
    res.send("✅ Backend is running with MongoDB");
  });

// ✅ DB Test route
app.get("/db-test", (req, res) => {
    if (mongoose.connection.readyState === 1) {
      res.send("✅ Database connected successfully!");
    } else {
      res.status(500).send("❌ Database not connected");
    }
  });
  
// ➕ Create Task
app.post("/tasks", async (req, res) => {
    try {
      const task = new Task(req.body);
      await task.save();
      res.status(201).json(task);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });
  // 📖 Get All Tasks
app.get("/tasks", async (req, res) => {
    const tasks = await Task.find();
    res.json(tasks);
  });
  

// ✅ Start server
const PORT = process.env.PORT || 5050;
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    app.listen(PORT, () =>
      console.log(`🚀 Server running at http://localhost:${PORT}`)
    );
  })
  .catch((err) => console.error("❌ Database connection failed:", err));


