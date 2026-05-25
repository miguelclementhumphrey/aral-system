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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Plus, Search, UserCircle, MoreHorizontal } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const createTeacherSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  middleName: z.string().optional(),
  lastName: z.string().min(1, "Last name is required"),
  gradeLevelId: z.string().min(1, "Grade level is required"),
});

type CreateTeacherFormValues = z.infer<typeof createTeacherSchema>;

export default function SchoolHeadTeachers() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
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
      const response = await createTeacher.mutateAsync({ data });
      queryClient.invalidateQueries({ queryKey: getGetTeachersQueryKey() });
      toast({
        title: "Teacher Added",
        description: `${data.firstName} ${data.lastName} added successfully. PIN: ${response.pin}`,
        duration: 10000, // Show longer so they can see the PIN
      });
      setIsDialogOpen(false);
      form.reset();
    } catch (e: any) {
      toast({ title: "Failed to add teacher", description: e.message, variant: "destructive" });
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
                Register a new teacher. A login PIN will be generated automatically.
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Grade Level" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {gradeLevels?.map(gl => (
                          <SelectItem key={gl.id} value={gl.id}>{gl.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
              filteredTeachers?.map((teacher) => (
                <TableRow key={teacher.id}>
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
                  <TableCell className="text-right font-mono text-muted-foreground">
                    {teacher.pin ? "••••" : "N/A"}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => {
                          toast({ title: "PIN Feature", description: "Resetting PIN functionality coming soon." })
                        }}>
                          Reset PIN
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
