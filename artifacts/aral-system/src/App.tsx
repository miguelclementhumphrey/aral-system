import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth";
import { AppLayout } from "@/components/layout/app-layout";

// Public Pages
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import SetPassword from "@/pages/login-set-password";

// Admin Pages
import AdminLogin from "@/pages/admin/login";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminSchools from "@/pages/admin/schools";
import AdminSchoolDetail from "@/pages/admin/school-detail";

// School Head Pages
import SchoolHeadDashboard from "@/pages/school-head/dashboard";
import SchoolHeadProfile from "@/pages/school-head/profile";
import SchoolHeadGradeLevels from "@/pages/school-head/grade-levels";
import SchoolHeadTeachers from "@/pages/school-head/teachers";

// Teacher Pages
import TeacherLearners from "@/pages/teacher/learners";
import TeacherProfile from "@/pages/teacher/profile";
import TeacherAralDashboard from "@/pages/teacher/aral-dashboard";
import TeacherAttendance from "@/pages/teacher/attendance";
import TeacherReadingLevels from "@/pages/teacher/reading-levels";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

function ProtectedRoute({
  component: Component,
  allowedRoles,
}: {
  component: React.ComponentType;
  allowedRoles?: string[];
}) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Redirect to="/login" />;

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen text-destructive">
        Unauthorized Access
      </div>
    );
  }

  return (
    <AppLayout>
      <Component />
    </AppLayout>
  );
}

function RoleRedirect() {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  if (!user) return <Redirect to="/login" />;
  if (user.role === "super_admin") return <Redirect to="/admin/dashboard" />;
  if (user.role === "school_head") return <Redirect to="/school-head/dashboard" />;
  if (user.role === "teacher") return <Redirect to="/teacher/learners" />;
  return <Redirect to="/login" />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={RoleRedirect} />
      <Route path="/login" component={Login} />
      <Route path="/login/set-password" component={SetPassword} />
      <Route path="/admin" component={AdminLogin} />

      {/* Admin Routes */}
      <Route
        path="/admin/dashboard"
        component={() => <ProtectedRoute component={AdminDashboard} allowedRoles={["super_admin"]} />}
      />
      <Route
        path="/admin/schools"
        component={() => <ProtectedRoute component={AdminSchools} allowedRoles={["super_admin"]} />}
      />
      <Route
        path="/admin/schools/:id"
        component={() => <ProtectedRoute component={AdminSchoolDetail} allowedRoles={["super_admin"]} />}
      />

      {/* School Head Routes */}
      <Route
        path="/school-head/dashboard"
        component={() => <ProtectedRoute component={SchoolHeadDashboard} allowedRoles={["school_head"]} />}
      />
      <Route
        path="/school-head/profile"
        component={() => <ProtectedRoute component={SchoolHeadProfile} allowedRoles={["school_head"]} />}
      />
      <Route
        path="/school-head/grade-levels"
        component={() => <ProtectedRoute component={SchoolHeadGradeLevels} allowedRoles={["school_head"]} />}
      />
      <Route
        path="/school-head/teachers"
        component={() => <ProtectedRoute component={SchoolHeadTeachers} allowedRoles={["school_head"]} />}
      />

      {/* Teacher Routes */}
      <Route
        path="/teacher/learners"
        component={() => <ProtectedRoute component={TeacherLearners} allowedRoles={["teacher"]} />}
      />
      <Route
        path="/teacher/profile"
        component={() => <ProtectedRoute component={TeacherProfile} allowedRoles={["teacher"]} />}
      />
      <Route
        path="/teacher/aral-dashboard"
        component={() => <ProtectedRoute component={TeacherAralDashboard} allowedRoles={["teacher"]} />}
      />
      <Route
        path="/teacher/attendance"
        component={() => <ProtectedRoute component={TeacherAttendance} allowedRoles={["teacher"]} />}
      />
      <Route
        path="/teacher/reading-levels"
        component={() => <ProtectedRoute component={TeacherReadingLevels} allowedRoles={["teacher"]} />}
      />

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
