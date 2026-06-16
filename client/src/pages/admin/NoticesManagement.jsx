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
import { Textarea } from "@/components/ui/textarea";
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
  Upload,
  X,
  AlertCircle,
} from "lucide-react";
import z from "zod";

const createSchema = z.object({
  title: z.string().min(3, "Title is required"),
  description: z.string().min(1, "Description is required"),
  date: z.string().min(1, "Date is required"),
  audience: z.enum(["all", "student", "teacher"], {
    message: "Audience is required",
  }),
});

const initialFormState = {
  title: "",
  description: "",
  audience: "all",
  date: new Date().toISOString().split("T")[0],
  noticeImage: null,
  imagePreview: null,
};

const NoticesManagement = () => {
  const navigate = useNavigate();
  const { get, post, put, del } = useApi();
  const [notices, setNotices] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAudience, setFilterAudience] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingNoticeId, setEditingNoticeId] = useState(null);
  const [formState, setFormState] = useState(initialFormState);
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotices = useCallback(async () => {
    try {
      const response = await get("/notices");
      if (response?.success && Array.isArray(response.notices)) {
        setNotices(response.notices);
      } else if (Array.isArray(response)) {
        setNotices(response);
      } else {
        toast.error("Unexpected notices response from backend");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load notices");
    }
  }, [get]);

  useEffect(() => {
    fetchNotices();
  }, [fetchNotices]);

  useEffect(() => {
    const handler = (e) => setSearchTerm(e.detail ?? "");
    window.addEventListener("adminSearch", handler);
    return () => window.removeEventListener("adminSearch", handler);
  }, []);

  const filteredNotices = useMemo(() => {
    const lower = (searchTerm || "").toLowerCase();
    return notices.filter((notice) => {
      const matchesSearch =
        (notice.title || "").toLowerCase().includes(lower) ||
        (notice.description || "").toLowerCase().includes(lower);
      const matchesAudience =
        filterAudience === "all" || notice.audience === filterAudience;
      return matchesSearch && matchesAudience;
    });
  }, [notices, searchTerm, filterAudience]);

  const handleInputChange = (field, value) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size must be less than 5MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormState((prev) => ({
          ...prev,
          noticeImage: file,
          imagePreview: reader.result,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const openCreateDialog = () => {
    setFormState(initialFormState);
    setIsEditMode(false);
    setEditingNoticeId(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (notice) => {
    setFormState({
      title: notice.title || "",
      description: notice.description || "",
      audience: notice.audience || "all",
      date: new Date(notice.date).toISOString().split("T")[0],
      noticeImage: null,
      imagePreview: notice.noticeImage?.url || null,
    });
    setEditingNoticeId(notice._id || notice.id);
    setIsEditMode(true);
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validation = createSchema.safeParse({
      title: formState.title,
      description: formState.description,
      date: formState.date,
      audience: formState.audience,
    });

    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    if (!isEditMode && !formState.noticeImage) {
      toast.error("Notice image is required");
      return;
    }

    try {
      setSubmitting(true);

      const formData = new FormData();
      formData.append("title", formState.title);
      formData.append("description", formState.description);
      formData.append("date", formState.date);
      formData.append("audience", formState.audience);

      if (formState.noticeImage) {
        formData.append("noticeImage", formState.noticeImage);
      }

      let response;
      if (isEditMode && editingNoticeId) {
        response = await put(`/notices/${editingNoticeId}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        response = await post("/notices/create", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      if (response?.success) {
        toast.success(
          isEditMode
            ? "Notice updated successfully"
            : "Notice created successfully",
        );
        setIsDialogOpen(false);
        setIsEditMode(false);
        setEditingNoticeId(null);
        setFormState(initialFormState);
        await fetchNotices();
      } else {
        toast.error(response?.message || "Failed to save notice");
      }
    } catch (error) {
      console.error(error);
      toast.error("Could not save notice");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (noticeId) => {
    if (!confirm("Are you sure you want to delete this notice?")) {
      return;
    }
    try {
      const response = await del(`/notices/${noticeId}`);
      if (response?.success) {
        toast.success("Notice deleted successfully");
        await fetchNotices();
      } else {
        toast.error(response?.message || "Failed to delete notice");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete notice");
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await fetchNotices();
      toast.success("Notices refreshed");
    } finally {
      setRefreshing(false);
    }
  };

  const getAudienceColor = (audience) => {
    switch (audience) {
      case "all":
        return "destructive";
      case "student":
        return "default";
      case "teacher":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getAudienceLabel = (audience) => {
    switch (audience) {
      case "all":
        return "All";
      case "student":
        return "Students";
      case "teacher":
        return "Teachers";
      default:
        return audience;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="pl-16 pr-4 py-6 ">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Notices</h2>
          <p className="text-muted-foreground">
            Manage announcements and notifications
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
            Add Notice
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
                placeholder="Search notices by title or description..."
                className="pl-10 bg-background border-border"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={filterAudience} onValueChange={setFilterAudience}>
              <SelectTrigger className="sm:w-[180px] bg-background border-border">
                <SelectValue placeholder="Filter by audience" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Audiences</SelectItem>
                <SelectItem value="student">Students</SelectItem>
                <SelectItem value="teacher">Teachers</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] bg-card border-border max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {isEditMode ? "Edit Notice" : "Create New Notice"}
            </DialogTitle>
            <DialogDescription>
              {isEditMode
                ? "Update notice information"
                : "Create a new announcement for students and/or teachers."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Notice Title</Label>
              <Input
                id="title"
                placeholder="Enter notice title"
                value={formState.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Enter notice description"
                rows={4}
                value={formState.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
              />
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
                <Label htmlFor="audience">Audience</Label>
                <Select
                  value={formState.audience}
                  onValueChange={(value) =>
                    handleInputChange("audience", value)
                  }
                >
                  <SelectTrigger id="audience">
                    <SelectValue placeholder="Select audience" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="student">Students Only</SelectItem>
                    <SelectItem value="teacher">Teachers Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Image Upload Section */}
            <div className="space-y-2">
              <Label htmlFor="image">Notice Image</Label>
              <div className="border-2 border-dashed border-border rounded-lg p-4">
                {formState.imagePreview ? (
                  <div className="space-y-4">
                    <div className="relative">
                      <img
                        src={formState.imagePreview}
                        alt="Preview"
                        className="w-full h-40 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setFormState((prev) => ({
                            ...prev,
                            noticeImage: null,
                            imagePreview: null,
                          }))
                        }
                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <label className="flex items-center justify-center gap-2 p-2 bg-muted rounded cursor-pointer hover:bg-muted/80 transition">
                      <Upload className="w-4 h-4" />
                      <span className="text-sm">Change Image</span>
                      <input
                        id="image"
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                ) : (
                  <label
                    htmlFor="image"
                    className="flex flex-col items-center justify-center gap-2 cursor-pointer"
                  >
                    <Upload className="w-8 h-8 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Click to upload or drag and drop
                    </span>
                    <span className="text-xs text-muted-foreground">
                      PNG, JPG up to 5MB
                    </span>
                    <input
                      id="image"
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                )}
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
                    ? "Update Notice"
                    : "Create Notice"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Notices List - Responsive Grid Cards */}
      {filteredNotices.length > 0 ? (
        <div className="grid gap-4 grid-cols-1">
          {filteredNotices.map((notice) => (
            <Card
              key={notice._id || notice.id}
              className="bg-card border-border overflow-hidden"
            >
              <div className="flex flex-col sm:flex-row">
                {/* Image */}
                {notice.noticeImage?.url && (
                  <div className="sm:w-48 w-full h-40 sm:h-auto overflow-hidden flex-shrink-0">
                    <img
                      src={notice.noticeImage.url}
                      alt={notice.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Content */}
                <div className="flex-1 flex flex-col justify-between">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <CardTitle className="text-lg text-foreground">
                            {notice.title}
                          </CardTitle>
                          <Badge variant={getAudienceColor(notice.audience)}>
                            {getAudienceLabel(notice.audience)}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          {formatDate(notice.date)}
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(notice)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              handleDelete(notice._id || notice.id)
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
                    <p className="text-foreground text-sm line-clamp-3">
                      {notice.description}
                    </p>
                  </CardContent>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No notices found</p>
              <p className="text-sm text-muted-foreground/70">
                {searchTerm || filterAudience !== "all"
                  ? "Try adjusting your search or filters"
                  : "Create your first notice to get started"}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Card */}
      {notices.length > 0 && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total Notices</p>
                <p className="text-2xl font-bold text-foreground">
                  {notices.length}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">For All</p>
                <p className="text-2xl font-bold text-foreground">
                  {notices.filter((n) => n.audience === "all").length}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">For Students</p>
                <p className="text-2xl font-bold text-foreground">
                  {notices.filter((n) => n.audience === "student").length}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">For Teachers</p>
                <p className="text-2xl font-bold text-foreground">
                  {notices.filter((n) => n.audience === "teacher").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default NoticesManagement;
