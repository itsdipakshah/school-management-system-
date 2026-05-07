import HomePage from '@/pages/HomePage'
import React from 'react'
import { Outlet, useLocation } from 'react-router-dom'

const AppLayout = () => {

  adminRoutes=['/register']

  const path = useLocation.pathname;

  if (path.startsWith("/admin") && role !== "Admin") {
    return <Navigate to="/login" replace />;
  }
  if (path.startsWith("/teacher") && role !== "Teacher") {
    return <Navigate to="/login" replace />;
  }
  if (path.startsWith("/student") && role !== "Student") {
    return <Navigate to="/login" replace />;
  }
  return (
    <>
    <HomePage />
     <Outlet />
    </>
  )
}

export default AppLayout