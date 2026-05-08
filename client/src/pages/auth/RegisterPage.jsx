import React from "react";
import { Link } from "react-router-dom";
import { Button } from "../../components/ui/button.jsx";

const RegisterPage = () => {
  return (
    <div className="min-h-screen bg-[#AAC4F5] px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-xl rounded-[2rem] border border-slate-200 bg-white p-10 shadow-xl shadow-slate-200/40">
        <div className="space-y-6 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">
            Create your account
          </p>
          <h1 className="text-3xl font-bold text-slate-950 sm:text-4xl">
            Register for the School Management System
          </h1>
          <p className="mx-auto max-w-lg text-sm leading-6 text-slate-600">
            Join as an admin, teacher, or student and start managing notices, attendance, fees, and results in one place.
          </p>
        </div>

        <div className="mt-10 space-y-4">
          <div className="rounded-3xl bg-slate-50 p-6 text-slate-700">
            <p className="text-sm font-semibold">Registration is coming soon.</p>
            <p className="mt-3 text-sm text-slate-600">
              You can implement the registration form here and connect it to the backend register endpoint.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button asChild className="min-w-[140px] justify-center">
              <Link to="/login">Go to Login</Link>
            </Button>
            <Button asChild variant="outline" className="min-w-[140px] justify-center">
              <Link to="/">Back to Home</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
