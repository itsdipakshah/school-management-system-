import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import useApi from "@/hooks/UseApi";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Plus, Search, Edit, Trash2, MoreHorizontal, RefreshCcw, AlertCircle, Calendar, CheckCircle2, XCircle } from "lucide-react";
import z from "zod";

const createSchema = z.object({
  sclass: z.string().min(1, "Class is required"),
  teacher: z.string().min(1, "Teacher is required"),
  status: z.enum(["Present", "Absent", "Late"], { message: "Status must be Present, Absent, or Late" }),
  date: z.string().min(1, "Date is required"),
});

const initialFormState = {
  sclass: "",
  teacher: "",
  status: "Present",
  date: new Date().toISOString().split("T")[0],
};

const AttendanceManagement = () => {
  const navigate = useNavigate();
  const { get, post, put, del } = useApi();
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingRecordId, setEditingRecordId] = useState(null);
  const [formState, setFormState] = useState(initialFormState);
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

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

  useEffect(() => {
    const handler = (e) => setSearchTerm(e.detail ?? "");
    window.addEventListener("adminSearch", handler);
    return () => window.removeEventListener("adminSearch", handler);
  }, []);

  const filteredAttendance = useMemo(() => {
    const lower = (searchTerm || "").toLowerCase();
    return attendanceRecords.filter((record) => {
      const teacherName = record.teacher?.name || record.name || "";
      const matchesSearch =
        teacherName.toLowerCase().includes(lower) ||
        (record.sclass?.className || record.sclass?.sclassName || "").toLowerCase().includes(lower);
      const matchesStatus = filterStatus === "all" || record.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [attendanceRecords, searchTerm, filterStatus]);

  const handleInputChange = (field, value) => {
    setFormState((prev) => {
      const cleanValue = (field === "sclass" || field === "teacher") ? String(value ?? "").trim() : value;
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
    const classId = record.sclass?._id || record.sclass?.id || (typeof record.sclass === "string" ? record.sclass : "");
    const teacherId = record.teacher?._id || record.teacher?.id || (typeof record.teacher === "string" ? record.teacher : "");

    setFormState({
      sclass: String(classId).trim(),
      teacher: String(teacherId).trim(),
      status: record.status || "Present",
      date: record.date ? new Date(record.date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
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

    // Find the teacher object matching the selected formState.teacher ID to extract their name
    const selectedTeacherObj = teachers.find(
      (t) => String(t._id || t.id || "").trim() === formState.teacher
    );

    if (!selectedTeacherObj) {
      toast.error("Please select a valid teacher from the list");
      return;
    }

    try {
      setSubmitting(true);
      
      // Building payload strictly matching backend: { teacher, name, status, date }
      const payload = {
        teacher: formState.teacher,
        name: selectedTeacherObj.name, // Added this to pass backend requirements
        status: formState.status,
        date: formState.date,
        sclass: formState.sclass, // Retained just in case backend references it optional
      };

      let response;
      if (isEditMode && editingRecordId) {
        response = await put(`/attendances/${editingRecordId}`, payload);
      } else {
        response = await post("/attendances/create", payload);
      }

      if (response?.success) {
        toast.success(isEditMode ? "attendances updated successfully" : "attendances recorded successfully");
        setIsDialogOpen(false);
        setIsEditMode(false);
        setEditingRecordId(null);
        setFormState(initialFormState);
        await fetchAttendance();
      } else {
        toast.error(response?.message || "Failed to save attendances");
      }
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Unable to save attendances details.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to remove this attendances record?")) return;
    try {
      const response = await del(`/attendances/${id}`);
      if (response?.success) {
        toast.success("attendances entry deleted");
        await fetchAttendance();
      } else {
        toast.error(response?.message || "Failed to remove item");
      }
    } catch (error) {
      console.error(error);
      toast.error("Process failed cleanly");
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

  const getStatusBadge = (status) => {
    switch (status) {
      case "Present":
        return <Badge variant="success" className="gap-1"><CheckCircle2 className="w-3 h-3" />Present</Badge>;
      case "Absent":
        return <Badge variant="destructive" className="gap-1"><XCircle className="w-3 h-3" />Absent</Badge>;
      case "Late":
        return <Badge variant="warning" className="gap-1"><Calendar className="w-3 h-3" />Late</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="pl-16 pr-4 py-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Teacher attendances Logs</h2>
          <p className="text-muted-foreground">Monitor and alter active structural daily teacher trackers</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCcw className="w-4 h-4 mr-2" />
            {refreshing ? "Refreshing..." : "Refresh"}
          </Button>
          <Button onClick={openCreateDialog} className="gap-2">
            <Plus className="w-4 h-4" /> Add Record
          </Button>
        </div>
      </div>

      <Card className="bg-card border-border mt-4">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by teacher or structural designation class..."
                className="pl-10 bg-background border-border"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-end gap-2">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="sm:w-[180px] bg-background border-border">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Logs</SelectItem>
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
            <DialogTitle>{isEditMode ? "Modify Teacher attendances" : "New Roll Call Entry"}</DialogTitle>
            <DialogDescription>Maintain state structures mapping relative dynamic teacher entities.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="teacher">Teacher / Instructor</Label>
                <Select 
                  value={formState.teacher || undefined} 
                  onValueChange={(v) => handleInputChange("teacher", v)}
                >
                  <SelectTrigger id="teacher" className="bg-background border-border">
                    <SelectValue placeholder="Select Teacher" />
                  </SelectTrigger>
                  <SelectContent>
                    {teachers.map((t) => {
                      const teacherId = String(t._id || t.id || "").trim();
                      return (
                        <SelectItem key={teacherId} value={teacherId}>
                          {t.name}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sclass">Assigned Class Room</Label>
                <Select 
                  value={formState.sclass || undefined} 
                  onValueChange={(v) => handleInputChange("sclass", v)}
                >
                  <SelectTrigger id="sclass" className="bg-background border-border">
                    <SelectValue placeholder="Select Class Structure" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((c) => {
                      const classId = String(c._id || c.id || "").trim();
                      return (
                        <SelectItem key={classId} value={classId}>
                          {c.className || c.sclassName || c.name}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="status">Registry Status</Label>
                <Select value={formState.status} onValueChange={(v) => handleInputChange("status", v)}>
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status context" />
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
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Writing data..." : isEditMode ? "Apply Updates" : "Commit Record"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <div className="mt-6">
        {filteredAttendance.length > 0 ? (
          <div className="grid gap-4 grid-cols-1">
            {filteredAttendance.map((rec) => (
              <Card key={rec._id || rec.id} className="bg-card border-border overflow-hidden">
                <CardContent className="p-4 flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-lg">{rec.teacher?.name || rec.name || "Teacher Name Missing"}</span>
                      {getStatusBadge(rec.status)}
                    </div>
                    <div className="text-sm text-muted-foreground space-x-4">
                      <span>Assigned Class: {rec.sclass?.className || rec.sclass?.sclassName || "Unassigned"}</span>
                      <span>Date: {rec.date ? new Date(rec.date).toLocaleDateString() : "N/A"}</span>
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(rec)}>
                        <Edit className="w-4 h-4 mr-2" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDelete(rec._id || rec.id)} className="text-destructive">
                        <Trash2 className="w-4 h-4 mr-2" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="bg-card border-border">
            <CardContent className="pt-6 flex flex-col items-center justify-center py-8 text-center">
              <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No corresponding attendances structures found</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AttendanceManagement;