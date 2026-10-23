
const bcrypt = require("bcrypt");
const pool = require("../config/db");

exports.signup = async (req, res) => {
  try {
    const { name, email, password } = req.body || {};

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email and password are required"
      });
    }

    if (typeof name !== "string" ||
        typeof email !== "string" ||
        typeof password !== "string") {
      return res.status(400).json({
        message: "Invalid input"
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must contain at least 8 characters"
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !name.trim()) {
      return res.status(400).json({
        message: "Name and email cannot be empty"
      });
    }

    const [existingUsers] = await pool.execute(
      "SELECT id FROM users WHERE email = ?",
      [normalizedEmail]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({
        message: "Email is already registered"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.execute(
      "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
      [name.trim(), normalizedEmail, hashedPassword]
    );

    return res.status(201).json({
      message: "Account created successfully"
    });
  } catch (error) {
    console.error("Signup error:", error.message);

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        message: "Email is already registered"
      });
    }

    return res.status(500).json({
      message: "Internal server error"
    });
  }
};


exports.login = async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        message: "Email and password are required"
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const [users] = await pool.execute(
      "SELECT id, name, email, password FROM users WHERE email = ?",
      [normalizedEmail]
    );

    if (users.length === 0) {
      return res.status(401).json({
        message: "Invalid email or password"
      });
    }

    const user = users[0];
    const isPasswordValid = await bcrypt.compare(
      password,
      user.password
    );

    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Invalid email or password"
      });
    }

    req.session.userId = user.id;

    return res.json({
      message: "Login successful",
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error("Login error:", error.message);

    return res.status(500).json({
      message: "Internal server error"
    });
  }
};

exports.me = async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({
        message: "Not logged in"
      });
    }

    const [users] = await pool.execute(
      "SELECT id, name, email FROM users WHERE id = ?",
      [req.session.userId]
    );

    if (users.length === 0) {
      return res.status(401).json({
        message: "User not found"
      });
    }

    res.json({
      message: "Session is active",
      user: users[0]
    });
  } catch (error) {
    console.error("Session check error:", error.message);

    res.status(500).json({
      message: "Internal server error"
    });
  }
};


exports.logout = (req, res) => {
  req.session.destroy((error) => {
    if (error) {
      console.error("Logout error:", error.message);

      return res.status(500).json({
        message: "Unable to log out"
      });
    }

    res.clearCookie("todo.sid");

    return res.json({
      message: "Logout successful"
    });
  });
};


