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
  FaEdit,
} from "react-icons/fa";
import "./AllTasks.css";

function formatTimeMs(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const s = totalSeconds % 60;
  const m = Math.floor(totalSeconds / 60) % 60;
  const h = Math.floor(totalSeconds / 3600);
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
  const [stoppingTask, setStoppingTask] = useState(null);
  const [completingTask, setCompletingTask] = useState(null);
  const [deletingTask, setDeletingTask] = useState(null);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState(null);

  const headers = useMemo(() => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${user.token}`,
  }), [user.token]);

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch("http://localhost:5050/api/tasks", { headers });
      if (!res.ok) throw new Error("Failed to load tasks");
      const data = await res.json();
      setTasks(data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
      
      // Reset elapsed times when tasks are refreshed
      setElapsedTimes({});
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [headers]);

  const fetchActiveTimelogs = useCallback(async () => {
    try {
      const res = await fetch("http://localhost:5050/api/timelog/active", { headers });
      if (!res.ok) throw new Error("Failed to load active timelogs");
      const data = await res.json();
      const activeMap = {};
      const elapsedMap = {};
      data.forEach((log) => {
        if (log.task && log.task._id) {
          activeMap[log.task._id] = { logId: log._id, startTime: log.startTime };
          elapsedMap[log.task._id] = Date.now() - new Date(log.startTime).getTime();
        }
      });
      setActiveTimers(activeMap);
      setElapsedTimes(elapsedMap);
    } catch (err) {
      console.error("Failed to fetch active timelogs:", err);
    }
  }, [headers]);

  useEffect(() => {
    if (user?.token) {
        fetchTasks();
        fetchActiveTimelogs();
    }
  }, [user, fetchTasks, fetchActiveTimelogs]);

  useEffect(() => {
    const ids = Object.keys(activeTimers);
    if (!ids.length) return;
    const interval = setInterval(() => {
      setElapsedTimes(prev => {
        const updated = { ...prev };
        ids.forEach((id) => {
          const log = activeTimers[id];
          if (log) updated[id] = Date.now() - new Date(log.startTime).getTime();
        });
        return updated;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [activeTimers]);

  const toggleExpand = useCallback((id) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);
  
  const handleStart = useCallback(async (taskId) => {
    if (startingTask) return;
    setStartingTask(taskId);
    try {
      const res = await fetch(`http://localhost:5050/api/timelog/start/${taskId}`, {
        method: "POST",
        headers,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to start task");
  
      setActiveTimers((prev) => ({ ...prev, [taskId]: { logId: data._id, startTime: data.startTime } }));
      
      // This line ensures the visual timer starts from 0.
      setElapsedTimes((prev) => ({ ...prev, [taskId]: 0 }));
  
    } catch (err) {
      setError(err.message);
    } finally {
      setStartingTask(null);
    }
  }, [headers, startingTask]);
  
  const handleStop = useCallback(async (taskId) => {
    try {
      const timelog = activeTimers[taskId];
      if (!timelog) return setError("No active timer for this task");
  
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/timelog/stop/${timelog.logId}`, {
        method: "POST",
        headers,
      });
  
      if (!res.ok) throw new Error((await res.json()).message || "Failed to stop timer on server");
  
      // ✅ clear local timers immediately
      setActiveTimers(prev => {
        const copy = { ...prev };
        delete copy[taskId];
        return copy;
      });
  
      setElapsedTimes(prev => {
        const copy = { ...prev };
        copy[taskId] = 0;
        return copy;
      });
  
      // ✅ now refresh task list from backend
      await fetchTasks();
  
    } catch (err) {
      setError(err.message);
    }
  }, [headers, activeTimers, fetchTasks]);
  

  const handleComplete = useCallback(async (taskId) => {
    try {
      setCompletingTask(taskId);
      if (activeTimers[taskId]) await handleStop(taskId);

      const res = await fetch(`http://localhost:5050/api/tasks/${taskId}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ status: "completed" }),
      });
      if (!res.ok) throw new Error((await res.json()).message || "Failed to complete task");
      
      setTasks(prevTasks =>
        prevTasks.map(t =>
          t._id === taskId ? { ...t, status: "completed", updatedAt: new Date().toISOString() } : t
        )
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setCompletingTask(null);
    }
  }, [headers, activeTimers, handleStop]);

  const handleDelete = useCallback(async (taskId) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;
    try {
      setDeletingTask(taskId);
      const res = await fetch(`http://localhost:5050/api/tasks/${taskId}`, {
        method: "DELETE",
        headers,
      });
      if (!res.ok) throw new Error("Failed to delete task");
      setTasks(prev => prev.filter(t => t._id !== taskId));
    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingTask(null);
    }
  }, [headers]);

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

      if (!res.ok) throw new Error((await res.json()).message || 'Failed to update task');

      closeEditModal();
      await fetchTasks();
    } catch (err) {
      console.error("Update error:", err);
      setError(err.message);
    }
  }, [headers, taskToEdit, fetchTasks]);

  if (loading) return <div className="loading">Loading tasks...</div>;

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
              const currentElapsed = elapsedTimes[task._id] || 0;
              const totalTimeMs = (task.timeSpent || 0) * 1000 + (isActive ? currentElapsed : 0);

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
                              <button 
                                className="btn warning" 
                                onClick={() => handleStop(task._id)}
                                disabled={stoppingTask === task._id}
                              >
                                {stoppingTask === task._id ? "Stopping..." : <><FaStop /> Stop</>}
                              </button>
                            ) : (
                              <button 
                                className="btn primary" 
                                onClick={() => handleStart(task._id)} 
                                disabled={!!startingTask}
                              >
                                {startingTask === task._id ? "Starting..." : <><FaPlay /> Start</>}
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
                        <span>Total: {formatTimeMs(totalTimeMs)}</span>
                      </div>

                      <div className="actions">
                        <button className="btn" onClick={() => openEditModal(task)}>
                          <FaEdit /> Edit
                        </button>
                        <button 
                          className="btn success" 
                          onClick={() => handleComplete(task._id)} 
                          disabled={task.status === "completed" || completingTask === task._id}
                        >
                          {completingTask === task._id ? "Completing..." : <><FaCheck /> Complete</>}
                        </button>
                        <button 
                          className="btn danger" 
                          onClick={() => handleDelete(task._id)}
                          disabled={deletingTask === task._id}
                        >
                          {deletingTask === task._id ? "Deleting..." : <><FaTrash /> Delete</>}
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