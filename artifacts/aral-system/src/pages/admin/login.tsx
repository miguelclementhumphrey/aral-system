import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAdminLogin } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { ShieldAlert } from "lucide-react";

const adminLoginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

type AdminLoginFormValues = z.infer<typeof adminLoginSchema>;

export default function AdminLogin() {
  const { login } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const loginMutation = useAdminLogin();

  const form = useForm<AdminLoginFormValues>({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = async (data: AdminLoginFormValues) => {
    try {
      const response = await loginMutation.mutateAsync({ data });
      login(response);
      
      toast({
        title: "Admin login successful",
        description: "Welcome to the ARAL System Administration.",
      });
      
      setLocation("/admin/dashboard");
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message || "Invalid credentials. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-sidebar p-4 relative overflow-hidden">
      
      <div className="w-full max-w-md z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary text-primary-foreground mb-4 shadow-lg shadow-primary/20">
            <ShieldAlert size={32} />
          </div>
          <h1 className="text-3xl font-bold text-sidebar-foreground font-serif tracking-tight">System Admin</h1>
          <p className="text-sidebar-foreground/70 mt-2">ARAL Platform Administration</p>
        </div>

        <Card className="border-sidebar-border bg-sidebar shadow-2xl text-sidebar-foreground">
          <CardHeader>
            <CardTitle className="text-xl">Admin Access</CardTitle>
            <CardDescription className="text-sidebar-foreground/70">Enter your credentials to manage schools.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sidebar-foreground">Username</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter admin username" 
                          {...field} 
                          className="bg-sidebar-accent border-sidebar-border text-sidebar-foreground placeholder:text-sidebar-foreground/50"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sidebar-foreground">Password</FormLabel>
                      <FormControl>
                        <Input 
                          type="password" 
                          placeholder="Enter admin password" 
                          {...field} 
                          className="bg-sidebar-accent border-sidebar-border text-sidebar-foreground placeholder:text-sidebar-foreground/50"
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
                  {loginMutation.isPending ? "Authenticating..." : "Login to Admin"}
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex justify-center text-sm text-sidebar-foreground/70 border-t border-sidebar-border pt-4 mt-2">
            <a href="/login" className="text-primary hover:underline font-medium">Return to School Login</a>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
