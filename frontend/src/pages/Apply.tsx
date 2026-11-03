import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useEmployeeProfile } from "../hooks/useEmployeeProfile";
import API from "../services/api";
import { inr, num } from "../utils/format";
import type { VrsApplication } from "../types";

function Apply() {
  const { profile, loading, error } = useEmployeeProfile();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [confirming, setConfirming] = useState(false);

  const submit = async () => {
    setSubmitting(true);
    setSubmitError("");
    try {
      await API.post<{ application: VrsApplication }>("/applications");
      navigate("/status", { state: { submitted: true } });
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        setSubmitError(
          (err.response.data as { error?: string })?.error ||
            "Submission failed. Please try again."
        );
      } else {
        setSubmitError("Unable to reach the server. Please try again later.");
      }
      setConfirming(false);
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
            <h1>Apply for VRS</h1>
            <p className="subtitle">
              Review your eligibility and compensation before submitting. The
              backend re-validates everything at submission time.
            </p>
          </div>
        </div>

        {loading && <div className="loading-card">Loading your eligibility…</div>}
        {error && <div className="error-box" style={{ width: "100%" }}>{error}</div>}

        {profile && (
          <>
            {/* ELIGIBILITY CHECKLIST */}
            <section className="panel">
              <h2 className="panel-title">Eligibility Checklist</h2>
              <ul className="checklist">
                {profile.eligibility.checks.map((check) => (
                  <li key={check.key} className={check.passed ? "check-pass" : "check-fail"}>
                    <span className="check-icon">{check.passed ? "✓" : "✗"}</span>
                    <span>
                      <strong>{check.label}</strong>
                      <br />
                      <small>{check.detail}</small>
                    </span>
                  </li>
                ))}
              </ul>
              {!profile.eligibility.eligible && (
                <div className="error-box" style={{ width: "100%", marginTop: 16 }}>
                  You are not eligible to submit a VRS application. {profile.eligibility.reason}.
                </div>
              )}
            </section>

            {/* ACP SUMMARY (executives) */}
            {profile.eligibility.isExecutive && (
              <section className="panel">
                <h2 className="panel-title">ACP Summary</h2>
                <div className="kv-grid">
                  <div className="kv"><span>Your ACP</span><strong>{profile.acp !== null ? num(profile.acp) : "—"}</strong></div>
                  <div className="kv"><span>Threshold for your age</span><strong>{profile.eligibility.acpThreshold !== null ? num(profile.eligibility.acpThreshold) : "None (57+)"}</strong></div>
                  <div className="kv"><span>Result</span><strong>{profile.eligibility.acpPassed ? "Within limit ✓" : "Exceeds limit ✗"}</strong></div>
                </div>
              </section>
            )}

            {/* COMPENSATION SNAPSHOT */}
            <section className="panel panel-highlight">
              <h2 className="panel-title">Compensation Snapshot</h2>
              <div className="kv-grid">
                <div className="kv"><span>Formula A</span><strong>{inr(profile.compensation.formulaA)}</strong></div>
                <div className="kv"><span>Formula B</span><strong>{inr(profile.compensation.formulaB)}</strong></div>
                <div className="kv"><span>Payout (75% of lower)</span><strong>{inr(profile.compensation.finalCompensation)}</strong></div>
              </div>
              <p className="panel-note" style={{ marginTop: 12 }}>
                <Link to="/compensation">View the full breakdown →</Link>
              </p>
            </section>

            {/* SUBMIT */}
            {submitError && <div className="error-box" style={{ width: "100%" }}>{submitError}</div>}

            {profile.eligibility.eligible && (
              <section className="panel action-panel">
                <div>
                  <h2 className="panel-title">Declaration</h2>
                  <p className="panel-note">
                    By submitting, you request voluntary retirement under the SAIL VRS. Only one
                    pending application is allowed at a time. Applications are processed
                    first-come-first-served based on submission time.
                  </p>
                </div>
                <div className="action-buttons">
                  {!confirming ? (
                    <button className="button" style={{ marginTop: 0 }} onClick={() => setConfirming(true)}>
                      Submit Application
                    </button>
                  ) : (
                    <>
                      <p className="confirm-text">Confirm submission? This cannot be undone.</p>
                      <button className="button" style={{ marginTop: 0 }} disabled={submitting} onClick={submit}>
                        {submitting ? "Submitting…" : "Yes, Submit"}
                      </button>
                      <button className="button button-outline" style={{ marginTop: 0 }} onClick={() => setConfirming(false)}>
                        Cancel
                      </button>
                    </>
                  )}
                </div>
              </section>
            )}
          </>
        )}
      </div>
      <Footer />
    </div>
  );
}

export default Apply;
