import { useEffect, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import StatusBadge from "../components/StatusBadge";
import API from "../services/api";
import { formatDateTime, inr } from "../utils/format";
import type { VrsApplication } from "../types";

function Status() {
  const location = useLocation();
  const justSubmitted =
    (location.state as { submitted?: boolean } | null)?.submitted === true;

  const [applications, setApplications] = useState<VrsApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    API.get<VrsApplication[]>("/applications")
      .then((res) => {
        if (!cancelled) setApplications(res.data);
      })
      .catch(() => {
        if (!cancelled) setError("Unable to load your applications.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const latest = applications[0];

  return (
    <div className="home">
      <Navbar />
      <div className="page">
        <div className="page-header">
          <div>
            <h1>Application Status</h1>
            <p className="subtitle">
              Track your VRS application from submission to decision.
            </p>
          </div>
          {latest && <StatusBadge status={latest.status} />}
        </div>

        {justSubmitted && (
          <div className="success-box">✓ Your VRS application has been submitted successfully.</div>
        )}

        {loading && <div className="loading-card">Loading your applications…</div>}
        {error && <div className="error-box" style={{ width: "100%" }}>{error}</div>}

        {!loading && !error && applications.length === 0 && (
          <section className="panel" style={{ textAlign: "center" }}>
            <h2 className="panel-title">No applications yet</h2>
            <p className="panel-note">
              You have not submitted a VRS application. Once you apply, its
              status will appear here.
            </p>
            <Link className="button button-small" to="/apply" style={{ textDecoration: "none", display: "inline-block" }}>
              Apply for VRS
            </Link>
          </section>
        )}

        {latest && (
          <section className="panel">
            <h2 className="panel-title">Latest Application — #{latest.application_id}</h2>

            {/* TIMELINE */}
            <ol className="timeline">
              <li className="timeline-item timeline-done">
                <span className="timeline-dot" />
                <div>
                  <strong>Application Submitted</strong>
                  <p>{formatDateTime(latest.submitted_at)}</p>
                </div>
              </li>
              <li className={`timeline-item ${latest.status !== "Pending" ? "timeline-done" : "timeline-current"}`}>
                <span className="timeline-dot" />
                <div>
                  <strong>Administrative Review</strong>
                  <p>{latest.status === "Pending" ? "Awaiting review by HR / Admin (FCFS order)" : "Review completed"}</p>
                </div>
              </li>
              <li className={`timeline-item ${latest.status === "Pending" ? "" : "timeline-done"}`}>
                <span className="timeline-dot" />
                <div>
                  <strong>Decision — {latest.status}</strong>
                  <p>{latest.decided_at ? formatDateTime(latest.decided_at) : "Pending"}</p>
                  {latest.status === "Rejected" && latest.rejection_reason && (
                    <p className="rejection-reason">Reason: {latest.rejection_reason}</p>
                  )}
                </div>
              </li>
            </ol>

            {/* FIGURES */}
            <div className="kv-grid" style={{ marginTop: 24 }}>
              <div className="kv"><span>Formula A</span><strong>{inr(latest.formula_a)}</strong></div>
              <div className="kv"><span>Formula B</span><strong>{inr(latest.formula_b)}</strong></div>
              <div className="kv"><span>Final Compensation (75%)</span><strong>{inr(latest.final_compensation)}</strong></div>
            </div>
          </section>
        )}

        {applications.length > 1 && (
          <section className="panel">
            <h2 className="panel-title">Application History</h2>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr><th>ID</th><th>Submitted</th><th>Status</th><th>Final Compensation</th></tr>
                </thead>
                <tbody>
                  {applications.map((a) => (
                    <tr key={a.application_id}>
                      <td>#{a.application_id}</td>
                      <td>{formatDateTime(a.submitted_at)}</td>
                      <td><StatusBadge status={a.status} /></td>
                      <td>{inr(a.final_compensation)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
      <Footer />
    </div>
  );
}

export default Status;
