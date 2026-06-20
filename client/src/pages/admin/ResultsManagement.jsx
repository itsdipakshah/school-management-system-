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
  AlertCircle,
  Award,
  TrendingUp,
} from "lucide-react";
import z from "zod";

const createSchema = z.object({
  student: z.string().min(1, "Student is required"),
  sclass: z.string().min(1, "Class is required"),
  subject: z.string().min(1, "Subject is required"),
  marksObtained: z.string().min(1, "Marks obtained is required"),
  totalMarks: z.string().min(1, "Total marks is required"),
  examType: z.string().min(1, "Exam type is required"),
  grade: z.string().optional(),
});

const initialFormState = {
  student: "",
  sclass: "",
  subject: "",
  marksObtained: "",
  totalMarks: "100",
  examType: "Final",
  grade: "",
};

const ResultsManagement = () => {
  const navigate = useNavigate();
  const { get, post, put, del } = useApi();
  const [results, setResults] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterExamType, setFilterExamType] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingResultId, setEditingResultId] = useState(null);
  const [formState, setFormState] = useState(initialFormState);
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);

  // Fetch results from backend with a cache-buster
  const fetchResults = useCallback(async () => {
    try {
      const response = await get(`/results?_cb=${new Date().getTime()}`);
      if (response?.success && Array.isArray(response.results)) {
        setResults(response.results);
      } else if (Array.isArray(response)) {
        setResults(response);
      } else {
        toast.error("Unexpected results response from backend");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load results");
    }
  }, [get]);

  // Fetch classes from backend for dropdown
  const fetchClasses = useCallback(async () => {
    try {
      const response = await get(`/classes/all?_cb=${new Date().getTime()}`);
      if (response?.success && Array.isArray(response.classes)) {
        setClasses(response.classes);
      } else if (Array.isArray(response)) {
        setClasses(response);
      }
    } catch (error) {
      console.error("Failed to load classes:", error);
    }
  }, [get]);

  // Fetch students based on selected class for dropdown
  const fetchStudentsByClassId = useCallback(
    async (classId) => {
      if (!classId || classes.length === 0) return;
      try {
        const targetClass = classes.find(
          (c) =>
            String(c._id || c.id || "")
              .trim()
              .toLowerCase() === String(classId).trim().toLowerCase(),
        );
        const classIdentifier =
          targetClass?.sclassName ||
          targetClass?.className ||
          targetClass?.name ||
          classId;

        const response = await get(
          `/students/class/${encodeURIComponent(classIdentifier)}?_cb=${new Date().getTime()}`,
        );
        if (response?.success && Array.isArray(response.studentByClass)) {
          setStudents(response.studentByClass);
        } else if (response?.success && Array.isArray(response.students)) {
          setStudents(response.students);
        } else if (Array.isArray(response)) {
          setStudents(response);
        } else if (response?.data && Array.isArray(response.data)) {
          setStudents(response.data);
        }
      } catch (error) {
        console.error("Failed to load students for this class:", error);
      }
    },
    [get, classes],
  );

  // Fetch subjects
  const fetchSubjects = useCallback(async () => {
    try {
      const response = await get(`/subjects?_cb=${new Date().getTime()}`);
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

  // Initial loads
  useEffect(() => {
    fetchResults();
    fetchClasses();
    fetchSubjects();
  }, [fetchResults, fetchClasses, fetchSubjects]);

  // Fetch students reactively when class selection changes
  useEffect(() => {
    if (formState.sclass) {
      fetchStudentsByClassId(formState.sclass);
    } else {
      setStudents([]);
    }
  }, [formState.sclass, fetchStudentsByClassId]);

  useEffect(() => {
    const handler = (e) => setSearchTerm(e.detail ?? "");
    window.addEventListener("adminSearch", handler);
    return () => window.removeEventListener("adminSearch", handler);
  }, []);

  // Safe Dynamic Name Resolvers
  const getStudentName = (studentObjOrId) => {
    if (!studentObjOrId) return "Student";
    if (typeof studentObjOrId === "object" && studentObjOrId.name)
      return studentObjOrId.name;
    const targetId =
      typeof studentObjOrId === "object"
        ? studentObjOrId._id || studentObjOrId.id
        : studentObjOrId;
    const found = students.find(
      (s) => String(s._id || s.id) === String(targetId),
    );
    if (found)
      return (
        found.name || `${found.firstName || ""} ${found.lastName || ""}`.trim()
      );
    return "Student";
  };

  const getClassName = (classObjOrId) => {
    if (!classObjOrId) return "N/A";
    if (typeof classObjOrId === "object") {
      return (
        classObjOrId.className ||
        classObjOrId.sclassName ||
        classObjOrId.name ||
        "N/A"
      );
    }
    const targetId = classObjOrId;
    const found = classes.find(
      (c) => String(c._id || c.id) === String(targetId),
    );
    if (found)
      return found.className || found.sclassName || found.name || "N/A";
    return "N/A";
  };

  const getSubjectName = (subjectObjOrId) => {
    if (!subjectObjOrId) return "N/A";
    if (
      typeof subjectObjOrId === "object" &&
      (subjectObjOrId.subjectName || subjectObjOrId.name)
    ) {
      return subjectObjOrId.subjectName || subjectObjOrId.name;
    }
    const targetId =
      typeof subjectObjOrId === "object"
        ? subjectObjOrId._id || subjectObjOrId.id
        : subjectObjOrId;
    const found = subjects.find(
      (s) => String(s._id || s.id) === String(targetId),
    );
    if (found) return found.subjectName || found.name || "N/A";
    return "N/A";
  };

  // Filter results based on search and exam type
  const filteredResults = useMemo(() => {
    const lower = (searchTerm || "").toLowerCase();
    return results.filter((result) => {
      const studentName = getStudentName(result.student).toLowerCase();
      const className = getClassName(result.sclass).toLowerCase();
      const subjectName = getSubjectName(result.subject).toLowerCase();
      const examType = (result.examType || "").toLowerCase();

      const matchesSearch =
        studentName.includes(lower) ||
        className.includes(lower) ||
        subjectName.includes(lower) ||
        examType.includes(lower);

      const matchesExamType =
        filterExamType === "all" || result.examType === filterExamType;
      return matchesSearch && matchesExamType;
    });
  }, [results, searchTerm, filterExamType, students, classes, subjects]);

  const handleInputChange = (field, value) => {
    setFormState((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === "sclass") {
        updated.student = "";
      }
      return updated;
    });
  };

  const openCreateDialog = () => {
    setFormState(initialFormState);
    setIsEditMode(false);
    setEditingResultId(null);
    setStudents([]);
    setIsDialogOpen(true);
  };

  const handleEdit = async (result) => {
    const classId =
      result.sclass?._id ||
      result.sclass?.id ||
      (typeof result.sclass === "string" ? result.sclass : "");
    const studentId =
      result.student?._id ||
      result.student?.id ||
      (typeof result.student === "string" ? result.student : "");
    const subjectId =
      result.subject?._id ||
      result.subject?.id ||
      (typeof result.subject === "string" ? result.subject : "");

    if (classId) {
      await fetchStudentsByClassId(classId);
    }

    setFormState({
      student: String(studentId).trim(),
      sclass: String(classId).trim(),
      subject: String(subjectId).trim(),
      marksObtained: result.marksObtained?.toString() || "",
      totalMarks: result.totalMarks?.toString() || "100",
      examType: result.examType || "Final",
      grade: result.grade || "",
    });
    setEditingResultId(result._id || result.id);
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

      const marksObtained = parseFloat(formState.marksObtained);
      const totalMarks = parseFloat(formState.totalMarks);

      if (marksObtained > totalMarks) {
        toast.error("Marks obtained cannot be greater than total marks");
        setSubmitting(false);
        return;
      }

      const payload = {
        student: formState.student,
        sclass: formState.sclass,
        subject: formState.subject,
        marksObtained,
        totalMarks,
        examType: formState.examType,
        grade: formState.grade,
      };

      let response;
      if (isEditMode && editingResultId) {
        response = await put(`/results/${editingResultId}`, payload);
      } else {
        response = await post("/results/add", payload);
      }

      if (response?.success) {
        toast.success(
          isEditMode
            ? "Result updated successfully"
            : "Result created successfully",
        );
        setIsDialogOpen(false);
        setIsEditMode(false);
        setEditingResultId(null);
        setFormState(initialFormState);
        await fetchResults();
      } else {
        toast.error(response?.message || "Failed to save result");
      }
    } catch (error) {
      console.error(error);
      toast.error("Could not save result");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (resultId) => {
    if (!confirm("Are you sure you want to delete this result?")) {
      return;
    }
    try {
      const response = await del(`/results/${resultId}`);
      if (response?.success) {
        toast.success("Result deleted successfully");
        await fetchResults();
      } else {
        toast.error(response?.message || "Failed to delete result");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete result");
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await fetchResults();
      await fetchClasses();
      await fetchSubjects();
      toast.success("Results refreshed");
    } finally {
      setRefreshing(false);
    }
  };

  const getGradeColor = (percentage) => {
    if (percentage >= 90) return "success";
    if (percentage >= 80) return "default";
    if (percentage >= 70) return "secondary";
    if (percentage >= 60) return "outline";
    return "destructive";
  };

  const calculatePercentage = (obtained, total) => {
    return total > 0 ? ((obtained / total) * 100).toFixed(2) : 0;
  };

  const getGradeLabel = (percentage) => {
    if (percentage >= 90) return "A+";
    if (percentage >= 80) return "A";
    if (percentage >= 70) return "B";
    if (percentage >= 60) return "C";
    if (percentage >= 50) return "D";
    return "F";
  };

  return (
    <div className="pl-16 pr-4 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            Results Management
          </h2>
          <p className="text-muted-foreground">
            Manage student exam results and grades
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
            Add Result
          </Button>
        </div>
      </div>

      {/* Search and Filter */}
      <Card className="bg-card border-border mt-4">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by student, subject, or class..."
                className="pl-10 bg-background border-border"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-end gap-2">
              <Select value={filterExamType} onValueChange={setFilterExamType}>
                <SelectTrigger className="sm:w-[180px] bg-background border-border">
                  <SelectValue placeholder="Filter by exam type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Exams</SelectItem>
                  <SelectItem value="Midterm">Midterm</SelectItem>
                  <SelectItem value="Final">Final</SelectItem>
                  <SelectItem value="Unit Test">Unit Test</SelectItem>
                </SelectContent>
              </Select>
              {filterExamType !== "all" && (
                <Badge variant="secondary" className="whitespace-nowrap">
                  Filtered: {filterExamType}
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] bg-card border-border max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {isEditMode ? "Edit Result" : "Add New Result"}
            </DialogTitle>
            <DialogDescription>
              {isEditMode
                ? "Update result information"
                : "Create a new result record for a student."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Class Dropdown Selector */}
              <div className="space-y-2">
                <Label htmlFor="sclass">Class</Label>
                <Select
                  value={
                    formState.sclass ? String(formState.sclass).trim() : ""
                  }
                  onValueChange={(value) => handleInputChange("sclass", value)}
                >
                  <SelectTrigger
                    id="sclass"
                    className="bg-background border-border"
                  >
                    <SelectValue placeholder="Select Class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((c) => (
                      <SelectItem
                        key={c._id || c.id}
                        value={String(c._id || c.id).trim()}
                      >
                        {c.className || c.sclassName || c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Student Dropdown Selector dependent on Class selection */}
              <div className="space-y-2">
                <Label htmlFor="student">Student</Label>
                <Select
                  value={
                    formState.student ? String(formState.student).trim() : ""
                  }
                  onValueChange={(value) => handleInputChange("student", value)}
                  disabled={!formState.sclass || students.length === 0}
                >
                  <SelectTrigger
                    id="student"
                    className="bg-background border-border"
                  >
                    <SelectValue
                      placeholder={
                        !formState.sclass
                          ? "Select a class first"
                          : "Select Student"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map((student) => (
                      <SelectItem
                        key={student._id || student.id}
                        value={String(student._id || student.id).trim()}
                      >
                        {student.firstName} ({student.rollNum || "N/A"})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Subject Dropdown Selector */}
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Select
                  value={
                    formState.subject ? String(formState.subject).trim() : ""
                  }
                  onValueChange={(value) => handleInputChange("subject", value)}
                >
                  <SelectTrigger
                    id="subject"
                    className="bg-background border-border"
                  >
                    <SelectValue placeholder="Select Subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((sub) => (
                      <SelectItem
                        key={sub._id || sub.id}
                        value={String(sub._id || sub.id).trim()}
                      >
                        {sub.subjectName || sub.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="examType">Exam Type</Label>
                <Select
                  value={formState.examType}
                  onValueChange={(value) =>
                    handleInputChange("examType", value)
                  }
                >
                  <SelectTrigger id="examType">
                    <SelectValue placeholder="Select exam type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Midterm">Midterm</SelectItem>
                    <SelectItem value="Final">Final</SelectItem>
                    <SelectItem value="Unit Test">Unit Test</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="marksObtained">Marks Obtained</Label>
                <Input
                  id="marksObtained"
                  type="number"
                  placeholder="Enter marks obtained"
                  value={formState.marksObtained}
                  onChange={(e) =>
                    handleInputChange("marksObtained", e.target.value)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="totalMarks">Total Marks</Label>
                <Input
                  id="totalMarks"
                  type="number"
                  placeholder="Enter total marks"
                  value={formState.totalMarks}
                  onChange={(e) =>
                    handleInputChange("totalMarks", e.target.value)
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="grade">Grade (Optional)</Label>
              <Input
                id="grade"
                placeholder="Leave blank to auto-calculate grade"
                value={formState.grade}
                onChange={(e) => handleInputChange("grade", e.target.value)}
              />
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
                    ? "Update Result"
                    : "Create Result"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Results List */}
      <div className="mt-6">
        {filteredResults.length > 0 ? (
          <div className="grid gap-4 grid-cols-1">
            {filteredResults.map((result) => {
              const percentage = calculatePercentage(
                result.marksObtained,
                result.totalMarks,
              );
              const grade = result.grade || getGradeLabel(percentage);

              return (
                <Card
                  key={result._id || result.id}
                  className="bg-card border-border overflow-hidden"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <CardTitle className="text-lg text-foreground">
                            {getStudentName(result.student)}
                          </CardTitle>
                          <Badge variant={getGradeColor(percentage)}>
                            <Award className="w-4 h-4 mr-1" />
                            {grade}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>Subject: {getSubjectName(result.subject)}</span>
                          <span>Class: {getClassName(result.sclass)}</span>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(result)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              handleDelete(result._id || result.id)
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
                  <CardContent className="space-y-2">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Marks</p>
                        <p className="font-semibold flex items-center gap-1">
                          <TrendingUp className="w-4 h-4" />
                          {result.marksObtained}/{result.totalMarks}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Percentage
                        </p>
                        <p className="font-semibold">{percentage}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Exam Type
                        </p>
                        <p className="font-semibold">{result.examType}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Grade</p>
                        <p className="font-semibold">{grade}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No results found</p>
                <p className="text-sm text-muted-foreground/70">
                  {searchTerm || filterExamType !== "all"
                    ? "Try adjusting your search or filters"
                    : "Create your first result to get started"}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Stats Card */}
      {results.length > 0 && (
        <Card className="bg-card border-border mt-6">
          <CardHeader>
            <CardTitle className="text-foreground">Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total Results</p>
                <p className="text-2xl font-bold text-foreground">
                  {results.length}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Avg. Percentage</p>
                <p className="text-2xl font-bold text-foreground">
                  {(
                    results.reduce(
                      (acc, r) => acc + (r.marksObtained / r.totalMarks) * 100,
                      0,
                    ) / results.length
                  ).toFixed(2)}
                  %
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Exams</p>
                <p className="text-2xl font-bold text-foreground">
                  {new Set(results.map((r) => r.examType)).size}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Subjects</p>
                <p className="text-2xl font-bold text-foreground">
                  {
                    new Set(results.map((r) => r.subject?._id || r.subject))
                      .size
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ResultsManagement;
