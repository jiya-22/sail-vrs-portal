/**
 * setup-db.js — one-shot database migration & seed for the SAIL-VRS Portal.
 *
 *  1. Backs up any legacy tables (employees, users, vrs_applications,
 *     calculations, vrs_calculations) to <name>_backup_legacy if not already done.
 *  2. Creates the report-specified normalized schema:
 *       employees, grading_history, vrs_applications
 *  3. Migrates legacy data (old `users` and `employees` tables) into the new
 *     `employees` table, synthesizing DOB/DOJ where missing.
 *  4. Seeds demo accounts (idempotent):
 *       ADMIN001 / Admin@123   (admin)
 *       EMP001   / Emp@123     (employee, non-executive)
 *       EMP002   / Emp@123     (employee, executive, with grading history)
 *       EMP003   / Emp@123     (employee, executive, fails ACP)
 *       SAIL101  / Sail@123    (executive, migrated legacy record)
 *       SAIL102  / Sail@123    (executive, migrated legacy record)
 *       SAIL103  / Sail@123    (non-executive, migrated legacy record)
 */

require("dotenv").config({ quiet: true });
const bcrypt = require("bcryptjs");
const mysql = require("mysql2/promise");

const DB_NAME = process.env.DB_NAME || "sail_vrs";

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS employees (
     employee_id      VARCHAR(20)  NOT NULL,
     name             VARCHAR(120) NOT NULL,
     department       VARCHAR(100) DEFAULT NULL,
     designation      VARCHAR(120) DEFAULT NULL,
     designation_type ENUM('executive','non_executive') NOT NULL DEFAULT 'non_executive',
     date_of_birth    DATE         NOT NULL,
     date_of_joining  DATE         NOT NULL,
     basic_pay        DECIMAL(12,2) NOT NULL DEFAULT 0.00,
     da               DECIMAL(12,2) NOT NULL DEFAULT 0.00,
     role             ENUM('employee','admin') NOT NULL DEFAULT 'employee',
     password_hash    VARCHAR(255) NOT NULL,
     created_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
     PRIMARY KEY (employee_id)
   ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`,

  `CREATE TABLE IF NOT EXISTS grading_history (
     id            INT          NOT NULL AUTO_INCREMENT,
     employee_id   VARCHAR(20)  NOT NULL,
     year          YEAR         NOT NULL,
     grade         VARCHAR(10)  NOT NULL,
     credit_points DECIMAL(6,2) NOT NULL,
     PRIMARY KEY (id),
     UNIQUE KEY uq_grading_year (employee_id, year),
     CONSTRAINT fk_grading_employee
       FOREIGN KEY (employee_id) REFERENCES employees(employee_id)
       ON DELETE CASCADE ON UPDATE CASCADE
   ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`,

  `CREATE TABLE IF NOT EXISTS vrs_applications (
     application_id    INT           NOT NULL AUTO_INCREMENT,
     employee_id       VARCHAR(20)   NOT NULL,
     formula_a         DECIMAL(14,2) NOT NULL,
     formula_b         DECIMAL(14,2) NOT NULL,
     final_compensation DECIMAL(14,2) NOT NULL,
     status            ENUM('Pending','Approved','Rejected') NOT NULL DEFAULT 'Pending',
     rejection_reason  VARCHAR(500)  DEFAULT NULL,
     submitted_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
     decided_at        TIMESTAMP     NULL DEFAULT NULL,
     decided_by        VARCHAR(20)   DEFAULT NULL,
     PRIMARY KEY (application_id),
     KEY idx_submitted_at (submitted_at),
     KEY idx_employee_status (employee_id, status),
     CONSTRAINT fk_application_employee
       FOREIGN KEY (employee_id) REFERENCES employees(employee_id)
       ON DELETE CASCADE ON UPDATE CASCADE
   ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`,
];

const LEGACY_TABLES = [
  "employees",
  "users",
  "vrs_applications",
  "calculations",
  "vrs_calculations",
];

async function tableExists(conn, name) {
  const [rows] = await conn.query(
    "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?",
    [DB_NAME, name]
  );
  return rows.length > 0;
}

async function backupLegacy(conn) {
  for (const t of LEGACY_TABLES) {
    const backup = `${t}_backup_legacy`;
    if ((await tableExists(conn, t)) && !(await tableExists(conn, backup))) {
      await conn.query(`RENAME TABLE \`${t}\` TO \`${backup}\``);
      console.log(`backed up legacy table ${t} -> ${backup}`);
    }
  }
}

async function migrateLegacy(conn) {
  // Old `users` table (login accounts) -> new employees
  if (await tableExists(conn, "users_backup_legacy")) {
    const [users] = await conn.query("SELECT * FROM users_backup_legacy");
    for (const u of users) {
      const [exists] = await conn.query(
        "SELECT employee_id FROM employees WHERE employee_id = ?",
        [u.employee_id]
      );
      if (exists.length) continue;
      const basic = Number(u.monthly_salary) > 0 ? Number(u.monthly_salary) * 0.7 : 0;
      const da = Number(u.monthly_salary) > 0 ? Number(u.monthly_salary) * 0.3 : 0;
      await conn.query(
        `INSERT INTO employees
          (employee_id, name, department, designation, designation_type,
           date_of_birth, date_of_joining, basic_pay, da, role, password_hash)
         VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
        [
          u.employee_id,
          u.name,
          u.department,
          u.designation,
          u.category === "executive" ? "executive" : "non_executive",
          u.date_of_birth,
          u.date_of_joining,
          Math.round(basic * 100) / 100,
          Math.round(da * 100) / 100,
          u.role,
          u.password_hash, // keep legacy hashes; demo passwords reset below
        ]
      );
      console.log(`migrated legacy user ${u.employee_id}`);
    }
  }

  // Old `vrs_applications` (user_id FK -> users.id) -> new vrs_applications
  if (await tableExists(conn, "vrs_applications_backup_legacy")) {
    const [apps] = await conn.query("SELECT * FROM vrs_applications_backup_legacy");
    const [legacyUsers] = await conn.query("SELECT id, employee_id FROM users_backup_legacy");
    const idToEmployee = new Map(legacyUsers.map((u) => [u.id, u.employee_id]));
    for (const a of apps) {
      const employeeId = idToEmployee.get(a.user_id);
      if (!employeeId) continue;
      const [dup] = await conn.query(
        "SELECT application_id FROM vrs_applications WHERE employee_id = ? AND submitted_at = ?",
        [employeeId, a.submitted_at]
      );
      if (dup.length) continue;
      const status =
        a.status === "approved" ? "Approved" : a.status === "rejected" ? "Rejected" : "Pending";
      await conn.query(
        `INSERT INTO vrs_applications
           (employee_id, formula_a, formula_b, final_compensation, status,
            rejection_reason, submitted_at, decided_at)
         VALUES (?,?,?,?,?,?,?,?)`,
        [
          employeeId,
          a.formula_a,
          a.formula_b,
          a.final_amount,
          status,
          a.rejection_reason,
          a.submitted_at,
          status === "Pending" ? null : a.updated_at,
        ]
      );
      console.log(`migrated legacy VRS application for ${employeeId} (${status})`);
    }
  }

  // Old `employees` table (SAIL101/102/103) -> new employees (no credentials existed)
  if (await tableExists(conn, "employees_backup_legacy")) {
    const [rows] = await conn.query("SELECT * FROM employees_backup_legacy");
    const defaults = {
      SAIL101: { dob: "1972-06-15", doj: "2001-07-01" },
      SAIL102: { dob: "1969-03-10", doj: "1998-07-01" },
      SAIL103: { dob: "1968-11-20", doj: "1996-07-01" },
    };
    const sailHash = await bcrypt.hash("Sail@123", 10);
    for (const e of rows) {
      const [exists] = await conn.query(
        "SELECT employee_id FROM employees WHERE employee_id = ?",
        [e.employee_id]
      );
      if (exists.length) continue;
      const d = defaults[e.employee_id] || { dob: "1970-01-01", doj: "2000-07-01" };
      await conn.query(
        `INSERT INTO employees
          (employee_id, name, department, designation, designation_type,
           date_of_birth, date_of_joining, basic_pay, da, role, password_hash)
         VALUES (?,?,?,?,?,?,?,?,?,'employee',?)`,
        [
          e.employee_id,
          e.name,
          e.department,
          e.designation,
          e.category === "executive" ? "executive" : "non_executive",
          d.dob,
          d.doj,
          e.basic_pay,
          e.DA,
          sailHash,
        ]
      );
      console.log(`migrated legacy employee ${e.employee_id}`);
    }
  }
}

async function seedDemoAccounts(conn) {
  const demos = [
    {
      employee_id: "ADMIN001",
      name: "HR Administrator",
      department: "Human Resources",
      designation: "Administrator",
      designation_type: "non_executive",
      date_of_birth: "1980-01-01",
      date_of_joining: "2010-01-01",
      basic_pay: 60000,
      da: 20000,
      role: "admin",
      password: "Admin@123",
    },
    {
      employee_id: "EMP001",
      name: "Amit Kumar",
      department: "Engineering",
      designation: "Engineer",
      designation_type: "non_executive",
      date_of_birth: "1970-05-15",
      date_of_joining: "2005-03-01",
      basic_pay: 44000,
      da: 19000,
      role: "employee",
      password: "Emp@123",
    },
    {
      employee_id: "EMP002",
      name: "Rajesh Sharma",
      department: "Production",
      designation: "Manager (Executive)",
      designation_type: "executive",
      date_of_birth: "1971-02-20",
      date_of_joining: "2000-08-01",
      basic_pay: 60000,
      da: 20000,
      role: "employee",
      password: "Emp@123",
      gradingHistory: [
        { year: 2021, grade: "A", credit_points: 44 },
        { year: 2022, grade: "A", credit_points: 45 },
        { year: 2023, grade: "B+", credit_points: 40 },
        { year: 2024, grade: "A", credit_points: 46 },
        { year: 2025, grade: "B+", credit_points: 41 },
      ],
    },
    {
      employee_id: "EMP003",
      name: "Pradeep Mishra",
      department: "Steel Plant",
      designation: "Senior Manager (Executive)",
      designation_type: "executive",
      date_of_birth: "1973-09-12",
      date_of_joining: "2002-04-15",
      basic_pay: 70000,
      da: 25000,
      role: "employee",
      password: "Emp@123",
      gradingHistory: [
        { year: 2021, grade: "A", credit_points: 47 },
        { year: 2022, grade: "A", credit_points: 48 },
        { year: 2023, grade: "A", credit_points: 46 },
        { year: 2024, grade: "A+", credit_points: 49 },
        { year: 2025, grade: "A", credit_points: 47 },
      ],
    },
  ];

  for (const d of demos) {
    const [exists] = await conn.query(
      "SELECT employee_id FROM employees WHERE employee_id = ?",
      [d.employee_id]
    );
    if (exists.length) {
      // refresh password to the documented demo password
      const hash = await bcrypt.hash(d.password, 10);
      await conn.query("UPDATE employees SET password_hash = ? WHERE employee_id = ?", [
        hash,
        d.employee_id,
      ]);
      console.log(`demo account ${d.employee_id} already exists (password reset)`);
    } else {
      const hash = await bcrypt.hash(d.password, 10);
      const { gradingHistory, password, ...row } = d;
      await conn.query(
        `INSERT INTO employees
          (employee_id, name, department, designation, designation_type,
           date_of_birth, date_of_joining, basic_pay, da, role, password_hash)
         VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
        [
          row.employee_id,
          row.name,
          row.department,
          row.designation,
          row.designation_type,
          row.date_of_birth,
          row.date_of_joining,
          row.basic_pay,
          row.da,
          row.role,
          hash,
        ]
      );
      console.log(`seeded demo account ${d.employee_id}`);
    }

    if (d.gradingHistory) {
      for (const g of d.gradingHistory) {
        await conn.query(
          `INSERT INTO grading_history (employee_id, year, grade, credit_points)
           VALUES (?,?,?,?)
           ON DUPLICATE KEY UPDATE grade = VALUES(grade), credit_points = VALUES(credit_points)`,
          [d.employee_id, g.year, g.grade, g.credit_points]
        );
      }
    }
  }

  // grading history for migrated executives SAIL101 / SAIL102
  const grading = {
    SAIL101: [
      { year: 2021, grade: "B+", credit_points: 41 },
      { year: 2022, grade: "A", credit_points: 44 },
      { year: 2023, grade: "B+", credit_points: 40 },
      { year: 2024, grade: "A", credit_points: 43 },
      { year: 2025, grade: "A", credit_points: 45 },
    ],
    SAIL102: [
      { year: 2021, grade: "A", credit_points: 46 },
      { year: 2022, grade: "A", credit_points: 47 },
      { year: 2023, grade: "A+", credit_points: 48 },
      { year: 2024, grade: "A", credit_points: 46 },
      { year: 2025, grade: "A", credit_points: 47 },
    ],
  };
  for (const [empId, rows] of Object.entries(grading)) {
    const [exists] = await conn.query(
      "SELECT employee_id FROM employees WHERE employee_id = ?",
      [empId]
    );
    if (!exists.length) continue;
    for (const g of rows) {
      await conn.query(
        `INSERT INTO grading_history (employee_id, year, grade, credit_points)
         VALUES (?,?,?,?)
         ON DUPLICATE KEY UPDATE grade = VALUES(grade), credit_points = VALUES(credit_points)`,
        [empId, g.year, g.grade, g.credit_points]
      );
    }
  }
}

(async () => {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: DB_NAME,
    multipleStatements: false,
  });

  try {
    console.log(`Using database: ${DB_NAME}`);
    await backupLegacy(conn);
    for (const stmt of SCHEMA) await conn.query(stmt);
    console.log("schema created (employees, grading_history, vrs_applications)");
    await migrateLegacy(conn);
    await seedDemoAccounts(conn);
    console.log("\nDatabase setup complete.");
    console.log("Demo logins:");
    console.log("  ADMIN001 / Admin@123  (admin)");
    console.log("  EMP001   / Emp@123    (employee, non-executive)");
    console.log("  EMP002   / Emp@123    (employee, executive, ACP OK)");
    console.log("  EMP003   / Emp@123    (employee, executive, ACP too high)");
  } finally {
    await conn.end();
  }
})().catch((err) => {
  console.error("setup-db failed:", err);
  process.exit(1);
});
