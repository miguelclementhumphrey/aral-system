import { useState } from "react";
import { useGetTeachers, useCreateTeacher, useGetGradeLevels, getGetTeachersQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";

import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { 
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger 
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Eye, EyeOff, MoreHorizontal, Plus, Search, Trash2, UserCircle } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { apiUrl } from "@/lib/api-url";

const createTeacherSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  middleName: z.string().optional(),
  lastName: z.string().min(1, "Last name is required"),
  gradeLevelId: z.string().min(1, "Grade level is required"),
  pin: z.string().regex(/^\d{4,12}$/, "PIN must be 4 to 12 digits"),
});

type CreateTeacherFormValues = z.infer<typeof createTeacherSchema>;
type TeacherRow = {
  id: string;
  firstName: string;
  middleName?: string | null;
  lastName: string;
  gradeLevelName: string;
  profileComplete: boolean;
  pin?: string | null;
  learnersCount: number;
};

type TeacherProfileDetails = {
  name?: string | null;
  designation: string;
  designationOther?: string | null;
  position: string;
  email: string;
  yearsInService: string;
  highestEducationalAttainment: string;
  fieldOfSpecialization: string;
  fieldOfSpecializationOther?: string | null;
  currentGradeLevel: string;
  contactNumber: string;
  mostSubjectHandled: string;
  literacyTrainingAttended?: string | null;
  readingTrainingsAttended: string[];
  englishTrainingAttended?: string | null;
  englishTrainingsAttended: string[];
  highestTrainingLevel?: string | null;
};

export default function SchoolHeadTeachers() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [visiblePinIds, setVisiblePinIds] = useState<string[]>([]);
  const [teacherToDelete, setTeacherToDelete] = useState<TeacherRow | null>(null);
  const [selectedTeacher, setSelectedTeacher] = useState<TeacherRow | null>(null);
  const [selectedTeacherProfile, setSelectedTeacherProfile] = useState<TeacherProfileDetails | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isProfileComplete } = useAuth();

  const { data: teachers, isLoading: teachersLoading } = useGetTeachers();
  const { data: gradeLevels, isLoading: gradeLevelsLoading } = useGetGradeLevels();
  const createTeacher = useCreateTeacher();

  const form = useForm<CreateTeacherFormValues>({
    resolver: zodResolver(createTeacherSchema),
    defaultValues: {
      firstName: "",
      middleName: "",
      lastName: "",
      gradeLevelId: "",
      pin: "",
    },
  });

  const filteredTeachers = teachers?.filter(teacher => {
    const fullName = `${teacher.firstName} ${teacher.lastName}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase()) || 
           teacher.gradeLevelName.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const hasGradeLevels = gradeLevels && gradeLevels.length > 0;
  const isAddDisabled = !isProfileComplete || !hasGradeLevels;

  const onSubmit = async (data: CreateTeacherFormValues) => {
    try {
      await createTeacher.mutateAsync({
        data: {
          ...data,
          pin: data.pin.trim(),
        },
      });
      queryClient.invalidateQueries({ queryKey: getGetTeachersQueryKey() });
      toast({
        title: "Teacher Added",
        description: `${data.firstName} ${data.lastName} added successfully.`,
        duration: 10000, // Show longer so they can see the PIN
      });
      setIsDialogOpen(false);
      form.reset();
    } catch (e: any) {
      toast({ title: "Failed to add teacher", description: e.message, variant: "destructive" });
    }
  };

  const togglePinVisibility = (teacherId: string) => {
    setVisiblePinIds((ids) =>
      ids.includes(teacherId) ? ids.filter((id) => id !== teacherId) : [...ids, teacherId],
    );
  };

  const openTeacherProfile = async (teacher: TeacherRow) => {
    if (!teacher.profileComplete) return;

    try {
      setSelectedTeacher(teacher);
      setSelectedTeacherProfile(null);
      setIsProfileOpen(true);
      setIsProfileLoading(true);

      const response = await fetch(apiUrl(`/api/teachers/${teacher.id}/profile`), {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem("aral_token") ?? ""}`,
        },
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(body.error || "Failed to load teacher profile");
      }

      setSelectedTeacherProfile(body);
    } catch (e: any) {
      toast({ title: "Profile unavailable", description: e.message, variant: "destructive" });
      setIsProfileOpen(false);
    } finally {
      setIsProfileLoading(false);
    }
  };

  const handleDeleteTeacher = async () => {
    if (!teacherToDelete) return;

    try {
      setIsDeleting(true);
      const response = await fetch(apiUrl(`/api/teachers/${teacherToDelete.id}`), {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem("aral_token") ?? ""}`,
        },
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(body.error || "Failed to delete teacher");
      }

      queryClient.invalidateQueries({ queryKey: getGetTeachersQueryKey() });
      setVisiblePinIds((ids) => ids.filter((id) => id !== teacherToDelete.id));
      toast({
        title: "Teacher deleted",
        description: `${teacherToDelete.firstName} ${teacherToDelete.lastName} was removed.`,
      });
      setTeacherToDelete(null);
    } catch (e: any) {
      toast({ title: "Delete failed", description: e.message, variant: "destructive" });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-foreground font-serif tracking-tight">Teachers Management</h1>
          <p className="text-muted-foreground mt-1">Manage teachers and their grade level assignments.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <Button 
                  onClick={() => setIsDialogOpen(true)}
                  disabled={isAddDisabled}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Teacher
                </Button>
              </div>
            </TooltipTrigger>
            {isAddDisabled && (
              <TooltipContent>
                {!isProfileComplete 
                  ? "Complete your profile first" 
                  : "Create at least one Grade Level first"}
              </TooltipContent>
            )}
          </Tooltip>

          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Teacher</DialogTitle>
              <DialogDescription>
                Register a new teacher and set their login PIN.
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="firstName" render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
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
                
                <FormField control={form.control} name="middleName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Middle Name (Optional)</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="gradeLevelId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Grade Level Assignment</FormLabel>
                    <FormControl>
                      <SearchableSelect
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={gradeLevelsLoading}
                        placeholder={gradeLevelsLoading ? "Loading grade levels..." : "Select Grade Level"}
                        searchPlaceholder="Search grade levels..."
                        options={(gradeLevels ?? []).map((gl) => ({
                          value: gl.id,
                          label: gl.name,
                        }))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="pin" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teacher Login PIN</FormLabel>
                    <FormControl>
                      <PasswordInput
                        inputMode="numeric"
                        placeholder="Enter 4 to 12 digits"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                
                <div className="flex justify-end pt-4">
                  <Button type="button" variant="outline" className="mr-2" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createTeacher.isPending}>
                    {createTeacher.isPending ? "Adding..." : "Add Teacher"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center space-x-2 bg-card border rounded-md px-3 py-2 max-w-sm">
        <Search className="w-4 h-4 text-muted-foreground" />
        <Input 
          placeholder="Search teachers..." 
          className="border-0 focus-visible:ring-0 p-0 h-8"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="bg-card border rounded-md shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Teacher Name</TableHead>
              <TableHead>Grade Level</TableHead>
              <TableHead>Profile Status</TableHead>
              <TableHead className="text-right">Learners</TableHead>
              <TableHead className="text-right">PIN</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {teachersLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8">Loading teachers...</TableCell></TableRow>
            ) : filteredTeachers?.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No teachers found.</TableCell></TableRow>
            ) : (
              filteredTeachers?.map((teacher) => {
                const isPinVisible = visiblePinIds.includes(teacher.id);

                return (
                <TableRow
                  key={teacher.id}
                  className={teacher.profileComplete ? "cursor-pointer" : undefined}
                  onClick={() => openTeacherProfile(teacher as TeacherRow)}
                >
                  <TableCell className="font-medium flex items-center">
                    <UserCircle className="w-6 h-6 mr-3 text-muted-foreground" />
                    {teacher.lastName}, {teacher.firstName} {teacher.middleName?.charAt(0) ? `${teacher.middleName.charAt(0)}.` : ""}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="font-normal">{teacher.gradeLevelName}</Badge>
                  </TableCell>
                  <TableCell>
                    {teacher.profileComplete ? (
                      <span className="text-green-600 text-sm font-medium flex items-center">Complete</span>
                    ) : (
                      <span className="text-amber-500 text-sm flex items-center">Incomplete</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">{teacher.learnersCount}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <span className="min-w-14 font-mono text-sm text-muted-foreground">
                        {teacher.pin ? (isPinVisible ? teacher.pin : "••••") : "N/A"}
                      </span>
                      {teacher.pin && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={(event) => {
                            event.stopPropagation();
                            togglePinVisibility(teacher.id);
                          }}
                          aria-label={isPinVisible ? "Hide PIN" : "Show PIN"}
                        >
                          {isPinVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0" onClick={(event) => event.stopPropagation()}>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" onClick={(event) => event.stopPropagation()}>
                        <DropdownMenuItem
                          onClick={() => openTeacherProfile(teacher as TeacherRow)}
                          disabled={!teacher.profileComplete}
                        >
                          <UserCircle className="h-4 w-4" />
                          View Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => togglePinVisibility(teacher.id)} disabled={!teacher.pin}>
                          {isPinVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          {isPinVisible ? "Hide PIN" : "Show PIN"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setTeacherToDelete(teacher)}
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete Teacher
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!teacherToDelete} onOpenChange={(open) => !open && setTeacherToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Teacher?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {teacherToDelete?.firstName} {teacherToDelete?.lastName}
              {teacherToDelete?.learnersCount ? ` and ${teacherToDelete.learnersCount} connected learner record(s)` : ""}.
              Attendance, reading levels, and ARAL profile records connected to those learners will also be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTeacher}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete Teacher"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
        <DialogContent className="max-h-[85vh] max-w-3xl overflow-hidden">
          <DialogHeader>
            <DialogTitle>
              {selectedTeacher
                ? `${selectedTeacher.firstName} ${selectedTeacher.lastName}`
                : "Teacher Profile"}
            </DialogTitle>
            <DialogDescription>
              {selectedTeacher?.gradeLevelName ?? "Completed teacher profile"}
            </DialogDescription>
          </DialogHeader>

          {isProfileLoading ? (
            <div className="py-8 text-center text-muted-foreground">Loading profile...</div>
          ) : selectedTeacherProfile ? (
            <div className="max-h-[calc(85vh-7rem)] space-y-6 overflow-y-auto pr-2">
              <section className="space-y-3">
                <h3 className="text-lg font-medium">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <ProfileItem label="Name (Optional)" value={selectedTeacherProfile.name || `${selectedTeacher?.firstName ?? ""} ${selectedTeacher?.lastName ?? ""}`} />
                  <ProfileItem label="Email Address" value={selectedTeacherProfile.email} />
                  <ProfileItem label="Contact Number" value={selectedTeacherProfile.contactNumber} />
                </div>
              </section>

              <section className="space-y-3">
                <h3 className="text-lg font-medium">Professional Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <ProfileItem label="Designation" value={selectedTeacherProfile.designation} />
                {selectedTeacherProfile.designationOther && <ProfileItem label="Other Designation" value={selectedTeacherProfile.designationOther} />}
                  <ProfileItem label="Position (Teachers)" value={selectedTeacherProfile.position} />
                <ProfileItem label="Highest Educational Attainment" value={selectedTeacherProfile.highestEducationalAttainment} />
                <ProfileItem label="Field of Specialization" value={selectedTeacherProfile.fieldOfSpecialization} />
                {selectedTeacherProfile.fieldOfSpecializationOther && <ProfileItem label="Other Specialization" value={selectedTeacherProfile.fieldOfSpecializationOther} />}
                <ProfileItem label="Years in Service" value={selectedTeacherProfile.yearsInService} />
                <ProfileItem label="Current Grade Level / Assignment" value={selectedTeacherProfile.currentGradeLevel} />
                  <ProfileItem label="Most Subject Currently Handled" value={selectedTeacherProfile.mostSubjectHandled} />
              </div>
              </section>

              <section className="space-y-3">
                <h3 className="text-lg font-medium">Training and Professional Development</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <ProfileItem label="Trainings related to literacy/reading instruction" value={selectedTeacherProfile.literacyTrainingAttended || "N/A"} />
                  <ProfileItem label="Trainings related to English curriculum instruction" value={selectedTeacherProfile.englishTrainingAttended || "N/A"} />
                <ProfileList label="Recent trainings in Reading" values={selectedTeacherProfile.readingTrainingsAttended} />
                <ProfileList label="Recent trainings in English Curriculum" values={selectedTeacherProfile.englishTrainingsAttended} />
                  <ProfileItem label="Highest level of trainings attended (last 5 years)" value={selectedTeacherProfile.highestTrainingLevel || "N/A"} />
              </div>
              </section>
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">No profile selected.</div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ProfileItem({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="rounded-md border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium">{value || "N/A"}</p>
    </div>
  );
}

function ProfileList({ label, values }: { label: string; values: string[] }) {
  return (
    <div className="rounded-md border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      {values.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-2">
          {values.map((value) => (
            <Badge key={value} variant="secondary" className="font-normal">
              {value}
            </Badge>
          ))}
        </div>
      ) : (
        <p className="mt-1 font-medium">N/A</p>
      )}
    </div>
  );
}
