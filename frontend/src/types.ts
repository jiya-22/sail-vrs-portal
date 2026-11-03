export type Role = "employee" | "admin";

export interface AuthUser {
  employeeId: string;
  name: string;
  role: Role;
}

export interface GradingEntry {
  year: number;
  grade: string;
  credit_points: string | number;
}

export interface EligibilityCheck {
  key: string;
  label: string;
  passed: boolean;
  detail: string;
}

export interface Eligibility {
  eligible: boolean;
  age: number;
  serviceYears: number;
  monthsLeft: number;
  isExecutive: boolean;
  acp: number | null;
  acpThreshold: number | null;
  acpPassed: boolean;
  checks: EligibilityCheck[];
  reason: string;
}

export interface Compensation {
  dailySalary: number;
  basicPay: number;
  da: number;
  age: number;
  completedYears: number;
  remainingYears: number;
  monthsLeft: number;
  superannuationDate: string;
  formulaA: number;
  formulaB: number;
  lowerFormula: "A" | "B";
  lowerAmount: number;
  payoutPercent: number;
  finalCompensation: number;
}

export interface EmployeeProfile {
  employee_id: string;
  name: string;
  department: string | null;
  designation: string | null;
  designation_type: "executive" | "non_executive";
  date_of_birth: string;
  date_of_joining: string;
  basic_pay: string;
  da: string;
  role: Role;
  created_at: string;
  gradingHistory: GradingEntry[];
  acp: number | null;
  eligibility: Eligibility;
  compensation: Compensation;
}

export type ApplicationStatus = "Pending" | "Approved" | "Rejected";

export interface VrsApplication {
  application_id: number;
  employee_id: string;
  formula_a: string;
  formula_b: string;
  final_compensation: string;
  status: ApplicationStatus;
  rejection_reason: string | null;
  submitted_at: string;
  decided_at: string | null;
  decided_by: string | null;
  // joined employee fields (admin queue / detail)
  name?: string;
  designation?: string | null;
  designation_type?: "executive" | "non_executive";
  department?: string | null;
  date_of_birth?: string;
  date_of_joining?: string;
  basic_pay?: string;
  da?: string;
}
