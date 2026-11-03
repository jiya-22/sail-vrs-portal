import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useAuth } from "../context/AuthContext";

function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const ctaTarget = user
    ? user.role === "admin"
      ? "/admin"
      : "/dashboard"
    : "/login";

  return (
    <div className="home">
      <Navbar />

      {/* HERO SECTION */}
      <section className="hero">
        <div className="logo-box">
          <img src="/sail_logo.png" className="logo" alt="SAIL logo" />
        </div>

        <div className="hero-content">
          <h1>
            VOLUNTARY
            <br />
            RETIREMENT SCHEME
          </h1>

          <p>
            A digital portal for eligible SAIL employees to check VRS
            eligibility, calculate retirement compensation, and apply for
            voluntary retirement — with complete transparency.
          </p>

          <button className="button" onClick={() => navigate(ctaTarget)}>
            {user ? "Go to Dashboard" : "Sign In to Apply"}
          </button>
        </div>
      </section>

      {/* INFORMATION CARDS */}
      <div className="section">
        <div className="card">
          <h2>WHO CAN APPLY</h2>
          <p>✓ Age 50 years or above</p>
          <p>✓ Minimum 15 years service</p>
          <p>✓ Eligible SAIL employees</p>
        </div>

        <div className="card">
          <h2>ACP CRITERIA</h2>
          <p>For executive employees:</p>
          <p>50–54 years → ACP ≤ 42.5</p>
          <p>54–57 years → ACP ≤ 45</p>
          <p>57+ years → Any ACP</p>
        </div>

        <div className="card">
          <h2>COMPENSATION</h2>
          <p>Formula A: 35 × daily salary × service + 25 × daily salary × remaining service</p>
          <p>Formula B: 30 × daily salary × months left (age 60)</p>
          <p>75% of whichever is lower</p>
        </div>
      </div>

      {/* HOW IT WORKS */}
      <div className="section" style={{ paddingTop: 0 }}>
        <div className="card" style={{ width: 1060, maxWidth: "100%" }}>
          <h2>HOW THE PORTAL WORKS</h2>
          <div className="steps-grid">
            <div className="step">
              <span className="step-num">1</span>
              <div>
                <strong>Sign in</strong>
                <p>Employee ID and password issued by HR/Admin.</p>
              </div>
            </div>
            <div className="step">
              <span className="step-num">2</span>
              <div>
                <strong>Check eligibility</strong>
                <p>Age, service and (for executives) ACP are verified automatically.</p>
              </div>
            </div>
            <div className="step">
              <span className="step-num">3</span>
              <div>
                <strong>Review compensation</strong>
                <p>See Formula A, Formula B and the 75% payout transparently.</p>
              </div>
            </div>
            <div className="step">
              <span className="step-num">4</span>
              <div>
                <strong>Apply &amp; track</strong>
                <p>Submit once; applications are processed first-come-first-served.</p>
              </div>
            </div>
          </div>
          <Link className="button button-small" to={ctaTarget} style={{ textDecoration: "none", display: "inline-block" }}>
            {user ? "Open My Dashboard" : "Sign In Now"}
          </Link>
        </div>
      </div>

      {/* CONTACT SECTION */}
      <div className="contact-section">
        <h2>Contact &amp; Support</h2>
        <p>
          For queries related to the Voluntary Retirement Scheme, please
          contact the HR department.
        </p>
        <div className="contact-info">
          <p>📧 Email: hr@sail.co.in</p>
          <p>☎ Support: Employee Help Desk</p>
          <p>🏢 Steel Authority of India Limited — Centre for Engineering and Technology (CET), Ranchi</p>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default Home;
