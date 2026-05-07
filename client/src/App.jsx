import React from "react";
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import ForgotPage from "./pages/auth/ForgotPage";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage";
import HomePage from "./pages/HomePage";
import Dashboard from "./pages/AdminDashboard/Dashboard";
import Tdashboard from "./pages/teacherDashboard/Tdashboard";
import Sdashboard from "./pages/studentDashboard/Sdashboard";
import useAuth from "./hooks/UseAuth";
import Logout from "./pages/auth/Logout";

const ProtectedRoutes = () => {
  const { user, token, logout } = useAuth();
  const location = useLocation();

  if (!token) {
    logout();
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  let decodedToken;
  try {
    decodedToken = jwtDecode(token);
  } catch (error) {
    console.error("Invalid token:", error);
    logout();
    return <Navigate to="/" replace />;
  }

  const currentTime = Date.now() / 1000;
  if (decodedToken.exp && currentTime > decodedToken.exp) {
    logout();
    return <Navigate to="/" replace />;
  }

  if (!decodedToken?.sub && !decodedToken?.id && !user) {
    logout();
    return <Navigate to="/" replace />;
  }

  const role = user?.role || decodedToken?.role;
 


};

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        
        {/* User auth */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/logout" element={<Logout/>} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        <Route element={<ProtectedRoutes />}>
          <Route path="/admin/dashboard" element={<Dashboard />} />
          <Route path="/teacher/dashboard" element={<Tdashboard />} />
          <Route path="/student/dashboard" element={<Sdashboard />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
