import { useState } from "react";
import {
  useGetLearners,
  useCreateLearner,
  useFlagLearnerAsAral,
  getGetLearnersQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";

import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Search, UserCircle, MoreHorizontal, AlertTriangle } from "lucide-react";

const READING_LEVELS = [
  "Non-reader", "Letter reader", "Word reader", "Phrase reader",
  "Sentence reader", "Paragraph reader", "Frustration", "Instructional", "Independent",
];

const createLearnerSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  middleName: z.string().optional(),
  lastName: z.string().min(1, "Last name is required"),
  lrn: z.string().min(12, "LRN must be 12 digits").max(12, "LRN must be 12 digits"),
  gender: z.enum(["male", "female"]),
  age: z.coerce.number().min(3).max(20),
});

type CreateLearnerFormValues = z.infer<typeof createLearnerSchema>;

export default function TeacherLearners() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDevelopmentOpen, setIsDevelopmentOpen] = useState(false);
  const [flagLearnerId, setFlagLearnerId] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: learners, isLoading } = useGetLearners();
  const createLearner = useCreateLearner();
  const flagAsAral = useFlagLearnerAsAral();

  const form = useForm<CreateLearnerFormValues>({
    resolver: zodResolver(createLearnerSchema),
    defaultValues: {
      firstName: "", middleName: "", lastName: "", lrn: "", gender: "male" as any, age: 7 as any,
    },
  });

  const filtered = learners?.filter(l => {
    const name = `${l.firstName} ${l.lastName}`.toLowerCase();
    return name.includes(searchTerm.toLowerCase()) || l.lrn.includes(searchTerm);
  }) ?? [];

  const onSubmit = async (data: CreateLearnerFormValues) => {
    try {
      await createLearner.mutateAsync({ data: data as any });
      queryClient.invalidateQueries({ queryKey: getGetLearnersQueryKey() });
      toast({ title: "Learner added", description: `${data.firstName} ${data.lastName} has been registered.` });
      setIsDialogOpen(false);
      form.reset();
    } catch (e: any) {
      toast({ title: "Failed to add learner", description: e.message, variant: "destructive" });
    }
  };

  const handleFlag = async () => {
    if (!flagLearnerId) return;
    try {
      await flagAsAral.mutateAsync({ learnerId: flagLearnerId });
      queryClient.invalidateQueries({ queryKey: getGetLearnersQueryKey() });
      toast({ title: "Flagged as ARAL", description: "Learner has been flagged for ARAL intervention." });
    } catch (e: any) {
      toast({ title: "Failed to flag learner", description: e.message, variant: "destructive" });
    } finally {
      setFlagLearnerId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-foreground font-serif tracking-tight">My Learners</h1>
          <p className="text-muted-foreground mt-1">
            Manage learners in your class. Grade Level: <strong>{(user as any)?.gradeLevelId ? "Loaded" : "—"}</strong>
          </p>
        </div>
        <Button
          onClick={() => setIsDevelopmentOpen(true)}
        >
          <Plus className="w-4 h-4 mr-2" /> Add Learner
        </Button>
      </div>

      <div className="flex items-center space-x-2 bg-card border rounded-md px-3 py-2 max-w-sm">
        <Search className="w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or LRN..."
          className="border-0 focus-visible:ring-0 p-0 h-8"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="bg-card border rounded-md shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>LRN</TableHead>
              <TableHead>Gender</TableHead>
              <TableHead>Age</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8">Loading learners...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                  <UserCircle className="w-10 h-10 mx-auto mb-3 opacity-20" />
                  <p>No learners found. Add your first learner to get started.</p>
                </TableCell>
              </TableRow>
            ) : filtered.map((learner) => (
              <TableRow key={learner.id}>
                <TableCell className="font-medium">
                  {learner.lastName}, {learner.firstName}
                  {(learner as any).middleName ? ` ${(learner as any).middleName.charAt(0)}.` : ""}
                </TableCell>
                <TableCell className="font-mono text-sm text-muted-foreground">{learner.lrn}</TableCell>
                <TableCell className="capitalize">{(learner as any).gender}</TableCell>
                <TableCell>{(learner as any).age}</TableCell>
                <TableCell>
                  {learner.isAral ? (
                    <Badge variant="destructive" className="text-xs">
                      <AlertTriangle className="w-3 h-3 mr-1" /> ARAL
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs">Regular</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {!learner.isAral && (
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => setFlagLearnerId(learner.id)}
                        >
                          <AlertTriangle className="w-4 h-4 mr-2" /> Flag as ARAL
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Learner</DialogTitle>
            <DialogDescription>Register a learner in your class.</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="firstName" render={({ field }) => (
                  <FormItem><FormLabel>First Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="lastName" render={({ field }) => (
                  <FormItem><FormLabel>Last Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <FormField control={form.control} name="middleName" render={({ field }) => (
                <FormItem><FormLabel>Middle Name (Optional)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="lrn" render={({ field }) => (
                <FormItem>
                  <FormLabel>Learner Reference Number (LRN)</FormLabel>
                  <FormControl><Input {...field} placeholder="12-digit LRN" maxLength={12} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="gender" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gender</FormLabel>
                    <FormControl>
                      <SearchableSelect
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder="Select gender"
                        searchPlaceholder="Search gender..."
                        options={[
                          { value: "male", label: "Male" },
                          { value: "female", label: "Female" },
                        ]}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="age" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Age</FormLabel>
                    <FormControl><Input type="number" {...field} min={3} max={20} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <div className="flex justify-end pt-2">
                <Button type="button" variant="outline" className="mr-2" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createLearner.isPending}>
                  {createLearner.isPending ? "Adding..." : "Add Learner"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!flagLearnerId} onOpenChange={(open) => !open && setFlagLearnerId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Flag Learner as ARAL?</AlertDialogTitle>
            <AlertDialogDescription>
              This will mark the learner as needing ARAL intervention. You can then track their progress
              in the ARAL Dashboard.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleFlag}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Flag as ARAL
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isDevelopmentOpen} onOpenChange={setIsDevelopmentOpen}>
        <AlertDialogContent className="max-w-xl border-destructive bg-destructive text-destructive-foreground shadow-2xl">
          <AlertDialogHeader className="items-center text-center">
            <div className="mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-destructive-foreground/15">
              <AlertTriangle className="h-9 w-9" />
            </div>
            <AlertDialogTitle className="text-3xl font-bold">Under Development</AlertDialogTitle>
            <AlertDialogDescription className="text-base text-destructive-foreground/90">
              Adding learners is temporarily unavailable.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center">
            <AlertDialogAction className="bg-destructive-foreground text-destructive hover:bg-destructive-foreground/90">
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
