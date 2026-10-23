
const pool = require("../config/db");

exports.getTasks = async (req, res) => {
  try {
    const [tasks] = await pool.execute(
      "SELECT id, title, description, completed, created_at FROM tasks WHERE user_id = ? ORDER BY created_at DESC",
      [req.session.userId]
    );

    res.json(tasks);
  } catch (error) {
    console.error("Get tasks error:", error.message);
    res.status(500).json({ message: "Unable to fetch tasks" });
  }
};

exports.createTask = async (req, res) => {
  try {
    const { title, description = "" } = req.body || {};

    if (typeof title !== "string" || !title.trim()) {
      return res.status(400).json({
        message: "Task title is required"
      });
    }

    if (typeof description !== "string") {
      return res.status(400).json({
        message: "Invalid description"
      });
    }

    const [result] = await pool.execute(
      "INSERT INTO tasks (user_id, title, description) VALUES (?, ?, ?)",
      [req.session.userId, title.trim(), description.trim()]
    );

    const [tasks] = await pool.execute(
      "SELECT id, title, description, completed, created_at FROM tasks WHERE id = ? AND user_id = ?",
      [result.insertId, req.session.userId]
    );

    res.status(201).json({
      message: "Task created successfully",
      task: tasks[0]
    });
  } catch (error) {
    console.error("Create task error:", error.message);
    res.status(500).json({ message: "Unable to create task" });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const { title, description, completed } = req.body || {};

    if (
      (title !== undefined &&
        (typeof title !== "string" || !title.trim())) ||
      (description !== undefined &&
        typeof description !== "string") ||
      (completed !== undefined &&
        typeof completed !== "boolean")
    ) {
      return res.status(400).json({
        message: "Invalid task data"
      });
    }

    if (
      title === undefined &&
      description === undefined &&
      completed === undefined
    ) {
      return res.status(400).json({
        message: "Provide a field to update"
      });
    }

    const fields = [];
    const values = [];

    if (title !== undefined) {
      fields.push("title = ?");
      values.push(title.trim());
    }

    if (description !== undefined) {
      fields.push("description = ?");
      values.push(description.trim());
    }

    if (completed !== undefined) {
      fields.push("completed = ?");
      values.push(completed);
    }

    values.push(req.params.id, req.session.userId);

    const [result] = await pool.execute(
      `UPDATE tasks SET ${fields.join(", ")} WHERE id = ? AND user_id = ?`,
      values
    );

    if (result.affectedRows === 0) {
      const [existing] = await pool.execute(
        "SELECT id FROM tasks WHERE id = ? AND user_id = ?",
        [req.params.id, req.session.userId]
      );

      if (existing.length === 0) {
        return res.status(404).json({
          message: "Task not found"
        });
      }
    }

    res.json({ message: "Task updated successfully" });
  } catch (error) {
    console.error("Update task error:", error.message);
    res.status(500).json({ message: "Unable to update task" });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const [result] = await pool.execute(
      "DELETE FROM tasks WHERE id = ? AND user_id = ?",
      [req.params.id, req.session.userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Task not found"
      });
    }

    res.json({ message: "Task deleted successfully" });
  } catch (error) {
    console.error("Delete task error:", error.message);
    res.status(500).json({ message: "Unable to delete task" });
  }
};
