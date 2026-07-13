import React, { useCallback, useEffect, useMemo, useState } from "react";
import useApi from "@/hooks/UseApi";
import useAuth from "@/hooks/UseAuth";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Plus, Search, Edit, Trash2, MoreHorizontal, RefreshCcw, Calendar, Clock, BookOpen, School, Upload, X, AlertCircle, FileText } from "lucide-react";
import z from "zod";

const normalizeText = (value) => String(value ?? "").trim();

const createSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(1, "Description is required"),
  assignDate: z.string().min(1, "Assign date is required"),
  deadline: z.string().min(1, "Deadline date is required"),
  classId: z.string().min(1, "Please select a target class"),
  subjectId: z.string().min(1, "Please select a subject"),
});

const initialFormState = {
  title: "",
  description: "",
  assignDate: new Date().toISOString().split("T")[0],
  deadline: "",
  classId: "",
  subjectId: "",
  assigneFile: null,
  filePreviewName: null,
};

const AssignmentManagement = () => {
  const { get, post, put, del } = useApi();
  const { user } = useAuth();
  
  const [teacherProfile, setTeacherProfile] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingAssignmentId, setEditingAssignmentId] = useState(null);
  const [formState, setFormState] = useState(initialFormState);
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

//Fetch function haru yaha bata xa 
  const fetchTeacherProfile = useCallback(async () => {
    if (!user?.email) return;
    try {
      const response = await get("/teachers");
      const teacherRecords = response?.teachers || response || [];
      const teacher = teacherRecords.find((item) => {
        const record = item.teacher || item;
        return String(record.email || "").toLowerCase() === String(user.email || "").toLowerCase();
      });
      setTeacherProfile(teacher?.teacher || teacher || null);
    } catch (error) {
      console.error("Error matching teacher profile:", error);
    }
  }, [get, user?.email]);

  const fetchClasses = useCallback(async () => {
    try {
      const response = await get("/classes/all");
      const classRecords = response?.classes || response || [];
      setClasses(Array.isArray(classRecords) ? classRecords : []);
    } catch (error) {
      console.error(error);
    }
  }, [get]);

  const fetchSubjects = useCallback(async () => {
    try {
      const response = await get("/subjects");
      const subjectRecords = response?.subjects || response || [];
      setSubjects(Array.isArray(subjectRecords) ? subjectRecords : []);
    } catch (error) {
      console.error(error);
    }
  }, [get]);

  const fetchAssignments = useCallback(async () => {
    try {
      const response = await get("/assigments");
      const list = response?.assigments || response || [];
      setAssignments(Array.isArray(list) ? list : []);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load assignments");
    }
  }, [get]);
//sab lia call gare yo useEffect ma 
  useEffect(() => {
    fetchTeacherProfile();
    fetchClasses();
    fetchSubjects();
    fetchAssignments();
  }, [fetchTeacherProfile, fetchClasses, fetchSubjects, fetchAssignments]);

  const selectedClass = useMemo(() => {
    return classes.find((c) => String(c._id || c.id) === String(formState.classId));
  }, [classes, formState.classId]);

  const selectedClassName = selectedClass
    ? String(selectedClass.sclassName || selectedClass.className || selectedClass.name || "").trim()
    : "";

  const teacherSubjectName = String(teacherProfile?.teachSubject || "").trim();

  //teacher subject lai match garna ko lagi yo useMemo use gareko ho
  const teacherSubjectDoc = useMemo(() => {
    if (!teacherProfile || !subjects.length || !teacherSubjectName) return null;
    const teacherId = String(teacherProfile._id || teacherProfile.id || "").trim();
    const normalizedName = teacherSubjectName.toLowerCase();
    const normalizedClassName = selectedClassName.toLowerCase();

    const exactMatch = subjects.find((subject) => {
      const subjectName = String(subject.subjectName || subject.name || "").trim().toLowerCase();
      const subjectTeacherId = String(subject.teacher?._id || subject.teacher || "").trim();
      const subjectClassName = String(
        subject.sclass?.sclassName || subject.sclass?.className || subject.sclass?.name || "",
      ).trim().toLowerCase();
      
      return (
        subjectName === normalizedName &&
        subjectTeacherId === teacherId &&
        (!normalizedClassName || subjectClassName === normalizedClassName)
      );
    });

    if (exactMatch) return exactMatch;

    return subjects.find((subject) => {
      const subjectName = String(subject.subjectName || subject.name || "").trim().toLowerCase();
      const subjectTeacherId = String(subject.teacher?._id || subject.teacher || "").trim();
      return subjectName === normalizedName && subjectTeacherId === teacherId;
    });
  }, [subjects, teacherProfile, teacherSubjectName, selectedClassName]);

  const selectedSubjectId = String(teacherSubjectDoc?._id || teacherSubjectDoc?.id || "").trim();

  // Auto-fill target selections down matching lines
  useEffect(() => {
    if (!formState.classId && teacherProfile && classes.length) {
      const defaultClass = classes.find(
        (cls) =>
          String(cls.sclassName || cls.className || cls.name || "").trim() ===
          String(teacherProfile.teachSclass || "").trim(),
      );
      if (defaultClass) {
        setFormState((prev) => ({ ...prev, classId: String(defaultClass._id || defaultClass.id) }));
      }
    }
  }, [classes, formState.classId, teacherProfile]);

  useEffect(() => {
    if (selectedSubjectId && formState.subjectId !== selectedSubjectId) {
      setFormState((prev) => ({ ...prev, subjectId: selectedSubjectId }));
    }
  }, [selectedSubjectId, formState.subjectId]);

  const handleInputChange = (field, value) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size must be less than 10MB");
        return;
      }
      setFormState((prev) => ({
        ...prev,
        assigneFile: file,
        filePreviewName: file.name,
      }));
    }
  };

  const openCreateDialog = () => {
    setFormState({
      ...initialFormState,
      subjectId: selectedSubjectId,
    });
    setIsEditMode(false);
    setEditingAssignmentId(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (assignment) => {
    setFormState({
      title: assignment.title || "",
      description: assignment.description || "",
      assignDate: assignment.assignDate ? new Date(assignment.assignDate).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
      deadline: assignment.deadline ? new Date(assignment.deadline).toISOString().split("T")[0] : "",
      classId: assignment.classId?._id || assignment.classId || "",
      subjectId: assignment.subjectId?._id || assignment.subjectId || "",
      assigneFile: null,
      filePreviewName: assignment.assigneFile ? "Current Attachment File" : null,
    });
    setEditingAssignmentId(assignment._id || assignment.id);
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
      const formData = new FormData();
      formData.append("title", formState.title);
      formData.append("description", formState.description);
      formData.append("assignDate", formState.assignDate);
      formData.append("deadline", formState.deadline);
      formData.append("classId", formState.classId);
      formData.append("subjectId", formState.subjectId);

      if (formState.assigneFile) {
        formData.append("assigneFile", formState.assigneFile);
      }

      let response;
      if (isEditMode && editingAssignmentId) {
        response = await put(`/assigments/${editingAssignmentId}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        response = await post("/assigments", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      if (response?.success !== false) {
        toast.success(isEditMode ? "Assignment updated successfully" : "Assignment created successfully");
        setIsDialogOpen(false);
        setFormState(initialFormState);
        await fetchAssignments();
      } else {
        toast.error(response?.message || "Action execution failed");
      }
    } catch (error) {
      console.error(error);
      toast.error("Operation encountered an error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (assignmentId) => {
    if (!window.confirm("Are you sure you want to delete this assignment?")) return;
    try {
      const response = await del(`/assigments/${assignmentId}`);
      if (response?.success !== false) {
        toast.success("Assignment deleted cleanly");
        await fetchAssignments();
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete item");
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([fetchClasses(), fetchSubjects(), fetchTeacherProfile(), fetchAssignments()]);
    } finally {
      setRefreshing(false);
    }
  };

  const getDeadlineStatus = (deadline) => {
    if (!deadline) return "unknown";
    const now = new Date();
    const due = new Date(deadline);
    const diffDays = (due - now) / (1000 * 60 * 60 * 24);
    if (diffDays < 0) return "overdue";
    if (diffDays <= 2) return "due-soon";
    return "upcoming";
  };

  const filteredAssignments = useMemo(() => {
    const lower = (searchTerm || "").toLowerCase().trim();
    return assignments.filter((item) => {
      const status = getDeadlineStatus(item.deadline);
      const classLabel = normalizeText(item?.classId?.sclassName || item?.classId?.className || item?.classId?.name || "");
      const subjectLabel = normalizeText(item?.subjectId?.subjectName || item?.subjectId?.name || "");
      
      const matchesSearch =
        (item.title || "").toLowerCase().includes(lower) ||
        (item.description || "").toLowerCase().includes(lower) ||
        classLabel.toLowerCase().includes(lower) ||
        subjectLabel.toLowerCase().includes(lower);

      const matchesStatus = filterStatus === "all" || status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [assignments, searchTerm, filterStatus]);

  return (
    <div className="pl-16 pr-4 py-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Assignments Management</h2>
          <p className="text-muted-foreground">Manage homework and coursework tasks for assigned classrooms</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCcw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} /> Refresh Items
          </Button>
          <Button onClick={openCreateDialog} className="gap-2">
            <Plus className="w-4 h-4" /> Add Assignment
          </Button>
        </div>
      </div>

      <Card className="bg-card border-border mt-6">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search assignments..."
                className="pl-10 bg-background border-border"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="sm:w-45 bg-background border-border">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Timelines</SelectItem>
                <SelectItem value="upcoming">Upcoming Tasks</SelectItem>
                <SelectItem value="due-soon">Due Within 48 Hrs</SelectItem>
                <SelectItem value="overdue">Overdue Deadlines</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Render Assignments Cards Grid Layout */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-6">
        {filteredAssignments.map((assignment) => {
          const status = getDeadlineStatus(assignment.deadline);
          return (
            <Card key={assignment._id || assignment.id} className="bg-card border-border relative overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start gap-2">
                  <CardTitle className="text-lg font-semibold line-clamp-1">{assignment.title}</CardTitle>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(assignment)}>
                        <Edit className="w-4 h-4 mr-2" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(assignment._id || assignment.id)}>
                        <Trash2 className="w-4 h-4 mr-2" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="flex gap-2 mt-1 flex-wrap">
                  <Badge variant="secondary">
                    <School className="w-3 h-3 mr-1" />
                    {assignment.classId?.sclassName || assignment.classId?.className || assignment.classId?.name || "Unknown Class"}
                  </Badge>
                  <Badge variant="outline">
                    <BookOpen className="w-3 h-3 mr-1" />
                    {assignment.subjectId?.subjectName || assignment.subjectId?.name || "Unknown Subject"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p className="line-clamp-2 min-h-[40px]">{assignment.description}</p>
                <div className="flex justify-between text-xs pt-2 border-t border-border">
                  <span className="flex items-center"><Calendar className="w-3 h-3 mr-1" /> {assignment.assignDate ? new Date(assignment.assignDate).toLocaleDateString() : "-"}</span>
                  <span className={`flex items-center font-medium ${status === "overdue" ? "text-destructive" : status === "due-soon" ? "text-amber-500" : "text-emerald-500"}`}>
                    <Clock className="w-3 h-3 mr-1" /> Due: {assignment.deadline ? new Date(assignment.deadline).toLocaleDateString() : "-"}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditMode ? "Edit Assignment Parameters" : "Create New Student Task"}</DialogTitle>
            <DialogDescription>Deploy tasks aligned with your subject assignment allocation.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="classId">Target Class</Label>
              <Select value={formState.classId} onValueChange={(val) => handleInputChange("classId", val)}>
                <SelectTrigger id="classId">
                  <SelectValue placeholder="Choose Target Class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((cls) => (
                    <SelectItem key={cls._id || cls.id} value={cls._id || cls.id}>
                      {cls.sclassName || cls.className || cls.name} {cls.section ? `(${cls.section})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subjectId">Subject Context (Auto-Resolved)</Label>
              <Select value={formState.subjectId} disabled={true}>
                <SelectTrigger id="subjectId" className="bg-muted opacity-80 cursor-not-allowed">
                  <SelectValue placeholder={teacherSubjectDoc ? (teacherSubjectDoc.subjectName || teacherSubjectDoc.name) : "No Subject Resolved"} />
                </SelectTrigger>
                <SelectContent>
                  {teacherSubjectDoc && (
                    <SelectItem value={teacherSubjectDoc._id || teacherSubjectDoc.id}>
                      {teacherSubjectDoc.subjectName || teacherSubjectDoc.name}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Task Title</Label>
              <Input id="title" value={formState.title} onChange={(e) => handleInputChange("title", e.target.value)} placeholder="e.g., Chapter 3 Problem Set" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Instructions</Label>
              <Textarea id="description" value={formState.description} onChange={(e) => handleInputChange("description", e.target.value)} placeholder="Provide assignment criteria details..." />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="assignDate">Assign Date</Label>
                <Input type="date" id="assignDate" value={formState.assignDate} onChange={(e) => handleInputChange("assignDate", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deadline">Due Date</Label>
                <Input type="date" id="deadline" value={formState.deadline} onChange={(e) => handleInputChange("deadline", e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="file-upload">Reference Material Attachment (Optional)</Label>
              <div className="flex items-center gap-2">
                <Input id="file-upload" type="file" className="hidden" onChange={handleFileChange} accept=".pdf,.doc,.docx,.jpg,.png" />
                <Button type="button" variant="outline" className="w-full gap-2" onClick={() => document.getElementById("file-upload").click()}>
                  <Upload className="w-4 h-4" /> {formState.filePreviewName ? "Change File" : "Upload Document"}
                </Button>
              </div>
              {formState.filePreviewName && (
                <div className="flex items-center justify-between bg-muted text-xs p-2 rounded border border-border mt-1">
                  <span className="flex items-center gap-1 line-clamp-1"><FileText className="w-3.5 h-3.5" /> {formState.filePreviewName}</span>
                  <Button type="button" variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={() => setFormState(p => ({ ...p, assigneFile: null, filePreviewName: null }))}>
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={submitting}>{submitting ? "Saving..." : "Save Assignment"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AssignmentManagement;