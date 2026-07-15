import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import useApi from "@/hooks/UseApi";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  RefreshCcw, 
  AlertCircle, 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  Save, 
  CheckSquare 
} from "lucide-react";

const AttendanceManagement = () => {
  const navigate = useNavigate();
  const { get, post } = useApi();
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Focus date for batch attendance logging
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);

  const [localAttendance, setLocalAttendance] = useState({});

  const fetchAttendance = useCallback(async () => {
    try {
      const response = await get("/attendances");
      if (response?.success && Array.isArray(response.attendances)) {
        setAttendanceRecords(response.attendances);
      } else if (Array.isArray(response)) {
        setAttendanceRecords(response);
      }
    } catch (error) {
      console.error(error);
    }
  }, [get]);

  const fetchClasses = useCallback(async () => {
    try {
      const response = await get("/classes/all");
      if (response?.success && Array.isArray(response.classes)) {
        setClasses(response.classes);
      } else if (Array.isArray(response)) {
        setClasses(response);
      }
    } catch (error) {
      console.error(error);
    }
  }, [get]);

  const fetchTeachers = useCallback(async () => {
    try {
      const response = await get("/teachers");
      if (response?.success && Array.isArray(response.teachers)) {
        setTeachers(response.teachers);
      } else if (Array.isArray(response)) {
        setTeachers(response);
      }
    } catch (error) {
      console.error(error);
    }
  }, [get]);

  useEffect(() => {
    fetchAttendance();
    fetchClasses();
    fetchTeachers();
  }, [fetchAttendance, fetchClasses, fetchTeachers]);

  // Helper to find class details based on teacher's teachSclass
  const getTeacherClassInfo = useCallback((teachSclassValue) => {
    if (!teachSclassValue) return { id: "", name: "Not Assigned" };
    
    const matchedClass = classes.find((c) => {
      const classId = String(c._id || c.id || "").trim();
      const className = String(c.className || c.sclassName || "").trim();
      const searchTarget = String(teachSclassValue).trim();

      return classId === searchTarget || className === searchTarget;
    });

    if (matchedClass) {
      return {
        id: matchedClass._id || matchedClass.id,
        name: matchedClass.className || matchedClass.sclassName || matchedClass.name
      };
    }

    return { id: teachSclassValue, name: `Class ${teachSclassValue}` };
  }, [classes]);

  // Sync / initialize grid selections with teacher data & class IDs
  useEffect(() => {
    if (teachers.length > 0) {
      const initialGridState = {};
      teachers.forEach((teacher) => {
        const teacherId = String(teacher._id || teacher.id || "").trim();
        
      
        const existingRecord = attendanceRecords.find(
          (rec) => 
            String(rec.teacher?._id || rec.teacher?.id || rec.teacher || "").trim() === teacherId &&
            rec.date?.split("T")[0] === selectedDate
        );

       
        const classInfo = getTeacherClassInfo(teacher.teachSclass);

        initialGridState[teacherId] = {
          sclass: classInfo.id || "",
          status: existingRecord?.status || "Present",
        };
      });
      setLocalAttendance(initialGridState);
    }
  }, [teachers, attendanceRecords, selectedDate, getTeacherClassInfo]);

  const filteredTeachers = useMemo(() => {
    const lower = (searchTerm || "").toLowerCase();
    return teachers.filter((teacher) => {
      const name = teacher.name || "";
      const subject = teacher.teachSubject || "";
      return name.toLowerCase().includes(lower) || subject.toLowerCase().includes(lower);
    });
  }, [teachers, searchTerm]);

  const handleRowChange = (teacherId, field, value) => {
    setLocalAttendance((prev) => ({
      ...prev,
      [teacherId]: {
        ...prev[teacherId],
        [field]: value,
      },
    }));
  };


  const handleMarkAllPresent = () => {
    setLocalAttendance((prev) => {
      const updated = { ...prev };
      Object.keys(updated).forEach((id) => {
        updated[id].status = "Present";
      });
      return updated;
    });
    toast.info("Marked all loaded teachers as Present (unsaved)");
  };

  // Submit all records to backend
  const handleSaveAll = async () => {
    const pendingRequests = [];
    const missingClassTeachers = [];

    teachers.forEach((t) => {
      const teacherId = String(t._id || t.id || "").trim();
      const gridRow = localAttendance[teacherId];

      if (gridRow) {
        if (!gridRow.sclass) {
          missingClassTeachers.push(t.name);
          return;
        }

        pendingRequests.push({
          teacher: teacherId,
          name: t.name,
          status: gridRow.status,
          date: selectedDate,
          sclass: gridRow.sclass,
        });
      }
    });

    if (missingClassTeachers.length > 0) {
      toast.error(`Please configure a classroom reference for: ${missingClassTeachers.join(", ")}`);
      return;
    }

    if (pendingRequests.length === 0) {
      toast.warning("No records found to save");
      return;
    }

    try {
      setSubmitting(true);
      let successCount = 0;

      for (const payload of pendingRequests) {
        const response = await post("/attendances/create", payload);
        if (response?.success) {
          successCount++;
        }
      }

      if (successCount === pendingRequests.length) {
        toast.success("All attendance records saved successfully!");
      } else {
        toast.warning(`Saved ${successCount} of ${pendingRequests.length} records successfully`);
      }
      
      await fetchAttendance();
    } catch (error) {
      console.error(error);
      toast.error("Failed to batch save attendance details.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await fetchAttendance();
      await fetchClasses();
      await fetchTeachers();
    } finally {
      setRefreshing(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "Present":
        return <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white gap-1"><CheckCircle2 className="w-3 h-3" />Present</Badge>;
      case "Absent":
        return <Badge variant="destructive" className="bg-destructive hover:bg-destructive/90 text-white gap-1"><XCircle className="w-3 h-3" />Absent</Badge>;
      case "Late":
        return <Badge className="bg-amber-500 hover:bg-amber-600 text-white gap-1"><Calendar className="w-3 h-3" />Late</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStatusButtonClass = (rowStatus, currentStatus) => {
    const base = "px-3 py-1 text-xs font-semibold rounded-full border transition-all cursor-pointer ";
    if (rowStatus !== currentStatus) {
      return base + "bg-background text-muted-foreground border-input hover:bg-accent";
    }
    switch (currentStatus) {
      case "Present":
        return base + "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800";
      case "Absent":
        return base + "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800";
      case "Late":
        return base + "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800";
      default:
        return base + "bg-primary text-primary-foreground";
    }
  };

  return (
    <div className="pl-16 pr-4 py-6 space-y-6">
     
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Teacher Attendance Registry</h2>
          <p className="text-muted-foreground">Manage and save daily rosters mapped directly to Class Instructors</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCcw className="w-4 h-4 mr-2" />
            {refreshing ? "Refreshing..." : "Refresh"}
          </Button>
          <Button variant="secondary" size="sm" onClick={handleMarkAllPresent} className="gap-2">
            <CheckSquare className="w-4 h-4" /> Mark All Present
          </Button>
          <Button onClick={handleSaveAll} disabled={submitting} className="gap-2 bg-primary">
            <Save className="w-4 h-4" /> {submitting ? "Saving..." : "Save All Logs"}
          </Button>
        </div>
      </div>

    
      <Card className="bg-card border-border">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="space-y-2">
              <Label htmlFor="search">Search Instructors</Label>
              <Input
                id="search"
                placeholder="Search by name or subject..."
                className="bg-background border-border"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="focus-date">Roster Target Date</Label>
              <Input
                id="focus-date"
                type="date"
                className="bg-background border-border"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

     
      <Card className="border border-border">
        <div className="overflow-x-auto">
          {filteredTeachers.length > 0 ? (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-sm font-semibold text-muted-foreground">
                  <th className="p-4">Teacher Name</th>
                  <th className="p-4">Assigned Subject</th>
                  <th className="p-4">Class Teacher Of</th>
                  <th className="p-4">Select Status</th>
                  <th className="p-4">Recent Database Log ({selectedDate})</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm">
                {filteredTeachers.map((teacher) => {
                  const teacherId = String(teacher._id || teacher.id || "").trim();
                  const rowState = localAttendance[teacherId] || { sclass: "", status: "Present" };
                  const classInfo = getTeacherClassInfo(teacher.teachSclass);

                  
                  const existingLog = attendanceRecords.find(
                    (rec) => 
                      String(rec.teacher?._id || rec.teacher?.id || rec.teacher || "").trim() === teacherId &&
                      rec.date?.split("T")[0] === selectedDate
                  );

                  return (
                    <tr key={teacherId} className="hover:bg-muted/30 transition-colors">
                     
                      <td className="p-4 font-medium text-foreground">
                        {teacher.name}
                      </td>

                      {/* Column 2: Subject */}
                      <td className="p-4 text-muted-foreground font-semibold">
                        {teacher.teachSubject || "N/A"}
                      </td>

                      {/* Column 3: Matched permanent classroom */}
                      <td className="p-4">
                        <Badge variant="secondary" className="font-semibold text-xs">
                          {classInfo.name}
                        </Badge>
                      </td>

                      {/* Column 4: Selection Buttons */}
                      <td className="p-4">
                        <div className="flex gap-2">
                          {["Present", "Absent", "Late"].map((st) => (
                            <button
                              key={st}
                              type="button"
                              className={getStatusButtonClass(rowState.status, st)}
                              onClick={() => handleRowChange(teacherId, "status", st)}
                            >
                              {st}
                            </button>
                          ))}
                        </div>
                      </td>

                      {/* Column 5: Database State status */}
                      <td className="p-4">
                        {existingLog ? (
                          <div className="flex items-center gap-2">
                            {getStatusBadge(existingLog.status)}
                            <span className="text-xs text-muted-foreground font-medium">(Saved)</span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">No record submitted</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="p-8 flex flex-col items-center justify-center text-center">
              <AlertCircle className="w-12 h-12 text-muted-foreground mb-2" />
              <p className="text-muted-foreground font-medium">No matching roster entries found.</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default AttendanceManagement;