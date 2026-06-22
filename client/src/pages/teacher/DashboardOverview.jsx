import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import useApi from "@/hooks/UseApi";
import useAuth from "@/hooks/UseAuth";

import {
  Badge,
  BookOpen,
  DollarSign,
  Hash,
  Mail,
  Phone,
  School,
  ShieldCheck,
} from "lucide-react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";


const DashboardOverview = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { get, post, put, del } = useApi();

  const [profileDetails, setProfileDetails] = useState(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) return <div>Loading profile records...</div>;
  if (!profileDetails) return <div>No matching teacher profile found.</div>;
  return (
    <div className="pl-16 pr-4 py-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
            <Badge className="bg-blue-50 text-blue-700 border border-blue-200 capitalize hover:bg-blue-50 font-medium px-2.5 py-0.5">
              <ShieldCheck className="w-3.5 h-3.5 mr-1 text-blue-500 inline" />
              {profileDetails.role || 'Teacher'}
            </Badge>
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
    </div>
  );
};

export default DashboardOverview;
