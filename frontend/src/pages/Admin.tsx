import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import StatusBadge from "../components/StatusBadge";
import API from "../services/api";
import { formatDateTime, inr } from "../utils/format";
import type { VrsApplication } from "../types";

function AdminDashboard() {
  const [applications, setApplications] = useState<VrsApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"All" | "Pending" | "Approved" | "Rejected">("All");

  useEffect(() => {
    let cancelled = false;
    API.get<VrsApplication[]>("/applications")
      .then((res) => {
        if (!cancelled) setApplications(res.data);
      })
      .catch(() => {
        if (!cancelled) setError("Unable to load the application queue.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const stats = useMemo(() => {
    const pending = applications.filter((a) => a.status === "Pending").length;
    const approved = applications.filter((a) => a.status === "Approved").length;
    const rejected = applications.filter((a) => a.status === "Rejected").length;
    const approvedAmount = applications
      .filter((a) => a.status === "Approved")
      .reduce((sum, a) => sum + Number(a.final_compensation), 0);
    return { total: applications.length, pending, approved, rejected, approvedAmount };
  }, [applications]);

  const visible =
    filter === "All" ? applications : applications.filter((a) => a.status === filter);

  return (
    <div className="home">
      <Navbar />
      <div className="page">
        <div className="page-header">
          <div>
            <h1>Admin Application Queue</h1>
            <p className="subtitle">
              Applications are ordered first-come-first-served by submission
              time. Open a record to review and decide.
            </p>
          </div>
          <Link className="button button-small" to="/admin/register" style={{ textDecoration: "none", display: "inline-block", marginTop: 0 }}>
            + Register Employee
          </Link>
        </div>

        {/* STATS */}
        <div className="dashboard-cards" style={{ margin: "0 0 32px" }}>
          <div className="dash-card"><h2>{stats.total}</h2><p>Total Applications</p></div>
          <div className="dash-card"><h2>{stats.pending}</h2><p>Pending Review</p></div>
          <div className="dash-card"><h2>{stats.approved}</h2><p>Approved</p></div>
          <div className="dash-card"><h2>{stats.rejected}</h2><p>Rejected</p></div>
          <div className="dash-card"><h2>{inr(stats.approvedAmount)}</h2><p>Approved Outflow</p></div>
        </div>

        {/* FILTER */}
        <div className="filter-row">
          {(["All", "Pending", "Approved", "Rejected"] as const).map((f) => (
            <button
              key={f}
              className={`filter-chip ${filter === f ? "filter-chip-active" : ""}`}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>

        {loading && <div className="loading-card">Loading queue…</div>}
        {error && <div className="error-box" style={{ width: "100%" }}>{error}</div>}

        {!loading && !error && (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Application</th>
                  <th>Employee</th>
                  <th>Designation</th>
                  <th>Submitted (FCFS)</th>
                  <th>Final Compensation</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {visible.map((a, index) => (
                  <tr key={a.application_id}>
                    <td>{index + 1}</td>
                    <td>#{a.application_id}</td>
                    <td>
                      <strong>{a.name ?? a.employee_id}</strong>
                      <br />
                      <small>{a.employee_id}</small>
                    </td>
                    <td>{a.designation ?? "—"}</td>
                    <td>{formatDateTime(a.submitted_at)}</td>
                    <td>{inr(a.final_compensation)}</td>
                    <td><StatusBadge status={a.status} /></td>
                    <td>
                      <Link className="table-link" to={`/admin/applications/${a.application_id}`}>
                        Review →
                      </Link>
                    </td>
                  </tr>
                ))}
                {visible.length === 0 && (
                  <tr>
                    <td colSpan={8} style={{ textAlign: "center", padding: 32 }}>
                      No applications found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}

export default AdminDashboard;
