import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import useApi from "@/hooks/UseApi";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  Calendar,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import z from "zod";
import TeachersManagement from "./TeachersManagement";
import StudentsManagement from "./StudentsManagement";

const createSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(["student", "teacher"], {
    message: "Type is required",
  }),
  class: z.string().optional(),
  date: z.string().min(1, "Date is required"),
  status: z.enum(["Present", "Absent", "Late"], {
    message: "Status is required",
  }),
});

const initialFormState = {
  name: "",
  type: "student",
  class: "",
  date: new Date().toISOString().split("T")[0],
  status: "Present",
};

const AttendanceManagement = () => {
  const navigate = useNavigate();
  const { get, post, put, del } = useApi();
  const [attendance, setAttendance] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingAttendanceId, setEditingAttendanceId] = useState(null);
  const [formState, setFormState] = useState(initialFormState);
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch attendance from backend
  const fetchAttendance = useCallback(async () => {
    try {
      const response = await get("/attendance");
      if (response?.success && Array.isArray(response.attendance)) {
        setAttendance(response.attendance);
      } else if (Array.isArray(response)) {
        setAttendance(response);
      } else {
        toast.error("Unexpected attendance response from backend");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load attendance");
    }
  }, [get]);

  const fetchStudents = useCallback(async () => {
    try {
      const response = await get("/students");
      if (response?.success && Array.isArray(response.students)) {
        return response.students;
      } else if (Array.isArray(response)) {
        return response;
      } else {
        toast.error("Unexpected students response from backend");
        return [];
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load students");
      return [];
    }
  }, [get]);

  const fetchTeachers = useCallback(async () => {
    try {
      const response = await get("/teachers");
      if (response?.success && Array.isArray(response.teachers)) {
        return response.teachers;
      } else if (Array.isArray(response)) {
        return response;
      }
        else {
        toast.error("Unexpected teachers response from backend");
        return [];
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load teachers");
      return [];
    } }, [get]);

    const fetchClasses = useCallback(async () => {
      try {
        const response = await get("/classes");
        if (response?.success && Array.isArray(response.classes)) {
          return response.classes;
        } else if (Array.isArray(response)) {
          return response;
        } else {
          toast.error("Unexpected classes response from backend");
          return [];
        }
      } catch (error) {
        console.error(error);
        toast.error("Failed to load classes");
        return [];
      } }, [get]);

useEffect(() => {
    const fetchAllData = async () => {
      await Promise.all([fetchAttendance(), fetchStudents(), fetchTeachers() ,fetchClasses()]);
    };
    fetchAllData();
  }, [fetchAttendance, fetchStudents, fetchTeachers , fetchClasses]);


  useEffect(() => {
    const handler = (e) => setSearchTerm(e.detail ?? "");
    window.addEventListener("adminSearch", handler);
    return () => window.removeEventListener("adminSearch", handler);
  }, []);

  // Filter attendance based on search, status, and type
  const filteredAttendance = useMemo(() => {
    const lower = (searchTerm || "").toLowerCase();
    return attendance.filter((record) => {
      const matchesSearch =
        (record.name || "").toLowerCase().includes(lower) ||
        (record.class || "").toLowerCase().includes(lower);
      const matchesStatus =
        filterStatus === "all" || record.status === filterStatus;
      const matchesType = filterType === "all" || record.type === filterType;
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [attendance, searchTerm, filterStatus, filterType]);

  const handleInputChange = (field, value) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const openCreateDialog = () => {
    setFormState(initialFormState);
    setIsEditMode(false);
    setEditingAttendanceId(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (record) => {
    setFormState({
      name: record.name || "",
      type: record.type || "student",
      class: record.class || "",
      date: new Date(record.date).toISOString().split("T")[0],
      status: record.status || "Present",
    });
    setEditingAttendanceId(record._id || record.id);
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

    try {
      setSubmitting(true);

      const payload = {
        name: formState.name,
        type: formState.type,
        class: formState.class,
        date: formState.date,
        status: formState.status,
      };

      let response;
      if (isEditMode && editingAttendanceId) {
        response = await put(`/attendance/${editingAttendanceId}`, payload);
      } else {
        response = await post("/attendance/create", payload);
      }

      if (response?.success) {
        toast.success(
          isEditMode
            ? "Attendance updated successfully"
            : "Attendance created successfully"
        );
        setIsDialogOpen(false);
        setIsEditMode(false);
        setEditingAttendanceId(null);
        setFormState(initialFormState);
        await fetchAttendance();
      } else {
        toast.error(response?.message || "Failed to save attendance");
      }
    } catch (error) {
      console.error(error);
      toast.error("Could not save attendance");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (attendanceId) => {
    if (!confirm("Are you sure you want to delete this attendance record?")) {
      return;
    }
    try {
      const response = await del(`/attendance/${attendanceId}`);
      if (response?.success) {
        toast.success("Attendance deleted successfully");
        await fetchAttendance();
      } else {
        toast.error(response?.message || "Failed to delete attendance");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete attendance");
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await fetchAttendance();
      toast.success("Attendance refreshed");
    } finally {
      setRefreshing(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Present":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "Absent":
        return <XCircle className="w-4 h-4 text-red-500" />;
      case "Late":
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Present":
        return "destructive";
      case "Absent":
        return "secondary";
      case "Late":
        return "default";
      default:
        return "outline";
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getTeacherName = (teacherId) => {
    const teacher = TeachersManagement.find(
      (t) => t._id === teacherId || t.id === teacherId,
    );
    return teacher?.name || "N/A";
  };

  const getClassName = (classId) => {
    const cls = classes.find((c) => c._id === classId || c.id === classId);
    return cls?.sclassName || "N/A";
  };

  const getStudentName = (studentId) => {
    const student = StudentsManagement.find(
      (s) => s._id === studentId || s.id === studentId,
    );
    return student?.name || "N/A";
  };

  return (
    <div className="pl-16 pr-4 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            Attendance Management
          </h2>
          <p className="text-muted-foreground">
            Manage student and teacher attendance
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
            {refreshing ? "Refreshing..." : "Refresh"}
          </Button>
          <Button onClick={openCreateDialog} className="gap-2">
            <Plus className="w-4 h-4" />
            Mark Attendance
          </Button>
        </div>
      </div>

      {/* Search and Filter */}
      <Card className="bg-card border-border">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or class..."
                className="pl-10 bg-background border-border"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="sm:w-[150px] bg-background border-border">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="student">Students</SelectItem>
                <SelectItem value="teacher">Teachers</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-end gap-2">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="sm:w-[150px] bg-background border-border">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Present">Present</SelectItem>
                  <SelectItem value="Absent">Absent</SelectItem>
                  <SelectItem value="Late">Late</SelectItem>
                </SelectContent>
              </Select>
              {(filterStatus !== "all" || filterType !== "all") && (
                <Badge variant="secondary" className="whitespace-nowrap">
                  Filtering
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px] bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {isEditMode ? "Edit Attendance" : "Mark Attendance"}
            </DialogTitle>
            <DialogDescription>
              {isEditMode
                ? "Update attendance information"
                : "Mark attendance for a student or teacher."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="Enter name"
                value={formState.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select
                  value={formState.type}
                  onValueChange={(value) => handleInputChange("type", value)}
                >
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="teacher">Teacher</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="class">Class</Label>
                <Input
                  id="class"
                  placeholder="Enter class (optional)"
                  value={formState.class}
                  onChange={(e) => handleInputChange("class", e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={formState.date}
                  onChange={(e) => handleInputChange("date", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formState.status}
                  onValueChange={(value) =>
                    handleInputChange("status", value)
                  }
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Present">Present</SelectItem>
                    <SelectItem value="Absent">Absent</SelectItem>
                    <SelectItem value="Late">Late</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false);
                  setFormState(initialFormState);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting
                  ? "Saving..."
                  : isEditMode
                    ? "Update"
                    : "Mark Attendance"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Attendance List */}
      {filteredAttendance.length > 0 ? (
        <div className="grid gap-4 grid-cols-1">
          {filteredAttendance.map((record) => (
            <Card
              key={record._id || record.id}
              className="bg-card border-border overflow-hidden"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <CardTitle className="text-lg text-foreground">
                        {record.name}
                      </CardTitle>
                      <Badge variant={getStatusColor(record.status)}>
                        <span className="flex items-center gap-1">
                          {getStatusIcon(record.status)}
                          {record.status}
                        </span>
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="capitalize">Type: {record.type}</span>
                      {record.class && <span>Class: {record.class}</span>}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(record)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() =>
                          handleDelete(record._id || record.id)
                        }
                        className="text-destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  {formatDate(record.date)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No attendance records found</p>
              <p className="text-sm text-muted-foreground/70">
                {searchTerm || filterStatus !== "all" || filterType !== "all"
                  ? "Try adjusting your search or filters"
                  : "Create your first attendance record to get started"}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Card */}
      {attendance.length > 0 && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total Records</p>
                <p className="text-2xl font-bold text-foreground">
                  {attendance.length}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Present</p>
                <p className="text-2xl font-bold text-green-500">
                  {attendance.filter((a) => a.status === "Present").length}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Absent</p>
                <p className="text-2xl font-bold text-red-500">
                  {attendance.filter((a) => a.status === "Absent").length}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Late</p>
                <p className="text-2xl font-bold text-yellow-500">
                  {attendance.filter((a) => a.status === "Late").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AttendanceManagement;