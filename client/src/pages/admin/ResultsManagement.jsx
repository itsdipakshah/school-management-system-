import React, { useCallback, useEffect, useMemo, useState } from "react";
import useApi from "@/hooks/UseApi";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Label } from "@/components/ui/label";
import { RefreshCcw, Printer } from "lucide-react";

const DEFAULT_TOTAL_MARKS = 100;
const DEFAULT_PASS_MARKS = 40;

const getGradeLabel = (percentage) => {
  if (percentage >= 90) return "A+";
  if (percentage >= 80) return "A";
  if (percentage >= 70) return "B+";
  if (percentage >= 60) return "B";
  if (percentage >= 50) return "C+";
  if (percentage >= 40) return "C";
  return "Fail";
};

const formatStudentName = (student) => {
  if (!student) return "Unknown Student";
  if (student.name) return student.name;
  return `${student.firstName || ""} ${student.lastName || ""}`.trim() || student.email || "Student";
};

const ResultsManagement = () => {
  const { get } = useApi();
  
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [results, setResults] = useState([]);
  const [students, setStudents] = useState([]);

  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  
  const [refreshing, setRefreshing] = useState(false);

  const selectedClass = useMemo(
    () => classes.find((c) => String(c._id || c.id) === String(selectedClassId)),
    [classes, selectedClassId],
  );

  const selectedClassName = selectedClass
    ? String(selectedClass.sclassName || selectedClass.className || selectedClass.name || "").trim()
    : "";

  const selectedSubject = useMemo(
    () => subjects.find((s) => String(s._id || s.id) === String(selectedSubjectId)),
    [subjects, selectedSubjectId],
  );

  const selectedSubjectName = selectedSubject
    ? String(selectedSubject.subjectName || selectedSubject.name || "").trim()
    : "";

  const fetchResults = useCallback(async () => {
    try {
      const response = await get(`/results?_cb=${new Date().getTime()}`);
      const resultRecords = response?.results || response || [];
      setResults(Array.isArray(resultRecords) ? resultRecords : []);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load results");
    }
  }, [get]);

  const fetchClasses = useCallback(async () => {
    try {
      const response = await get(`/classes/all?_cb=${new Date().getTime()}`);
      const classRecords = response?.classes || response || [];
      setClasses(Array.isArray(classRecords) ? classRecords : []);
    } catch (error) {
      console.error("Failed to load classes:", error);
    }
  }, [get]);

  const fetchSubjects = useCallback(async () => {
    try {
      const response = await get(`/subjects?_cb=${new Date().getTime()}`);
      const subjectRecords = response?.subjects || response || [];
      setSubjects(Array.isArray(subjectRecords) ? subjectRecords : []);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load subjects");
    }
  }, [get]);

  const fetchStudentsByClassName = useCallback(
    async (className) => {
      if (!className) {
        setStudents([]);
        return;
      }
      try {
        const response = await get(`/students/class/${encodeURIComponent(className)}?_cb=${new Date().getTime()}`);
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
    fetchResults();
    fetchClasses();
    fetchSubjects();
  }, [fetchResults, fetchClasses, fetchSubjects]);

  useEffect(() => {
    if (selectedClassName) {
      fetchStudentsByClassName(selectedClassName);
    } else {
      setStudents([]);
    }
  }, [fetchStudentsByClassName, selectedClassName]);

  const processedRows = useMemo(() => {
    if (!selectedClassId || !selectedSubjectId) return [];

    const matchingResults = results
      .filter((res) => {
        const resSubjectId = String(res.subject?._id || res.subject || "").trim();
        const resClassId = String(res.sclass?._id || res.sclass || "").trim();
        const resClassName = String(
          res.sclass?.sclassName || res.sclass?.className || res.sclass?.name || "",
        ).trim().toLowerCase();

        const subjectMatch = resSubjectId === selectedSubjectId;
        const classMatch = resClassId === selectedClassId || resClassName === selectedClassName.toLowerCase();

        return subjectMatch && classMatch;
      })
      .sort((a, b) => new Date(a.updatedAt) - new Date(b.updatedAt));

    const resultMap = new Map();
    const nullStudentResults = [];

    matchingResults.forEach((result) => {
      const studentId = String(result.student?._id || result.student || "").trim();
      if (studentId && studentId !== "null") {
        resultMap.set(studentId, result);
      } else {
        nullStudentResults.push(result);
      }
    });

    const initialRows = students.map((student, index) => {
      const studentId = String(student._id || student.id || "").trim();
      
      let existing = resultMap.get(studentId);
      if (!existing && nullStudentResults.length > 0) {
        existing = nullStudentResults[index % nullStudentResults.length];
      }

      const obtained = existing?.marksObtained !== undefined ? String(existing.marksObtained) : "";
      const total = existing?.totalMarks ?? DEFAULT_TOTAL_MARKS;
      const percentage = obtained !== "" ? Number((parseFloat(obtained) / total) * 100) : 0;
      const grade = obtained !== "" ? getGradeLabel(percentage) : "";
      
      return {
        id: studentId,
        name: formatStudentName(student),
        className: selectedClassName || "-",
        subjectName: selectedSubjectName || "-",
        marksObtained: obtained,
        totalMarks: total,
        passMarks: DEFAULT_PASS_MARKS,
        percentage: obtained !== "" ? percentage.toFixed(2) : "",
        grade,
        updatedAt: existing?.updatedAt || null,
      };
    });

    return [...initialRows]
      .sort((a, b) => {
        const aVal = parseFloat(a.marksObtained) || 0;
        const bVal = parseFloat(b.marksObtained) || 0;
        return bVal - aVal;
      })
      .map((row, index) => ({ ...row, rank: row.marksObtained !== "" ? index + 1 : "-" }));
  }, [students, results, selectedClassId, selectedSubjectId, selectedClassName, selectedSubjectName]);

  const totalStudents = students.length;
  const enteredCount = processedRows.filter((row) => row.marksObtained !== "").length;
  
  const averageScore = useMemo(() => {
    const scoredRows = processedRows.filter((row) => row.marksObtained !== "");
    if (!scoredRows.length) return "0";
    const totalSum = scoredRows.reduce((sum, row) => sum + (parseFloat(row.marksObtained) || 0), 0);
    return (totalSum / scoredRows.length).toFixed(2);
  }, [processedRows]);

  const topResultRow = useMemo(() => {
    const scoredRows = processedRows.filter((row) => row.marksObtained !== "");
    if (!scoredRows.length) return null;
    return scoredRows.reduce((best, row) => {
      const currentScore = parseFloat(row.marksObtained) || 0;
      const bestScore = best ? (parseFloat(best.marksObtained) || 0) : -1;
      return currentScore > bestScore ? row : best;
    }, null);
  }, [processedRows]);

  const topStudentName = topResultRow?.name || "-";
  const topStudentScore = topResultRow ? topResultRow.marksObtained : "-";

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([fetchClasses(), fetchSubjects(), fetchResults()]);
      if (selectedClassName) await fetchStudentsByClassName(selectedClassName);
    } finally {
      setRefreshing(false);
    }
  };

  const handlePrint = () => {
    if (processedRows.length === 0) {
      toast.error("No results loaded to print. Please choose a Class and Subject first.");
      return;
    }
    window.print();
  };

  return (
    <div className="pl-16 pr-4 py-6 print:p-0 print:m-0 print:absolute print:left-0 print:top-0 print:w-full">
      <style>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 10mm 15mm 10mm 15mm;
          }
          body {
            background-color: #ffffff !important;
            color: #000000 !important;
            font-size: 10pt !important;
            line-height: 1.3 !important;
          }
          .print\\:hidden, 
          header, 
          footer, 
          nav, 
          aside {
            display: none !important;
          }
          div {
            padding: 0 !important;
            margin: 0 !important;
            position: static !important;
          }
          table {
            width: 100% !important;
            border-collapse: collapse !important;
            page-break-inside: auto;
          }
          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
          thead {
            display: table-header-group;
          }
          th, td {
            border: 1px solid #000000 !important;
            padding: 6px 10px !important;
            text-align: left !important;
            font-size: 9.5pt !important;
            color: #000000 !important;
          }
          th {
            background-color: #f3f4f6 !important;
            font-weight: bold !important;
          }
          .print-badge {
            background: none !important;
            color: #000000 !important;
            padding: 0 !important;
            font-weight: bold !important;
          }
        }
      `}</style>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Admin Results Directory</h2>
          <p className="text-muted-foreground">
            Monitor and review student performance records and subject classifications.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCcw className="w-4 h-4 mr-2" />
            {refreshing ? "Refreshing Data..." : "Refresh Database"}
          </Button>
          <Button variant="default" size="sm" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" />
            Print Landscape A4
          </Button>
        </div>
      </div>

      <Card className="bg-card border-border mt-4 print:hidden">
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
              <Label htmlFor="subject">Select Subject</Label>
              <Select value={selectedSubjectId} onValueChange={setSelectedSubjectId}>
                <SelectTrigger id="subject" className="bg-background border-border">
                  <SelectValue placeholder="Choose subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((sub) => {
                    const id = String(sub._id || sub.id || "");
                    const label = sub.subjectName || sub.name || "Subject";
                    return (
                      <SelectItem key={id} value={id}>
                        {label}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Class Out of</Label>
                <div className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
                  {DEFAULT_TOTAL_MARKS} Marks
                </div>
              </div>
              <div className="space-y-2">
                <Label>Minimum Pass</Label>
                <div className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
                  {DEFAULT_PASS_MARKS} Marks
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-border bg-background p-4">
              <p className="text-sm text-muted-foreground">Class Size</p>
              <p className="mt-2 text-2xl font-semibold">{totalStudents}</p>
            </div>
            <div className="rounded-lg border border-border bg-background p-4">
              <p className="text-sm text-muted-foreground">Entered Submissions</p>
              <p className="mt-2 text-2xl font-semibold">{enteredCount}</p>
            </div>
            <div className="rounded-lg border border-border bg-background p-4">
              <p className="text-sm text-muted-foreground">Top Score</p>
              <p className="mt-2 text-2xl font-semibold">{topStudentScore}</p>
            </div>
            <div className="rounded-lg border border-border bg-background p-4">
              <p className="text-sm text-muted-foreground">Top Performing Student</p>
              <p className="mt-2 text-xl font-semibold truncate" title={topStudentName}>{topStudentName}</p>
            </div>
            <div className="rounded-lg border border-border bg-background p-4 sm:col-span-2">
              <p className="text-sm text-muted-foreground">Average Class Score</p>
              <p className="mt-2 text-2xl font-semibold">{averageScore}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="hidden print:block mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-black">Academic Performance Record</h1>
        <p className="text-sm text-gray-600 mt-1">
          <strong>Class:</strong> {selectedClassName || "-"} &nbsp;|&nbsp; 
          <strong>Subject:</strong> {selectedSubjectName || "-"} &nbsp;|&nbsp; 
          <strong>Date Generated:</strong> {new Date().toLocaleDateString()}
        </p>
      </div>

      <Card className="bg-card border-border mt-4 print:border-none print:shadow-none print:mt-0 print:w-full">
        <CardHeader className="print:hidden">
          <CardTitle>Student Performance Records</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto print:p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Rank</TableHead>
                <TableHead>Student Name</TableHead>
                <TableHead>Class Name</TableHead>
                <TableHead>Subject Name</TableHead>
                <TableHead>Total Marks</TableHead>
                <TableHead>Obtained Marks</TableHead>
                <TableHead>Pass Marks</TableHead>
                <TableHead>Percentage</TableHead>
                <TableHead>Grade Awarded</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {processedRows.length > 0 ? (
                processedRows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.rank}</TableCell>
                    <TableCell>{row.name}</TableCell>
                    <TableCell>{row.className}</TableCell>
                    <TableCell>{row.subjectName}</TableCell>
                    <TableCell>{row.totalMarks}</TableCell>
                    <TableCell className="font-semibold">{row.marksObtained !== "" ? row.marksObtained : "-"}</TableCell>
                    <TableCell>{row.passMarks}</TableCell>
                    <TableCell>{row.percentage !== "" ? `${row.percentage}%` : "-"}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs font-bold print-badge ${
                        row.grade === "Fail" 
                          ? "bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400" 
                          : row.grade !== "" 
                            ? "bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400" 
                            : ""
                      }`}>
                        {row.grade || "-"}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={9} className="py-12 text-center text-sm text-muted-foreground">
                    {!selectedClassId || !selectedSubjectId
                      ? "Choose both Class and Subject parameters above to inspect results."
                      : "No matching saved results or students found for selected parameters."}
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

export default ResultsManagement;