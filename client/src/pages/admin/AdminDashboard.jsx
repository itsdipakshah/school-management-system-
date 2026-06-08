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
import React, { useState } from "react";
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
  const [globalSearch, setGlobalSearch] = useState("")

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

  
    const navigate = useNavigate();
    const { logout } = useAuth();

    const handleLogout = () => {
      logout();
      navigate("/login");
      toast.success("User logout successfully");
    };


  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Hidden on mobile, shown when toggled */}
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

      {/* Main Content */}
      <div
        className={cn(
          "transition-all duration-300",
          isSidebarCollapsed ? "lg:ml-[70px]" : "lg:ml-[260px]",
        )}
      >
        {/* Header */}
        <header className="sticky top-0 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6">
            <div className="flex items-center gap-4">
              {/* Mobile menu button */}
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
                  Welcome back, Admin
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="hidden md:block relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  className="w-[250px] pl-10 bg-secondary border-0"
                  value={globalSearch}
                  onChange={(e) => {
                    const v = e.target.value
                    setGlobalSearch(v)
                    try { window.dispatchEvent(new CustomEvent('adminSearch', { detail: v })) } catch (err) {}
                  }}
                />
              </div>

              {/* Notifications */}
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

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-9 w-9 rounded-full"
                  >
                    <Avatar className="h-9 w-9">
                      <AvatarImage src="/placeholder-avatar.jpg" />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        AD
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>Profile</DropdownMenuItem>
                  <DropdownMenuItem>Settings</DropdownMenuItem>
                  <DropdownMenuItem>Support</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive" asChild>
                    <div
                      onClick={handleLogout}>
                     
                        <Link to="/login">Logout</Link>
                      
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 sm:p-6 lg:p-8">{renderContent()}</main>
      </div>
    </div>
  );
};

export default AdminDashboard;
