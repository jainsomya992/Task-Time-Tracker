// src/App.jsx

import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import AddTask from "./pages/AddTask.jsx";
import AllTasks from "./pages/AllTasks.jsx";
import OngoingTasks from "./pages/OngoingTask.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import DashboardLayout from "./DashBoard.jsx";
import Summary from "./pages/Summary.jsx"; // 1. Import the new Summary component


function App() {
  const [user, setUser] = useState(null);
  const [refreshOngoing, setRefreshOngoing] = useState(0);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (storedUser) setUser(storedUser);
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  const triggerOngoingRefresh = () => {
    setRefreshOngoing(prev => prev + 1);
  };

  const PrivateRoute = ({ children }) => {
    return user ? children : <Navigate to="/login" />;
  };

  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={!user ? <LoginPage onLogin={handleLogin} /> : <Navigate to="/" />}
        />
        
        <Route
          path="/"
          element={
            <PrivateRoute>
              <DashboardLayout onLogout={handleLogout} />
            </PrivateRoute>
          }
        >
          {/* 2. Set Summary as the main page and move AllTasks to a new route */}
          <Route index element={<Summary user={user} />} /> 
          <Route path="tasks" element={<AllTasks user={user} onTimerChange={triggerOngoingRefresh} />} />
          <Route path="add" element={<AddTask user={user} />} />
          <Route path="ongoing" element={<OngoingTasks user={user} refreshTrigger={refreshOngoing} />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;