
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


// Required on Render (it sits behind a proxy), otherwise secure cookies won't be set
app.set("trust proxy", 1);

const allowedOrigins = [
  "https://todo-application-eight-theta.vercel.app",
  "http://localhost:5173", // local dev (Vite). Change to 3000 if using CRA
];

app.use(
  cors({
    origin: (origin, callback) => {
      // allow curl/Postman (no origin) and listed frontends
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
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
    proxy: true,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // true on Render
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 24 * 60 * 60 * 1000,
    },
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
