import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="navbar">
      <div className="nav-links">
        <Link to="/">Home</Link>
        {!user && <Link to="/login">Sign In</Link>}
        {user?.role === "employee" && (
          <>
            <Link to="/dashboard">Dashboard</Link>
            <Link to="/apply">Apply for VRS</Link>
            <Link to="/compensation">Compensation</Link>
            <Link to="/status">Application Status</Link>
          </>
        )}
        {user?.role === "admin" && (
          <>
            <Link to="/admin">Application Queue</Link>
            <Link to="/admin/register">Register Employee</Link>
          </>
        )}
        {user && (
          <button className="nav-logout" onClick={handleLogout}>
            Logout ({user.employeeId})
          </button>
        )}
      </div>
    </nav>
  );
}
