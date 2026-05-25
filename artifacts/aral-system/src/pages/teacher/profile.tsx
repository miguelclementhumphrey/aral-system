import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  useGetTeacherProfile,
  useSaveTeacherProfile,
  getGetTeacherProfileQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

const profileSchema = z.object({
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

export default function TeacherProfile() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isInitialLoad = useRef(true);

  const { data: profile, isLoading } = useGetTeacherProfile();
  const saveProfile = useSaveTeacherProfile();

  const form = useForm<any>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      designation: "",
      position: "",
      contactNumber: "",
      email: "",
      district: "",
      division: "",
      schoolYear: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
      highestEducationalAttainment: "",
      yearsInService: "",
      fieldOfSpecialization: "",
    },
  });

  useEffect(() => {
    if (profile && isInitialLoad.current) {
      form.reset({
        designation: (profile as any).designation || "",
        position: (profile as any).position || "",
        contactNumber: (profile as any).contactNumber || "",
        email: (profile as any).email || "",
        district: (profile as any).district || "",
        division: (profile as any).division || "",
        schoolYear: (profile as any).schoolYear || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
        highestEducationalAttainment: (profile as any).highestEducationalAttainment || "",
        yearsInService: (profile as any).yearsInService || "",
        fieldOfSpecialization: (profile as any).fieldOfSpecialization || "",
      });
      isInitialLoad.current = false;
    }
  }, [profile, form]);

  const onSubmit = async (data: any) => {
    try {
      await saveProfile.mutateAsync({ data });
      queryClient.invalidateQueries({ queryKey: getGetTeacherProfileQueryKey() });
      toast({ title: "Profile saved", description: "Your profile has been updated successfully." });
    } catch (e: any) {
      toast({ title: "Failed to save", description: e.message, variant: "destructive" });
    }
  };

  if (isLoading) return <div className="p-8">Loading profile...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground font-serif tracking-tight">Teacher Profile</h1>
        <p className="text-muted-foreground mt-1">Update your professional information for DepEd records.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Professional Information</CardTitle>
          <CardDescription>Required for official DepEd documentation.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem><FormLabel>Email Address</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="contactNumber" render={({ field }) => (
                  <FormItem><FormLabel>Contact Number</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>

              <Separator />
              <h3 className="text-lg font-medium">Professional Details</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="designation" render={({ field }) => (
                  <FormItem><FormLabel>Designation</FormLabel><FormControl><Input {...field} placeholder="e.g. Teacher I" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="position" render={({ field }) => (
                  <FormItem><FormLabel>Position</FormLabel><FormControl><Input {...field} placeholder="e.g. Classroom Teacher" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="highestEducationalAttainment" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Highest Educational Attainment</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
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
                  <FormItem><FormLabel>Field of Specialization</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="yearsInService" render={({ field }) => (
                  <FormItem><FormLabel>Years in Service</FormLabel><FormControl><Input type="number" min="0" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="schoolYear" render={({ field }) => (
                  <FormItem><FormLabel>Current School Year</FormLabel><FormControl><Input {...field} placeholder="YYYY-YYYY" /></FormControl><FormMessage /></FormItem>
                )} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="division" render={({ field }) => (
                  <FormItem><FormLabel>Division</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="district" render={({ field }) => (
                  <FormItem><FormLabel>District</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
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
