import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  FaSync,
  FaExclamationTriangle,
  FaTasks,
  FaStopwatch,
  FaPlay,
  FaStop,
  FaCheck,
  FaTrash,
  FaChevronDown,
  FaChevronUp,
  FaEdit, // NEW: Icon for the Edit button
} from "react-icons/fa";
import "./AllTasks.css";

function formatTimeMs(ms) {
  const s = Math.floor(ms / 1000) % 60;
  const m = Math.floor(ms / (1000 * 60)) % 60;
  const h = Math.floor(ms / (1000 * 60 * 60));
  return `${h}h ${m}m ${s}s`;
}

function AllTasks({ user, onTimerChange }) {
  const [tasks, setTasks] = useState([]);
  const [expanded, setExpanded] = useState({});
  const [activeTimers, setActiveTimers] = useState({});
  const [elapsedTimes, setElapsedTimes] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [startingTask, setStartingTask] = useState(null);

  // NEW: State for the Edit Task modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState(null);

  const headers = useMemo(() => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${user.token}`,
  }), [user.token]);

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("http://localhost:5050/api/tasks", { headers });
      if (!res.ok) throw new Error("Failed to load tasks");
      const data = await res.json();
      setTasks(data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [headers]);

  const fetchActiveTimelogs = useCallback(async () => {
    // ... (existing code is correct)
  }, [headers]);

  useEffect(() => {
    fetchTasks();
    fetchActiveTimelogs();
  }, [fetchTasks, fetchActiveTimelogs]);

  useEffect(() => {
    // ... (existing timer effect is correct)
  }, [activeTimers]);

  const toggleExpand = useCallback((id) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const handleStart = useCallback(async (taskId) => {
    // ... (existing code is correct)
  }, [headers, onTimerChange, startingTask, tasks]);

  const handleStop = useCallback(async (taskId) => {
    // ... (existing code is correct)
  }, [headers, activeTimers]);

  const handleComplete = useCallback(async (taskId) => {
    // ... (existing code is correct)
  }, [headers]);

  const handleDelete = useCallback(async (taskId) => {
    // ... (existing code is correct)
  }, [headers]);

  // NEW: Handlers for opening, closing, and submitting the Edit Modal
  const openEditModal = (task) => {
    setTaskToEdit(task);
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setTaskToEdit(null);
  };

  const handleUpdateTask = useCallback(async (e) => {
    e.preventDefault();
    if (!taskToEdit) return;

    const updatedTitle = e.target.title.value;
    const updatedDescription = e.target.description.value;

    try {
      const res = await fetch(`http://localhost:5050/api/tasks/${taskToEdit._id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ title: updatedTitle, description: updatedDescription }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to update task');
      }

      closeEditModal();
      await fetchTasks(); // Refresh the task list to show changes
    } catch (err) {
      // You can set an error state specific to the modal if you want
      console.error("Update error:", err);
      setError(err.message);
    }
  }, [headers, taskToEdit, fetchTasks]);


  if (loading) return <div>Loading tasks...</div>;

  return (
    <>
      <div className="all-tasks-container">
        <div className="tasks-header">
          <h2>📋 All Tasks</h2>
          <button className="btn small primary" onClick={fetchTasks}>
            <FaSync /> Refresh
          </button>
        </div>

        {error && (
          <div className="error-card">
            <FaExclamationTriangle /> <p>{error}</p>
            <button className="btn small" onClick={() => setError("")}>Dismiss</button>
          </div>
        )}

        {tasks.length === 0 ? (
          <div className="empty-state">
            <FaTasks className="icon" /> <h3>No tasks found</h3>
          </div>
        ) : (
          <div className="tasks-container">
            {tasks.map((task) => {
              const isActive = !!activeTimers[task._id];
              const currentElapsed = isActive ? elapsedTimes[task._id] || 0 : 0;
              const totalTimeMs = (task.timeSpent || 0) * 1000 + currentElapsed;

              return (
                <div key={task._id} className="task-card">
                  <div className="task-card-header">
                    <h3 className={task.status === "completed" ? "done" : ""}>{task.title}</h3>
                    <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                      <span className={`badge ${task.status}`}>
                        {task.status.replace('-', ' ')}
                      </span>
                      <button className="btn small" onClick={() => toggleExpand(task._id)}>
                        {expanded[task._id] ? <FaChevronUp /> : <FaChevronDown />}
                      </button>
                    </div>
                  </div>

                  {expanded[task._id] && (
                    <>
                      <p className="desc">{task.description || "No description provided."}</p>
                      <div className="timer-box">
                        <FaStopwatch className="icon" />
                        <span>{formatTimeMs(totalTimeMs)}</span>
                        {task.status !== "completed" && (
                          <div className="timer-buttons">
                            {isActive ? (
                              <button className="btn warning" onClick={() => handleStop(task._id)}>
                                <FaStop /> Stop
                              </button>
                            ) : (
                              <button className="btn primary" onClick={() => handleStart(task._id)} disabled={!!startingTask}>
                                <FaPlay /> Start
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="meta">
                        <span>Created: {new Date(task.createdAt).toLocaleDateString()}</span>
                        {task.status === "completed" && (
                          <span>Completed: {new Date(task.updatedAt).toLocaleDateString()}</span>
                        )}
                      </div>

                      <div className="actions">
                        {/* NEW: Edit Button added here */}
                        <button className="btn" onClick={() => openEditModal(task)}>
                          <FaEdit /> Edit
                        </button>
                        <button className="btn success" onClick={() => handleComplete(task._id)} disabled={task.status === "completed"}>
                          <FaCheck /> Complete
                        </button>
                        <button className="btn danger" onClick={() => handleDelete(task._id)}>
                          <FaTrash /> Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* NEW: Edit Task Modal */}
      {isEditModalOpen && (
        <div className="modal-overlay" onClick={closeEditModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Task</h3>
              <button onClick={closeEditModal} className="modal-close-btn">&times;</button>
            </div>
            <form onSubmit={handleUpdateTask} className="modal-form">
              <div className="form-group">
                <label htmlFor="title">Title</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  defaultValue={taskToEdit.title}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  defaultValue={taskToEdit.description}
                  rows="4"
                ></textarea>
              </div>
              <button type="submit" className="btn primary">Save Changes</button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default AllTasks;