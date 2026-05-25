import { useState } from "react";
import { Link } from "wouter";
import { 
  useAdminGetSchools, 
  useAdminCreateSchool, 
  getAdminGetSchoolsQueryKey 
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Eye } from "lucide-react";

const createSchoolSchema = z.object({
  name: z.string().min(1, "School name is required"),
  schoolCode: z.string().min(1, "School code is required"),
  division: z.string().min(1, "Division is required"),
  district: z.string().min(1, "District is required"),
  region: z.string().min(1, "Region is required"),
  schoolHeadName: z.string().min(1, "School Head Name is required"),
  schoolHeadContact: z.string().min(1, "Contact is required"),
});

type CreateSchoolFormValues = z.infer<typeof createSchoolSchema>;

export default function AdminSchools() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: schools, isLoading } = useAdminGetSchools();
  const createSchool = useAdminCreateSchool();

  const form = useForm<CreateSchoolFormValues>({
    resolver: zodResolver(createSchoolSchema),
    defaultValues: {
      name: "",
      schoolCode: "",
      division: "",
      district: "",
      region: "",
      schoolHeadName: "",
      schoolHeadContact: "",
    },
  });

  const filteredSchools = schools?.filter(school => 
    school.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    school.schoolCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const onSubmit = async (data: CreateSchoolFormValues) => {
    try {
      await createSchool.mutateAsync({ data });
      queryClient.invalidateQueries({ queryKey: getAdminGetSchoolsQueryKey() });
      toast({
        title: "School created",
        description: `${data.name} has been registered successfully.`,
      });
      setIsDialogOpen(false);
      form.reset();
    } catch (error: any) {
      toast({
        title: "Failed to create school",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active": return <Badge variant="default" className="bg-green-500">Active</Badge>;
      case "pending": return <Badge variant="outline" className="text-amber-500 border-amber-500">Pending</Badge>;
      case "suspended": return <Badge variant="destructive">Suspended</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-foreground font-serif tracking-tight">Schools Management</h1>
          <p className="text-muted-foreground mt-1">Register and manage schools in the system.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Register School
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Register New School</DialogTitle>
              <DialogDescription>
                Create a new school record and assign a school head.
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem>
                      <FormLabel>School Name</FormLabel>
                      <FormControl><Input placeholder="e.g. Quezon National High School" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="schoolCode" render={({ field }) => (
                    <FormItem>
                      <FormLabel>School Code</FormLabel>
                      <FormControl><Input placeholder="e.g. 301234" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="region" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Region</FormLabel>
                      <FormControl><Input placeholder="e.g. Region IV-A" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="division" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Division</FormLabel>
                      <FormControl><Input placeholder="e.g. Quezon Province" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="district" render={({ field }) => (
                    <FormItem>
                      <FormLabel>District</FormLabel>
                      <FormControl><Input placeholder="e.g. Lucena City" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                
                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <FormField control={form.control} name="schoolHeadName" render={({ field }) => (
                    <FormItem>
                      <FormLabel>School Head Full Name</FormLabel>
                      <FormControl><Input placeholder="e.g. Juan Dela Cruz" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="schoolHeadContact" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Number / Email</FormLabel>
                      <FormControl><Input placeholder="Email or phone" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                
                <div className="flex justify-end pt-4">
                  <Button type="button" variant="outline" className="mr-2" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createSchool.isPending}>
                    {createSchool.isPending ? "Registering..." : "Register School"}
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
          placeholder="Search by school name or code..." 
          className="border-0 focus-visible:ring-0 p-0 h-8"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="bg-card border rounded-md shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>School Name</TableHead>
              <TableHead>School Head</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Metrics</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8">Loading schools...</TableCell></TableRow>
            ) : filteredSchools?.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No schools found.</TableCell></TableRow>
            ) : (
              filteredSchools?.map((school) => (
                <TableRow key={school.id}>
                  <TableCell className="font-mono text-sm">{school.schoolCode}</TableCell>
                  <TableCell className="font-medium">{school.name}</TableCell>
                  <TableCell>{school.schoolHeadName || "Unassigned"}</TableCell>
                  <TableCell>{getStatusBadge(school.status)}</TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground">
                    <span title="Teachers" className="mr-3">{school.teachersCount} T</span>
                    <span title="Learners" className="mr-3">{school.learnersCount} L</span>
                    <span title="ARAL Learners" className="text-accent font-medium">{school.aralLearnersCount} A</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/admin/schools/${school.id}`}>
                        <Eye className="w-4 h-4 mr-2" /> View
                      </Link>
                    </Button>
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
