import { useCallback, useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import StatusBadge from "../components/StatusBadge";
import API from "../services/api";
import { formatDate, formatDateTime, inr } from "../utils/format";
import type { VrsApplication } from "../types";

function AdminApplicationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [application, setApplication] = useState<VrsApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [acting, setActing] = useState<"Approved" | "Rejected" | null>(null);
  const [rejecting, setRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    setError("");
    API.get<VrsApplication>(`/applications/${id}`)
      .then((res) => setApplication(res.data))
      .catch(() => setError("Unable to load this application."))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const decide = async (status: "Approved" | "Rejected") => {
    setActing(status);
    setActionError("");
    try {
      const { data } = await API.patch<{ application: VrsApplication }>(
        `/applications/${id}/status`,
        {
          status,
          rejectionReason: status === "Rejected" ? rejectionReason.trim() : undefined,
        }
      );
      setApplication((prev) => (prev ? { ...prev, ...data.application } : prev));
      setRejecting(false);
      setRejectionReason("");
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        setActionError(
          (err.response.data as { error?: string })?.error || "Action failed."
        );
      } else {
        setActionError("Unable to reach the server.");
      }
    } finally {
      setActing(null);
    }
  };

  return (
    <div className="home">
      <Navbar />
      <div className="page">
        <div className="page-header">
          <div>
            <Link to="/admin" className="back-link">← Back to Queue</Link>
            <h1>Application Review {application ? `#${application.application_id}` : ""}</h1>
            <p className="subtitle">
              Verify employee details and calculated compensation before
              approving or rejecting.
            </p>
          </div>
          {application && <StatusBadge status={application.status} />}
        </div>

        {loading && <div className="loading-card">Loading application…</div>}
        {error && <div className="error-box" style={{ width: "100%" }}>{error}</div>}

        {application && (
          <>
            <div className="grid-2">
              <section className="panel">
                <h2 className="panel-title">Employee Details</h2>
                <div className="kv-grid">
                  <div className="kv"><span>Employee ID</span><strong>{application.employee_id}</strong></div>
                  <div className="kv"><span>Name</span><strong>{application.name ?? "—"}</strong></div>
                  <div className="kv"><span>Department</span><strong>{application.department ?? "—"}</strong></div>
                  <div className="kv"><span>Designation</span><strong>{application.designation ?? "—"}</strong></div>
                  <div className="kv"><span>Category</span><strong>{application.designation_type === "executive" ? "Executive" : "Non-Executive"}</strong></div>
                  <div className="kv"><span>Date of Birth</span><strong>{formatDate(application.date_of_birth)}</strong></div>
                  <div className="kv"><span>Date of Joining</span><strong>{formatDate(application.date_of_joining)}</strong></div>
                  <div className="kv"><span>Basic Pay / DA</span><strong>{inr(application.basic_pay)} / {inr(application.da)}</strong></div>
                </div>
              </section>

              <section className="panel">
                <h2 className="panel-title">Application &amp; Compensation</h2>
                <div className="kv-grid">
                  <div className="kv"><span>Submitted (FCFS)</span><strong>{formatDateTime(application.submitted_at)}</strong></div>
                  <div className="kv"><span>Formula A</span><strong>{inr(application.formula_a)}</strong></div>
                  <div className="kv"><span>Formula B</span><strong>{inr(application.formula_b)}</strong></div>
                  <div className="kv"><span>Payout Rule</span><strong>75% of lower</strong></div>
                  <div className="kv"><span>Final Compensation</span><strong>{inr(application.final_compensation)}</strong></div>
                  <div className="kv"><span>Decided</span><strong>{application.decided_at ? `${formatDateTime(application.decided_at)}${application.decided_by ? ` by ${application.decided_by}` : ""}` : "—"}</strong></div>
                </div>
                {application.status === "Rejected" && application.rejection_reason && (
                  <p className="rejection-reason" style={{ marginTop: 16 }}>
                    <strong>Rejection reason:</strong> {application.rejection_reason}
                  </p>
                )}
              </section>
            </div>

            {actionError && <div className="error-box" style={{ width: "100%", marginTop: 16 }}>{actionError}</div>}

            {/* DECISION PANEL */}
            {application.status === "Pending" ? (
              <section className="panel action-panel">
                <div>
                  <h2 className="panel-title">Administrative Decision</h2>
                  <p className="panel-note">
                    Approving sanctions the VRS with the computed compensation.
                    Rejecting returns the application with a recorded reason.
                    This action is final.
                  </p>
                  {rejecting && (
                    <div style={{ marginTop: 12 }}>
                      <label className="field-label" htmlFor="reason">Rejection reason (optional)</label>
                      <textarea
                        id="reason"
                        className="reason-input"
                        rows={2}
                        maxLength={500}
                        placeholder="e.g. Pending document verification"
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                      />
                    </div>
                  )}
                </div>
                <div className="action-buttons">
                  <button className="button button-approve" style={{ marginTop: 0 }} disabled={acting !== null} onClick={() => decide("Approved")}>
                    {acting === "Approved" ? "Approving…" : "✓ Approve"}
                  </button>
                  {!rejecting ? (
                    <button className="button button-reject" style={{ marginTop: 0 }} onClick={() => setRejecting(true)}>
                      ✗ Reject…
                    </button>
                  ) : (
                    <>
                      <button className="button button-reject" style={{ marginTop: 0 }} disabled={acting !== null} onClick={() => decide("Rejected")}>
                        {acting === "Rejected" ? "Rejecting…" : "Confirm Rejection"}
                      </button>
                      <button className="button button-outline" style={{ marginTop: 0 }} onClick={() => setRejecting(false)}>
                        Cancel
                      </button>
                    </>
                  )}
                </div>
              </section>
            ) : (
              <section className="panel" style={{ textAlign: "center" }}>
                <h2 className="panel-title">Decision Recorded</h2>
                <p className="panel-note">
                  This application has been <strong>{application.status.toLowerCase()}</strong>
                  {application.decided_at ? ` on ${formatDateTime(application.decided_at)}` : ""}.
                  No further action is available.
                </p>
                <button className="button button-small" style={{ marginTop: 8 }} onClick={() => navigate("/admin")}>
                  Back to Queue
                </button>
              </section>
            )}
          </>
        )}
      </div>
      <Footer />
    </div>
  );
}

export default AdminApplicationDetail;
