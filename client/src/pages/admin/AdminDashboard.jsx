import SideBar from "@/components/common/SideBar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Bell, Menu, Search } from "lucide-react";
import React, { useState, useEffect } from "react";
import DashboardOverview from "./DashboardOverview";
import StudentsManagement from "./StudentsManagement";
import TeachersManagement from "./TeachersManagement";
import ClassesManagement from "./ClassesManagement";
import SubjectsManagement from "./SubjectsManagement";
import NoticesManagement from "./NoticesManagement";
import FeesManagement from "./FeesManagement";
import EventsManagement from "./EventsManagement";
import AttendanceManagement from "./AttendanceManagement";
import ResultsManagement from "./ResultsManagement";
import { Link, useNavigate } from "react-router-dom";
import useAuth from "@/hooks/UseAuth";
import { toast } from "sonner";

const AdminDashboard = () => {
  const [activeSection, setActiveSection] = useState("dashboard");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState("");
  const [displayName, setDisplayName] = useState("User");
  const navigate = useNavigate();
  const { logout, user } = useAuth();

   const handleLogout = () => {
    logout();
    navigate("/login");
    toast.success("User logout successfully");
  };

  useEffect(() => {
    if (user?.name) {
      setDisplayName(user.name);
    } else {
      const savedProfile = localStorage.getItem("user_profile");
      if (savedProfile) {
        try {
          const parsed = JSON.parse(savedProfile);
          if (parsed?.name) setDisplayName(parsed.name);
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, [user]);

  const renderContent = () => {
    switch (activeSection) {
      case "dashboard":
        return <DashboardOverview />;
      case "students":
        return <StudentsManagement />;
      case "teachers":
        return <TeachersManagement />;
      case "classes":
        return <ClassesManagement />;
      case "subjects":
        return <SubjectsManagement />;
      case "notices":
        return <NoticesManagement />;
      case "fees":
        return <FeesManagement />;
      case "events":
        return <EventsManagement />;
      case "attendance":
        return <AttendanceManagement />;
      case "results":
        return <ResultsManagement />;
      default:
        return <DashboardOverview />;
    }
  };

  const getSectionTitle = () => {
    switch (activeSection) {
      case "dashboard":
        return "Dashboard";
      case "students":
        return "Students";
      case "teachers":
        return "Teachers";
      case "classes":
        return "Classes";
      case "subjects":
        return "Subjects";
      case "notices":
        return "Notices";
      case "fees":
        return "Fees";
      case "events":
        return "Events";
      case "attendance":
        return "Attendance";
      case "results":
        return "Results";
      default:
        return "Dashboard";
    }
  };

 

  const getInitials = (name) => {
    return name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "AD";
  };

  return (
    <div className="min-h-screen bg-background">
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-40 transform lg:transform-none transition-transform duration-300",
          isMobileSidebarOpen
            ? "translate-x-0"
            : "-translate-x-full lg:translate-x-0",
        )}
      >
        <SideBar
          activeSection={activeSection}
          onSectionChange={(section) => {
            setActiveSection(section);
            setIsMobileSidebarOpen(false);
          }}
          isCollapsed={isSidebarCollapsed}
          onCollapsedChange={setIsSidebarCollapsed}
        />
      </div>

      <div
        className={cn(
          "transition-all duration-300",
          isSidebarCollapsed ? "lg:ml-[70px]" : "lg:ml-[260px]",
        )}
      >
        <header className="sticky top-0 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setIsMobileSidebarOpen(true)}
              >
                <Menu className="w-5 h-5" />
              </Button>
              <div className="hidden sm:block">
                <h1 className="text-xl font-semibold text-foreground">
                  {getSectionTitle()}
                </h1>
                <p className="text-sm text-muted-foreground">
                  Welcome back, <span className="font-medium text-foreground">{displayName}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="w-5 h-5" />
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                      3
                    </Badge>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="flex flex-col items-start gap-1 cursor-pointer">
                    <span className="font-medium">New student enrolled</span>
                    <span className="text-sm text-muted-foreground">
                      Rahul Kumar joined Class 10
                    </span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex flex-col items-start gap-1 cursor-pointer">
                    <span className="font-medium">Fee payment received</span>
                    <span className="text-sm text-muted-foreground">
                      ₹25,000 from Priya Patel
                    </span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex flex-col items-start gap-1 cursor-pointer">
                    <span className="font-medium">Leave request</span>
                    <span className="text-sm text-muted-foreground">
                      Mrs. Sunita Rao requested leave
                    </span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-9 w-9 rounded-full border border-border"
                  >
                    <Avatar className="h-9 w-9">
                      <AvatarImage src="/placeholder-avatar.jpg" alt={displayName} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
                        {getInitials(displayName)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none text-foreground">{displayName}</p>
                      <p className="text-xs leading-none text-muted-foreground">Logged in</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer">Profile</DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer">Settings</DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer">Support</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive font-medium cursor-pointer focus:bg-destructive/10 focus:text-destructive" onClick={handleLogout}>
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8">{renderContent()}</main>
      </div>
    </div>
  );
};

export default AdminDashboard;