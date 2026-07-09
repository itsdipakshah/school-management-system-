import React, { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Bell,
  Calendar,
  ClipboardCheck,
  FileText,
  Settings,
  LogOut,
  ChevronLeft,
  Menu,
  LetterText,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import useAuth from "@/hooks/UseAuth";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
const menuItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "teachers", label: "All Teachers", icon: Users },
  { id: "assigments", label: "Assigments", icon: BookOpen },
  { id: "notices", label: "Notices", icon: Bell },
  { id: "events", label: "Events", icon: Calendar },
  { id: "attendances", label: "Attendances", icon: ClipboardCheck },
  { id: "studentresults", label: "Student Result", icon: FileText },
];

const Sidebar = ({
  activeSection,
  onSectionChange,
  isCollapsed,
  onCollapsedChange,
}) => {
  const [displayName, setDisplayName] = useState("User");
  const [displayEmail, setDisplayEmail] = useState("User");
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login");
    toast.success("User logout successfully");
  };

  useEffect(() => {
    if (user?.name && user?.email) {
      setDisplayName(user.name);
      setDisplayEmail(user.email);
    } else {
      const savedProfile = localStorage.getItem("user_profile");
      if (savedProfile) {
        try {
          const parsed = JSON.parse(savedProfile);
          if (parsed?.name)
            setDisplayName(parsed.name) || setDisplayEmail(parsed.email);
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, [user]);

  const getInitials = (name) => {
    return (
      name
        ?.split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2) || "AD"
    );
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 flex flex-col",
        isCollapsed ? "w-[70px]" : "w-[260px]",
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
        {!isCollapsed && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-semibold text-lg text-sidebar-foreground">
              SchoolManagement
            </span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onCollapsedChange(!isCollapsed)}
          className="text-sidebar-foreground hover:bg-sidebar-accent"
        >
          {isCollapsed ? (
            <Menu className="w-5 h-5" />
          ) : (
            <ChevronLeft className="w-5 h-5" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <Button
                key={item.id}
                variant="ghost"
                onClick={() => onSectionChange(item.id)}
                className={cn(
                  "w-full justify-start gap-3 h-11 px-3",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary hover:text-sidebar-primary-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  isCollapsed && "justify-center px-0",
                )}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {!isCollapsed && <span>{item.label}</span>}
              </Button>
            );
          })}
        </nav>
      </ScrollArea>

      {/* Footer */}
      <div className="p-3 border-t border-sidebar-border">
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start gap-3 h-11 px-3 text-sidebar-foreground hover:bg-sidebar-accent",
            isCollapsed && "justify-center px-0",
          )}
        >
          <Settings className="w-5 h-5 shrink-0" />
          {!isCollapsed && <span>Settings</span>}
        </Button>
        <Separator className="my-2 bg-sidebar-border" />
        <div
          className={cn(
            "flex items-center gap-3 p-2",
            isCollapsed && "justify-center",
          )}
        >
          <Avatar className="h-9 w-9">
            <AvatarImage src="/placeholder-avatar.jpg" alt={displayName} />
            <AvatarFallback className="bg-primary text-primary-foreground text-sm">
              {getInitials(displayName)}
            </AvatarFallback>
          </Avatar>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {displayName}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {displayEmail}
              </p>
            </div>
          )}
          {!isCollapsed && (
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 text-muted-foreground hover:text-sidebar-foreground"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
