const API_URL = "http://localhost:5050"; // backend URL

// Fetch all tasks
export const getTasks = async () => {
  const res = await fetch(`${API_URL}/tasks`);
  return res.json();
};

// Create a new task
export const createTask = async (task) => {
  const res = await fetch(`${API_URL}/tasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(task),
  });
  return res.json();
};
