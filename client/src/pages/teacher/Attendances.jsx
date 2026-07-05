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
import { FileDown, RefreshCcw } from "lucide-react";

const formatStudentName = (student) => {
  if (!student) return "Unknown Student";
  if (student.name) return student.name;
  return `${student.firstName || ""} ${student.lastName || ""}`.trim() || student.email || "Student";
};

const normalizeClassKey = (value) => {
  if (value === null || value === undefined || value === "") return "";
  const text = String(value).trim().toLowerCase();
  const numberMatch = text.match(/(\d+)/);
  if (numberMatch) return numberMatch[1];
  return text.replace(/^class\s*/, "").trim();
};

const Attendances = () => {
  const { user } = useAuth();
  const { get, post } = useApi();

  const [teacherProfile, setTeacherProfile] = useState(null);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [students, setStudents] = useState([]);
  const [rows, setRows] = useState([]);
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split("T")[0]);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [savedAttendance, setSavedAttendance] = useState(false);

  const selectedClass = useMemo(
    () => classes.find((item) => String(item._id || item.id) === String(selectedClassId)),
    [classes, selectedClassId],
  );

  const selectedClassName = selectedClass
    ? String(selectedClass.sclassName || selectedClass.className || selectedClass.name || "").trim()
    : "";

  const teacherSubjectName = String(teacherProfile?.teachSubject || "").trim();
  const teacherAssignedClassKey = useMemo(
    () => normalizeClassKey(teacherProfile?.teachSclass),
    [teacherProfile?.teachSclass],
  );

  const matchingClasses = useMemo(() => {
    if (!teacherAssignedClassKey) return classes;
    return classes.filter((item) => {
      const className = String(item.sclassName || item.className || item.name || "").trim();
      return normalizeClassKey(className) === teacherAssignedClassKey;
    });
  }, [classes, teacherAssignedClassKey]);

  const sectionOptions = useMemo(() => {
    const options = matchingClasses.map((item) => String(item.section || "A").trim()).filter(Boolean);
    return Array.from(new Set(options));
  }, [matchingClasses]);

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

  const fetchTeacherProfile = useCallback(async () => {
    if (!user?.email) return;
    try {
      const response = await get("/teachers");
      const records = response?.teachers || response || [];
      const teacher = records.find((item) => {
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

  const fetchStudentsByClassName = useCallback(
    async (className, sectionName) => {
      if (!className) {
        setStudents([]);
        setRows([]);
        return;
      }

      try {
        setRefreshing(true);
        const lookupValue = className || teacherProfile?.teachSclass || "";
        const response = await get(`/students/class/${encodeURIComponent(lookupValue)}`);
        const classStudents = response?.studentByClass || response?.students || response || [];
        const normalizedStudents = Array.isArray(classStudents) ? classStudents : [];
        const filteredStudents = sectionName
          ? normalizedStudents.filter((student) => {
              const studentSection = String(student.section || student.sclass?.section || "").trim();
              return !studentSection || studentSection === sectionName;
            })
          : normalizedStudents;
        setStudents(filteredStudents);
      } catch (error) {
        console.error(error);
        toast.error("Unable to load students for the selected class.");
      } finally {
        setRefreshing(false);
      }
    },
    [get, teacherProfile?.teachSclass],
  );

  useEffect(() => {
    fetchTeacherProfile();
    fetchClasses();
    fetchSubjects();
  }, [fetchTeacherProfile, fetchClasses, fetchSubjects]);

  useEffect(() => {
    if (!matchingClasses.length) {
      setSelectedClassId("");
      setSelectedSection("");
      return;
    }

    const currentClass = matchingClasses.find(
      (item) => String(item._id || item.id) === String(selectedClassId),
    );

    if (!selectedClassId || !currentClass) {
      const firstClass = matchingClasses[0];
      setSelectedClassId(String(firstClass._id || firstClass.id || ""));
      setSelectedSection(String(firstClass.section || "A").trim() || "A");
      return;
    }

    if (!selectedSection) {
      setSelectedSection(String(currentClass.section || "A").trim() || "A");
    }
  }, [matchingClasses, selectedClassId, selectedSection]);

  useEffect(() => {
    if (selectedClassName) {
      fetchStudentsByClassName(selectedClassName, selectedSection || undefined);
    } else {
      setStudents([]);
      setRows([]);
    }
  }, [fetchStudentsByClassName, selectedClassName, selectedSection]);

  useEffect(() => {
    setRows(
      students.map((student, index) => ({
        id: String(student._id || student.id || ""),
        sn: index + 1,
        name: formatStudentName(student),
        rollNum: student.rollNum || "-",
        className: selectedClassName || student.sclass?.sclassName || "-",
        sectionName: student.section || selectedClass?.section || "-",
        status: "Present",
      })),
    );
  }, [students, selectedClassName, selectedClass]);

  const updateRowStatus = (studentId, status) => {
    setRows((currentRows) =>
      currentRows.map((row) => (row.id === studentId ? { ...row, status } : row)),
    );
  };

  const handleClassChange = (value) => {
    setSelectedClassId(value);
    const chosenClass = matchingClasses.find((item) => String(item._id || item.id) === String(value));
    if (chosenClass) {
      setSelectedSection(String(chosenClass.section || "A").trim() || "A");
    }
  };

  const handleSectionChange = (value) => {
    setSelectedSection(value);
    const chosenClass = matchingClasses.find((item) => String(item.section || "A").trim() === value);
    if (chosenClass) {
      setSelectedClassId(String(chosenClass._id || chosenClass.id || ""));
    }
  };

  const handleRefresh = async () => {
    if (!selectedClassName) return;
    await fetchStudentsByClassName(selectedClassName, selectedSection || undefined);
  };

  const generatePdf = (attendanceRows) => {
    if (!attendanceRows.length || typeof window === "undefined") return;

    const printWindow = window.open("", "_blank", "width=900,height=700");
    if (!printWindow) {
      toast.error("Please allow pop-ups to download the attendance sheet.");
      return;
    }

    const rowsHtml = attendanceRows
      .map(
        (row) => `
          <tr>
            <td>${row.sn}</td>
            <td>${row.name}</td>
            <td>${row.rollNum}</td>
            <td>${row.className}</td>
            <td>${row.sectionName}</td>
            <td>${row.status}</td>
          </tr>`,
      )
      .join("");

    printWindow.document.write(`
      <html>
        <head>
          <title>Attendance Sheet</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; color: #111; }
            h2 { margin-bottom: 8px; }
            p { margin: 4px 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; }
            th, td { border: 1px solid #ccc; padding: 8px; text-align: left; font-size: 12px; }
            th { background: #f5f5f5; }
          </style>
        </head>
        <body>
          <h2>Attendance Sheet</h2>
          <p><strong>Class:</strong> ${selectedClassName || "-"}</p>
          <p><strong>Subject:</strong> ${teacherSubjectName || teacherSubjectDoc?.subjectName || teacherSubjectDoc?.name || "-"}</p>
          <p><strong>Date:</strong> ${attendanceDate}</p>
          <table>
            <thead>
              <tr>
                <th>SN</th>
                <th>Name</th>
                <th>Roll No.</th>
                <th>Class</th>
                <th>Section</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>${rowsHtml}</tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const handleSaveAttendance = async () => {
    if (!selectedClassName) {
      toast.error("Please select a class first.");
      return;
    }

    if (!teacherSubjectName) {
      toast.error("No subject is assigned to this teacher.");
      return;
    }

    if (!rows.length) {
      toast.error("No students are available to save attendance for.");
      return;
    }

    try {
      setSaving(true);
      for (const row of rows) {
        const response = await post("/attendances/createStd", {
          student: row.id,
          name: row.name,
          status: row.status,
          date: attendanceDate,
          class: selectedClassName,
          subName: teacherSubjectName,
        });

        if (!response?.success) {
          throw new Error(response?.message || "Failed to save attendance for one or more students.");
        }
      }

      setSavedAttendance(true);
      toast.success(`Attendance saved for ${rows.length} students.`);
      generatePdf(rows);
    } catch (error) {
      console.error(error);
      toast.error(error?.message || "Unable to save attendance records.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="pl-16 pr-4 py-6 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Student Attendance Sheet</h2>
          <p className="text-muted-foreground">
            Mark attendance for students in your assigned class and subject. You can select the class, section, and date, then mark each student's attendance status before saving the records.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing || !selectedClassName}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            {refreshing ? "Loading..." : "Refresh"}
          </Button>
          <Button onClick={handleSaveAttendance} disabled={saving || !rows.length}>
            {saving ? "Saving..." : "Save Attendance"}
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="class">Class</Label>
              <Select value={selectedClassId || undefined} onValueChange={handleClassChange}>
                <SelectTrigger id="class">
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {matchingClasses.map((item) => {
                    const classId = String(item._id || item.id || "").trim();
                    const label = `${item.sclassName || item.className || item.name || "Class"}${item.section ? ` - Section ${item.section}` : ""}`;
                    return (
                      <SelectItem key={classId} value={classId}>
                        {label}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="section">Section</Label>
              <Select value={selectedSection || undefined} onValueChange={handleSectionChange}>
                <SelectTrigger id="section">
                  <SelectValue placeholder="Select section" />
                </SelectTrigger>
                <SelectContent>
                  {sectionOptions.map((section) => (
                    <SelectItem key={section} value={section}>
                      {section}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                readOnly
                value={teacherSubjectName || teacherSubjectDoc?.subjectName || teacherSubjectDoc?.name || "Subject not assigned"}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={attendanceDate}
                onChange={(event) => setAttendanceDate(event.target.value)}
              />
            </div>
          </div>

          <div className="rounded-md border bg-muted/20 p-3 text-sm text-muted-foreground">
           please ensure that you select the correct class, section, and subject before marking attendance. Once you have marked the attendance for all students, click on "Save Attendance" to store the records. You can also download a PDF of the attendance sheet for your records.
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Students in {selectedClassName || "Selected Class"}</CardTitle>
        </CardHeader>
        <CardContent>
          {rows.length ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SN</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Roll No.</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Section</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>{row.sn}</TableCell>
                      <TableCell>{row.name}</TableCell>
                      <TableCell>{row.rollNum}</TableCell>
                      <TableCell>{row.className}</TableCell>
                      <TableCell>{row.sectionName}</TableCell>
                      <TableCell>
                        <Select value={row.status} onValueChange={(value) => updateRowStatus(row.id, value)}>
                          <SelectTrigger className="w-[140px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Present">Present</SelectItem>
                            <SelectItem value="Absent">Absent</SelectItem>
                            <SelectItem value="Late">Late</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="rounded-md border border-dashed p-6 text-center text-muted-foreground">
              No students found for the selected class yet.
            </div>
          )}
        </CardContent>
      </Card>

      {savedAttendance && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Saved Attendance Preview</CardTitle>
            <Button variant="outline" size="sm" onClick={() => generatePdf(rows)}>
              <FileDown className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SN</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Roll No.</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Section</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={`${row.id}-saved`}>
                      <TableCell>{row.sn}</TableCell>
                      <TableCell>{row.name}</TableCell>
                      <TableCell>{row.rollNum}</TableCell>
                      <TableCell>{row.className}</TableCell>
                      <TableCell>{row.sectionName}</TableCell>
                      <TableCell>{row.status}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Attendances;
