
import React, { useCallback, useEffect, useMemo, useState } from "react";
import useApi from "@/hooks/UseApi";
import useAuth from "@/hooks/UseAuth";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { RefreshCcw } from "lucide-react";

const DEFAULT_TOTAL_MARKS = 100;
const DEFAULT_PASS_MARKS = 40;

const getGradeLabel = (percentage) => {
  if (percentage >= 90) return "A+";
  if (percentage >= 80) return "A";
  if (percentage >= 70) return "B+";
  if (percentage >= 60) return "B";
  if (percentage >= 50) return "C+";
  if (percentage >=40) return "C";
  return "Fail";
};

const formatStudentName = (student) => {
  if (!student) return "Unknown Student";
  if (student.name) return student.name;
  return `${student.firstName || ""} ${student.lastName || ""}`.trim() || student.email || "Student";
};

const StudentResult = () => {
  const { user } = useAuth();
  const { get, post, put } = useApi();

  const [teacherProfile, setTeacherProfile] = useState(null);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [students, setStudents] = useState([]);
  const [results, setResults] = useState([]);
  const [rows, setRows] = useState([]);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const selectedClass = useMemo(
    () => classes.find((c) => String(c._id || c.id) === String(selectedClassId)),
    [classes, selectedClassId],
  );

  const selectedClassName = selectedClass
    ? String(selectedClass.sclassName || selectedClass.className || selectedClass.name || "").trim()
    : "";

  const teacherSubjectName = String(teacherProfile?.teachSubject || "").trim();

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
      )
        .trim()
        .toLowerCase();
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
      console.error(error);
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

  const fetchResults = useCallback(async () => {
    try {
      const response = await get("/results");
      const resultRecords = response?.results || response || [];
      setResults(Array.isArray(resultRecords) ? resultRecords : []);
    } catch (error) {
      console.error(error);
    }
  }, [get]);

  const fetchStudentsByClassName = useCallback(
    async (className) => {
      if (!className) {
        setStudents([]);
        return;
      }
      try {
        const response = await get(`/students/class/${encodeURIComponent(className)}`);
        const classStudents = response?.studentByClass || response?.students || response || [];
        setStudents(Array.isArray(classStudents) ? classStudents : []);
      } catch (error) {
        console.error(error);
        toast.error("Unable to load students for the selected class.");
      }
    },
    [get],
  );

  useEffect(() => {
    fetchTeacherProfile();
    fetchClasses();
    fetchSubjects();
    fetchResults();
  }, [fetchTeacherProfile, fetchClasses, fetchSubjects, fetchResults]);

  useEffect(() => {
    if (!selectedClassId && teacherProfile && classes.length) {
      const defaultClass = classes.find(
        (cls) =>
          String(cls.sclassName || cls.className || cls.name || "").trim() ===
          String(teacherProfile.teachSclass || "").trim(),
      );
      const fallbackClass = classes[0];
      setSelectedClassId(String(defaultClass?._id || defaultClass?.id || fallbackClass?._id || fallbackClass?.id || ""));
    }
  }, [classes, selectedClassId, teacherProfile]);

  useEffect(() => {
    if (selectedClassName) {
      fetchStudentsByClassName(selectedClassName);
    } else {
      setStudents([]);
    }
  }, [fetchStudentsByClassName, selectedClassName]);

  useEffect(() => {
    const teacherSubjectNameValue = teacherSubjectName;
    const subjectInfo = teacherSubjectDoc;
    const classId = selectedClassId;
    const className = selectedClassName;

    const relevantResults = results.filter((result) => {
      const resultSubjectId = String(result.subject?._id || result.subject || "").trim();
      const resultClassId = String(result.sclass?._id || result.sclass || "").trim();
      const resultClassName = String(
        result.sclass?.sclassName || result.sclass?.className || result.sclass?.name || "",
      )
        .trim()
        .toLowerCase();
      const subjectMatch = subjectInfo
        ? resultSubjectId === String(subjectInfo._id || subjectInfo.id || "").trim()
        : String(result.subject?.subjectName || "").trim().toLowerCase() ===
          teacherSubjectNameValue.toLowerCase();
      return (
        subjectMatch &&
        (resultClassId === classId || resultClassName === className.toLowerCase())
      );
    });

    const resultMap = new Map();
    relevantResults.forEach((result) => {
      const studentId = String(result.student?._id || result.student || "").trim();
      if (studentId) resultMap.set(studentId, result);
    });

    const initialRows = students.map((student) => {
      const studentId = String(student._id || student.id || "").trim();
      const existing = resultMap.get(studentId);
      const obtained = existing?.marksObtained !== undefined ? String(existing.marksObtained) : "";
      const total = existing?.totalMarks ?? DEFAULT_TOTAL_MARKS;
      const percentage = obtained !== "" ? Number((parseFloat(obtained) / total) * 100) : 0;
      const grade = obtained !== "" ? getGradeLabel(percentage) : "";
      return {
        id: studentId,
        name: formatStudentName(student),
        className: className || "-",
        subjectName: teacherSubjectNameValue || "-",
        marksObtained: obtained,
        totalMarks: total,
        passMarks: DEFAULT_PASS_MARKS,
        percentage: obtained !== "" ? percentage.toFixed(2) : "",
        grade,
        resultId: existing?._id || existing?.id || "",
      };
    });

    const sortedRows = [...initialRows].sort((a, b) => {
      const aVal = parseFloat(a.marksObtained) || 0;
      const bVal = parseFloat(b.marksObtained) || 0;
      return bVal - aVal;
    });

    setRows(sortedRows.map((row, index) => ({ ...row, rank: index + 1 })));
  }, [students, results, selectedClassId, selectedClassName, teacherSubjectDoc, teacherSubjectName]);

  const totalStudents = students.length;
  const enteredCount = rows.filter((row) => row.marksObtained !== "").length;
  const averageScore = useMemo(() => {
    const scoredRows = rows.filter((row) => row.marksObtained !== "");
    if (!scoredRows.length) return "0";
    const total = scoredRows.reduce((sum, row) => sum + (parseFloat(row.marksObtained) || 0), 0);
    return (total / scoredRows.length).toFixed(2);
  }, [rows]);

  const topResultRow = rows.reduce((best, row) => {
    const value = parseFloat(row.marksObtained);
    const bestValue = best ? parseFloat(best.marksObtained) : NaN;
    if (Number.isNaN(value)) return best;
    if (!best || Number.isNaN(bestValue) || value > bestValue) {
      return row;
    }
    return best;
  }, null);

  const topStudent = topResultRow?.name || "-";
  const topScore = topResultRow ? Number(topResultRow.marksObtained) || 0 : 0;

  const studentLookup = useMemo(
    () => new Map(students.map((student) => [String(student._id || student.id || ""), student])),
    [students],
  );

  const savedResultsRows = useMemo(() => {
    const relevantResults = results.filter((result) => {
      const resultSubjectId = String(result.subject?._id || result.subject || "").trim();
      const resultClassId = String(result.sclass?._id || result.sclass || "").trim();
      const resultClassName = String(
        result.sclass?.sclassName || result.sclass?.className || result.sclass?.name || "",
      )
        .trim()
        .toLowerCase();
      const subjectMatch = teacherSubjectDoc
        ? resultSubjectId === String(teacherSubjectDoc._id || teacherSubjectDoc.id || "").trim()
        : String(result.subject?.subjectName || "").trim().toLowerCase() === teacherSubjectName.toLowerCase();

      return (
        subjectMatch &&
        (resultClassId === selectedClassId || resultClassName === selectedClassName.toLowerCase())
      );
    });

    return relevantResults
      .map((result) => {
        const student = result.student || {};
        const marksObtained = result.marksObtained !== undefined ? String(result.marksObtained) : "";
        const totalMarks = result.totalMarks ?? DEFAULT_TOTAL_MARKS;
        const percentage = marksObtained !== "" ? Number((parseFloat(marksObtained) / totalMarks) * 100) : 0;
        const studentLookupRecord = studentLookup.get(String(student._id || student.id || ""));
        return {
          id: String(result._id || result.id || student._id || student.id || marksObtained),
          studentId: String(student._id || student.id || ""),
          name: formatStudentName(studentLookupRecord || student),
          className: selectedClassName || "-",
          subjectName: teacherSubjectName || "-",
          totalMarks,
          marksObtained,
          passMarks: DEFAULT_PASS_MARKS,
          percentage: marksObtained !== "" ? percentage.toFixed(2) : "",
          grade: result.grade || (marksObtained !== "" ? getGradeLabel(percentage) : ""),
          rankValue: parseFloat(marksObtained) || 0,
        };
      })
      .sort((a, b) => b.rankValue - a.rankValue)
      .map((row, index) => ({ ...row, rank: index + 1 }));
  }, [results, selectedClassId, selectedClassName, teacherSubjectDoc, teacherSubjectName, studentLookup]);

  const handleMarksChange = (studentId, value) => {
    const cleaned = value.replace(/[^0-9.]/g, "");
    setRows((prevRows) =>
      prevRows.map((row) => {
        if (row.id !== studentId) return row;
        const numeric = cleaned === "" ? "" : Number(cleaned);
        const marksObtained = cleaned === "" ? "" : String(numeric);
        const percentage = marksObtained !== "" ? Number((numeric / row.totalMarks) * 100) : 0;
        return {
          ...row,
          marksObtained,
          percentage: marksObtained !== "" ? percentage.toFixed(2) : "",
          grade: marksObtained !== "" ? getGradeLabel(percentage) : "",
        };
      }),
    );
  };

  const handleSaveResults = async () => {
    if (!selectedClassId) {
      toast.error("Please select a class before saving results.");
      return;
    }
    if (!selectedSubjectId) {
      toast.error("Unable to resolve your subject. Please contact admin.");
      return;
    }

    const rowsWithMarks = rows.filter((row) => row.marksObtained !== "");
    if (!rowsWithMarks.length) {
      toast.error("Enter obtained marks for at least one student.");
      return;
    }

    // Build a lookup of existing results keyed by student|subject|class
    const existingResultMap = new Map(
      results
        .map((result) => {
          const studentId = String(result.student?._id || result.student || "").trim();
          const subjectId = String(result.subject?._id || result.subject || "").trim();
          const classId = String(result.sclass?._id || result.sclass || "").trim();
          if (!studentId || !subjectId || !classId) return null;
          return [`${studentId}|${subjectId}|${classId}`, result];
        })
        .filter(Boolean),
    );

    setSaving(true);
    try {
      const invalid = [];
      const promises = rowsWithMarks
        .map((row) => {
          const studentId = String(row.studentId || row.id || "").trim();
          if (!studentId) {
            invalid.push(row);
            return null;
          }

          const payload = {
            student: studentId,
            sclass: selectedClassId,
            subject: selectedSubjectId,
            marksObtained: Number(row.marksObtained),
            totalMarks: Number(row.totalMarks),
            examType: "Final",
            grade: row.grade || getGradeLabel(Number(row.percentage) || 0),
          };

          const key = `${studentId}|${selectedSubjectId}|${selectedClassId}`;
          const existingResult = existingResultMap.get(key);
          const resultId = row.resultId || String(existingResult?._id || existingResult?.id || "");

          if (resultId) return put(`/results/${resultId}`, payload);
          return post("/results/add", payload);
        })
        .filter(Boolean);

      if (invalid.length) {
        toast.error(`${invalid.length} row(s) missing student id. Aborting save.`);
        setSaving(false);
        return;
      }

      const settled = await Promise.allSettled(promises);
      const failed = settled.filter((item) => item.status === "rejected");
      if (failed.length) {
        toast.error(`${failed.length} result(s) could not be saved.`);
      } else {
        toast.success("Student result records saved successfully.");
      }

      await fetchResults();
    } catch (error) {
      console.error(error);
      toast.error("Unable to save results.");
    } finally {
      setSaving(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([fetchClasses(), fetchSubjects(), fetchTeacherProfile(), fetchResults()]);
      if (selectedClassName) await fetchStudentsByClassName(selectedClassName);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="pl-16 pr-4 py-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Student Result Records</h2>
          <p className="text-muted-foreground">
            Enter obtained marks for the assigned subject and review ranking.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCcw className="w-4 h-4 mr-2" />
            {refreshing ? "Refreshing..." : "Refresh"}
          </Button>
          <Button onClick={handleSaveResults} disabled={saving || !selectedClassId || !selectedSubjectId}>
            {saving ? "Saving..." : "Save Results"}
          </Button>
        </div>
      </div>

      <Card className="bg-card border-border mt-4">
        <CardContent className="py-6 grid gap-4 lg:grid-cols-[1fr_2fr]">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="class">Select Class</Label>
              <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                <SelectTrigger id="class" className="bg-background border-border">
                  <SelectValue placeholder="Choose class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((cls) => {
                    const id = String(cls._id || cls.id || "");
                    const label = cls.sclassName || cls.className || cls.name || "Class";
                    return (
                      <SelectItem key={id} value={id}>
                        {label}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Subject</Label>
              <Input readOnly value={teacherSubjectName || "Subject not assigned"} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Total Marks</Label>
                <Input readOnly value={String(DEFAULT_TOTAL_MARKS)} />
              </div>
              <div className="space-y-2">
                <Label>Pass Marks</Label>
                <Input readOnly value={String(DEFAULT_PASS_MARKS)} />
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-border bg-background p-4">
              <p className="text-sm text-muted-foreground">Total Students</p>
              <p className="mt-2 text-2xl font-semibold">{totalStudents}</p>
            </div>
            <div className="rounded-lg border border-border bg-background p-4">
              <p className="text-sm text-muted-foreground">Results Entered</p>
              <p className="mt-2 text-2xl font-semibold">{enteredCount}</p>
            </div>
            <div className="rounded-lg border border-border bg-background p-4">
              <p className="text-sm text-muted-foreground">Top Score</p>
              <p className="mt-2 text-2xl font-semibold">{topScore}</p>
            </div>
            <div className="rounded-lg border border-border bg-background p-4">
              <p className="text-sm text-muted-foreground">Top Student</p>
              <p className="mt-2 text-2xl font-semibold">{topStudent}</p>
            </div>
            <div className="rounded-lg border border-border bg-background p-4 sm:col-span-2">
              <p className="text-sm text-muted-foreground">Average Obtained</p>
              <p className="mt-2 text-2xl font-semibold">{averageScore}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border mt-4">
        <CardHeader>
          <CardTitle>Result Entry Table</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rank</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Obtained</TableHead>
                <TableHead>Pass</TableHead>
                <TableHead>Percentage</TableHead>
                <TableHead>Grade</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length > 0 ? (
                rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.rank}</TableCell>
                    <TableCell>{row.name}</TableCell>
                    <TableCell>{row.className}</TableCell>
                    <TableCell>{row.subjectName}</TableCell>
                    <TableCell>{row.totalMarks}</TableCell>
                    <TableCell>
                      <Input
                        value={row.marksObtained}
                        onChange={(event) => handleMarksChange(row.id, event.target.value)}
                        placeholder="0"
                        className="w-24"
                      />
                    </TableCell>
                    <TableCell>{row.passMarks}</TableCell>
                    <TableCell>{row.percentage !== "" ? `${row.percentage}%` : "-"}</TableCell>
                    <TableCell>{row.grade || "-"}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={9} className="py-10 text-center text-sm text-muted-foreground">
                    {selectedClassName
                      ? "No students found for the selected class."
                      : "Select a class to load students and enter results."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
     {/* saved result table */}
      <Card className="bg-card border-border mt-4">
        <CardHeader>
          <CardTitle>Saved Result Rankings</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rank</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Obtained</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Percentage</TableHead>
                <TableHead>Grade</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {savedResultsRows.length > 0 ? (
                savedResultsRows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.rank}</TableCell>
                    <TableCell>{row.name}</TableCell>
                    <TableCell>{row.marksObtained}</TableCell>
                    <TableCell>{row.totalMarks}</TableCell>
                    <TableCell>{row.percentage !== "" ? `${row.percentage}%` : "-"}</TableCell>
                    <TableCell>{row.grade || "-"}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                    {selectedClassName
                      ? "No saved results available for this class and subject yet."
                      : "Select a class to view saved result rankings."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentResult;
