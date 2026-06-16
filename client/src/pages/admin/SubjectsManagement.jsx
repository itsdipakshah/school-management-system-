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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
} from "lucide-react";
import z from "zod";

const createSchema = z.object({
  subjectName: z.string().min(1, "Subject name is required"),
  subjectCode: z.string().min(1, "Subject code is required"),
  sclass: z.string().min(1, "Class is required"),
  teacher: z.string().min(1, "Teacher is required"),
});

const initialFormState = {
  subjectName: "",
  subjectCode: "",
  sclass: "",
  teacher: "",
};

const SubjectsManagement = () => {
  const navigate = useNavigate();
  const { get, post, put, del } = useApi();
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingSubjectId, setEditingSubjectId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [formState, setFormState] = useState(initialFormState);
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch subjects, classes, and teachers
  const fetchSubjects = useCallback(async () => {
    try {
      const response = await get("/subjects");
      if (response?.success && Array.isArray(response.subjects)) {
        setSubjects(response.subjects);
      } else if (Array.isArray(response)) {
        setSubjects(response);
      } else {
        toast.error("Unexpected subjects response from backend");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load subjects");
    }
  }, [get]);

  const fetchClasses = useCallback(async () => {
    try {
      const response = await get("/classes/all");
      if (response?.classes && Array.isArray(response.classes)) {
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
    const fetchAllData = async () => {
      await Promise.all([fetchSubjects(), fetchClasses(), fetchTeachers()]);
    };
    fetchAllData();
  }, [fetchSubjects, fetchClasses, fetchTeachers]);

  useEffect(() => {
    const handler = (e) => setSearchTerm(e.detail ?? "");
    window.addEventListener("adminSearch", handler);
    return () => window.removeEventListener("adminSearch", handler);
  }, []);

  // Filter subjects based on search term
  const filteredSubjects = useMemo(() => {
    const lower = (searchTerm || "").toLowerCase();
    return subjects.filter((s) => {
      const teacherName = s.teacher?.name || "";
      const className = s.sclass?.sclassName || "";
      return (
        (s.subjectName || "").toLowerCase().includes(lower) ||
        (s.subjectCode || "").toLowerCase().includes(lower) ||
        (teacherName || "").toLowerCase().includes(lower) ||
        (className || "").toLowerCase().includes(lower)
      );
    });
  }, [subjects, searchTerm]);

  const handleInputChange = (field, value) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const openCreateDialog = () => {
    setFormState(initialFormState);
    setIsEditMode(false);
    setEditingSubjectId(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (subject) => {
    setFormState({
      subjectName: subject.subjectName || "",
      subjectCode: subject.subjectCode || "",
      sclass: subject.sclass?._id || subject.sclass || "",
      teacher: subject.teacher?._id || subject.teacher || "",
    });
    setEditingSubjectId(subject._id || subject.id);
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
      let response;
      if (isEditMode && editingSubjectId) {
        response = await put(`/subjects/${editingSubjectId}`, formState);
      } else {
        response = await post("/subjects/create", formState);
      }

      if (response?.success) {
        toast.success(
          isEditMode
            ? "Subject updated successfully"
            : "Subject created successfully",
        );
        setIsDialogOpen(false);
        setIsEditMode(false);
        setEditingSubjectId(null);
        setFormState(initialFormState);
        await fetchSubjects();
      } else {
        toast.error(response?.message || "Failed to save subject");
      }
    } catch (error) {
      console.error(error);
      toast.error("Could not save subject");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (subjectId) => {
    if (!confirm("Are you sure you want to delete this subject?")) {
      return;
    }
    try {
      const response = await del(`/subjects/${subjectId}`);
      if (response?.success) {
        toast.success("Subject deleted successfully");
        await fetchSubjects();
      } else {
        toast.error(response?.message || "Failed to delete subject");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete subject");
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await fetchSubjects();
      toast.success("Subjects refreshed");
    } finally {
      setRefreshing(false);
    }
  };

  const getTeacherName = (teacherId) => {
    const teacher = teachers.find(
      (t) => t._id === teacherId || t.id === teacherId,
    );
    return teacher?.name || "N/A";
  };

  const getClassName = (classId) => {
    const cls = classes.find((c) => c._id === classId || c.id === classId);
    return cls?.sclassName || "N/A";
  };

  return (
    <div className="pl-16 pr-4 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Subjects</h2>
          <p className="text-muted-foreground">
            Manage curriculum and subject assignments
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
            Add Subject
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <Card className="bg-card border-border">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search subjects by name, code, teacher, or class..."
              className="pl-10 bg-background border-border"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px] bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {isEditMode ? "Edit Subject" : "Add New Subject"}
            </DialogTitle>
            <DialogDescription>
              {isEditMode
                ? "Update subject information"
                : "Create a new subject with class and teacher assignment."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="subjectName">Subject Name</Label>
                <Input
                  id="subjectName"
                  placeholder="e.g., Mathematics"
                  value={formState.subjectName}
                  onChange={(e) =>
                    handleInputChange("subjectName", e.target.value)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subjectCode">Subject Code</Label>
                <Input
                  id="subjectCode"
                  placeholder="e.g., MATH101"
                  value={formState.subjectCode}
                  onChange={(e) =>
                    handleInputChange("subjectCode", e.target.value)
                  }
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="sclass">Class</Label>
                <Select
                  value={formState.sclass}
                  onValueChange={(value) => handleInputChange("sclass", value)}
                >
                  <SelectTrigger id="sclass">
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((cls) => (
                      <SelectItem
                        key={cls._id || cls.id}
                        value={cls._id || cls.id}
                      >
                        {cls.sclassName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="teacher">Teacher</Label>
                <Select
                  value={formState.teacher}
                  onValueChange={(value) => handleInputChange("teacher", value)}
                >
                  <SelectTrigger id="teacher">
                    <SelectValue placeholder="Select teacher" />
                  </SelectTrigger>
                  <SelectContent>
                    {teachers.map((teacher) => (
                      <SelectItem
                        key={teacher._id || teacher.id}
                        value={teacher._id || teacher.id}
                      >
                        {teacher.name}
                      </SelectItem>
                    ))}
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
                    ? "Update Subject"
                    : "Add Subject"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Subjects Table - Desktop View */}
      <div className="hidden md:block rounded-lg border border-border overflow-hidden bg-card">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="text-foreground font-semibold">
                Subject Name
              </TableHead>
              <TableHead className="text-foreground font-semibold">
                Code
              </TableHead>
              <TableHead className="text-foreground font-semibold">
                Class
              </TableHead>
              <TableHead className="text-foreground font-semibold">
                Teacher
              </TableHead>
              <TableHead className="text-right text-foreground font-semibold">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSubjects.length > 0 ? (
              filteredSubjects.map((subject) => (
                <TableRow
                  key={subject._id || subject.id}
                  className="border-border hover:bg-muted/50 transition-colors"
                >
                  <TableCell className="font-medium text-foreground">
                    {subject.subjectName}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{subject.subjectCode}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {getClassName(subject.sclass?._id || subject.sclass)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {getTeacherName(subject.teacher?._id || subject.teacher)}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(subject)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            handleDelete(subject._id || subject.id)
                          }
                          className="text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-8 text-muted-foreground"
                >
                  No subjects found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Subjects Cards - Mobile View */}
      <div className="md:hidden space-y-4">
        {filteredSubjects.length > 0 ? (
          filteredSubjects.map((subject) => (
            <Card
              key={subject._id || subject.id}
              className="bg-card border-border"
            >
              <CardContent className="pt-6 space-y-4">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <h3 className="font-semibold text-foreground">
                      {subject.subjectName}
                    </h3>
                    <Badge variant="outline" className="mt-1">
                      {subject.subjectCode}
                    </Badge>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(subject)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDelete(subject._id || subject.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Class:</span>
                    <span className="font-medium">
                      {getClassName(subject.sclass?._id || subject.sclass)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Teacher:</span>
                    <span className="font-medium">
                      {getTeacherName(subject.teacher?._id || subject.teacher)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="bg-card border-border">
            <CardContent className="pt-6 text-center text-muted-foreground">
              No subjects found
            </CardContent>
          </Card>
        )}
      </div>

      {/* Stats Card */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total Subjects</p>
              <p className="text-2xl font-bold text-foreground">
                {subjects.length}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total Teachers</p>
              <p className="text-2xl font-bold text-foreground">
                {teachers.length}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total Classes</p>
              <p className="text-2xl font-bold text-foreground">
                {classes.length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SubjectsManagement;
