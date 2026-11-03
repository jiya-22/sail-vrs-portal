/**
 * VRS Compensation Engine
 * -----------------------
 * Daily Salary        = (Basic Pay + DA) / 26
 * Formula A           = 35 x Daily Salary x Completed Years of Service
 *                     + 25 x Daily Salary x Remaining Years of Service (up to age 60)
 * Formula B           = 30 x Daily Salary x Months Left Before Superannuation (age 60)
 * Final Compensation  = 75% x MIN(Formula A, Formula B)
 */

const SUPERANNUATION_AGE = 60;
const DAYS_PER_MONTH = 26;

function parseDate(value) {
  if (value instanceof Date) return value;
  // DATE columns arrive as 'YYYY-MM-DD' (pool configured with dateStrings: true)
  const [y, m, d] = String(value).split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function fullYearsBetween(from, to) {
  let years = to.getUTCFullYear() - from.getUTCFullYear();
  const monthDiff = to.getUTCMonth() - from.getUTCMonth();
  if (monthDiff < 0 || (monthDiff === 0 && to.getUTCDate() < from.getUTCDate())) {
    years -= 1;
  }
  return Math.max(0, years);
}

function fullMonthsBetween(from, to) {
  let months =
    (to.getUTCFullYear() - from.getUTCFullYear()) * 12 +
    (to.getUTCMonth() - from.getUTCMonth());
  if (to.getUTCDate() < from.getUTCDate()) {
    months -= 1;
  }
  return Math.max(0, months);
}

function addYears(date, years) {
  const d = new Date(date.getTime());
  d.setUTCFullYear(d.getUTCFullYear() + years);
  return d;
}

function round2(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}

/**
 * @param {{basicPay:number, da:number, dateOfBirth:string|Date, dateOfJoining:string|Date}} input
 * @param {Date} [asOf]
 */
function calculateCompensation(input, asOf = new Date()) {
  const basicPay = Number(input.basicPay) || 0;
  const da = Number(input.da) || 0;
  const dob = parseDate(input.dateOfBirth);
  const doj = parseDate(input.dateOfJoining);
  const now = parseDate(asOf.toISOString().slice(0, 10));

  const dailySalary = round2((basicPay + da) / DAYS_PER_MONTH);

  const superannuationDate = addYears(dob, SUPERANNUATION_AGE);
  const monthsLeft = fullMonthsBetween(now, superannuationDate);
  const remainingYears = monthsLeft / 12;

  const completedYears = fullYearsBetween(doj, now);
  const age = fullYearsBetween(dob, now);

  const formulaA = round2(
    35 * dailySalary * completedYears + 25 * dailySalary * remainingYears
  );
  const formulaB = round2(30 * dailySalary * monthsLeft);

  const lower = Math.min(formulaA, formulaB);
  const finalCompensation = round2(lower * 0.75);

  return {
    dailySalary,
    basicPay: round2(basicPay),
    da: round2(da),
    age,
    completedYears,
    remainingYears: round2(remainingYears),
    monthsLeft,
    superannuationDate: superannuationDate.toISOString().slice(0, 10),
    formulaA,
    formulaB,
    lowerFormula: formulaA <= formulaB ? "A" : "B",
    lowerAmount: round2(lower),
    payoutPercent: 75,
    finalCompensation,
  };
}

module.exports = {
  SUPERANNUATION_AGE,
  calculateCompensation,
  fullYearsBetween,
  fullMonthsBetween,
  parseDate,
};
