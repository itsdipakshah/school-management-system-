import React, { useCallback, useEffect, useMemo, useState } from "react";
import useApi from "@/hooks/UseApi";
import useAuth from "@/hooks/UseAuth";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Eye,
  Calendar,
  Search,
  Sparkles,
  ClipboardList,
  User,
  CalendarClock,
  AlertTriangle,
  CheckCircle2,
  Send,
  UploadCloud,
  Plus,
} from "lucide-react";

const Assigment = () => {
  const { get, post } = useApi();
  const { user } = useAuth();
  const isStudent = user?.role === "Student";
  const isTeacher = user?.role === "Teacher";

  const [assigments, setAssigments] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("show-all");
  const [viewAssigment, setViewAssigment] = useState(null);
  const [isViewOpen, setIsViewOpen] = useState(false);

  // "Give Assignment" = student submission flow
  const [giveAssigment, setGiveAssigment] = useState(null);
  const [isGiveOpen, setIsGiveOpen] = useState(false);
  const [submissionNote, setSubmissionNote] = useState("");
  const [submissionFile, setSubmissionFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // "Create Assignment" = teacher creation flow
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: "",
    description: "",
    assignDate: "",
    deadline: "",
  });
  const [createFile, setCreateFile] = useState(null);
  const [isCreating, setIsCreating] = useState(false);

  const fetchAssigments = useCallback(async () => {
    try {
      const response = await get("/assigments");
      if (response?.success && Array.isArray(response.assigments)) {
        setAssigments(response.assigments);
      } else if (Array.isArray(response)) {
        setAssigments(response);
      } else {
        toast.error("Unexpected assignments response from backend");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load assignments");
    }
  }, [get]);

  useEffect(() => {
    fetchAssigments();
  }, [fetchAssigments]);

  // Deadline status is derived on the fly since the backend has no status field
  const getDeadlineStatus = (deadline) => {
    if (!deadline) return "unknown";
    const now = new Date();
    const due = new Date(deadline);
    const diffDays = (due - now) / (1000 * 60 * 60 * 24);

    if (diffDays < 0) return "overdue";
    if (diffDays <= 2) return "due-soon";
    return "upcoming";
  };

  const filteredAssigments = useMemo(() => {
    const lowerSearch = searchTerm.toLowerCase().trim();

    return assigments.filter((assigment) => {
      const status = getDeadlineStatus(assigment.deadline);

      if (filterStatus !== "show-all" && status !== filterStatus) {
        return false;
      }

      const matchesSearch =
        !lowerSearch ||
        assigment.title?.toLowerCase().includes(lowerSearch) ||
        assigment.description?.toLowerCase().includes(lowerSearch) ||
        assigment.assignedBy?.name?.toLowerCase().includes(lowerSearch);

      return matchesSearch;
    });
  }, [assigments, searchTerm, filterStatus]);

  const handleView = (assigment) => {
    setViewAssigment(assigment);
    setIsViewOpen(true);
  };

  const handleOpenGive = (assigment) => {
    setGiveAssigment(assigment);
    setSubmissionNote("");
    setSubmissionFile(null);
    setIsGiveOpen(true);
  };

  const handleSubmitAssigment = async (e) => {
    e.preventDefault();
    if (!giveAssigment) return;

    try {
      setIsSubmitting(true);

      const formData = new FormData();
      formData.append("note", submissionNote);
      if (submissionFile) {
        formData.append("submissionFile", submissionFile);
      }

      // NOTE: the controller you shared doesn't include a submission route
      // yet — this posts to /assigments/:id/submit as a placeholder.
      // Add a matching endpoint (e.g. submitAssigment) on the backend that
      // records the student's submission against this assignment.
      const response = await post(`/assigments/${giveAssigment._id}/submit`, formData);

      if (response?.success === false) {
        toast.error(response?.message || "Failed to submit assignment");
        return;
      }

      toast.success("Assignment submitted successfully");
      setIsGiveOpen(false);
    } catch (error) {
      console.error(error);
      toast.error("Failed to submit assignment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenCreate = () => {
    setCreateForm({ title: "", description: "", assignDate: "", deadline: "" });
    setCreateFile(null);
    setIsCreateOpen(true);
  };

  const handleCreateFormChange = (field, value) => {
    setCreateForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreateAssigment = async (e) => {
    e.preventDefault();

    const { title, description, assignDate, deadline } = createForm;
    if (!title || !description || !assignDate || !deadline) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setIsCreating(true);

      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      formData.append("assignDate", assignDate);
      formData.append("deadline", deadline);
      if (createFile) {
        // matches req.files.assigneFile expected by the createAssigment controller
        formData.append("assigneFile", createFile);
      }

      const response = await post("/assigments", formData);

      if (response?.success === false) {
        toast.error(response?.message || "Failed to create assignment");
        return;
      }

      toast.success("Assignment created successfully");
      setIsCreateOpen(false);
      fetchAssigments();
    } catch (error) {
      console.error(error);
      toast.error("Failed to create assignment");
    } finally {
      setIsCreating(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getStatusStyles = (status) => {
    switch (status) {
      case "overdue":
        return "bg-red-500/10 text-red-600 border-red-500/20 hover:bg-red-500/10";
      case "due-soon":
        return "bg-amber-500/10 text-amber-600 border-amber-500/20 hover:bg-amber-500/10";
      case "upcoming":
        return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/10";
      default:
        return "bg-blue-500/10 text-blue-600 border-blue-500/20 hover:bg-blue-500/10";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "overdue":
        return <AlertTriangle className="h-3.5 w-3.5 mr-1 inline" />;
      case "due-soon":
        return <CalendarClock className="h-3.5 w-3.5 mr-1 inline" />;
      case "upcoming":
        return <CheckCircle2 className="h-3.5 w-3.5 mr-1 inline" />;
      default:
        return <ClipboardList className="h-3.5 w-3.5 mr-1 inline" />;
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "overdue":
        return "Overdue";
      case "due-soon":
        return "Due Soon";
      case "upcoming":
        return "Upcoming";
      default:
        return "Unknown";
    }
  };

  return (
    <div className="pl-16 pr-4 py-6">
      <div className="mb-6 flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Assignments</h2>
          <p className="text-muted-foreground">
            Track assigned work, deadlines, and submission files.
          </p>
        </div>
        <div className="flex items-center gap-3 self-start sm:self-center">
          <div className="text-sm font-medium bg-muted px-3 py-1.5 rounded-md">
            Showing {filteredAssigments.length} Assignments
          </div>
          {isTeacher && (
            <Button onClick={handleOpenCreate} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create Assignment
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6 w-full">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search assignments by title, keywords, or teacher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 w-full"
          />
        </div>

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-[180px] shrink-0">
            <SelectValue placeholder="Deadline Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="show-all">All Assignments</SelectItem>
            <SelectItem value="upcoming">Upcoming</SelectItem>
            <SelectItem value="due-soon">Due Soon</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAssigments.length === 0 ? (
          <div className="col-span-full text-center py-12 border rounded-xl bg-muted/20 text-muted-foreground">
            <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p>No assignments found matching your criteria.</p>
          </div>
        ) : (
          filteredAssigments.map((assigment) => {
            const status = getDeadlineStatus(assigment.deadline);
            return (
              <Card
                key={assigment._id}
                className="flex flex-col justify-between shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
              >
                <div>
                  {assigment.assigneFile?.url ? (
                    <div className="h-40 w-full relative overflow-hidden bg-muted border-b">
                      <img
                        src={assigment.assigneFile.url}
                        alt={assigment.title}
                        className="object-cover w-full h-full hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  ) : (
                    <div className="h-2 bg-primary/20 w-full" />
                  )}

                  <CardHeader className="space-y-2">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <Badge variant="outline" className={getStatusStyles(status)}>
                        {getStatusIcon(status)}
                        {getStatusLabel(status)}
                      </Badge>
                      <div className="flex items-center text-xs text-muted-foreground gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>Due {formatDate(assigment.deadline)}</span>
                      </div>
                    </div>
                    <CardTitle className="text-xl font-bold line-clamp-1 leading-snug">
                      {assigment.title}
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="pb-4 space-y-3">
                    <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                      {assigment.description}
                    </p>

                    <div className="flex flex-col gap-1.5 pt-1 text-xs text-muted-foreground border-t border-dashed mt-2">
                      {assigment.assignedBy?.name && (
                        <div className="flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70" />
                          <span className="truncate">
                            Assigned by {assigment.assignedBy.name}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70" />
                        <span>Assigned {formatDate(assigment.assignDate)}</span>
                      </div>
                    </div>
                  </CardContent>
                </div>

                <CardContent className="pt-0 border-t mt-auto py-3 bg-muted/10 flex flex-col gap-2">
                  <Button
                    className="w-full flex items-center justify-center gap-2"
                    variant="outline"
                    onClick={() => handleView(assigment)}
                  >
                    <Eye className="h-4 w-4" />
                    View Assignment Details
                  </Button>
                  {isStudent && (
                    <Button
                      className="w-full flex items-center justify-center gap-2"
                      onClick={() => handleOpenGive(assigment)}
                    >
                      <Send className="h-4 w-4" />
                      Give Assignment
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="sm:max-w-[550px] overflow-y-auto max-h-[90vh]">
          {viewAssigment && (
            <>
              <DialogHeader className="space-y-3 text-left">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge
                    variant="outline"
                    className={getStatusStyles(getDeadlineStatus(viewAssigment.deadline))}
                  >
                    {getStatusIcon(getDeadlineStatus(viewAssigment.deadline))}
                    Status: {getStatusLabel(getDeadlineStatus(viewAssigment.deadline))}
                  </Badge>
                  <div className="flex items-center text-xs text-muted-foreground gap-1 ml-auto">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>Deadline: {formatDate(viewAssigment.deadline)}</span>
                  </div>
                </div>
                <DialogTitle className="text-2xl font-bold tracking-tight text-foreground">
                  {viewAssigment.title}
                </DialogTitle>
              </DialogHeader>

              {viewAssigment.assigneFile?.url && (
                <div className="my-2 rounded-lg overflow-hidden border bg-muted max-h-64 flex justify-center">
                  <img
                    src={viewAssigment.assigneFile.url}
                    alt={viewAssigment.title}
                    className="object-contain max-h-64 w-full bg-black/5"
                  />
                </div>
              )}

              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-muted/30 p-3 rounded-lg border text-sm">
                  {viewAssigment.assignedBy?.name && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <User className="h-4 w-4 text-primary shrink-0" />
                      <div>
                        <span className="font-medium text-foreground block text-xs">
                          Assigned By
                        </span>
                        {viewAssigment.assignedBy.name}
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4 text-primary shrink-0" />
                    <div>
                      <span className="font-medium text-foreground block text-xs">
                        Assign Date
                      </span>
                      {formatDate(viewAssigment.assignDate)}
                    </div>
                  </div>
                </div>

                <div className="text-sm leading-relaxed text-slate-600 dark:text-slate-300 whitespace-pre-wrap bg-muted/10 p-4 rounded-lg border">
                  {viewAssigment.description}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isGiveOpen} onOpenChange={setIsGiveOpen}>
        <DialogContent className="sm:max-w-[500px]">
          {giveAssigment && (
            <>
              <DialogHeader className="space-y-1 text-left">
                <DialogTitle className="text-xl font-bold tracking-tight text-foreground">
                  Give Assignment
                </DialogTitle>
                <p className="text-sm text-muted-foreground">
                  Submitting for{" "}
                  <span className="font-medium text-foreground">
                    {giveAssigment.title}
                  </span>{" "}
                  · Due {formatDate(giveAssigment.deadline)}
                </p>
              </DialogHeader>

              <form onSubmit={handleSubmitAssigment} className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">
                    Note (optional)
                  </label>
                  <Textarea
                    placeholder="Add a note for your teacher..."
                    value={submissionNote}
                    onChange={(e) => setSubmissionNote(e.target.value)}
                    rows={4}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">
                    Attach your work
                  </label>
                  <label
                    htmlFor="submission-file"
                    className="flex items-center gap-2 border border-dashed rounded-lg px-3 py-2.5 text-sm text-muted-foreground cursor-pointer hover:bg-muted/40 transition-colors"
                  >
                    <UploadCloud className="h-4 w-4 shrink-0" />
                    {submissionFile ? submissionFile.name : "Choose a file to upload"}
                  </label>
                  <input
                    id="submission-file"
                    type="file"
                    className="hidden"
                    onChange={(e) => setSubmissionFile(e.target.files?.[0] || null)}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2"
                  disabled={isSubmitting}
                >
                  <Send className="h-4 w-4" />
                  {isSubmitting ? "Submitting..." : "Submit Assignment"}
                </Button>
              </form>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[550px] overflow-y-auto max-h-[90vh]">
          <DialogHeader className="space-y-1 text-left">
            <DialogTitle className="text-xl font-bold tracking-tight text-foreground">
              Create Assignment
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              Post a new assignment for your students.
            </p>
          </DialogHeader>

          <form onSubmit={handleCreateAssigment} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Title</label>
              <Input
                placeholder="e.g. Chapter 4 Problem Set"
                value={createForm.title}
                onChange={(e) => handleCreateFormChange("title", e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Description</label>
              <Textarea
                placeholder="Describe what students need to do..."
                value={createForm.description}
                onChange={(e) => handleCreateFormChange("description", e.target.value)}
                rows={4}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Assign Date</label>
                <Input
                  type="date"
                  value={createForm.assignDate}
                  onChange={(e) => handleCreateFormChange("assignDate", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Deadline</label>
                <Input
                  type="date"
                  value={createForm.deadline}
                  onChange={(e) => handleCreateFormChange("deadline", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                Attachment (optional)
              </label>
              <label
                htmlFor="create-assigment-file"
                className="flex items-center gap-2 border border-dashed rounded-lg px-3 py-2.5 text-sm text-muted-foreground cursor-pointer hover:bg-muted/40 transition-colors"
              >
                <UploadCloud className="h-4 w-4 shrink-0" />
                {createFile ? createFile.name : "Choose a file to attach"}
              </label>
              <input
                id="create-assigment-file"
                type="file"
                className="hidden"
                onChange={(e) => setCreateFile(e.target.files?.[0] || null)}
              />
            </div>

            <Button
              type="submit"
              className="w-full flex items-center justify-center gap-2"
              disabled={isCreating}
            >
              <Plus className="h-4 w-4" />
              {isCreating ? "Creating..." : "Create Assignment"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Assigment;