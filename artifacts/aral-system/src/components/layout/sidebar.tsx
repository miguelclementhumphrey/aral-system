import { useAuth } from "@/lib/auth";
import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Users, 
  School, 
  BookOpen, 
  LogOut, 
  UserCircle,
  BarChart,
  CalendarDays,
  Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function Sidebar() {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  if (!user) return null;

  const links = [];

  if (user.role === "super_admin") {
    links.push({ href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard });
    links.push({ href: "/admin/schools", label: "Schools", icon: School });
  } else if (user.role === "school_head") {
    links.push({ href: "/school-head/dashboard", label: "Dashboard", icon: LayoutDashboard });
    links.push({ href: "/school-head/profile", label: "Profile", icon: UserCircle });
    links.push({ href: "/school-head/grade-levels", label: "Grade Levels", icon: BookOpen });
    links.push({ href: "/school-head/teachers", label: "Teachers", icon: Users });
  } else if (user.role === "teacher") {
    links.push({ href: "/teacher/learners", label: "Learners", icon: Users });
    links.push({ href: "/teacher/profile", label: "Profile", icon: UserCircle });
    links.push({ href: "/teacher/aral-dashboard", label: "ARAL Dashboard", icon: BarChart });
    links.push({ href: "/teacher/attendance", label: "Attendance", icon: CalendarDays });
    links.push({ href: "/teacher/reading-levels", label: "Reading Levels", icon: Activity });
  }

  return (
    <div className="w-64 bg-sidebar border-r border-sidebar-border h-screen flex flex-col fixed left-0 top-0">
      <div className="p-6">
        <h1 className="text-xl font-bold text-sidebar-primary-foreground font-serif tracking-tight">ARAL System</h1>
        <p className="text-xs text-sidebar-foreground/70 mt-1 capitalize">{user.role.replace("_", " ")}</p>
      </div>

      <nav className="flex-1 px-4 space-y-2 mt-4">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = location.startsWith(link.href);
          
          return (
            <Link 
              key={link.href} 
              href={link.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                isActive 
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" 
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50"
              }`}
            >
              <Icon size={18} className={isActive ? "text-sidebar-primary" : "text-sidebar-foreground/70"} />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <div className="mb-4 px-3 flex flex-col">
          <span className="text-sm font-medium text-sidebar-foreground truncate">{user.name}</span>
          {user.schoolName && <span className="text-xs text-sidebar-foreground/70 truncate">{user.schoolName}</span>}
        </div>
        <Button 
          variant="outline" 
          className="w-full justify-start text-sidebar-foreground border-sidebar-border hover:bg-sidebar-accent"
          onClick={() => logout()}
        >
          <LogOut size={16} className="mr-2" />
          Logout
        </Button>
      </div>
    </div>
  );
}
