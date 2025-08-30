import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";

// Import route files
import userRoutes from "./Routes/userRoutes.js";
import taskRoutes from "./Routes/taskRoutes.js";
import timelogRoutes from "./Routes/timelogRoutes.js";
import summaryRoutes from "./Routes/summaryRoutes.js";
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5050;


app.use(cors({
    origin: "https://task-time-tracker-kp7umo2cm-jainsomya992s-projects.vercel.app", // for testing, or replace with your Vercel URL in production
    credentials: true
  }));
  // Middleware
app.use(express.json()); 

// API Routes
app.use('/api/users', userRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/summary', summaryRoutes);

// Using the singular form for all timelog routes
app.use('/api/timelog', timelogRoutes);

// Health check
app.get("/", (req, res) => {
    res.send("✅ Backend is running with MongoDB");
});

// DB connection and server start
mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
        app.listen(PORT, () =>
            console.log(`🚀 Server running at http://localhost:${PORT}`)
        );
        console.log("✅ Database connected successfully!");
    })
    .catch((err) => console.error("❌ Database connection failed:", err));