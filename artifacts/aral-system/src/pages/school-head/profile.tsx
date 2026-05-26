import { useEffect, useRef, useState } from "react";
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import {
  designationOptions,
  educationalAttainmentOptions,
  englishTrainingOptions,
  normalizeDesignationValue,
  normalizeYesNoValue,
  readingTrainingOptions,
  schoolHeadPositionOptions,
  specializationOptions,
  trainingLevelOptions,
  yearsInServiceOptions,
  yesNoOptions,
} from "@/lib/profile-options";

const profileSchema = z.object({
  name: z.string().optional(),
  designation: z.string().min(1, "Designation is required"),
  designationOther: z.string().optional(),
  position: z.string().min(1, "Position is required"),
  contactNumber: z.string().min(1, "Contact number is required"),
  email: z.string().email("Invalid email address"),
  highestEducationalAttainment: z.string().min(1, "Educational attainment is required"),
  yearsInService: z.string().min(1, "Years in service is required"),
  fieldOfSpecialization: z.string().min(1, "Field of specialization is required"),
  fieldOfSpecializationOther: z.string().optional(),
  literacyTrainingAttended: z.string().min(1, "Select yes or no"),
  readingTrainingsAttended: z.array(z.string()).default([]),
  englishTrainingAttended: z.string().min(1, "Select yes or no"),
  englishTrainingsAttended: z.array(z.string()).default([]),
  highestTrainingLevel: z.string().min(1, "Training level is required"),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const uniqueStrings = (...groups: string[][]) => {
  return Array.from(new Set(groups.flatMap((group) => group.map((item) => item.trim()).filter(Boolean))));
};

const valuesFromProfile = (profile: any): ProfileFormValues => {
  const legacyName = [profile.firstName, profile.middleName, profile.lastName].filter(Boolean).join(" ");
  return {
    name: profile.name || legacyName,
    designation: normalizeDesignationValue(profile.designation),
    designationOther: profile.designationOther || "",
    position: profile.position || "",
    contactNumber: profile.contactNumber || "",
    email: profile.email || "",
    highestEducationalAttainment: profile.highestEducationalAttainment || "",
    yearsInService: profile.yearsInService || "",
    fieldOfSpecialization: profile.fieldOfSpecialization || "",
    fieldOfSpecializationOther: profile.fieldOfSpecializationOther || "",
    literacyTrainingAttended: normalizeYesNoValue(profile.literacyTrainingAttended),
    readingTrainingsAttended: profile.readingTrainingsAttended || [],
    englishTrainingAttended: normalizeYesNoValue(profile.englishTrainingAttended),
    englishTrainingsAttended: profile.englishTrainingsAttended || [],
    highestTrainingLevel: profile.highestTrainingLevel || "",
  };
};

const valuesToPayload = (data: ProfileFormValues) => {
  const name = data.name?.trim() || "";

  return {
    ...data,
    name,
    trainingsAttended: uniqueStrings(data.readingTrainingsAttended, data.englishTrainingsAttended),
  };
};

export default function SchoolHeadProfile() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { isProfileComplete } = useAuth();
  const isInitialLoad = useRef(true);
  const [isEditing, setIsEditing] = useState(false);

  const { data: profile, isLoading } = useGetSchoolHeadProfile();
  const saveProfile = useSaveSchoolHeadProfile();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      designation: "",
      designationOther: "",
      position: "",
      contactNumber: "",
      email: "",
      highestEducationalAttainment: "",
      yearsInService: "",
      fieldOfSpecialization: "",
      fieldOfSpecializationOther: "",
      literacyTrainingAttended: "",
      readingTrainingsAttended: [],
      englishTrainingAttended: "",
      englishTrainingsAttended: [],
      highestTrainingLevel: "",
    },
  });
  const selectedDesignation = form.watch("designation");
  const selectedSpecialization = form.watch("fieldOfSpecialization");
  const isLocked = Boolean(profile?.isComplete) && !isEditing;
  const isControlDisabled = isLocked || saveProfile.isPending;

  useEffect(() => {
    if (profile && isInitialLoad.current) {
      form.reset(valuesFromProfile(profile));
      setIsEditing(false);
      isInitialLoad.current = false;
    }
  }, [profile, form]);

  const onSubmit = async (data: ProfileFormValues) => {
    try {
      const savedProfile = await saveProfile.mutateAsync({ data: valuesToPayload(data) });
      form.reset(valuesFromProfile(savedProfile));
      queryClient.setQueryData(getGetSchoolHeadProfileQueryKey(), savedProfile);
      queryClient.invalidateQueries({ queryKey: getGetSchoolHeadProfileQueryKey() });
      setIsEditing(false);
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

  const handleCancel = () => {
    if (profile) {
      form.reset(valuesFromProfile(profile));
    }
    setIsEditing(false);
  };

  const toggleArrayValue = (name: "readingTrainingsAttended" | "englishTrainingsAttended", value: string) => {
    const current = form.getValues(name) || [];
    form.setValue(
      name,
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value],
      { shouldValidate: true },
    );
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
              <fieldset disabled={isControlDisabled} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name (Optional)</FormLabel>
                      <FormControl><Input {...field} placeholder="Optional" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
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
                    <FormControl>
                      <SearchableSelect
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder="Select designation"
                        searchPlaceholder="Search designation..."
                        options={designationOptions}
                        disabled={isControlDisabled}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                {selectedDesignation === "Others" && (
                  <FormField control={form.control} name="designationOther" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Other Designation</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                )}
                <FormField control={form.control} name="position" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Position (School Head)</FormLabel>
                    <FormControl>
                      <SearchableSelect
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder="Select position"
                        searchPlaceholder="Search position..."
                        options={schoolHeadPositionOptions}
                        disabled={isControlDisabled}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="highestEducationalAttainment" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Highest Educational Attainment</FormLabel>
                    <FormControl>
                      <SearchableSelect
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder="Select educational attainment"
                        searchPlaceholder="Search attainment..."
                        options={educationalAttainmentOptions}
                        disabled={isControlDisabled}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="fieldOfSpecialization" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Field of Specialization</FormLabel>
                    <FormControl>
                      <SearchableSelect
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder="Select specialization"
                        searchPlaceholder="Search specialization..."
                        options={specializationOptions}
                        disabled={isControlDisabled}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                {selectedSpecialization === "Others" && (
                  <FormField control={form.control} name="fieldOfSpecializationOther" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Other Specialization</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                )}
                <FormField control={form.control} name="yearsInService" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Years in Service</FormLabel>
                    <FormControl>
                      <SearchableSelect
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder="Select years in service"
                        searchPlaceholder="Search years..."
                        options={yearsInServiceOptions}
                        disabled={isControlDisabled}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <Separator />
              <h3 className="text-lg font-medium">Training and Professional Development</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="literacyTrainingAttended" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Trainings related to literacy/reading instruction</FormLabel>
                    <FormControl>
                      <SearchableSelect
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder="Select yes or no"
                        options={yesNoOptions}
                        disabled={isControlDisabled}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="englishTrainingAttended" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Trainings related to English curriculum instruction</FormLabel>
                    <FormControl>
                      <SearchableSelect
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder="Select yes or no"
                        options={yesNoOptions}
                        disabled={isControlDisabled}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField control={form.control} name="readingTrainingsAttended" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Recent trainings in Reading (last 5 years)</FormLabel>
                    <div className="space-y-2 rounded-md border p-3">
                      {readingTrainingOptions.map((option) => (
                        <label key={option} className="flex items-center gap-2 text-sm">
                          <Checkbox
                            checked={(field.value || []).includes(option)}
                            onCheckedChange={() => toggleArrayValue("readingTrainingsAttended", option)}
                            disabled={isControlDisabled}
                          />
                          {option}
                        </label>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="englishTrainingsAttended" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Recent trainings in English Curriculum (last 5 years)</FormLabel>
                    <div className="space-y-2 rounded-md border p-3">
                      {englishTrainingOptions.map((option) => (
                        <label key={option} className="flex items-center gap-2 text-sm">
                          <Checkbox
                            checked={(field.value || []).includes(option)}
                            onCheckedChange={() => toggleArrayValue("englishTrainingsAttended", option)}
                            disabled={isControlDisabled}
                          />
                          {option}
                        </label>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <FormField control={form.control} name="highestTrainingLevel" render={({ field }) => (
                <FormItem>
                  <FormLabel>Highest level of trainings attended (last 5 years)</FormLabel>
                  <FormControl>
                    <SearchableSelect
                      value={field.value}
                      onValueChange={field.onChange}
                      placeholder="Select training level"
                      searchPlaceholder="Search level..."
                      options={trainingLevelOptions}
                      disabled={isControlDisabled}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              </fieldset>

              <div className="flex justify-end gap-2 pt-4">
                {isLocked ? (
                  <Button type="button" size="lg" onClick={() => setIsEditing(true)}>
                    Edit Profile
                  </Button>
                ) : (
                  <>
                    {profile?.isComplete && (
                      <Button type="button" variant="outline" size="lg" onClick={handleCancel} disabled={saveProfile.isPending}>
                        Cancel
                      </Button>
                    )}
                    <Button type="submit" size="lg" disabled={saveProfile.isPending}>
                      {saveProfile.isPending ? "Saving..." : "Save Profile"}
                    </Button>
                  </>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
