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
  Clock,
  MapPin,
  Upload,
  X,
  AlertCircle,
} from "lucide-react";
import z from "zod";

const createSchema = z.object({
  title: z.string().min(3, "Title is required"),
  description: z.string().min(1, "Description is required"),
  eventDate: z.string().min(1, "Date is required"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  location: z.string().min(1, "Location is required"),
  eventType: z.enum(["academic", "extracurricular", "other"], {
    message: "Event type is required",
  }),
});

const initialFormState = {
  title: "",
  description: "",
  eventDate: new Date().toISOString().split("T")[0],
  startTime: "09:00",
  endTime: "10:00",
  location: "",
  eventType: "other",
  eventImage: null,
  imagePreview: null,
};

const EventsManagement = () => {
  const navigate = useNavigate();
  const { get, post, put, del } = useApi();
  const [events, setEvents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterEventType, setFilterEventType] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingEventId, setEditingEventId] = useState(null);
  const [formState, setFormState] = useState(initialFormState);
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch events from backend
  const fetchEvents = useCallback(async () => {
    try {
      const response = await get("/events");
      if (response?.success && Array.isArray(response.events)) {
        setEvents(response.events);
      } else if (Array.isArray(response)) {
        setEvents(response);
      } else {
        toast.error("Unexpected events response from backend");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load events");
    }
  }, [get]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  useEffect(() => {
    const handler = (e) => setSearchTerm(e.detail ?? "");
    window.addEventListener("adminSearch", handler);
    return () => window.removeEventListener("adminSearch", handler);
  }, []);

  // Filter events based on search and type
  const filteredEvents = useMemo(() => {
    const lower = (searchTerm || "").toLowerCase();
    return events.filter((event) => {
      const matchesSearch =
        (event.title || "").toLowerCase().includes(lower) ||
        (event.description || "").toLowerCase().includes(lower);
      const matchesEventType =
        filterEventType === "all" || event.eventType === filterEventType;
      return matchesSearch && matchesEventType; ``
    });
  }, [events, searchTerm, filterEventType]);

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
          eventImage: file,
          imagePreview: reader.result,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const openCreateDialog = () => {
    setFormState(initialFormState);
    setIsEditMode(false);
    setEditingEventId(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (event) => {
    setFormState({
      title: event.title || "",
      description: event.description || "",
      eventType: event.eventType || "other",
      eventDate: new Date(event.eventDate).toISOString().split("T")[0],
      startTime: event.startTime || "09:00",
      endTime: event.endTime || "10:00",
      location: event.location || "",
      eventImage: null,
      imagePreview: event.eventImage?.url || null,
    });
    setEditingEventId(event._id || event.id);
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

    if (!isEditMode && !formState.eventImage) {
      toast.error("Event image is required");
      return;
    }

    try {
      setSubmitting(true);

      const formData = new FormData();
      formData.append("title", formState.title);
      formData.append("description", formState.description);
      formData.append("eventDate", formState.eventDate);
      formData.append("startTime", formState.startTime);
      formData.append("endTime", formState.endTime);
      formData.append("location", formState.location);
      formData.append("eventType", formState.eventType);

      if (formState.eventImage) {
        formData.append("eventImage", formState.eventImage);
      }

      let response;
      if (isEditMode && editingEventId) {
        response = await put(`/events/${editingEventId}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        response = await post("/events/create", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      if (response?.success) {
        toast.success(
          isEditMode
            ? "Event updated successfully"
            : "Event created successfully"
        );
        setIsDialogOpen(false);
        setIsEditMode(false);
        setEditingEventId(null);
        setFormState(initialFormState);
        await fetchEvents();
      } else {
        toast.error(response?.message || "Failed to save event");
      }
    } catch (error) {
      console.error(error);
      toast.error("Could not save event");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (eventId) => {
    if (!confirm("Are you sure you want to delete this event?")) {
      return;
    }
    try {
      const response = await del(`/events/${eventId}`);
      if (response?.success) {
        toast.success("Event deleted successfully");
        await fetchEvents();
      } else {
        toast.error(response?.message || "Failed to delete event");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete event");
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await fetchEvents();
      toast.success("Events refreshed");
    } finally {
      setRefreshing(false);
    }
  };

  const getEventTypeColor = (eventType) => {
    switch (eventType) {
      case "academic":
        return "destructive";
      case "extracurricular":
        return "default";
      case "other":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getEventTypeLabel = (eventType) => {
    switch (eventType) {
      case "academic":
        return "Academic";
      case "extracurricular":
        return "Extracurricular";
      case "other":
        return "Other";
      default:
        return eventType;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return "";
    return timeString;
  };

  return (
    <div className="pl-16 pr-4 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Events</h2>
          <p className="text-muted-foreground">
            Manage school events and activities
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
            Add Event
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
                placeholder="Search events by title or description..."
                className="pl-10 bg-background border-border"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-end gap-2">
              <Select value={filterEventType} onValueChange={setFilterEventType}>
                <SelectTrigger className="sm:w-[180px] bg-background border-border">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Events</SelectItem>
                  <SelectItem value="academic">Academic</SelectItem>
                  <SelectItem value="extracurricular">Extracurricular</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              {filterEventType !== "all" && (
                <Badge variant="secondary" className="whitespace-nowrap">
                  Filtered: {getEventTypeLabel(filterEventType)}
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
              {isEditMode ? "Edit Event" : "Create New Event"}
            </DialogTitle>
            <DialogDescription>
              {isEditMode
                ? "Update event information"
                : "Create a new event for students and staff."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Event Title</Label>
              <Input
                id="title"
                placeholder="Enter event title"
                value={formState.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Enter event description"
                rows={4}
                value={formState.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="eventDate">Event Date</Label>
                <Input
                  id="eventDate"
                  type="date"
                  value={formState.eventDate}
                  onChange={(e) =>
                    handleInputChange("eventDate", e.target.value)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="eventType">Event Type</Label>
                <Select
                  value={formState.eventType}
                  onValueChange={(value) =>
                    handleInputChange("eventType", value)
                  }
                >
                  <SelectTrigger id="eventType">
                    <SelectValue placeholder="Select event type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="academic">Academic</SelectItem>
                    <SelectItem value="extracurricular">
                      Extracurricular
                    </SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="startTime">Start Time</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={formState.startTime}
                  onChange={(e) =>
                    handleInputChange("startTime", e.target.value)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">End Time</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={formState.endTime}
                  onChange={(e) => handleInputChange("endTime", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                placeholder="Enter event location"
                value={formState.location}
                onChange={(e) => handleInputChange("location", e.target.value)}
              />
            </div>

            {/* Image Upload Section */}
            <div className="space-y-2">
              <Label htmlFor="image">Event Image</Label>
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
                            eventImage: null,
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
                    ? "Update Event"
                    : "Create Event"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Events List - Responsive Grid Cards */}
      {filteredEvents.length > 0 ? (
        <div className="grid gap-4 grid-cols-1">
          {filteredEvents.map((event) => (
            <Card
              key={event._id || event.id}
              className="bg-card border-border overflow-hidden"
            >
              <div className="flex flex-col sm:flex-row">
                {/* Image */}
                {event.eventImage?.url && (
                  <div className="sm:w-48 w-full h-40 sm:h-auto overflow-hidden flex-shrink-0">
                    <img
                      src={event.eventImage.url}
                      alt={event.title}
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
                            {event.title}
                          </CardTitle>
                          <Badge variant={getEventTypeColor(event.eventType)}>
                            {getEventTypeLabel(event.eventType)}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {formatDate(event.eventDate)}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {formatTime(event.startTime)} -{" "}
                            {formatTime(event.endTime)}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="w-4 h-4" />
                          {event.location}
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(event)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              handleDelete(event._id || event.id)
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
                      {event.description}
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
              <p className="text-muted-foreground">No events found</p>
              <p className="text-sm text-muted-foreground/70">
                {searchTerm || filterEventType !== "other"
                  ? "Try adjusting your search or filters"
                  : "Create your first event to get started"}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Card */}
      {events.length > 0 && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total Events</p>
                <p className="text-2xl font-bold text-foreground">
                  {events.length}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Academic</p>
                <p className="text-2xl font-bold text-foreground">
                  {events.filter((e) => e.eventType === "academic").length}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Extracurricular</p>
                <p className="text-2xl font-bold text-foreground">
                  {
                    events.filter((e) => e.eventType === "extracurricular")
                      .length
                  }
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Other</p>
                <p className="text-2xl font-bold text-foreground">
                  {events.filter((e) => e.eventType === "other").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EventsManagement;