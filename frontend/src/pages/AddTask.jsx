import React, { useState } from "react";
import "./AddTask.css"; // The stylesheet is imported here

function AddTask({ user }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

 
  // If the user is not logged in, show a message.
  if (!user) {
    return (
      <div className="add-task-container">
        <h2 className="form-title">➕ Add New Task</h2>
        <p className="form-message error">🚨 Please log in to add tasks.</p>
      </div>
    );
  }

  // Handles the form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setMessage("⚠️ Title is required");
      setIsSuccess(false);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/tasks`,  {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({ title, description }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage("✅ Task added successfully!");
        setIsSuccess(true);
        setTitle("");
        setDescription("");
      } else {
        setMessage(data.message || "❌ Failed to add task");
        setIsSuccess(false);
      }
    } catch (err) {
      console.error("Error adding task:", err);
      setMessage("🚨 Server error. Please try again later.");
      setIsSuccess(false);
    } finally {
      setIsLoading(false);
      setTimeout(() => setMessage(""), 3000);
    }
  };

  return (
    <div className="add-task-page-wrapper">
    <div className="add-task-container">
      <h2 className="form-title">➕ Add New Task</h2>

      <form className="task-form" onSubmit={handleSubmit}>
        {/* Form Group for Title */}
        <div className="form-group">
          <label htmlFor="taskTitle" className="form-label">
            Task Title
          </label>
          <input
            type="text"
            id="taskTitle"
            placeholder="e.g., Design the new dashboard"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        {/* Form Group for Description */}
        <div className="form-group">
          <label htmlFor="taskDescription" className="form-label">
            Description (Optional)
          </label>
          <textarea
            id="taskDescription"
            placeholder="Add more details about the task..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          ></textarea>
        </div>

        <button type="submit" disabled={isLoading}>
          {isLoading ? "⏳ Adding..." : "Add Task"}
        </button>
      </form>

      {/* The message now appears after the form */}
      {message && (
        <p className={`form-message ${isSuccess ? "success" : "error"}`}>
          {message}
        </p>
      )}
    </div>
    </div>
  );
}

export default AddTask;

