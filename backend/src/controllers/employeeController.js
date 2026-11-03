const bcrypt = require("bcryptjs");
const pool = require("../config/db");
const { buildProfilePayload, getEmployeeWithGrading } = require("../services/profileService");

const DESIGNATION_TYPES = new Set(["executive", "non_executive"]);
const ROLES = new Set(["employee", "admin"]);

function isValidDate(value) {
  const d = new Date(value);
  return value && !Number.isNaN(d.getTime());
}

/**
 * POST /api/employees  (Admin only)
 * Register a new employee, including grading history for executives.
 */
exports.createEmployee = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const {
      employeeId,
      name,
      department,
      designation,
      designationType,
      dateOfBirth,
      dateOfJoining,
      basicPay,
      da,
      role = "employee",
      password,
      gradingHistory = [],
    } = req.body || {};

    // ---- Validation -------------------------------------------------------
    const errors = [];
    if (!employeeId || !String(employeeId).trim()) errors.push("Employee ID is required.");
    if (!name || !String(name).trim()) errors.push("Name is required.");
    if (!designationType || !DESIGNATION_TYPES.has(designationType))
      errors.push("Designation type must be 'executive' or 'non_executive'.");
    if (!isValidDate(dateOfBirth)) errors.push("A valid date of birth is required.");
    if (!isValidDate(dateOfJoining)) errors.push("A valid date of joining is required.");
    if (basicPay === undefined || Number(basicPay) < 0) errors.push("Basic pay must be a non-negative number.");
    if (da === undefined || Number(da) < 0) errors.push("DA must be a non-negative number.");
    if (!ROLES.has(role)) errors.push("Role must be 'employee' or 'admin'.");
    if (!password || String(password).length < 6)
      errors.push("Password must be at least 6 characters.");

    const dob = isValidDate(dateOfBirth) ? new Date(dateOfBirth) : null;
    const doj = isValidDate(dateOfJoining) ? new Date(dateOfJoining) : null;
    if (dob && doj && doj < dob) errors.push("Date of joining cannot be before date of birth.");

    if (designationType === "executive" && Array.isArray(gradingHistory) && gradingHistory.length) {
      gradingHistory.forEach((g, i) => {
        const year = Number(g.year);
        const credits = Number(g.creditPoints ?? g.credit_points);
        if (!Number.isInteger(year) || year < 1900 || year > 2100)
          errors.push(`Grading history row ${i + 1}: invalid year.`);
        if (!g.grade || !String(g.grade).trim())
          errors.push(`Grading history row ${i + 1}: grade is required.`);
        if (Number.isNaN(credits) || credits < 0 || credits > 100)
          errors.push(`Grading history row ${i + 1}: credit points must be between 0 and 100.`);
      });
    }

    if (errors.length) {
      return res.status(400).json({ error: errors.join(" ") });
    }

    const id = String(employeeId).trim().toUpperCase();

    const [existing] = await connection.query(
      "SELECT employee_id FROM employees WHERE employee_id = ?",
      [id]
    );
    if (existing.length) {
      return res.status(409).json({ error: `Employee ${id} already exists.` });
    }

    await connection.beginTransaction();

    const passwordHash = await bcrypt.hash(String(password), 10);

    await connection.query(
      `INSERT INTO employees
        (employee_id, name, department, designation, designation_type,
         date_of_birth, date_of_joining, basic_pay, da, role, password_hash)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      [
        id,
        String(name).trim(),
        department ? String(department).trim() : null,
        designation ? String(designation).trim() : null,
        designationType,
        dateOfBirth,
        dateOfJoining,
        Number(basicPay),
        Number(da),
        role,
        passwordHash,
      ]
    );

    if (designationType === "executive" && Array.isArray(gradingHistory)) {
      for (const g of gradingHistory) {
        await connection.query(
          "INSERT INTO grading_history (employee_id, year, grade, credit_points) VALUES (?,?,?,?)",
          [
            id,
            Number(g.year),
            String(g.grade).trim().toUpperCase(),
            Number(g.creditPoints ?? g.credit_points),
          ]
        );
      }
    }

    await connection.commit();

    const payload = await buildProfilePayload(id);
    res.status(201).json({ message: "Employee registered successfully.", employee: payload });
  } catch (err) {
    await connection.rollback().catch(() => {});
    next(err);
  } finally {
    connection.release();
  }
};

/**
 * GET /api/employees  (Admin only)
 * List employees (summary) for administration screens.
 */
exports.listEmployees = async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT employee_id, name, department, designation, designation_type,
              date_of_birth, date_of_joining, basic_pay, da, role, created_at
       FROM employees ORDER BY created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/employees/:id  (Owner or Admin)
 * Profile + live eligibility, ACP and compensation details.
 */
exports.getEmployee = async (req, res, next) => {
  try {
    const id = String(req.params.id).trim().toUpperCase();

    if (req.user.role !== "admin" && req.user.employeeId !== id) {
      return res.status(403).json({ error: "You can only access your own profile." });
    }

    const payload = await buildProfilePayload(id);
    if (!payload) {
      return res.status(404).json({ error: "Employee not found." });
    }
    res.json(payload);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/employees/:id/grading-history  (Owner or Admin)
 */
exports.getGradingHistory = async (req, res, next) => {
  try {
    const id = String(req.params.id).trim().toUpperCase();
    if (req.user.role !== "admin" && req.user.employeeId !== id) {
      return res.status(403).json({ error: "You can only access your own records." });
    }
    const { employee, gradingHistory } = await getEmployeeWithGrading(id);
    if (!employee) return res.status(404).json({ error: "Employee not found." });
    res.json(gradingHistory);
  } catch (err) {
    next(err);
  }
};
