import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import useApi from "@/hooks/UseApi";
import useAuth from "@/hooks/UseAuth";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  MoreHorizontal,
  RefreshCcw,
  AlertCircle,
  Calendar,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import z from "zod";

const createSchema = z.object({
  sclass: z.string().min(1, "Class is required"),
  student: z.string().min(1, "Student selection is required"),
  status: z.enum(["Present", "Absent", "Late"], {
    message: "Status must be Present, Absent, or Late",
  }),
  date: z.string().min(1, "Date is required"),
});

const initialFormState = {
  sclass: "",
  student: "",
  status: "Present",
  date: new Date().toISOString().split("T")[0],
};

const Attendances = ({ currentTeacher }) => {
  const { user } = useAuth();

  const teacherContext = currentTeacher || {
    _id: "user._id",
    name: user?.name || "Unknown Teacher",
  };

  const navigate = useNavigate();
  const { get, post, put, del } = useApi();

  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingRecordId, setEditingRecordId] = useState(null);
  const [formState, setFormState] = useState(initialFormState);

  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [submittingIds, setSubmittingIds] = useState([]);

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

  const fetchStudentsByClass = useCallback(
    async (className) => {
      if (!className) return;
      try {
        const response = await get(
          `/students/class/${encodeURIComponent(className)}`,
        );
        if (response?.success && Array.isArray(response.studentByClass)) {
          setStudents(response.studentByClass);
        } else if (response?.students && Array.isArray(response.students)) {
          setStudents(response.students);
        } else if (Array.isArray(response)) {
          setStudents(response);
        } else {
          setStudents([]);
        }
      } catch (error) {
        console.error(error);
        toast.error("Failed to load students for the selected class.");
      }
    },
    [get],
  );

  const fetchClasses = useCallback(async () => {
    const sclassName = String(teacherContext.teachSclass || "").trim();
    if (!sclassName) {
      setClasses([]);
      return;
    }
    const classObj = { sclassName, section: "" };
    setClasses([classObj]);
    setFormState((prev) => ({ ...prev, sclass: sclassName }));
    await fetchStudentsByClass(sclassName);
  }, [teacherContext.teachSclass, fetchStudentsByClass]);

  useEffect(() => {
    fetchAttendance();
    fetchClasses();
  }, [fetchAttendance, fetchClasses]);

  useEffect(() => {
    if (formState.sclass) {
      fetchStudentsByClass(formState.sclass);
    } else {
      setStudents([]);
    }
  }, [formState.sclass, fetchStudentsByClass]);

  const filteredAttendance = useMemo(() => {
    const lower = (searchTerm || "").toLowerCase();
    return attendanceRecords.filter((record) => {
      const studentName = record.student?.name || record.name || "";
      const matchesSearch =
        studentName.toLowerCase().includes(lower) ||
        (record.sclass?.className || record.sclass?.sclassName || "")
          .toLowerCase()
          .includes(lower);
      const matchesStatus =
        filterStatus === "all" || record.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [attendanceRecords, searchTerm, filterStatus]);

  const handleInputChange = (field, value) => {
    setFormState((prev) => {
      const cleanValue =
        field === "sclass" || field === "student"
          ? String(value ?? "").trim()
          : value;
      if (field === "sclass") {
        return { ...prev, sclass: cleanValue, student: "" };
      }
      return { ...prev, [field]: cleanValue };
    });
  };

  const openCreateDialog = () => {
    setFormState(initialFormState);
    setIsEditMode(false);
    setEditingRecordId(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (record) => {
    const classId =
      record.sclass?._id ||
      record.sclass?.id ||
      (typeof record.sclass === "string" ? record.sclass : "");
    const studentId =
      record.student?._id ||
      record.student?.id ||
      (typeof record.student === "string" ? record.student : "");

    setFormState({
      sclass: String(classId).trim(),
      student: String(studentId).trim(),
      status: record.status || "Present",
      date: record.date
        ? new Date(record.date).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
    });
    setEditingRecordId(record._id || record.id);
    setIsEditMode(true);
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validation = createSchema.safeParse(formState);
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    const selectedStudentObj = students.find(
      (s) => String(s._id || s.id || "").trim() === formState.student,
    );

    if (!selectedStudentObj) {
      toast.error(
        "Please select a valid student from the active registry list",
      );
      return;
    }

    try {
      setSubmitting(true);

      const name =
        (selectedStudentObj.firstName || selectedStudentObj.name || "") +
        (selectedStudentObj.lastName ? ` ${selectedStudentObj.lastName}` : "");
      const payload = {
        student: formState.student,
        name,
        status: formState.status,
        date: formState.date,
        class: formState.sclass,
        subName: teacherContext.teachSubject || "",
      };

      let response;
      if (isEditMode && editingRecordId) {
        response = await put(`/attendances/${editingRecordId}`, payload);
      } else {
        response = await post(`/attendances/createStd`, payload);
      }

      if (response?.success) {
        toast.success(
          isEditMode
            ? "Attendance logs modified successfully"
            : "Attendance recorded cleanly",
        );
        setIsDialogOpen(false);
        setIsEditMode(false);
        setEditingRecordId(null);
        setFormState(initialFormState);
        await fetchAttendance();
      } else {
        toast.error(response?.message || "Failed to commit record updates");
      }
    } catch (error) {
      console.error(error);
      toast.error("Unable to save student attendance entry.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (
      !confirm(
        "Remove this target student attendance record from registry logs?",
      )
    )
      return;
    try {
      const response = await del(`/attendances/${id}`);
      if (response?.success) {
        toast.success("Attendance ledger item removed");
        await fetchAttendance();
      } else {
        toast.error(
          response?.message || "Failed to process elimination request",
        );
      }
    } catch (error) {
      console.error(error);
      toast.error("Clean fallback interruption triggered");
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await fetchAttendance();
    } finally {
      setRefreshing(false);
    }
  };

  const markAttendance = async (studentObj, status) => {
    const studentId = String(studentObj._id || studentObj.id || "").trim();
    if (!studentId) return toast.error("Invalid student selected");
    if (!formState.sclass) return toast.error("Class not selected");

    const alreadySubmitting = submittingIds.includes(studentId);
    if (alreadySubmitting) return;
    setSubmittingIds((s) => [...s, studentId]);

    try {
      const name =
        (studentObj.firstName || studentObj.name || "") +
        (studentObj.lastName ? ` ${studentObj.lastName}` : "");
      const payload = {
        student: studentId,
        name,
        status,
        date: formState.date,
        class: formState.sclass,
        subName: teacherContext.teachSubject || "",
      };

      const res = await post(`/attendances/createStd`, payload);
      if (res?.success) {
        toast.success(`${name} marked ${status}`);
        await fetchAttendance();
      } else {
        toast.error(res?.message || "Failed to mark attendance");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to mark attendance");
    } finally {
      setSubmittingIds((s) => s.filter((x) => x !== studentId));
    }
  };

  const handleMarkAllPresent = async () => {
    if (!formState.sclass) return toast.error("Class not selected");
    if (!students.length)
      return toast.error("No students in this class to mark");
    if (
      !confirm(
        `Mark all ${students.length} students as Present for ${formState.sclass}?`,
      )
    )
      return;

    try {
      setSubmitting(true);
      const promises = students.map((s) => {
        const name =
          (s.firstName || s.name || "") + (s.lastName ? ` ${s.lastName}` : "");
        return post(`/attendances/createStd`, {
          student: s._id || s.id,
          name,
          status: "Present",
          date: formState.date,
          class: formState.sclass,
          subName: teacherContext.teachSubject || "",
        });
      });
      const results = await Promise.allSettled(promises);
      const successes = results.filter((r) => r.status === "fulfilled").length;
      toast.success(`${successes} / ${students.length} marked as Present`);
      await fetchAttendance();
    } catch (err) {
      console.error(err);
      toast.error("Failed marking all present");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "Present":
        return (
          <Badge variant="success" className="gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Present
          </Badge>
        );
      case "Absent":
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="w-3 h-3" />
            Absent
          </Badge>
        );
      case "Late":
        return (
          <Badge variant="warning" className="gap-1">
            <Calendar className="w-3 h-3" />
            Late
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="pl-16 pr-4 py-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            Student Roll Call Panel
          </h2>
          <p className="text-muted-foreground">
            Logged in as: {teacherContext.name}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCcw className="w-4 h-4 mr-2" />
            {refreshing ? "Refreshing Grid..." : "Refresh"}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleMarkAllPresent}
            disabled={submitting || !students.length}
            className="mx-1"
          >
            Mark All Present
          </Button>
          <Button onClick={openCreateDialog} className="gap-2">
            <Plus className="w-4 h-4" /> Record Roll Call
          </Button>
        </div>
      </div>

      <Card className="bg-card border-border mt-4">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search matching student tracking profile names..."
                className="pl-10 bg-background border-border"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-end gap-2">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="sm:w-[180px] bg-background border-border">
                  <SelectValue placeholder="Filter metrics" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Complete Logs</SelectItem>
                  <SelectItem value="Present">Present</SelectItem>
                  <SelectItem value="Absent">Absent</SelectItem>
                  <SelectItem value="Late">Late</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] bg-card border-border max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEditMode
                ? "Modify Live Attendance Entry"
                : "Commit Active Class Roll Call"}
            </DialogTitle>
            <DialogDescription>
              Apply active state modifications to mapped student structural
              items.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="sclass">Class Room</Label>
                <Select
                  value={formState.sclass || undefined}
                  onValueChange={(v) => handleInputChange("sclass", v)}
                >
                  <SelectTrigger
                    id="sclass"
                    className="bg-background border-border"
                  >
                    <SelectValue placeholder="Select Target Class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((c) => {
                      const classId = String(c._id || c.id || "").trim();
                      return (
                        <SelectItem key={classId} value={classId}>
                          {c.sclassName} - Section {c.section}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="student">Student</Label>
                <Select
                  value={formState.student || undefined}
                  onValueChange={(v) => handleInputChange("student", v)}
                  disabled={!formState.sclass}
                >
                  <SelectTrigger
                    id="student"
                    className="bg-background border-border"
                  >
                    <SelectValue
                      placeholder={
                        formState.sclass
                          ? "Select Student Profile"
                          : "Choose Class First"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map((s) => {
                      const studentId = String(s._id || s.id || "").trim();
                      return (
                        <SelectItem key={studentId} value={studentId}>
                          {s.name}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formState.status}
                  onValueChange={(v) => handleInputChange("status", v)}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Mark state indicator" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Present">Present</SelectItem>
                    <SelectItem value="Absent">Absent</SelectItem>
                    <SelectItem value="Late">Late</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Logging Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={formState.date}
                  onChange={(e) => handleInputChange("date", e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting
                  ? "Writing data blocks..."
                  : isEditMode
                    ? "Apply Changes"
                    : "Commit Record"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Card className="mt-6">
        <CardContent>
          <h3 className="text-lg font-semibold mb-3">
            Students in Class {formState.sclass || teacherContext.teachSclass}
          </h3>
          <div className="grid gap-3">
            {students && students.length > 0 ? (
              students.map((s) => {
                const studentId = String(s._id || s.id || "").trim();
                const displayName =
                  (s.firstName || s.name || "") +
                  (s.lastName ? ` ${s.lastName}` : "");
                return (
                  <div
                    key={studentId}
                    className="flex items-center justify-between p-3 border rounded-md"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={
                          s.studentAvatar?.url ||
                          s.studentAvatar?.secure_url ||
                          "/public/default-avatar.png"
                        }
                        alt={displayName}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div>
                        <div className="font-medium">{displayName}</div>
                        <div className="text-sm text-muted-foreground">
                          Roll: {s.rollNum ?? "-"}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-green-600"
                        onClick={() => markAttendance(s, "Present")}
                        disabled={submittingIds.includes(studentId)}
                      >
                        Present
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-600"
                        onClick={() => markAttendance(s, "Absent")}
                        disabled={submittingIds.includes(studentId)}
                      >
                        Absent
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-amber-600"
                        onClick={() => markAttendance(s, "Late")}
                        disabled={submittingIds.includes(studentId)}
                      >
                        Late
                      </Button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-4 text-center text-muted-foreground">
                No students found for this class.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Attendances;
