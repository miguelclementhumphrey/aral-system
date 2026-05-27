import { useState } from "react";
import { Link, useParams, useLocation } from "wouter";
import { 
  useAdminGetSchool, 
  useAdminActivateSchool,
  useAdminSuspendSchool,
  useAdminDeleteSchool,
  useAdminResetSchoolPassword,
  getAdminGetSchoolQueryKey,
  getAdminGetSchoolsQueryKey
} from "@workspace/api-client-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { apiUrl } from "@/lib/api-url";
import { ChevronLeft, ShieldAlert, KeyRound, CheckCircle2, AlertTriangle, Users, BookOpen, Trash2, Eye, UserCircle } from "lucide-react";

type ProfileDetails = {
  name?: string | null;
  designation?: string | null;
  designationOther?: string | null;
  position?: string | null;
  contactNumber?: string | null;
  email?: string | null;
  highestEducationalAttainment?: string | null;
  yearsInService?: string | null;
  fieldOfSpecialization?: string | null;
  fieldOfSpecializationOther?: string | null;
  currentGradeLevel?: string | null;
  mostSubjectHandled?: string | null;
  literacyTrainingAttended?: string | null;
  readingTrainingsAttended?: string[];
  englishTrainingAttended?: string | null;
  englishTrainingsAttended?: string[];
  highestTrainingLevel?: string | null;
};

type AdminSchoolProfiles = {
  schoolHead: {
    profileComplete: boolean;
    profile: ProfileDetails | null;
  };
  teachers: Array<{
    id: string;
    name: string;
    gradeLevelName: string;
    profileComplete: boolean;
    isActive: boolean;
    profile: ProfileDetails | null;
  }>;
};

type SelectedProfile = {
  title: string;
  description: string;
  role: "school_head" | "teacher";
  profile: ProfileDetails;
};

export default function AdminSchoolDetail() {
  const params = useParams();
  const schoolId = params.id as string;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
  const [activateDialogOpen, setActivateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<SelectedProfile | null>(null);

  const { data: school, isLoading } = useAdminGetSchool(schoolId);
  const { data: profileOverview, isLoading: profilesLoading } = useQuery<AdminSchoolProfiles>({
    queryKey: ["admin-school-profiles", schoolId],
    queryFn: async () => {
      const response = await fetch(apiUrl(`/api/admin/schools/${schoolId}/profiles`), {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem("aral_token") ?? ""}`,
        },
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(body.error || "Failed to load profile overview");
      }
      return body;
    },
    enabled: Boolean(schoolId),
    retry: false,
  });
  const activateSchool = useAdminActivateSchool();
  const suspendSchool = useAdminSuspendSchool();
  const deleteSchool = useAdminDeleteSchool();
  const resetPassword = useAdminResetSchoolPassword();

  if (isLoading) {
    return <div className="p-8">Loading school details...</div>;
  }

  if (!school) {
    return (
      <div className="p-8">
        <h2 className="text-2xl font-bold text-destructive mb-4">School not found</h2>
        <Button onClick={() => setLocation("/admin/schools")}>Return to Schools</Button>
      </div>
    );
  }

  const schoolHeadProfileComplete = profileOverview?.schoolHead.profileComplete ?? school.profileComplete;

  const handleActivate = async () => {
    try {
      await activateSchool.mutateAsync({ schoolId });
      queryClient.invalidateQueries({ queryKey: getAdminGetSchoolQueryKey(schoolId) });
      queryClient.invalidateQueries({ queryKey: getAdminGetSchoolsQueryKey() });
      toast({ title: "School activated", description: "The school can now log in." });
      setActivateDialogOpen(false);
    } catch (e: any) {
      toast({ title: "Action failed", description: e.message, variant: "destructive" });
    }
  };

  const handleSuspend = async () => {
    try {
      await suspendSchool.mutateAsync({ schoolId });
      queryClient.invalidateQueries({ queryKey: getAdminGetSchoolQueryKey(schoolId) });
      queryClient.invalidateQueries({ queryKey: getAdminGetSchoolsQueryKey() });
      toast({ title: "School suspended", description: "The school can no longer log in." });
      setSuspendDialogOpen(false);
    } catch (e: any) {
      toast({ title: "Action failed", description: e.message, variant: "destructive" });
    }
  };

  const handleResetPassword = async () => {
    try {
      await resetPassword.mutateAsync({ schoolId });
      toast({ 
        title: "Password reset", 
        description: "The school head's password has been reset to the default School ID.",
      });
      setResetDialogOpen(false);
    } catch (e: any) {
      toast({ title: "Action failed", description: e.message, variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    try {
      await deleteSchool.mutateAsync({ schoolId });
      queryClient.invalidateQueries({ queryKey: getAdminGetSchoolsQueryKey() });
      toast({ title: "School deleted", description: "The suspended school and related records were deleted." });
      setDeleteDialogOpen(false);
      setLocation("/admin/schools");
    } catch (e: any) {
      toast({ title: "Delete failed", description: e.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
        <Link href="/admin/schools" className="hover:text-foreground flex items-center">
          <ChevronLeft className="w-4 h-4 mr-1" /> Back to Schools
        </Link>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-foreground font-serif tracking-tight">{school.name}</h1>
            {school.status === "active" && <Badge className="bg-green-500">Active</Badge>}
            {school.status === "pending" && <Badge variant="outline" className="text-amber-500 border-amber-500">Pending</Badge>}
            {school.status === "suspended" && <Badge variant="destructive">Suspended</Badge>}
          </div>
          <p className="text-muted-foreground mt-1">School ID: <span className="font-mono text-foreground">{school.schoolCode}</span></p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setResetDialogOpen(true)}>
            <KeyRound className="w-4 h-4 mr-2" /> Reset Password
          </Button>
          
          {school.status !== "active" ? (
            <Button onClick={() => setActivateDialogOpen(true)} className="bg-green-600 hover:bg-green-700">
              <CheckCircle2 className="w-4 h-4 mr-2" /> Activate
            </Button>
          ) : (
            <Button variant="destructive" onClick={() => setSuspendDialogOpen(true)}>
              <ShieldAlert className="w-4 h-4 mr-2" /> Suspend
            </Button>
          )}
          {school.status === "suspended" && (
            <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
              <Trash2 className="w-4 h-4 mr-2" /> Delete
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>School Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Region</p>
                <p className="text-base">{school.region || "Not specified"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Division</p>
                <p className="text-base">{school.division || "Not specified"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">District</p>
                <p className="text-base">{school.district || "Not specified"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Profile Status</p>
                <p className="text-base">{schoolHeadProfileComplete ? "Complete" : "Incomplete"}</p>
              </div>
            </div>

            <Separator className="my-4" />
            
            <h3 className="font-medium text-lg mt-4 mb-2">School Head Details</h3>
            <div className="grid grid-cols-2 gap-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Name</p>
                <p className="text-base">{school.schoolHeadName || "Unassigned"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Contact</p>
                <p className="text-base">{school.schoolHeadContact || "N/A"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Metrics</CardTitle>
            <CardDescription>Current academic year</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-primary/10 rounded-md">
                  <Users className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium leading-none">Teachers</p>
                </div>
              </div>
              <div className="font-bold text-xl">{school.teachersCount}</div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-primary/10 rounded-md">
                  <BookOpen className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium leading-none">Total Learners</p>
                </div>
              </div>
              <div className="font-bold text-xl">{school.learnersCount}</div>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-accent/20 rounded-md">
                  <AlertTriangle className="w-4 h-4 text-accent" />
                </div>
                <div>
                  <p className="text-sm font-medium leading-none">ARAL Learners</p>
                </div>
              </div>
              <div className="font-bold text-xl text-accent">{school.aralLearnersCount}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profiles</CardTitle>
          <CardDescription>School head and teacher profile completion for this school.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {profilesLoading ? (
            <div className="py-6 text-center text-muted-foreground">Loading profiles...</div>
          ) : (
            <>
              <div className="rounded-md border p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="rounded-md bg-primary/10 p-2">
                      <UserCircle className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">School Head</p>
                      <p className="text-sm text-muted-foreground">{school.schoolHeadName || "Unassigned"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <ProfileStatusBadge complete={Boolean(profileOverview?.schoolHead.profileComplete)} />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={!profileOverview?.schoolHead.profile}
                      onClick={() => {
                        if (!profileOverview?.schoolHead.profile) return;
                        setSelectedProfile({
                          title: school.schoolHeadName || "School Head Profile",
                          description: "School Head",
                          role: "school_head",
                          profile: profileOverview.schoolHead.profile,
                        });
                      }}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      View Profile
                    </Button>
                  </div>
                </div>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Teacher</TableHead>
                      <TableHead>Grade Level</TableHead>
                      <TableHead>Profile Status</TableHead>
                      <TableHead className="text-right">Profile</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {profileOverview?.teachers.length ? (
                      profileOverview.teachers.map((teacher) => (
                        <TableRow key={teacher.id}>
                          <TableCell className="font-medium">{teacher.name}</TableCell>
                          <TableCell>{teacher.gradeLevelName || "Not assigned"}</TableCell>
                          <TableCell><ProfileStatusBadge complete={teacher.profileComplete} /></TableCell>
                          <TableCell className="text-right">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={!teacher.profile}
                              onClick={() => {
                                if (!teacher.profile) return;
                                setSelectedProfile({
                                  title: teacher.name,
                                  description: teacher.gradeLevelName || "Teacher",
                                  role: "teacher",
                                  profile: teacher.profile,
                                });
                              }}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="py-6 text-center text-muted-foreground">
                          No teachers added yet.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedProfile} onOpenChange={(open) => !open && setSelectedProfile(null)}>
        <DialogContent className="max-h-[85vh] max-w-3xl overflow-hidden">
          <DialogHeader>
            <DialogTitle>{selectedProfile?.title ?? "Profile"}</DialogTitle>
            <DialogDescription>{selectedProfile?.description ?? "Completed profile"}</DialogDescription>
          </DialogHeader>

          {selectedProfile && (
            <div className="max-h-[calc(85vh-7rem)] space-y-6 overflow-y-auto pr-2">
              <section className="space-y-3">
                <h3 className="text-lg font-medium">Personal Information</h3>
                <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
                  <ProfileItem label="Name" value={selectedProfile.profile.name || selectedProfile.title} />
                  <ProfileItem label="Email Address" value={selectedProfile.profile.email} />
                  <ProfileItem label="Contact Number" value={selectedProfile.profile.contactNumber} />
                </div>
              </section>

              <section className="space-y-3">
                <h3 className="text-lg font-medium">Professional Details</h3>
                <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
                  <ProfileItem label="Designation" value={selectedProfile.profile.designation} />
                  {selectedProfile.profile.designationOther && <ProfileItem label="Other Designation" value={selectedProfile.profile.designationOther} />}
                  <ProfileItem
                    label={selectedProfile.role === "teacher" ? "Position (Teachers)" : "Position (School Head)"}
                    value={selectedProfile.profile.position}
                  />
                  <ProfileItem label="Highest Educational Attainment" value={selectedProfile.profile.highestEducationalAttainment} />
                  <ProfileItem label="Field of Specialization" value={selectedProfile.profile.fieldOfSpecialization} />
                  {selectedProfile.profile.fieldOfSpecializationOther && <ProfileItem label="Other Specialization" value={selectedProfile.profile.fieldOfSpecializationOther} />}
                  <ProfileItem label="Years in Service" value={selectedProfile.profile.yearsInService} />
                  {selectedProfile.role === "teacher" && (
                    <>
                      <ProfileItem label="Current Grade Level / Assignment" value={selectedProfile.profile.currentGradeLevel} />
                      <ProfileItem label="Most Subject Currently Handled" value={selectedProfile.profile.mostSubjectHandled} />
                    </>
                  )}
                </div>
              </section>

              <section className="space-y-3">
                <h3 className="text-lg font-medium">Training and Professional Development</h3>
                <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
                  <ProfileItem label="Trainings related to literacy/reading instruction" value={selectedProfile.profile.literacyTrainingAttended} />
                  <ProfileItem label="Trainings related to English curriculum instruction" value={selectedProfile.profile.englishTrainingAttended} />
                  <ProfileList label="Recent trainings in Reading" values={selectedProfile.profile.readingTrainingsAttended ?? []} />
                  <ProfileList label="Recent trainings in English Curriculum" values={selectedProfile.profile.englishTrainingsAttended ?? []} />
                  <ProfileItem label="Highest level of trainings attended (last 5 years)" value={selectedProfile.profile.highestTrainingLevel} />
                </div>
              </section>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialogs */}
      <AlertDialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Password?</AlertDialogTitle>
            <AlertDialogDescription>
              This will reset the school head's password back to their School ID ({school.schoolCode}). 
              They will be forced to change it upon their next login.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleResetPassword}>Reset Password</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={activateDialogOpen} onOpenChange={setActivateDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Activate School?</AlertDialogTitle>
            <AlertDialogDescription>
              This will allow the school head to log in and begin using the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleActivate} className="bg-green-600 hover:bg-green-700">Activate</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={suspendDialogOpen} onOpenChange={setSuspendDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Suspend School?</AlertDialogTitle>
            <AlertDialogDescription>
              This will immediately revoke access for the school head and all associated teachers. 
              They will not be able to log in until the school is reactivated.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSuspend} className="bg-destructive hover:bg-destructive/90">Suspend Access</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Suspended School?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes the school, school head profile, teachers, learners, grade levels, attendance, reading levels, and ARAL profile records connected to this school. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Delete School
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ProfileStatusBadge({ complete }: { complete: boolean }) {
  return complete ? (
    <Badge className="bg-green-500">Complete</Badge>
  ) : (
    <Badge variant="outline" className="border-amber-500 text-amber-500">Pending</Badge>
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
