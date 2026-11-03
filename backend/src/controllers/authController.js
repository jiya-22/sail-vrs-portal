const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");

exports.login = async (req, res, next) => {
  try {
    const { employeeId, password } = req.body || {};

    if (!employeeId || !password) {
      return res
        .status(400)
        .json({ error: "Employee ID and password are required." });
    }

    const [rows] = await pool.query(
      "SELECT employee_id, name, role, password_hash FROM employees WHERE employee_id = ?",
      [String(employeeId).trim()]
    );
    const employee = rows[0];

    const match =
      employee && (await bcrypt.compare(String(password), employee.password_hash));

    if (!match) {
      return res.status(401).json({ error: "Invalid Employee ID or password." });
    }

    const payload = {
      employeeId: employee.employee_id,
      name: employee.name,
      role: employee.role,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || "8h",
    });

    res.json({ token, user: payload });
  } catch (err) {
    next(err);
  }
};

exports.me = async (req, res, next) => {
  try {
    res.json({ user: req.user });
  } catch (err) {
    next(err);
  }
};
