import React, { useEffect, useState } from "react";
import {
  FaSync,
  FaPlay,
  FaStop,
  FaClock,
  FaCheck,
  FaExclamationTriangle,
  FaHistory, // Icon for the Timelogs button
} from "react-icons/fa";
import "./OngoingTask.css";

function OngoingTasks({ user, refreshTrigger, onTimerChange }) {
  const [tasks, setTasks] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [elapsedTimes, setElapsedTimes] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTimers, setActiveTimers] = useState({});
  const [completingTask, setCompletingTask] = useState(null);

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${user?.token}`,
  };

  // Clear messages after 3 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError("");
        setSuccess("");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  // Fetch incomplete tasks (status not "completed")
  const fetchIncompleteTasks = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/tasks`, {
        headers,
      });
      
      if (!res.ok) {
        throw new Error(`Server returned ${res.status} ${res.statusText}`);
      }
      
      const data = await res.json();
      const incompleteTasks = data.filter(task => task.status !== "completed");
      setTasks(incompleteTasks);
      await fetchActiveTimelogs(incompleteTasks);
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Failed to fetch tasks. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch active timelogs to see which tasks have active timers
  const fetchActiveTimelogs = async (incompleteTasks) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/timelog/active`, {
        headers,
      });
      
      if (res.ok) {
        const data = await res.json();
        const activeTimerMap = {};
        const updatedTimes = {};
        
        data.forEach(log => {
          if (log.task && log.task._id) {
            activeTimerMap[log.task._id] = {
              logId: log._id,
              startTime: log.startTime
            };
            // Safe date parsing
            try {
              const startDate = new Date(log.startTime);
              if (!isNaN(startDate.getTime())) {
                updatedTimes[log.task._id] = Date.now() - startDate;
              } else {
                updatedTimes[log.task._id] = 0;
              }
            } catch (e) {
              console.error("Date parsing error:", e);
              updatedTimes[log.task._id] = 0;
            }
          }
        });
        
        setActiveTimers(activeTimerMap);
        setElapsedTimes(updatedTimes);
      }
    } catch (err) {
      console.error("Error fetching active timelogs:", err);
    }
  };

  useEffect(() => {
    if (user && user.token) {
      fetchIncompleteTasks();
    } else {
      setLoading(false);
    }
  }, [user, refreshTrigger]);

  // Timer effect for active timers
  useEffect(() => {
    let interval;
    const activeTaskIds = Object.keys(activeTimers);
    
    if (activeTaskIds.length > 0) {
      interval = setInterval(() => {
        const updatedTimes = {};
        activeTaskIds.forEach(taskId => {
          const timelog = activeTimers[taskId];
          if (timelog) {
            // Safe date parsing
            try {
              const startDate = new Date(timelog.startTime);
              if (!isNaN(startDate.getTime())) {
                updatedTimes[taskId] = Date.now() - startDate;
              } else {
                updatedTimes[taskId] = 0;
              }
            } catch (e) {
              console.error("Date parsing error:", e);
              updatedTimes[taskId] = 0;
            }
          }
        });
        setElapsedTimes(updatedTimes);
      }, 1000);
    } else {
      setElapsedTimes({});
    }

    return () => clearInterval(interval);
  }, [activeTimers]);

  // Start timer for a task
  const handleStart = async (taskId) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/timelog/start/${taskId}`, {
        method: "POST",
        headers,
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to start timer");
      }
      
      const data = await res.json();
      setActiveTimers(prev => ({
        ...prev,
        [taskId]: {
          logId: data._id,
          startTime: data.startTime
        }
      }));
      
      setElapsedTimes(prev => ({
        ...prev,
        [taskId]: 0
      }));
      
      if (onTimerChange) onTimerChange();
      setSuccess("Timer started successfully");
    } catch (err) {
      console.error("Start error:", err);
      setError(err.message || "Server error while starting timer");
    }
  };

  // Stop timer for a task
  const handleStop = async (taskId) => {
    try {
      const timelog = activeTimers[taskId];
      if (!timelog) {
        setError("No active timer to stop");
        return;
      }

      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/timelog/stop/${timelog.logId}`, {
        method: "POST",
        headers,
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to stop timer");
      }
      
      // Calculate elapsed time in seconds with safe date parsing
      let elapsedTime = 0;
      try {
        const startDate = new Date(timelog.startTime);
        if (!isNaN(startDate.getTime())) {
          elapsedTime = Math.floor((Date.now() - startDate) / 1000);
        }
      } catch (e) {
        console.error("Date parsing error:", e);
      }
      
      // Update the task's timeSpent in the local state immediately
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task._id === taskId 
            ? { ...task, timeSpent: (task.timeSpent || 0) + elapsedTime } 
            : task
        )
      );
      
      // Clear the active timer
      setActiveTimers(prev => {
        const newTimers = { ...prev };
        delete newTimers[taskId];
        return newTimers;
      });
      
      // Clear the elapsed time
      setElapsedTimes(prev => {
        const newTimes = { ...prev };
        delete newTimes[taskId];
        return newTimes;
      });
      
      if (onTimerChange) onTimerChange();
      setSuccess("Timer stopped successfully");
    } catch (err) {
      console.error("Stop error:", err);
      setError(err.message || "Server error while stopping timer");
    }
  };

  const handleComplete = async (task) => {
    try {
      setCompletingTask(task._id);
  
      if (activeTimers[task._id]) {
        await handleStop(task._id);
      }
      
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/tasks/${task._id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ status: "completed" }),
      });
  
      if (!res.ok) {
        let errorMessage = `Server returned ${res.status} ${res.statusText}`;
        try {
          const errorData = await res.json();
          errorMessage = errorData.message || errorMessage;
        } catch {}
        throw new Error(errorMessage);
      }
  
      setTasks((prev) => prev.filter((t) => t._id !== task._id));
      if (onTimerChange) onTimerChange();
      setSuccess("Task marked as complete!");
    } catch (err) {
      console.error("Complete error:", err);
      setError(err.message || "Server error while completing task. Please try again.");
    } finally {
      setCompletingTask(null);
    }
  };
  
  // Format milliseconds → h m s
  const formatTime = (ms) => {
    if (ms < 0 || isNaN(ms)) {
      return "0:00:00";
    }
    const s = Math.floor(ms / 1000) % 60;
    const m = Math.floor(ms / (1000 * 60)) % 60;
    const h = Math.floor(ms / (1000 * 60 * 60));
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Format seconds → h m s (for task.timeSpent)
  const formatSeconds = (seconds) => {
    if (!seconds || seconds < 0 || isNaN(seconds)) {
      return "0:00:00";
    }
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Get status class based on task status
  const getStatusClass = (status) => {
    switch (status) {
      case "in-progress": return "status-in-progress";
      case "pending": return "status-pending";
      case "completed": return "status-completed";
      default: return "status-in-progress";
    }
  };

  return (
    <div className="ongoing-tasks-container">
      <div className="tasks-header">
        <h2 className="tasks-title">
          <FaClock className="icon" />
          Ongoing Tasks
        </h2>
        <div className="controls">
          <button className="refresh-btn" onClick={fetchIncompleteTasks} disabled={loading}>
            <FaSync className={loading ? "spinning" : ""} />
            <span>Refresh</span>
          </button>
          <button
            className="timelogs-btn"
            onClick={() => {
              // Handle navigation to the timelogs page or open a modal
              alert("Navigate to Timelogs page!");
            }}
          >
            <FaHistory />
            <span>Timelogs</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="error-state">
          <FaExclamationTriangle /> {error}
        </div>
      )}
      
      {success && (
        <div className="success-state">
          <FaCheck /> {success}
        </div>
      )}
      
      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading tasks...</p>
        </div>
      ) : tasks.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🎉</div>
          <h3 className="empty-title">No Ongoing Tasks</h3>
          <p className="empty-desc">All tasks are completed! Start a new task or check your completed tasks.</p>
        </div>
      ) : (
        <div className="tasks-grid">
          {tasks.map((task) => {
            const isActive = activeTimers[task._id];
            const currentTime = isActive ? elapsedTimes[task._id] : 0;
            const totalTime = (task.timeSpent || 0) * 1000 + currentTime;
            const isCompleting = completingTask === task._id;
            
            return (
              <div key={task._id} className="task-card">
                <div className="task-card-header">
                  <h3 className="task-title">{task.title}</h3>
                  <span className={`status ${getStatusClass(task.status)}`}>
                    {task.status || "in-progress"}
                  </span>
                </div>
                
                {task.description && (
                  <p className="task-description">
                    {task.description}
                  </p>
                )}
                
                <div className="task-timer">
                  <div className="timer-display">
                    <FaClock className="timer-icon" />
                    {formatTime(totalTime)}
                  </div>
                  <div className="timer-controls">
                    {isActive ? (
                      <button 
                        className="stop-btn"
                        onClick={() => handleStop(task._id)}
                        disabled={isCompleting}
                      >
                        <FaStop />
                        Stop
                      </button>
                    ) : (
                      <button 
                        className="start-btn"
                        onClick={() => handleStart(task._id)}
                        disabled={isCompleting}
                      >
                        <FaPlay />
                        Start
                      </button>
                    )}
                    <button 
                      className="complete-btn"
                      onClick={() => handleComplete(task)}
                      disabled={isCompleting}
                      title="Mark as complete"
                    >
                      {isCompleting ? <div className="mini-spinner"></div> : <FaCheck />}
                    </button>
                  </div>
                </div>
                
                <div className="task-meta">
                  <div className="time-info">
                    <span className="time-value">{formatSeconds(task.timeSpent)}</span>
                    <span className="time-label">total</span>
                  </div>
                  {isActive && (
                    <div className="time-info">
                      <span className="time-value">{formatTime(currentTime)}</span>
                      <span className="time-label">current</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default OngoingTasks;