import React, { useState, useEffect, useCallback } from 'react';
import { FaRegClock, FaTasks, FaRegCheckCircle, FaChevronDown } from 'react-icons/fa';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Filler,
} from 'chart.js';
import { Doughnut, Line } from 'react-chartjs-2';
import './Summary.css';

// Chart.js Registration (no changes)
ChartJS.register(
  ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title, Filler
);

// NEW: Reusable Expandable Stat Card Component
function ExpandableStatCard({ icon, label, value, color, isExpanded, onToggle, details, detailType }) {
  const formatTime = (seconds) => {
    if (isNaN(seconds) || seconds < 0) return '0h 0m';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
  };

  return (
    <div className={`stat-card expandable ${isExpanded ? 'expanded' : ''}`} style={{ borderLeftColor: color }} onClick={onToggle}>
      <div className="stat-header">
        <div className="stat-icon">{icon}</div>
        <div className="stat-info">
          <span className="stat-label">{label}</span>
          <span className="stat-value">{value}</span>
        </div>
        <FaChevronDown className="expand-chevron" />
      </div>
      {isExpanded && (
        <div className="card-details">
          {details && details.length > 0 ? (
            <ul className="details-list">
              {details.map((item, index) => (
                <li key={index} className="details-item">
                  <span>{detailType === 'worked' ? item.title : item}</span>
                  {detailType === 'worked' && <span className="details-time">{formatTime(item.timeSpent)}</span>}
                </li>
              ))}
            </ul>
          ) : (
            <p className="details-empty">No tasks to show.</p>
          )}
        </div>
      )}
    </div>
  );
}

function Summary({ user }) {
  const [summaryData, setSummaryData] = useState(null);
  const [doughnutChartData, setDoughnutChartData] = useState(null);
  const [lineChartData, setLineChartData] = useState(null);
  const [activityLogs, setActivityLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // MODIFIED: State for date navigation and card expansion
  const [currentDate, setCurrentDate] = useState(new Date());
  const [expandedCards, setExpandedCards] = useState({ workedOn: false, completed: false });

  const formatTime = (seconds) => {
    if (isNaN(seconds) || seconds < 0) return '0h 0m';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
  };

  // MODIFIED: fetchData is now wrapped in useCallback and accepts a date
  const fetchData = useCallback(async (date) => {
    try {
      setLoading(true);
      setError('');
      setSummaryData(null); // Clear previous data

      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateString = `${year}-${month}-${day}`;

      const [summaryRes, activityRes] = await Promise.all([
        fetch(`http://localhost:5050/api/summary/today?date=${dateString}`, {
          headers: { Authorization: `Bearer ${user.token}` },
        }),
        fetch(`http://localhost:5050/api/timelog/day?date=${dateString}`, {
          headers: { Authorization: `Bearer ${user.token}` },
        }),
      ]);

      if (!summaryRes.ok || !activityRes.ok) {
        throw new Error('Failed to fetch summary data.');
      }

      const summaryJson = await summaryRes.json();
      const activityJson = await activityRes.json();

      setSummaryData(summaryJson);
      setActivityLogs(activityJson);

      // Doughnut chart logic (no changes)
      if (summaryJson.taskBreakdown?.length > 0) {
        setDoughnutChartData({
          labels: summaryJson.taskBreakdown.map((task) => task.title),
          datasets: [{ data: summaryJson.taskBreakdown.map((task) => task.timeSpent), backgroundColor: ['#36A2EB', '#FF6384', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'], borderColor: '#fff', borderWidth: 2 }],
        });
      } else {
        setDoughnutChartData(null);
      }

      // Line chart logic (no changes)
      if (summaryJson.hourlyBreakdown) {
        setLineChartData({
          labels: Array.from({ length: 24 }, (_, i) => `${i}:00`),
          datasets: [{ label: 'Minutes Tracked per Hour', data: summaryJson.hourlyBreakdown.map((s) => Math.round(s / 60)), fill: true, backgroundColor: 'rgba(54, 162, 235, 0.2)', borderColor: 'rgb(54, 162, 235)', tension: 0.3 }],
        });
      } else {
        setLineChartData(null);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user.token]);

  // MODIFIED: useEffect now calls the memoized fetchData with the current date
  useEffect(() => {
    if (user?.token) {
      fetchData(currentDate);
    }
  }, [user, currentDate, fetchData]);
  
  // NEW: Handlers for date navigation and card toggling
  const handleDateChange = (days) => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setDate(newDate.getDate() + days);
      return newDate;
    });
  };

  const toggleCard = (cardName) => {
    setExpandedCards(prev => ({ ...prev, [cardName]: !prev[cardName] }));
  };

  const isToday = (date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  // Chart options (no changes)
  const lineChartOptions = { maintainAspectRatio: false, responsive: true, scales: { y: { beginAtZero: true } } };
  const doughnutChartOptions = { maintainAspectRatio: false, responsive: true, plugins: { legend: { position: 'bottom' } } };

  if (loading) return <div className="loading-state"><div className="spinner"></div></div>;
  if (error) return <div className="error-card">{error}</div>;

  return (
    <div className="summary-container">
      <div className="summary-header">
        <h2>Daily Summary</h2>
        <div className="date-navigator">
          {/* MODIFIED: Buttons are now functional */}
          <button className="btn small" onClick={() => handleDateChange(-1)}>&lt; Prev</button>
          <span>{currentDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
          <button className="btn small" onClick={() => handleDateChange(1)} disabled={isToday(currentDate)}>Next &gt;</button>
        </div>
      </div>

      <div className="stats-grid">
        {/* MODIFIED: Using the new ExpandableStatCard component */}
        <ExpandableStatCard
          icon={<FaRegClock />}
          label="Total Time Today"
          value={formatTime(summaryData?.totalTimeToday || 0)}
          color="#1890ff"
        />
        <ExpandableStatCard
          icon={<FaTasks />}
          label="Tasks Worked On"
          value={summaryData?.tasksWorkedOn || 0}
          color="#faad14"
          isExpanded={expandedCards.workedOn}
          onToggle={() => toggleCard('workedOn')}
          details={summaryData?.taskBreakdown}
          detailType="worked"
        />
        <ExpandableStatCard
          icon={<FaRegCheckCircle />}
          label="Tasks Completed"
          value={summaryData?.tasksCompleted || 0}
          color="#52c41a"
          isExpanded={expandedCards.completed}
          onToggle={() => toggleCard('completed')}
          details={summaryData?.completedTaskTitles}
          detailType="completed"
        />
      </div>

      <div className="dashboard-widgets">
        {/* Doughnut Chart */}
        <div className="widget-card">
          <h3>Task Breakdown</h3>
          <div className="chart-container">
            {doughnutChartData ? <Doughnut data={doughnutChartData} options={doughnutChartOptions} /> : <p>No time tracked today to display chart.</p>}
          </div>
        </div>

        {/* Activity Timeline */}
        <div className="widget-card">
          <h3>Today's Activity</h3>
          <div className="activity-timeline">
            {activityLogs.length > 0 ? (
              activityLogs.map((log) => (
                <div key={log._id} className="activity-item">
                  <div className="activity-details">
                    <span className="activity-task-title">{log.task?.title || 'Untitled Task'}</span>
                    <span className="activity-time-range">
                      {new Date(log.startTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} - {new Date(log.endTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                    </span>
                  </div>
                  <span className="activity-duration">{formatTime(log.duration)}</span>
                </div>
              ))
            ) : (
              <div className="activity-empty"><p>No completed activity to display.</p></div>
            )}
          </div>
        </div>

        {/* Hourly Line Chart */}
        <div className="widget-card">
          <h3>Hourly Breakdown</h3>
          <div className="chart-container line-chart">
            {lineChartData ? <Line data={lineChartData} options={lineChartOptions} /> : <p>No hourly data to display.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Summary;