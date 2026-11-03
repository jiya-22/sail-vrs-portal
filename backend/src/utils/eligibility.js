/**
 * VRS Eligibility Engine
 * ----------------------
 * Basic conditions:
 *   - Age >= 50 years
 *   - Completed years of service >= 15
 *   - Not yet superannuated (months left before age 60 > 0)
 * Executive (ACP) condition:
 *   - Age 50-54  -> ACP must be <= 42.5
 *   - Age 54-57  -> ACP must be <= 45
 *   - Age 57+    -> no ACP restriction
 */

const { calculateCompensation, fullYearsBetween, parseDate } = require("./vrsFormula");

const MIN_AGE = 50;
const MIN_SERVICE_YEARS = 15;

function acpThresholdForAge(age) {
  if (age < 54) return 42.5;
  if (age < 57) return 45;
  return null; // 57+ : any ACP permitted
}

/**
 * @param {object} employee row from employees table (snake_case)
 * @param {number|null} acp Average Credit Point for executives (null when no grading history)
 * @param {Date} [asOf]
 */
function evaluateEligibility(employee, acp = null, asOf = new Date()) {
  const dob = parseDate(employee.date_of_birth);
  const doj = parseDate(employee.date_of_joining);
  const now = parseDate(asOf.toISOString().slice(0, 10));

  const age = fullYearsBetween(dob, now);
  const serviceYears = fullYearsBetween(doj, now);
  const compensation = calculateCompensation(
    {
      basicPay: employee.basic_pay,
      da: employee.da,
      dateOfBirth: employee.date_of_birth,
      dateOfJoining: employee.date_of_joining,
    },
    asOf
  );
  const monthsLeft = compensation.monthsLeft;

  const isExecutive = employee.designation_type === "executive";
  const acpThreshold = isExecutive ? acpThresholdForAge(age) : null;
  const acpValue = acp === null || acp === undefined ? null : Number(acp);

  const checks = [
    {
      key: "age",
      label: `Age is at least ${MIN_AGE} years`,
      passed: age >= MIN_AGE,
      detail: `Current age: ${age} years`,
    },
    {
      key: "service",
      label: `At least ${MIN_SERVICE_YEARS} years of completed service`,
      passed: serviceYears >= MIN_SERVICE_YEARS,
      detail: `Completed service: ${serviceYears} years`,
    },
    {
      key: "superannuation",
      label: "Not yet superannuated (age 60)",
      passed: monthsLeft > 0,
      detail: `${monthsLeft} months left before superannuation`,
    },
  ];

  let acpPassed = true;
  let acpDetail = "ACP check not applicable (non-executive)";
  if (isExecutive) {
    if (acpThreshold === null) {
      acpDetail = `Age ${age} (57+): no ACP restriction applies`;
    } else if (acpValue === null) {
      acpPassed = false;
      acpDetail = "No grading history available to compute ACP";
    } else if (acpValue <= acpThreshold) {
      acpDetail = `ACP ${acpValue.toFixed(2)} is within the limit of ${acpThreshold} for age ${age}`;
    } else {
      acpPassed = false;
      acpDetail = `ACP ${acpValue.toFixed(2)} exceeds the limit of ${acpThreshold} for age ${age}`;
    }
    checks.push({
      key: "acp",
      label: `Executive ACP within limit${
        acpThreshold !== null ? ` (≤ ${acpThreshold})` : ""
      }`,
      passed: acpPassed,
      detail: acpDetail,
    });
  }

  const eligible = checks.every((c) => c.passed);
  const failedReasons = checks.filter((c) => !c.passed).map((c) => c.detail);

  return {
    eligible,
    age,
    serviceYears,
    monthsLeft,
    isExecutive,
    acp: acpValue,
    acpThreshold,
    acpPassed,
    checks,
    reason: eligible ? "Eligible for VRS" : failedReasons.join("; "),
  };
}

module.exports = {
  MIN_AGE,
  MIN_SERVICE_YEARS,
  acpThresholdForAge,
  evaluateEligibility,
};
