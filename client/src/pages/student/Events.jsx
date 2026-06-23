import React, { useCallback, useEffect, useMemo, useState } from "react";
import useApi from "@/hooks/UseApi";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Eye, Calendar, Search, Sparkles, BookOpen, Trophy, HelpCircle, MapPin, Clock } from "lucide-react";

const Events = () => {
  const { get } = useApi();
  const [events, setEvents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("show-all");
  const [viewEvent, setViewEvent] = useState(null);
  const [isViewOpen, setIsViewOpen] = useState(false);

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

  const filteredEvents = useMemo(() => {
    const lowerSearch = searchTerm.toLowerCase().trim();

    return events.filter((event) => {
      const targetType = event.eventType?.toLowerCase();

      if (filterType !== "show-all" && targetType !== filterType) {
        return false;
      }

      const matchesSearch =
        !lowerSearch ||
        event.title?.toLowerCase().includes(lowerSearch) ||
        event.description?.toLowerCase().includes(lowerSearch) ||
        event.location?.toLowerCase().includes(lowerSearch);

      return matchesSearch;
    });
  }, [events, searchTerm, filterType]);

  const handleView = (event) => {
    setViewEvent(event);
    setIsViewOpen(true);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getTypeStyles = (type) => {
    switch (type?.toLowerCase()) {
      case "academic":
        return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/10";
      case "extracurricular":
        return "bg-amber-500/10 text-amber-600 border-amber-500/20 hover:bg-amber-500/10";
      default:
        return "bg-blue-500/10 text-blue-600 border-blue-500/20 hover:bg-blue-500/10";
    }
  };

  const getTypeIcon = (type) => {
    switch (type?.toLowerCase()) {
      case "academic":
        return <BookOpen className="h-3.5 w-3.5 mr-1 inline" />;
      case "extracurricular":
        return <Trophy className="h-3.5 w-3.5 mr-1 inline" />;
      default:
        return <HelpCircle className="h-3.5 w-3.5 mr-1 inline" />;
    }
  };

  return (
    <div className="pl-16 pr-4 py-6">
      <div className="mb-6 flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">School Events</h2>
          <p className="text-muted-foreground">
            Explore upcoming activities, celebrations, and academic programs.
          </p>
        </div>
        <div className="text-sm font-medium bg-muted px-3 py-1.5 rounded-md self-start sm:self-center">
          Showing {filteredEvents.length} Events
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6 w-full">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search events by title, keywords, or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 w-full"
          />
        </div>

        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-full sm:w-[180px] shrink-0">
            <SelectValue placeholder="Event Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="show-all">All Types</SelectItem>
            <SelectItem value="academic">Academic</SelectItem>
            <SelectItem value="extracurricular">Extracurricular</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEvents.length === 0 ? (
          <div className="col-span-full text-center py-12 border rounded-xl bg-muted/20 text-muted-foreground">
            <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p>No events found matching your criteria.</p>
          </div>
        ) : (
          filteredEvents.map((event) => (
            <Card
              key={event._id}
              className="flex flex-col justify-between shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
            >
              <div>
                {event.eventImage?.url ? (
                  <div className="h-40 w-full relative overflow-hidden bg-muted border-b">
                    <img
                      src={event.eventImage.url}
                      alt={event.title}
                      className="object-cover w-full h-full hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                ) : (
                  <div className="h-2 bg-primary/20 w-full" />
                )}

                <CardHeader className="space-y-2">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <Badge
                      variant="outline"
                      className={getTypeStyles(event.eventType)}
                    >
                      {getTypeIcon(event.eventType)}
                      {event.eventType || "Other"}
                    </Badge>
                    <div className="flex items-center text-xs text-muted-foreground gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{formatDate(event.eventDate)}</span>
                    </div>
                  </div>
                  <CardTitle className="text-xl font-bold line-clamp-1 leading-snug">
                    {event.title}
                  </CardTitle>
                </CardHeader>

                <CardContent className="pb-4 space-y-3">
                  <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                    {event.description}
                  </p>
                  
                  <div className="flex flex-col gap-1.5 pt-1 text-xs text-muted-foreground border-t border-dashed mt-2">
                    {event.location && (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70" />
                        <span className="truncate">{event.location}</span>
                      </div>
                    )}
                    {(event.startTime || event.endTime) && (
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70" />
                        <span>{event.startTime || "N/A"} - {event.endTime || "N/A"}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </div>

              <CardContent className="pt-0 border-t mt-auto py-3 bg-muted/10">
                <Button
                  className="w-full flex items-center justify-center gap-2"
                  variant="outline"
                  onClick={() => handleView(event)}
                >
                  <Eye className="h-4 w-4" />
                  View Event Details
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="sm:max-w-[550px] overflow-y-auto max-h-[90vh]">
          {viewEvent && (
            <>
              <DialogHeader className="space-y-3 text-left">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge
                    variant="outline"
                    className={getTypeStyles(viewEvent.eventType)}
                  >
                    {getTypeIcon(viewEvent.eventType)}
                    Category: {viewEvent.eventType || "Other"}
                  </Badge>
                  <div className="flex items-center text-xs text-muted-foreground gap-1 ml-auto">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>Event Date: {formatDate(viewEvent.eventDate)}</span>
                  </div>
                </div>
                <DialogTitle className="text-2xl font-bold tracking-tight text-foreground">
                  {viewEvent.title}
                </DialogTitle>
              </DialogHeader>

              {viewEvent.eventImage?.url && (
                <div className="my-2 rounded-lg overflow-hidden border bg-muted max-h-64 flex justify-center">
                  <img
                    src={viewEvent.eventImage.url}
                    alt={viewEvent.title}
                    className="object-contain max-h-64 w-full bg-black/5"
                  />
                </div>
              )}

              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-muted/30 p-3 rounded-lg border text-sm">
                  {viewEvent.location && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4 text-primary shrink-0" />
                      <div>
                        <span className="font-medium text-foreground block text-xs">Location</span>
                        {viewEvent.location}
                      </div>
                    </div>
                  )}
                  {(viewEvent.startTime || viewEvent.endTime) && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4 text-primary shrink-0" />
                      <div>
                        <span className="font-medium text-foreground block text-xs">Timing</span>
                        {viewEvent.startTime || "N/A"} - {viewEvent.endTime || "N/A"}
                      </div>
                    </div>
                  )}
                </div>

                <div className="text-sm leading-relaxed text-slate-600 dark:text-slate-300 whitespace-pre-wrap bg-muted/10 p-4 rounded-lg border">
                  {viewEvent.description}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Events;