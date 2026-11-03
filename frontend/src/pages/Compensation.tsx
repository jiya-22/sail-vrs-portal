import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useEmployeeProfile } from "../hooks/useEmployeeProfile";
import { formatDate, inr, num } from "../utils/format";

function CompensationBreakdown() {
  const { profile, loading, error } = useEmployeeProfile();
  const comp = profile?.compensation;

  return (
    <div className="home">
      <Navbar />
      <div className="page">
        <div className="page-header">
          <div>
            <h1>Compensation Breakdown</h1>
            <p className="subtitle">
              How your estimated VRS compensation is computed, step by step.
            </p>
          </div>
        </div>

        {loading && <div className="loading-card">Calculating…</div>}
        {error && <div className="error-box" style={{ width: "100%" }}>{error}</div>}

        {profile && comp && (
          <>
            {/* STEP 1 — DAILY SALARY */}
            <section className="panel formula-panel">
              <div className="formula-step">Step 1</div>
              <h2 className="panel-title">Daily Salary</h2>
              <div className="formula-line">
                ( Basic Pay + Dearness Allowance ) ÷ 26
              </div>
              <div className="formula-inputs">
                <span>{inr(comp.basicPay)}</span>+
                <span>{inr(comp.da)}</span>=
                <span>{inr(comp.basicPay + comp.da)}</span>÷ 26 =
                <strong>{inr(comp.dailySalary)} / day</strong>
              </div>
            </section>

            {/* STEP 2 — FORMULA A */}
            <section className={`panel formula-panel ${comp.lowerFormula === "A" ? "formula-winner" : ""}`}>
              <div className="formula-step">Step 2{comp.lowerFormula === "A" ? " · Selected (lower)" : ""}</div>
              <h2 className="panel-title">Formula A — Service-based</h2>
              <div className="formula-line">
                35 × Daily Salary × Completed Years + 25 × Daily Salary × Remaining Years
              </div>
              <div className="formula-inputs">
                <span>35 × {num(comp.dailySalary)} × {comp.completedYears} yrs</span>+
                <span>25 × {num(comp.dailySalary)} × {num(comp.remainingYears)} yrs</span>=
                <strong>{inr(comp.formulaA)}</strong>
              </div>
              <p className="panel-note">
                Completed years of service: {comp.completedYears} · Remaining years up to
                superannuation ({formatDate(comp.superannuationDate)}): {num(comp.remainingYears)}
              </p>
            </section>

            {/* STEP 3 — FORMULA B */}
            <section className={`panel formula-panel ${comp.lowerFormula === "B" ? "formula-winner" : ""}`}>
              <div className="formula-step">Step 3{comp.lowerFormula === "B" ? " · Selected (lower)" : ""}</div>
              <h2 className="panel-title">Formula B — Months-left-based</h2>
              <div className="formula-line">
                30 × Daily Salary × Months Left Before Superannuation (age 60)
              </div>
              <div className="formula-inputs">
                <span>30 × {num(comp.dailySalary)} × {comp.monthsLeft} months</span>=
                <strong>{inr(comp.formulaB)}</strong>
              </div>
            </section>

            {/* STEP 4 — LOWER BASKET */}
            <section className="panel formula-panel">
              <div className="formula-step">Step 4</div>
              <h2 className="panel-title">Select the Lower Basket</h2>
              <div className="compare-row">
                <div className={`compare-cell ${comp.lowerFormula === "A" ? "compare-winner" : ""}`}>
                  <span>Formula A</span>
                  <strong>{inr(comp.formulaA)}</strong>
                </div>
                <div className="compare-vs">vs</div>
                <div className={`compare-cell ${comp.lowerFormula === "B" ? "compare-winner" : ""}`}>
                  <span>Formula B</span>
                  <strong>{inr(comp.formulaB)}</strong>
                </div>
              </div>
              <p className="panel-note">
                Formula {comp.lowerFormula} is lower, so it forms the basis of the payout.
              </p>
            </section>

            {/* STEP 5 — 75% PAYOUT */}
            <section className="panel panel-highlight">
              <div className="formula-step">Step 5</div>
              <h2 className="panel-title">Final VRS Compensation (75%)</h2>
              <div className="formula-line">75% × MIN(Formula A, Formula B)</div>
              <div className="formula-inputs">
                <span>75% × {inr(comp.lowerAmount)}</span>=
                <div className="big-amount" style={{ margin: "8px 0 0" }}>
                  {inr(comp.finalCompensation)}
                </div>
              </div>
              <p className="panel-note">
                This is an estimate based on current data. The final sanctioned amount is
                subject to administrative verification and approval.
              </p>
            </section>
          </>
        )}
      </div>
      <Footer />
    </div>
  );
}

export default CompensationBreakdown;
