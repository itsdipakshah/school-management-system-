import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import useApi from "@/hooks/UseApi";
import useAuth from "@/hooks/UseAuth";

import {
  Badge,
  BookOpen,
  Box,
  DollarSign,
  Hash,
  Mail,
  Phone,
  School,
  ShieldCheck,
  ShieldCheckIcon,
} from "lucide-react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";


const DashboardOverview = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { get, post, put, del } = useApi();

  const [profileDetails, setProfileDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [totalStudents, setTotalStudents] = useState(0);
  const [totalPresent, setTotalPresent] = useState(0);
  const [totalAbsent, setTotalAbsent] = useState(0);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.email) return;
      try {
        setLoading(true);
        const res = await get("/teachers");
        const list = res?.teachers || res || [];

        const match = list.find(
          (t) =>
            (t.teacher || t).email?.toLowerCase() === user.email.toLowerCase(),
        );
        if (match) setProfileDetails(match.teacher || match);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfile();
  }, [get, user?.email]);

  useEffect(() => {
    const computeAttendance = async () => {
      if (!profileDetails) return;
      try {
        // fetch students in this class
        const stuRes = await get(`/students/class/${encodeURIComponent(profileDetails.teachSclass)}`);
        const students = stuRes?.studentByClass || stuRes?.students || [];
        setTotalStudents(Array.isArray(students) ? students.length : 0);

        // fetch attendances and filter by class + today's date
        const attRes = await get(`/attendances`);
        const attendances = attRes?.attendances || [];
        const todayKey = new Date().toISOString().split("T")[0];
        const classAttendances = (attendances || []).filter((a) => {
          const aClass = a.class || a.sclass || "";
          const aDateKey = a.date ? new Date(a.date).toISOString().split("T")[0] : "";
          const subjectMatch = !profileDetails.teachSubject || !a.subName || String(a.subName).trim() === String(profileDetails.teachSubject).trim();
          return String(aClass).trim() === String(profileDetails.teachSclass).trim() && aDateKey === todayKey && subjectMatch;
        });

        const present = classAttendances.filter((c) => c.status === "Present").length;
        const absent = classAttendances.filter((c) => c.status === "Absent").length;
        setTotalPresent(present);
        setTotalAbsent(absent);
      } catch (err) {
        console.error(err);
      }
    };
    computeAttendance();
  }, [get, profileDetails]);

  if (loading) return <div>Loading profile records...</div>;
  if (!profileDetails) return <div>No matching teacher profile found.</div>;
  return (
    <div className="pl-16 pr-4 py-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
        <Card className="border-blue-300/50 shadow-sm hover:shadow-xl hover:shadow-green-900/10 transition-all duration-300 ease-out hover:-translate-y-1.5 hover:scale-[1.02] animate-in fade-in slide-in-from-bottom-4 duration-500">
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3 border-b border-slate-100">
            <div className="space-y-1">
              <CardTitle className="text-xl font-bold tracking-tight text-slate-900">
                {profileDetails.name || 'N/A'}
              </CardTitle>
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Hash className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-mono font-medium bg-slate-100 px-1.5 py-0.5 rounded">
                  {profileDetails.teachSubject || 'N/A'}
                </span>
              </div>
            </div>
          
          </CardHeader>

          <CardContent className="pt-4 space-y-3.5 text-sm">
            <div className="flex items-center gap-3 text-slate-600">
              <div className="p-1.5 bg-slate-50 rounded-md border border-slate-100">
                <Mail className="w-4 h-4 text-slate-500" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Email Address</span>
                <span className="truncate text-slate-800 font-medium">{profileDetails.email || 'N/A'}</span>
              </div>
            </div>


            <div className="flex items-center gap-3 text-slate-600">
              <div className="p-1.5 bg-slate-50 rounded-md border border-slate-100">
                <Phone className="w-4 h-4 text-slate-500" />
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Contact Number</span>
                <span className="text-slate-800 font-medium font-mono">{profileDetails.phone || 'N/A'}</span>
              </div>
            </div>
            <div className="flex items-center gap-3 text-slate-600">
              <div className="p-1.5 bg-slate-50 rounded-md border border-slate-100">
                <Box className="w-4 h-4 text-slate-500" />
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Teacher of Class</span>
                <span className="text-slate-800 font-medium font-mono">{profileDetails.teachSclass || 'N/A'}</span>
              </div>
            </div>
            <div className="flex items-center gap-3 text-slate-600">
              <div className="p-1.5 bg-slate-50 rounded-md border border-slate-100">
                <DollarSign className="w-4 h-4 text-slate-500" />
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Salary</span>
                <span className="text-slate-800 font-medium">{profileDetails.salary || 'N/A'}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 text-slate-600">
              <div className="p-1.5 bg-slate-50 rounded-md border border-slate-100">
                <School className="w-4 h-4 text-slate-500" />
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Institution</span>
                <span className="text-slate-800 font-medium">{profileDetails.school || 'N/A'}</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        </div>
        <div>
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold">Today's Attendance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Total Students</span>
                <span className="font-medium">{totalStudents}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Present</span>
                <span className="font-medium text-green-600">{totalPresent}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Absent</span>
                <span className="font-medium text-red-600">{totalAbsent}</span>
              </div>
            </div>
          </CardContent>
        </Card>
        </div>
        
      </div>
    </div>
  );
};

export default DashboardOverview;
