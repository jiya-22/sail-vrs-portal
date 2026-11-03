const pool = require("../config/db");
const { calculateCompensation } = require("../utils/vrsFormula");
const { evaluateEligibility } = require("../utils/eligibility");

/**
 * Load an employee row plus their grading history.
 */
async function getEmployeeWithGrading(employeeId) {
  const [rows] = await pool.query(
    "SELECT * FROM employees WHERE employee_id = ?",
    [employeeId]
  );
  const employee = rows[0];
  if (!employee) return { employee: null, gradingHistory: [] };

  const [gradingHistory] = await pool.query(
    "SELECT year, grade, credit_points FROM grading_history WHERE employee_id = ? ORDER BY year ASC",
    [employeeId]
  );
  return { employee, gradingHistory };
}

function computeAcp(gradingHistory) {
  if (!gradingHistory || gradingHistory.length === 0) return null;
  const total = gradingHistory.reduce(
    (sum, g) => sum + Number(g.credit_points),
    0
  );
  return Math.round((total / gradingHistory.length) * 100) / 100;
}

/**
 * Build the full profile payload used by the employee dashboard:
 * profile + grading history + ACP + eligibility + compensation estimate.
 */
async function buildProfilePayload(employeeId) {
  const { employee, gradingHistory } = await getEmployeeWithGrading(employeeId);
  if (!employee) return null;

  const acp = computeAcp(gradingHistory);
  const compensation = calculateCompensation({
    basicPay: employee.basic_pay,
    da: employee.da,
    dateOfBirth: employee.date_of_birth,
    dateOfJoining: employee.date_of_joining,
  });
  const eligibility = evaluateEligibility(employee, acp);

  const { password_hash, ...safeEmployee } = employee;

  return {
    ...safeEmployee,
    gradingHistory,
    acp,
    eligibility,
    compensation,
  };
}

module.exports = { getEmployeeWithGrading, computeAcp, buildProfilePayload };
