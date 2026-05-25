import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSetPassword } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { ShieldCheck } from "lucide-react";
import { jwtDecode } from "jwt-decode";

const setPasswordSchema = z.object({
  schoolId: z.string(),
  tempCredential: z.string().min(1, "Temporary password is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters long"),
  confirmPassword: z.string()
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type SetPasswordFormValues = z.infer<typeof setPasswordSchema>;

export default function SetPassword() {
  const { login } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const setPasswordMutation = useSetPassword();
  
  // We need the schoolId which should be in the temp token or passed somehow.
  // Assuming the user comes here after initial login, they might still have a token
  // with a 'requiresPasswordChange' flag, or we extract it.
  // For this simplified flow, we'll try to extract school ID from the current token if it exists.
  const tempToken = localStorage.getItem("aral_token");
  let defaultSchoolId = "";
  let defaultTempCred = "";
  
  try {
    if (tempToken) {
      const decoded: any = jwtDecode(tempToken);
      defaultSchoolId = decoded.schoolId || "";
    }
  } catch (e) {}

  const form = useForm<SetPasswordFormValues>({
    resolver: zodResolver(setPasswordSchema),
    defaultValues: {
      schoolId: defaultSchoolId,
      tempCredential: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: SetPasswordFormValues) => {
    try {
      const response = await setPasswordMutation.mutateAsync({ data });
      login(response);
      
      toast({
        title: "Password updated successfully",
        description: "You can now access the system.",
      });
      
      setLocation("/school-head/profile");
    } catch (error: any) {
      toast({
        title: "Failed to set password",
        description: error.message || "Please check your temporary password.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md z-10">
        <Card className="border-border/50 shadow-xl">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-12 h-12 bg-primary/10 text-primary flex items-center justify-center rounded-full mb-4">
              <ShieldCheck size={24} />
            </div>
            <CardTitle className="text-2xl">Secure Your Account</CardTitle>
            <CardDescription>
              As this is your first time logging in, you must set a new password for your school.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {/* Hidden schoolId field */}
                <input type="hidden" {...form.register("schoolId")} />

                <FormField
                  control={form.control}
                  name="tempCredential"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current / Temporary Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Enter your current password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="At least 8 characters" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm New Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Re-enter new password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  className="w-full mt-6" 
                  size="lg"
                  disabled={setPasswordMutation.isPending || !form.getValues().schoolId}
                >
                  {setPasswordMutation.isPending ? "Updating..." : "Update Password & Continue"}
                </Button>
                
                {!form.getValues().schoolId && (
                  <p className="text-sm text-destructive text-center mt-2">
                    Missing school context. Please return to login.
                  </p>
                )}
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
