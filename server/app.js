
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const session = require("express-session");
const MySQLStore = require("express-mysql-session")(session);

const pool = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const taskRoutes = require("./routes/taskRoutes");

const app = express();

const sessionStore = new MySQLStore({}, pool);

app.use(
  cors({
    origin: "https://todo-application-api-j4nk.onrender.com",
    credentials: true
  })
);

app.use(express.json());

app.use(
  session({
    name: "todo.sid",
    secret: process.env.SESSION_SECRET,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000
    }
  })
);

app.get("/api/health", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT 1 AS result");

    res.json({
      status: "success",
      message: "Backend and MySQL connected successfully",
      database: rows[0].result
    });
  } catch (error) {
    console.error("Health check error:", error.message);

    res.status(500).json({
      status: "error",
      message: "Database connection failed"
    });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);

app.use((err, req, res, next) => {
  console.error("Server error:", err.message);

  res.status(500).json({
    message: "Internal server error"
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
