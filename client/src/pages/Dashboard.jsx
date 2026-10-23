
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { clearUser } from "../redux/authSlice";

function Dashboard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);

  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const fetchTasks = async () => {
    try {
      const response = await api.get("/tasks");
      setTasks(response.data);
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Unable to load tasks"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleAddTask = async (event) => {
    event.preventDefault();
    setMessage("");

    if (!title.trim()) {
      setMessage("Please enter a task title");
      return;
    }

    try {
      const response = await api.post("/tasks", {
        title: title.trim(),
        description: description.trim()
      });

      setTasks((previousTasks) => [
        response.data.task,
        ...previousTasks
      ]);

      setTitle("");
      setDescription("");
      setMessage("Task added successfully");
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Unable to add task"
      );
    }
  };

  const handleToggle = async (task) => {
    try {
      await api.patch(`/tasks/${task.id}`, {
        completed: !Boolean(task.completed)
      });

      setTasks((previousTasks) =>
        previousTasks.map((item) =>
          item.id === task.id
            ? { ...item, completed: !Boolean(item.completed) }
            : item
        )
      );
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Unable to update task"
      );
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/tasks/${id}`);

      setTasks((previousTasks) =>
        previousTasks.filter((task) => task.id !== id)
      );

      setMessage("Task deleted successfully");
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Unable to delete task"
      );
    }
  };

  const handleEdit = async (task) => {
    const newTitle = window.prompt("Edit task title:", task.title);

    if (newTitle === null || !newTitle.trim()) {
      return;
    }

    try {
      await api.patch(`/tasks/${task.id}`, {
        title: newTitle.trim()
      });

      setTasks((previousTasks) =>
        previousTasks.map((item) =>
          item.id === task.id
            ? { ...item, title: newTitle.trim() }
            : item
        )
      );

      setMessage("Task updated successfully");
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Unable to edit task"
      );
    }
  };

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
      dispatch(clearUser());
      navigate("/login", { replace: true });
    } catch (error) {
      setMessage("Unable to log out. Please try again.");
    }
  };

  return (
    <main className="dashboard">
      <header className="dashboard-header">
        <div>
          <h1>My Tasks</h1>
          <p>Welcome, {user?.name || "User"}!</p>
        </div>

        <button className="logout-button" onClick={handleLogout}>
          Log Out
        </button>
      </header>

      <section className="task-form-card">
        <h2>Add a New Task</h2>

        <form onSubmit={handleAddTask}>
          <label htmlFor="task-title">Task title</label>
          <input
            id="task-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="What do you need to do?"
            required
          />

          <label htmlFor="task-description">Description</label>
          <textarea
            id="task-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Add some details (optional)"
            rows={3}
          />

          <button type="submit">Add Task</button>
        </form>
      </section>

      {message && <p className="task-message" role="status">{message}</p>}

      <section className="task-list-section">
        <h2>Your Tasks ({tasks.length})</h2>

        {loading ? (
          <p>Loading tasks...</p>
        ) : tasks.length === 0 ? (
          <p>No tasks yet. Add your first task!</p>
        ) : (
          <div className="task-list">
            {tasks.map((task) => (
              <article className="task-item" key={task.id}>
                <input
                  type="checkbox"
                  checked={Boolean(task.completed)}
                  onChange={() => handleToggle(task)}
                  aria-label={`Mark ${task.title} as completed`}
                />

                <div className="task-details">
                  <h3 className={task.completed ? "completed" : ""}>
                    {task.title}
                  </h3>

                  {task.description && <p>{task.description}</p>}
                </div>

                <button
                  type="button"
                  onClick={() => handleEdit(task)}
                >
                  Edit
                </button>

                <button
                  type="button"
                  className="delete-button"
                  onClick={() => handleDelete(task.id)}
                >
                  Delete
                </button>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export default Dashboard;
