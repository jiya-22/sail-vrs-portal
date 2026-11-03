const pool = require("../config/db");
const { buildProfilePayload } = require("../services/profileService");

/**
 * POST /api/applications  (Employee)
 * Submit a VRS application after re-validating eligibility, ACP and
 * duplicate pending applications. Compensation values are snapshotted
 * at the time of submission. FCFS order is preserved via submitted_at.
 */
exports.submitApplication = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const employeeId = req.user.employeeId;

    const profile = await buildProfilePayload(employeeId);
    if (!profile) {
      return res.status(404).json({ error: "Employee not found." });
    }

    // Re-validate eligibility & ACP server-side (never trust the client)
    if (!profile.eligibility.eligible) {
      return res.status(400).json({
        error: `You are not eligible for VRS. ${profile.eligibility.reason}`,
      });
    }

    await connection.beginTransaction();

    const [pending] = await connection.query(
      "SELECT application_id FROM vrs_applications WHERE employee_id = ? AND status = 'Pending' FOR UPDATE",
      [employeeId]
    );
    if (pending.length) {
      await connection.rollback();
      return res.status(409).json({
        error: "You already have a pending VRS application. Only one pending application is allowed at a time.",
      });
    }

    const { formulaA, formulaB, finalCompensation } = profile.compensation;

    const [result] = await connection.query(
      `INSERT INTO vrs_applications
         (employee_id, formula_a, formula_b, final_compensation, status, submitted_at)
       VALUES (?,?,?,?, 'Pending', CURRENT_TIMESTAMP)`,
      [employeeId, formulaA, formulaB, finalCompensation]
    );

    await connection.commit();

    const [rows] = await pool.query(
      "SELECT * FROM vrs_applications WHERE application_id = ?",
      [result.insertId]
    );

    res.status(201).json({
      message: "VRS application submitted successfully.",
      application: rows[0],
    });
  } catch (err) {
    await connection.rollback().catch(() => {});
    next(err);
  } finally {
    connection.release();
  }
};

/**
 * GET /api/applications
 * Admin  -> every application, ordered FCFS (submitted_at ASC)
 * Employee -> only their own applications (latest first)
 */
exports.listApplications = async (req, res, next) => {
  try {
    if (req.user.role === "admin") {
      const [rows] = await pool.query(
        `SELECT a.*, e.name, e.designation, e.designation_type, e.department
         FROM vrs_applications a
         JOIN employees e ON e.employee_id = a.employee_id
         ORDER BY a.submitted_at ASC, a.application_id ASC`
      );
      return res.json(rows);
    }

    const [rows] = await pool.query(
      "SELECT * FROM vrs_applications WHERE employee_id = ? ORDER BY submitted_at DESC, application_id DESC",
      [req.user.employeeId]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/applications/:id  (Owner or Admin)
 */
exports.getApplication = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: "Invalid application id." });
    }

    const [rows] = await pool.query(
      `SELECT a.*, e.name, e.designation, e.designation_type, e.department,
              e.date_of_birth, e.date_of_joining, e.basic_pay, e.da
       FROM vrs_applications a
       JOIN employees e ON e.employee_id = a.employee_id
       WHERE a.application_id = ?`,
      [id]
    );
    const application = rows[0];
    if (!application) {
      return res.status(404).json({ error: "Application not found." });
    }

    if (req.user.role !== "admin" && application.employee_id !== req.user.employeeId) {
      return res.status(403).json({ error: "You can only view your own application." });
    }

    res.json(application);
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/applications/:id/status  (Admin)
 * Body: { status: 'Approved' | 'Rejected', rejectionReason?: string }
 */
exports.updateStatus = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: "Invalid application id." });
    }

    const { status, rejectionReason } = req.body || {};
    if (!["Approved", "Rejected"].includes(status)) {
      return res.status(400).json({ error: "Status must be 'Approved' or 'Rejected'." });
    }
    if (status === "Rejected" && rejectionReason && String(rejectionReason).length > 500) {
      return res.status(400).json({ error: "Rejection reason must be 500 characters or fewer." });
    }

    const [rows] = await pool.query(
      "SELECT status FROM vrs_applications WHERE application_id = ?",
      [id]
    );
    const application = rows[0];
    if (!application) {
      return res.status(404).json({ error: "Application not found." });
    }
    if (application.status !== "Pending") {
      return res.status(409).json({
        error: `Application has already been ${application.status.toLowerCase()}.`,
      });
    }

    await pool.query(
      `UPDATE vrs_applications
         SET status = ?, rejection_reason = ?, decided_at = CURRENT_TIMESTAMP, decided_by = ?
       WHERE application_id = ?`,
      [
        status,
        status === "Rejected" ? String(rejectionReason || "").trim() || null : null,
        req.user.employeeId,
        id,
      ]
    );

    const [updated] = await pool.query(
      "SELECT * FROM vrs_applications WHERE application_id = ?",
      [id]
    );
    res.json({ message: `Application ${status.toLowerCase()}.`, application: updated[0] });
  } catch (err) {
    next(err);
  }
};
