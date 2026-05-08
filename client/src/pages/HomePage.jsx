import React from "react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/button.jsx";
import CustomButton from "@/components/common/CustomButton.jsx";

const HomePage = () => {
  return (
    <div className="min-h-screen bg-[#AAC4F5] text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-4 py-16 sm:px-6 lg:px-8">

        <div className="grid gap-12 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          {/* Left side */}
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-700">
              <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-green-600"></span>

              <p>School Management System</p>
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
                Make school life easier for admins, teachers, and students.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
                Centralize attendance, fees, notices, and results in one modern
                dashboard built for the whole school community.
              </p>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row">

              <CustomButton variant="primary" asChild className="min-w-[150px] justify-center">
               <Link to="/login">Login</Link>
              </CustomButton>
              <Button
                asChild
                variant="outline"
                className="min-w-[150px] justify-center"
              >
                <Link to="/register">Register</Link>
              </Button>
            </div>
          </div>
          {/* Right side */}
          <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/40">
            <div className="space-y-6">
              <div className="rounded-3xl bg-blue-50 p-6 text-slate-900">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">
                  Built for schools
                </p>
                <h2 className="mt-4 text-2xl font-bold">
                  Fast setup, easy access
                </h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  Log in or register to start managing your classroom, students,
                  and school operations from a single place.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 ">
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 transition hover:border-blue-300">
                  <p className="text-sm font-semibold text-slate-900">
                    Attendance
                  </p>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    Track student attendance and teacher schedules with one
                    click.
                  </p>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 transition hover:border-blue-300">
                  <p className="text-sm font-semibold text-slate-900">
                    Results
                  </p>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    Publish grades and progress reports for students and parents
                    instantly.
                  </p>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 transition hover:border-blue-300">
                  <p className="text-sm font-semibold text-slate-900">Fees</p>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    Simplify fee management with clear records and payment
                    status for every student.
                  </p>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 transition hover:border-blue-300">
                  <p className="text-sm font-semibold text-slate-900">
                    Notices
                  </p>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    Share announcements, homework, and school news across all
                    roles immediately.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
