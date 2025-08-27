// backend/index.js
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";

// Import route files
import userRoutes from "./Routes/userRoutes.js"; // NEW
import taskRoutes from "./Routes/taskRoutes.js"; // NEW

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5050;

// ✅ Middleware
app.use(express.json()); // Body parser for JSON
app.use(cors({ origin: "http://localhost:5173" })); // Allow frontend to make requests

// ✅ DB Test route (re-added)
app.get("/db-test", (req, res) => {
    if (mongoose.connection.readyState === 1) {
      res.send("✅ Database connected successfully!");
    } else {
      res.status(500).send("❌ Database not connected");
    }
  });
// ✅ API Routes
// Use dedicated route files for better organization
app.use('/api/users', userRoutes); // All user-related routes will start with /api/users
app.use('/api/tasks', taskRoutes); // All task-related routes will start with /api/tasks

// ✅ Health check
app.get("/", (req, res) => {
    res.send("✅ Backend is running with MongoDB");
});

// ✅ DB connection and server start
mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
        app.listen(PORT, () =>
            console.log(`🚀 Server running at http://localhost:${PORT}`)
        );
        console.log("✅ Database connected successfully!");
    })
    .catch((err) => console.error("❌ Database connection failed:", err));
