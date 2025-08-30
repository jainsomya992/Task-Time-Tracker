// src/Dashboard.jsx

import React, { useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import {
  FaTasks,
  FaPlus,
  FaPlay,
  FaSignOutAlt,
  FaBars,
  FaChartPie,
} from "react-icons/fa";
import "./DashBoard.css";

function DashboardLayout({ onLogout }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const location = useLocation();

  const toggleSidebar = () => {
    setIsExpanded((prev) => !prev);
  };

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className={`sidebar ${isExpanded ? "expanded" : "collapsed"}`}>
        <button className="btn toggle-btn" onClick={toggleSidebar}>
          <FaBars />
        </button>

        <nav>
          <Link to="/" className={location.pathname === "/" ? "active" : ""}>
            <FaChartPie />
            {isExpanded && <span>Summary</span>}
          </Link>

          <Link
            to="/tasks"
            className={location.pathname === "/tasks" ? "active" : ""}
          >
            <FaTasks />
            {isExpanded && <span>All Tasks</span>}
          </Link>

          <Link
            to="/add"
            className={location.pathname === "/add" ? "active" : ""}
          >
            <FaPlus />
            {isExpanded && <span>Add Task</span>}
          </Link>

          <Link
            to="/ongoing"
            className={location.pathname === "/ongoing" ? "active" : ""}
          >
            <FaPlay />
            {isExpanded && <span>Ongoing</span>}
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="main-content">
        {/* Header */}
        <header className="header">
          <h1 className="page-title">Trackify</h1>
          <button className="btn logout-btn" onClick={onLogout}>
            <FaSignOutAlt />
            <span>Logout</span>
          </button>
        </header>

        {/* Content */}
        <main>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;
