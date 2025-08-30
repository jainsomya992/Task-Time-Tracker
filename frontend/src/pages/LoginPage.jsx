import React, { useState } from "react";   // ✅ React + Hooks
import "./LoginPage.css";     

function LoginPage({ onLogin }) {
  const [isRegister, setIsRegister] = useState(false); // ✅ toggle between login & register
  const [name, setName] = useState("");
  const [username, setUsername] = useState(""); // actually email
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (isRegister && (!name || !username || !password)) {
      setError("Please fill all fields.");
      return;
    }
    if (!isRegister && (!username || !password)) {
      setError("Please enter both email and password.");
      return;
    }

    try {
      const baseUrl = import.meta.env.VITE_API_URL; // Get the base URL

      const endpoint = isRegister
        ? `${baseUrl}/api/users/register` // Build the full URL
        : `${baseUrl}/api/users/login`;

      const body = isRegister
        ? { name, email: username, password }
        : { email: username, password };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      console.log("Login response:", data);
      if (response.ok) {
        onLogin(data); // login/register success → pass user info/token up
      } else {
        setError(data.message || "Something went wrong");
      }
    } catch (err) {
      setError("Server error. Please try again later.");
    }
  };

  return (
    <div className="login-container">
      {/* Left Side */}
      <div className="login-left">
        <div className="left-content">
          <h1>Task-Time Tracker</h1>
          <p>
            Stay organized, manage your tasks effectively, and track your
            progress in real time.
          </p>
        </div>
      </div>

      {/* Right Side */}
      <div className="login-right">
        <div className="login-box">
          <h2>{isRegister ? "Register" : "Login"}</h2>

          {error && <p className="error">{error}</p>}

          {isRegister && (
            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                name="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                required
              />
            </div>
          )}

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>

          <div className="btn-container">
            <button
              type="button"
              className="login-btn"
              onClick={handleSubmit}
            >
              {isRegister ? "Register" : "Login"}
            </button>
          </div>

          <p className="toggle-text">
            {isRegister ? "Already have an account?" : "Don’t have an account?"}{" "}
            <span
              className="toggle-link"
              onClick={() => {
                setIsRegister(!isRegister);
                setError("");
              }}
            >
              {isRegister ? "Login here" : "Register here"}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
