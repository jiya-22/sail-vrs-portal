import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useEmployeeProfile } from "../hooks/useEmployeeProfile";
import { formatDate, inr, num } from "../utils/format";

function Dashboard() {
  const { profile, loading, error } = useEmployeeProfile();

  return (
    <div className="home">
      <Navbar />
      <div className="page">
        <div className="page-header">
          <div>
            <h1>Employee Dashboard</h1>
            <p className="subtitle">
              Your VRS eligibility, compensation estimate and application
              actions — all in one place.
            </p>
          </div>
          {profile && (
            <span
              className={
                profile.eligibility.eligible
                  ? "badge badge-approved"
                  : "badge badge-rejected"
              }
            >
              {profile.eligibility.eligible ? "Eligible for VRS" : "Not Eligible"}
            </span>
          )}
        </div>

        {loading && <div className="loading-card">Loading your profile…</div>}
        {error && <div className="error-box" style={{ width: "100%" }}>{error}</div>}

        {profile && (
          <>
            {/* PROFILE + SERVICE DETAILS */}
            <div className="grid-2">
              <section className="panel">
                <h2 className="panel-title">Profile</h2>
                <div className="kv-grid">
                  <div className="kv"><span>Employee ID</span><strong>{profile.employee_id}</strong></div>
                  <div className="kv"><span>Name</span><strong>{profile.name}</strong></div>
                  <div className="kv"><span>Department</span><strong>{profile.department || "—"}</strong></div>
                  <div className="kv"><span>Designation</span><strong>{profile.designation || "—"}</strong></div>
                  <div className="kv"><span>Category</span><strong>{profile.designation_type === "executive" ? "Executive" : "Non-Executive"}</strong></div>
                  <div className="kv"><span>Role</span><strong>{profile.role === "admin" ? "Administrator" : "Employee"}</strong></div>
                </div>
              </section>

              <section className="panel">
                <h2 className="panel-title">Service Details</h2>
                <div className="kv-grid">
                  <div className="kv"><span>Date of Birth</span><strong>{formatDate(profile.date_of_birth)}</strong></div>
                  <div className="kv"><span>Date of Joining</span><strong>{formatDate(profile.date_of_joining)}</strong></div>
                  <div className="kv"><span>Age</span><strong>{profile.eligibility.age} years</strong></div>
                  <div className="kv"><span>Completed Service</span><strong>{profile.eligibility.serviceYears} years</strong></div>
                  <div className="kv"><span>Months Left to 60</span><strong>{profile.eligibility.monthsLeft} months</strong></div>
                  <div className="kv"><span>Superannuation Date</span><strong>{formatDate(profile.compensation.superannuationDate)}</strong></div>
                </div>
              </section>
            </div>

            {/* SALARY + COMPENSATION ESTIMATE */}
            <div className="grid-2">
              <section className="panel">
                <h2 className="panel-title">Salary Components</h2>
                <div className="kv-grid">
                  <div className="kv"><span>Basic Pay</span><strong>{inr(profile.basic_pay)}</strong></div>
                  <div className="kv"><span>Dearness Allowance</span><strong>{inr(profile.da)}</strong></div>
                  <div className="kv"><span>Daily Salary ( (B+DA)/26 )</span><strong>{inr(profile.compensation.dailySalary)}</strong></div>
                </div>
              </section>

              <section className="panel panel-highlight">
                <h2 className="panel-title">Estimated VRS Compensation</h2>
                <div className="big-amount">{inr(profile.compensation.finalCompensation)}</div>
                <p className="panel-note">
                  75% of the lower of Formula A ({num(profile.compensation.formulaA, 0)}) and
                  Formula B ({num(profile.compensation.formulaB, 0)}).
                </p>
                <Link className="button button-small" to="/compensation" style={{ textDecoration: "none", display: "inline-block" }}>
                  View Full Breakdown
                </Link>
              </section>
            </div>

            {/* ACP (executives) */}
            {profile.eligibility.isExecutive && (
              <section className="panel">
                <h2 className="panel-title">ACP Verification (Executive)</h2>
                <div className="kv-grid">
                  <div className="kv"><span>Average Credit Point (ACP)</span><strong>{profile.acp !== null ? num(profile.acp) : "No grading history"}</strong></div>
                  <div className="kv"><span>Applicable Threshold</span><strong>{profile.eligibility.acpThreshold !== null ? num(profile.eligibility.acpThreshold) : "None (57+)"}</strong></div>
                  <div className="kv"><span>ACP Result</span><strong>{profile.eligibility.acpPassed ? "Within limit ✓" : "Exceeds limit ✗"}</strong></div>
                </div>
                {profile.gradingHistory.length > 0 && (
                  <div className="table-wrap" style={{ marginTop: 16 }}>
                    <table className="data-table">
                      <thead>
                        <tr><th>Year</th><th>Grade</th><th>Credit Points</th></tr>
                      </thead>
                      <tbody>
                        {profile.gradingHistory.map((g) => (
                          <tr key={g.year}>
                            <td>{g.year}</td>
                            <td>{g.grade}</td>
                            <td>{num(g.credit_points)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            )}

            {/* ACTIONS */}
            <section className="panel action-panel">
              <div>
                <h2 className="panel-title">VRS Application</h2>
                <p className="panel-note">
                  {profile.eligibility.eligible
                    ? "You satisfy the eligibility conditions. You may proceed to apply for VRS. Applications are processed first-come-first-served."
                    : `You are not eligible to apply. ${profile.eligibility.reason}.`}
                </p>
              </div>
              <div className="action-buttons">
                {profile.eligibility.eligible ? (
                  <Link className="button" to="/apply" style={{ textDecoration: "none", display: "inline-block", marginTop: 0 }}>
                    Apply for VRS
                  </Link>
                ) : (
                  <button className="button" disabled style={{ opacity: 0.5, cursor: "not-allowed", marginTop: 0 }}>
                    Apply for VRS
                  </button>
                )}
                <Link className="button button-outline" to="/status" style={{ textDecoration: "none", display: "inline-block", marginTop: 0 }}>
                  Track Application Status
                </Link>
              </div>
            </section>
          </>
        )}
      </div>
      <Footer />
    </div>
  );
}

export default Dashboard;
