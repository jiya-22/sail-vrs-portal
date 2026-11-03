import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Apply from "./pages/Apply";
import Compensation from "./pages/Compensation";
import Status from "./pages/Status";
import Admin from "./pages/Admin";
import AdminApplicationDetail from "./pages/AdminApplicationDetail";
import AdminRegister from "./pages/AdminRegister";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />

          {/* Employee routes */}
          <Route path="/dashboard" element={<ProtectedRoute roles={["employee"]}><Dashboard /></ProtectedRoute>} />
          <Route path="/apply" element={<ProtectedRoute roles={["employee"]}><Apply /></ProtectedRoute>} />
          <Route path="/compensation" element={<ProtectedRoute roles={["employee"]}><Compensation /></ProtectedRoute>} />
          <Route path="/status" element={<ProtectedRoute roles={["employee"]}><Status /></ProtectedRoute>} />

          {/* Admin routes */}
          <Route path="/admin" element={<ProtectedRoute roles={["admin"]}><Admin /></ProtectedRoute>} />
          <Route path="/admin/applications/:id" element={<ProtectedRoute roles={["admin"]}><AdminApplicationDetail /></ProtectedRoute>} />
          <Route path="/admin/register" element={<ProtectedRoute roles={["admin"]}><AdminRegister /></ProtectedRoute>} />

          {/* Legacy routes */}
          <Route path="/calculator" element={<Navigate to="/dashboard" replace />} />
          <Route path="/admin-login" element={<Navigate to="/login" replace />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
