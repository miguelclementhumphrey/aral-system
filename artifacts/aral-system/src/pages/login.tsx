import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLogin, useGetSchoolsForLogin } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { School, BookOpen } from "lucide-react";

const loginSchema = z.object({
  schoolId: z.string().min(1, "School is required"),
  role: z.enum(["school_head", "teacher"]),
  credential: z.string().min(1, "Password/PIN is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function Login() {
  const { login } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [selectedRole, setSelectedRole] = useState<"school_head" | "teacher">("school_head");
  
  const { data: schools, isError: schoolsError, isLoading: schoolsLoading } = useGetSchoolsForLogin();
  const loginMutation = useLogin();
  const schoolOptions = Array.isArray(schools) ? schools : [];

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      schoolId: "",
      role: "school_head",
      credential: "",
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    try {
      const response = await loginMutation.mutateAsync({ data });
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
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[30rem] h-[30rem] bg-accent/10 rounded-full blur-3xl pointer-events-none" />
      
      <div className="w-full max-w-md z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary text-primary-foreground mb-4 shadow-lg shadow-primary/20">
            <BookOpen size={32} />
          </div>
          <h1 className="text-3xl font-bold text-foreground font-serif tracking-tight">ARAL System</h1>
          <p className="text-muted-foreground mt-2">Learner Tracking & Profiling Platform</p>
        </div>

        <Card className="border-border/50 shadow-xl">
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
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                        disabled={schoolsLoading}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue
                              placeholder={
                                schoolsLoading
                                  ? "Loading schools..."
                                  : schoolsError
                                    ? "Unable to load schools"
                                    : "Select your school"
                              }
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {schoolOptions.map(school => (
                            <SelectItem 
                              key={school.id} 
                              value={school.id}
                              disabled={selectedRole === "teacher" && !school.hasTeachers}
                            >
                              {school.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="credential"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{selectedRole === "school_head" ? "Password" : "PIN Code"}</FormLabel>
                      <FormControl>
                        <Input 
                          type="password" 
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
            Are you a Super Admin? &nbsp;<a href="/admin" className="text-primary hover:underline font-medium">Admin Login</a>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
