import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Calculator from "./pages/Calculator";
import Status from "./pages/Status";
import AdminLogin from "./pages/AdminLogin";
import Admin from "./pages/Admin";
export default function App() { return <BrowserRouter><Routes><Route path="/" element={<Home />} /><Route path="/dashboard" element={<Dashboard />} /><Route path="/apply" element={<Calculator />} /><Route path="/application-status" element={<Status />} /><Route path="/admin-login" element={<AdminLogin />} /><Route path="/admin" element={<Admin />} /><Route path="*" element={<Navigate to="/" replace />} /></Routes></BrowserRouter>; }
