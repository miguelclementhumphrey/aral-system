import { useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  useGetSchoolHeadProfile, 
  useSaveSchoolHeadProfile,
  getGetSchoolHeadProfileQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

const profileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  middleName: z.string().optional(),
  lastName: z.string().min(1, "Last name is required"),
  designation: z.string().min(1, "Designation is required"),
  position: z.string().min(1, "Position is required"),
  contactNumber: z.string().min(1, "Contact number is required"),
  email: z.string().email("Invalid email address"),
  district: z.string().min(1, "District is required"),
  division: z.string().min(1, "Division is required"),
  schoolYear: z.string().min(1, "School year is required"),
  highestEducationalAttainment: z.string().min(1, "Educational attainment is required"),
  yearsInService: z.string().min(1, "Years in service is required"),
  fieldOfSpecialization: z.string().min(1, "Field of specialization is required"),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function SchoolHeadProfile() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { isProfileComplete } = useAuth();
  const isInitialLoad = useRef(true);

  const { data: profile, isLoading } = useGetSchoolHeadProfile();
  const saveProfile = useSaveSchoolHeadProfile();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: "",
      middleName: "",
      lastName: "",
      designation: "",
      position: "",
      contactNumber: "",
      email: "",
      district: "",
      division: "",
      schoolYear: new Date().getFullYear().toString() + "-" + (new Date().getFullYear() + 1).toString(),
      highestEducationalAttainment: "",
      yearsInService: "",
      fieldOfSpecialization: "",
    },
  });

  useEffect(() => {
    if (profile && isInitialLoad.current) {
      form.reset({
        firstName: profile.firstName || "",
        middleName: profile.middleName || "",
        lastName: profile.lastName || "",
        designation: profile.designation || "",
        position: profile.position || "",
        contactNumber: profile.contactNumber || "",
        email: profile.email || "",
        district: profile.district || "",
        division: profile.division || "",
        schoolYear: profile.schoolYear || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
        highestEducationalAttainment: profile.highestEducationalAttainment || "",
        yearsInService: profile.yearsInService || "",
        fieldOfSpecialization: profile.fieldOfSpecialization || "",
      });
      isInitialLoad.current = false;
    }
  }, [profile, form]);

  const onSubmit = async (data: ProfileFormValues) => {
    try {
      await saveProfile.mutateAsync({ data });
      queryClient.invalidateQueries({ queryKey: getGetSchoolHeadProfileQueryKey() });
      toast({
        title: "Profile saved",
        description: "Your profile information has been updated successfully.",
      });
      
      // If it was incomplete, redirect to dashboard as they are now unlocked
      if (!isProfileComplete) {
        // Need to force reload the auth state to get new profileComplete flag,
        // but for now we just redirect.
        window.location.href = "/school-head/dashboard";
      }
    } catch (e: any) {
      toast({ title: "Failed to save", description: e.message, variant: "destructive" });
    }
  };

  if (isLoading) return <div className="p-8">Loading profile...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground font-serif tracking-tight">School Head Profile</h1>
        <p className="text-muted-foreground mt-1">
          {!isProfileComplete 
            ? "You must complete your profile information before accessing the rest of the system."
            : "Update your personal and professional information."}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>Required details for official DepEd records.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField control={form.control} name="firstName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="middleName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Middle Name</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="lastName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl><Input type="email" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="contactNumber" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Number</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <Separator />
              <h3 className="text-lg font-medium">Professional Details</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="designation" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Designation</FormLabel>
                    <FormControl><Input {...field} placeholder="e.g. Principal I" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="position" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Position</FormLabel>
                    <FormControl><Input {...field} placeholder="e.g. School Head" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="highestEducationalAttainment" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Highest Educational Attainment</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select educational attainment" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="bachelors">Bachelor's Degree</SelectItem>
                        <SelectItem value="masters_units">Master's Units</SelectItem>
                        <SelectItem value="masters">Master's Degree</SelectItem>
                        <SelectItem value="doctoral_units">Doctoral Units</SelectItem>
                        <SelectItem value="doctoral">Doctoral Degree</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="fieldOfSpecialization" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Field of Specialization</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="yearsInService" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Years in Service</FormLabel>
                    <FormControl><Input type="number" min="0" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="schoolYear" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current School Year</FormLabel>
                    <FormControl><Input {...field} placeholder="YYYY-YYYY" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="division" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Division</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="district" render={({ field }) => (
                  <FormItem>
                    <FormLabel>District</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="flex justify-end pt-4">
                <Button type="submit" size="lg" disabled={saveProfile.isPending}>
                  {saveProfile.isPending ? "Saving..." : "Save Profile"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
