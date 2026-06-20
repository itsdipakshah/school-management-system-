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

import {  useNavigate } from "react-router-dom";
import useAuth from "@/hooks/UseAuth";
import { toast } from "sonner";
import DashboardOverview from "./DashboardOverview";
import AllStudents from "./AllStudents";
import Attendances from "./Attendances";
import Results from "./Results";
import Notices from "./Notices";
import Events from "./Events";
import Complains from "./Complains";
import Sidebar from "./Sidebar";

const StudentDashboard = () => {
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

  useEffect(() => {
    setGlobalSearch("");
    try {
      window.dispatchEvent(new CustomEvent("studentSearch", { detail: "" }));
    } catch (err) {
      console.error(err);
    }
  }, [activeSection]);

  const renderContent = () => {
    switch (activeSection) {
      case "dashboard":
        return <DashboardOverview />;
      case "students":
        return <AllStudents />;
      case "attendances":
        return <Attendances />;
      case "results":
        return <Results />;
      case "notices":
        return <Notices />;
      case "events":
        return <Events />;
      case "complains":
        return <Complains />;
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
      case "notices":
        return "Notices";
      case "events":
        return "Events";
        case "complains":
          return "Complains"
      case "attendances":
        return "Attendances";
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
        <Sidebar
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
              <div className="hidden md:block relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search across collections..."
                  className="w-[250px] pl-10 bg-secondary border-0 focus-visible:ring-1 focus-visible:ring-primary"
                  value={globalSearch}
                  onChange={(e) => {
                    const v = e.target.value;
                    setGlobalSearch(v);
                    try {
                      window.dispatchEvent(
                        new CustomEvent("studentSearch", { detail: v }),
                      );
                    } catch (err) {
                      console.error(err);
                    }
                  }}
                />
              </div>

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
                    <span className="font-medium">New Notices here</span>
                    <span className="text-sm text-muted-foreground">
                      Final exam is near
                    </span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex flex-col items-start gap-1 cursor-pointer">
                    <span className="font-medium">Payment have to Pay</span>
                    <span className="text-sm text-muted-foreground">
                      ₹25,000 through you
                    </span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex flex-col items-start gap-1 cursor-pointer">
                    <span className="font-medium">Complaints</span>
                    <span className="text-sm text-muted-foreground">
                      Your complaint is in Pending..
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

export default StudentDashboard;