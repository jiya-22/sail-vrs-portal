import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import API from "../services/api";

interface GradingRow {
  year: string;
  grade: string;
  creditPoints: string;
}

const emptyGradingRow = (): GradingRow => ({ year: "", grade: "", creditPoints: "" });

const initialForm = {
  employeeId: "",
  name: "",
  department: "",
  designation: "",
  designationType: "non_executive",
  dateOfBirth: "",
  dateOfJoining: "",
  basicPay: "",
  da: "",
  role: "employee",
  password: "",
};

function AdminRegister() {
  const [form, setForm] = useState(initialForm);
  const [gradingHistory, setGradingHistory] = useState<GradingRow[]>([emptyGradingRow()]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const isExecutive = form.designationType === "executive";

  const set = (key: keyof typeof initialForm) =>
    (e: { target: { value: string } }) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  const setGrading = (index: number, key: keyof GradingRow) =>
    (e: { target: { value: string } }) =>
      setGradingHistory((rows) =>
        rows.map((row, i) => (i === index ? { ...row, [key]: e.target.value } : row))
      );

  const addGradingRow = () => setGradingHistory((rows) => [...rows, emptyGradingRow()]);
  const removeGradingRow = (index: number) =>
    setGradingHistory((rows) => rows.filter((_, i) => i !== index));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!form.employeeId.trim() || !form.name.trim() || !form.password) {
      setError("Employee ID, name and password are required.");
      return;
    }

    const payload = {
      employeeId: form.employeeId.trim(),
      name: form.name.trim(),
      department: form.department.trim() || undefined,
      designation: form.designation.trim() || undefined,
      designationType: form.designationType,
      dateOfBirth: form.dateOfBirth,
      dateOfJoining: form.dateOfJoining,
      basicPay: Number(form.basicPay),
      da: Number(form.da),
      role: form.role,
      password: form.password,
      gradingHistory: isExecutive
        ? gradingHistory
            .filter((r) => r.year || r.grade || r.creditPoints)
            .map((r) => ({
              year: Number(r.year),
              grade: r.grade.trim(),
              creditPoints: Number(r.creditPoints),
            }))
        : [],
    };

    setSubmitting(true);
    try {
      const { data } = await API.post<{ message: string }>("/employees", payload);
      setSuccess(data.message || "Employee registered successfully.");
      setForm(initialForm);
      setGradingHistory([emptyGradingRow()]);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        setError(
          (err.response.data as { error?: string })?.error || "Registration failed."
        );
      } else {
        setError("Unable to reach the server. Please try again later.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="home">
      <Navbar />
      <div className="page">
        <div className="page-header">
          <div>
            <Link to="/admin" className="back-link">← Back to Queue</Link>
            <h1>Register Employee</h1>
            <p className="subtitle">
              Create an employee record with login credentials. Executives can
              include grading history for ACP verification.
            </p>
          </div>
        </div>

        {success && <div className="success-box">✓ {success}</div>}
        {error && <div className="error-box" style={{ width: "100%" }}>{error}</div>}

        <form className="panel register-form" onSubmit={handleSubmit}>
          <h2 className="panel-title">Employee Details</h2>
          <div className="form-grid">
            <div className="form-field">
              <label className="field-label" htmlFor="employeeId">Employee ID *</label>
              <input id="employeeId" value={form.employeeId} onChange={set("employeeId")} placeholder="e.g. EMP004" required />
            </div>
            <div className="form-field">
              <label className="field-label" htmlFor="name">Full Name *</label>
              <input id="name" value={form.name} onChange={set("name")} placeholder="e.g. Sunita Singh" required />
            </div>
            <div className="form-field">
              <label className="field-label" htmlFor="department">Department</label>
              <input id="department" value={form.department} onChange={set("department")} placeholder="e.g. Steel Plant" />
            </div>
            <div className="form-field">
              <label className="field-label" htmlFor="designation">Designation</label>
              <input id="designation" value={form.designation} onChange={set("designation")} placeholder="e.g. Supervisor" />
            </div>
            <div className="form-field">
              <label className="field-label" htmlFor="designationType">Category *</label>
              <select id="designationType" value={form.designationType} onChange={set("designationType")}>
                <option value="non_executive">Non-Executive</option>
                <option value="executive">Executive</option>
              </select>
            </div>
            <div className="form-field">
              <label className="field-label" htmlFor="role">Portal Role *</label>
              <select id="role" value={form.role} onChange={set("role")}>
                <option value="employee">Employee</option>
                <option value="admin">Administrator</option>
              </select>
            </div>
            <div className="form-field">
              <label className="field-label" htmlFor="dateOfBirth">Date of Birth *</label>
              <input id="dateOfBirth" type="date" value={form.dateOfBirth} onChange={set("dateOfBirth")} required />
            </div>
            <div className="form-field">
              <label className="field-label" htmlFor="dateOfJoining">Date of Joining *</label>
              <input id="dateOfJoining" type="date" value={form.dateOfJoining} onChange={set("dateOfJoining")} required />
            </div>
            <div className="form-field">
              <label className="field-label" htmlFor="basicPay">Basic Pay (₹ / month) *</label>
              <input id="basicPay" type="number" min={0} step="0.01" value={form.basicPay} onChange={set("basicPay")} required />
            </div>
            <div className="form-field">
              <label className="field-label" htmlFor="da">Dearness Allowance (₹ / month) *</label>
              <input id="da" type="number" min={0} step="0.01" value={form.da} onChange={set("da")} required />
            </div>
            <div className="form-field">
              <label className="field-label" htmlFor="password">Temporary Password *</label>
              <input id="password" type="password" value={form.password} onChange={set("password")} placeholder="Min 6 characters" required />
            </div>
          </div>

          {/* GRADING HISTORY (executives) */}
          {isExecutive && (
            <>
              <h2 className="panel-title" style={{ marginTop: 28 }}>Executive Grading History</h2>
              <p className="panel-note">Yearly appraisal grades and credit points used to compute the Average Credit Point (ACP).</p>
              <div className="grading-rows">
                {gradingHistory.map((row, i) => (
                  <div className="grading-row" key={i}>
                    <input type="number" min={1900} max={2100} placeholder="Year" value={row.year} onChange={setGrading(i, "year")} aria-label="Year" />
                    <input placeholder="Grade (e.g. A)" value={row.grade} onChange={setGrading(i, "grade")} aria-label="Grade" />
                    <input type="number" min={0} max={100} step="0.1" placeholder="Credit points" value={row.creditPoints} onChange={setGrading(i, "creditPoints")} aria-label="Credit points" />
                    <button type="button" className="grading-remove" onClick={() => removeGradingRow(i)} aria-label="Remove row">✕</button>
                  </div>
                ))}
              </div>
              <button type="button" className="button button-outline button-small" style={{ marginTop: 12 }} onClick={addGradingRow}>
                + Add Year
              </button>
            </>
          )}

          <div style={{ marginTop: 28 }}>
            <button className="button" style={{ marginTop: 0 }} disabled={submitting}>
              {submitting ? "Registering…" : "Register Employee"}
            </button>
          </div>
        </form>
      </div>
      <Footer />
    </div>
  );
}

export default AdminRegister;
