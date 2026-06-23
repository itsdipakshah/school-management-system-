import React, { useCallback, useEffect, useMemo, useState } from "react";
import useApi from "@/hooks/UseApi";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Eye, Calendar, Search, Megaphone } from "lucide-react";

const Notices = () => {
  const { get } = useApi();
  const [notices, setNotices] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAudience, setFilterAudience] = useState("show-all");
  const [viewNotice, setViewNotice] = useState(null);
  const [isViewOpen, setIsViewOpen] = useState(false);

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

  const filteredNotices = useMemo(() => {
    const lowerSearch = searchTerm.toLowerCase().trim();

    return notices.filter((notice) => {
      const targetAudience = notice.audience?.toLowerCase();

      const isAccessible =
        targetAudience === "all" || targetAudience === "teacher";
      if (!isAccessible) return false;

      if (filterAudience !== "show-all" && targetAudience !== filterAudience) {
        return false;
      }

      const matchesSearch =
        !lowerSearch ||
        notice.title?.toLowerCase().includes(lowerSearch) ||
        notice.description?.toLowerCase().includes(lowerSearch);

      return matchesSearch;
    });
  }, [notices, searchTerm, filterAudience]);

  const handleView = (notice) => {
    setViewNotice(notice);
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

  const getAudienceStyles = (audience) => {
    switch (audience?.toLowerCase()) {
      case "all":
        return "bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/10";
      case "teacher":
        return "bg-indigo-500/10 text-indigo-600 border-indigo-500/20 hover:bg-indigo-500/10";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="pl-16 pr-4 py-6">
      <div className="mb-6 flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Notice Board</h2>
          <p className="text-muted-foreground">
            Stay updated with the latest circulars and announcements.
          </p>
        </div>
        <div className="text-sm font-medium bg-muted px-3 py-1.5 rounded-md self-start sm:self-center">
          Showing {filteredNotices.length} Notices
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6 w-full">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search notices by keyword..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 w-full"
          />
        </div>

        <Select value={filterAudience} onValueChange={setFilterAudience}>
          <SelectTrigger className="w-full sm:w-[180px] shrink-0">
            <SelectValue placeholder="Audience Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="show-all">All Audiences</SelectItem>
            <SelectItem value="all">Public Notices</SelectItem>
            <SelectItem value="teacher">Teacher Only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredNotices.length === 0 ? (
          <div className="col-span-full text-center py-12 border rounded-xl bg-muted/20 text-muted-foreground">
            <Megaphone className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p>No announcements found matching your criteria.</p>
          </div>
        ) : (
          filteredNotices.map((notice) => (
            <Card
              key={notice._id}
              className="flex flex-col justify-between shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
            >
              <div>
                {notice.noticeImage?.url ? (
                  <div className="h-40 w-full relative overflow-hidden bg-muted border-b">
                    <img
                      src={notice.noticeImage.url}
                      alt={notice.title}
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
                      className={getAudienceStyles(notice.audience)}
                    >
                      {notice.audience?.toLowerCase() === "all"
                        ? "Public Notice"
                        : "Teacher Only"}
                    </Badge>
                    <div className="flex items-center text-xs text-muted-foreground gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{formatDate(notice.date)}</span>
                    </div>
                  </div>
                  <CardTitle className="text-xl font-bold line-clamp-1 leading-snug">
                    {notice.title}
                  </CardTitle>
                </CardHeader>

                <CardContent className="pb-4">
                  <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                    {notice.description}
                  </p>
                </CardContent>
              </div>

              <CardContent className="pt-0 border-t mt-auto py-3 bg-muted/10">
                <Button
                  className="w-full flex items-center justify-center gap-2"
                  variant="outline"
                  onClick={() => handleView(notice)}
                >
                  <Eye className="h-4 w-4" />
                  Read Full Notice
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="sm:max-w-[550px] overflow-y-auto max-h-[90vh]">
          {viewNotice && (
            <>
              <DialogHeader className="space-y-3 text-left">
                <div className="flex items-center gap-3">
                  <Badge
                    variant="outline"
                    className={getAudienceStyles(viewNotice.audience)}
                  >
                    Target:{" "}
                    {viewNotice.audience?.toLowerCase() === "all"
                      ? "Everyone"
                      : "Teachers Only"}
                  </Badge>
                  <div className="flex items-center text-xs text-muted-foreground gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>Published: {formatDate(viewNotice.date)}</span>
                  </div>
                </div>
                <DialogTitle className="text-2xl font-bold tracking-tight text-foreground">
                  {viewNotice.title}
                </DialogTitle>
              </DialogHeader>
              {viewNotice.noticeImage?.url && (
                <div className="my-2 rounded-lg overflow-hidden border bg-muted max-h-64 flex justify-center">
                  <img
                    src={viewNotice.noticeImage.url}
                    alt={viewNotice.title}
                    className="object-contain max-h-64 w-full bg-black/5"
                  />
                </div>
              )}
              <div className="space-y-4 pt-2">
                <div className="text-sm leading-relaxed text-slate-600 dark:text-slate-300 whitespace-pre-wrap bg-muted/40 p-4 rounded-lg border">
                  {viewNotice.description}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Notices;
