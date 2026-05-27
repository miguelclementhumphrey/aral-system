import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLogin, useGetSchoolsForLogin } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { useToast } from "@/hooks/use-toast";
import { School, BookOpen } from "lucide-react";
import { apiUrl } from "@/lib/api-url";

const loginSchema = z.object({
  schoolId: z.string().min(1, "School is required"),
  role: z.enum(["school_head", "teacher"]),
  teacherId: z.string().optional(),
  credential: z.string().min(1, "Password/PIN is required"),
}).refine((data) => data.role !== "teacher" || Boolean(data.teacherId), {
  message: "Teacher is required",
  path: ["teacherId"],
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function Login() {
  const { login } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [selectedRole, setSelectedRole] = useState<"school_head" | "teacher">("school_head");
  const [teacherOptions, setTeacherOptions] = useState<Array<{ id: string; name: string }>>([]);
  const [teachersLoading, setTeachersLoading] = useState(false);
  
  const { data: schools, isError: schoolsError, isLoading: schoolsLoading } = useGetSchoolsForLogin();
  const loginMutation = useLogin();
  const schoolOptions = Array.isArray(schools) ? schools : [];

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      schoolId: "",
      role: "school_head",
      teacherId: "",
      credential: "",
    },
  });
  const selectedSchoolId = form.watch("schoolId");

  useEffect(() => {
    if (selectedRole !== "teacher" || !selectedSchoolId) {
      setTeacherOptions([]);
      form.setValue("teacherId", "");
      return;
    }

    const controller = new AbortController();
    form.setValue("teacherId", "");
    setTeachersLoading(true);

    fetch(apiUrl(`/api/auth/schools/${selectedSchoolId}/teachers`), { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Unable to load teachers");
        return response.json() as Promise<Array<{ id: string; name: string }>>;
      })
      .then((teachers) => setTeacherOptions(Array.isArray(teachers) ? teachers : []))
      .catch((error) => {
        if (error.name !== "AbortError") {
          setTeacherOptions([]);
        }
      })
      .finally(() => setTeachersLoading(false));

    return () => controller.abort();
  }, [form, selectedRole, selectedSchoolId]);

  const onSubmit = async (data: LoginFormValues) => {
    try {
      const response = await loginMutation.mutateAsync({
        data: {
          ...data,
          credential: data.role === "teacher" ? data.credential.trim() : data.credential,
        },
      });
      login(response);
      
      toast({
        title: "Login successful",
        description: "Welcome to the ARAL System.",
      });
      
      if (response.requiresPasswordChange) {
        setLocation("/login/set-password");
        return;
      }

      if (response.user.role === "school_head") {
        setLocation(response.profileComplete ? "/school-head/dashboard" : "/school-head/profile");
      } else if (response.user.role === "teacher") {
        setLocation(response.profileComplete ? "/teacher/learners" : "/teacher/profile");
      }
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message || "Invalid credentials. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/login-background.avif')" }}
      />
      <div className="absolute inset-0 bg-black/55" />

      <div className="relative z-10 grid min-h-screen grid-cols-1 items-center gap-8 p-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,28rem)] lg:p-10">
        <div className="hidden justify-self-start text-left text-white lg:block">
          <div className="inline-flex flex-col items-start">
            <div className="mb-6 flex h-28 w-28 items-center justify-center rounded-3xl bg-white text-primary shadow-2xl">
              <BookOpen size={56} />
            </div>
            <h1 className="font-serif text-6xl font-bold tracking-tight drop-shadow-lg">ARAL System</h1>
            <p className="mt-4 max-w-xl text-xl font-medium text-white/90 drop-shadow">
              Learner Tracking & Profiling Platform
            </p>
          </div>
        </div>

        <div className="w-full max-w-md justify-self-center lg:justify-self-end">
          <div className="mb-8 text-center lg:hidden">
            <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-black/20">
              <BookOpen size={32} />
            </div>
            <h1 className="font-serif text-3xl font-bold tracking-tight text-white">ARAL System</h1>
            <p className="mt-2 text-white/80">Learner Tracking & Profiling Platform</p>
          </div>

        <Card className="border-white/20 bg-background/95 shadow-2xl backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-xl">Welcome back</CardTitle>
            <CardDescription>Sign in to your school account to continue.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <Button 
                type="button"
                variant={selectedRole === "school_head" ? "default" : "outline"}
                className={selectedRole === "school_head" ? "shadow-md" : ""}
                onClick={() => {
                  setSelectedRole("school_head");
                  form.setValue("role", "school_head");
                  form.setValue("teacherId", "");
                }}
              >
                <School size={16} className="mr-2" />
                School Head
              </Button>
              <Button 
                type="button"
                variant={selectedRole === "teacher" ? "default" : "outline"}
                className={selectedRole === "teacher" ? "shadow-md" : ""}
                onClick={() => {
                  setSelectedRole("teacher");
                  form.setValue("role", "teacher");
                }}
              >
                <BookOpen size={16} className="mr-2" />
                Teacher
              </Button>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="schoolId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>School</FormLabel>
                      <FormControl>
                        <SearchableSelect
                          value={field.value}
                          onValueChange={field.onChange}
                          disabled={schoolsLoading}
                          placeholder={
                            schoolsLoading
                              ? "Loading schools..."
                              : schoolsError
                                ? "Unable to load schools"
                                : "Select your school"
                          }
                          searchPlaceholder="Search schools..."
                          options={schoolOptions.map((school) => ({
                            value: school.id,
                            label: school.name,
                          }))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {selectedRole === "teacher" && (
                  <FormField
                    control={form.control}
                    name="teacherId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Teacher</FormLabel>
                        <FormControl>
                          <SearchableSelect
                            value={field.value}
                            onValueChange={field.onChange}
                            disabled={!selectedSchoolId || teachersLoading}
                            placeholder={
                              !selectedSchoolId
                                ? "Select school first"
                                : teachersLoading
                                  ? "Loading teachers..."
                                  : "Select teacher"
                            }
                            searchPlaceholder="Search teachers..."
                            options={teacherOptions.map((teacher) => ({
                              value: teacher.id,
                              label: teacher.name,
                            }))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="credential"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{selectedRole === "school_head" ? "Password" : "PIN Code"}</FormLabel>
                      <FormControl>
                        <PasswordInput 
                          placeholder={selectedRole === "school_head" ? "Enter your password" : "Enter your PIN"} 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  className="w-full mt-2" 
                  size="lg"
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? "Signing in..." : "Sign in"}
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex justify-center text-sm text-muted-foreground">
            Are you a Super Admin?&nbsp;
            <button
              type="button"
              onClick={() => setLocation("/admin")}
              className="font-medium text-primary hover:underline"
            >
              Admin Login
            </button>
          </CardFooter>
        </Card>
      </div>
      </div>
    </div>
  );
}
