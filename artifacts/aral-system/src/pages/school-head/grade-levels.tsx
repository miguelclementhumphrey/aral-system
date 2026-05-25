import { useState } from "react";
import { useGetGradeLevels, useCreateGradeLevel, getGetGradeLevelsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Plus, Users, BookOpen } from "lucide-react";

const AVAILABLE_GRADE_LEVELS = [
  "Kinder", "Grade 1", "Grade 2", "Grade 3", "Grade 4", 
  "Grade 5", "Grade 6", "Grade 7", "Grade 8", "Grade 9", 
  "Grade 10", "Grade 11", "Grade 12", "Floating"
];

export default function SchoolHeadGradeLevels() {
  const { data: gradeLevels, isLoading } = useGetGradeLevels();
  const createGradeLevel = useCreateGradeLevel();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { isProfileComplete } = useAuth();
  
  const [creatingLevel, setCreatingLevel] = useState<string | null>(null);

  if (isLoading) {
    return <div className="p-8">Loading grade levels...</div>;
  }

  const existingLevelNames = gradeLevels?.map(gl => gl.name) || [];

  const handleCreate = async (name: string) => {
    if (!isProfileComplete) {
      toast({
        title: "Profile Incomplete",
        description: "Please complete your profile before adding grade levels.",
        variant: "destructive",
      });
      return;
    }

    try {
      setCreatingLevel(name);
      await createGradeLevel.mutateAsync({ data: { name } });
      queryClient.invalidateQueries({ queryKey: getGetGradeLevelsQueryKey() });
      toast({
        title: "Grade Level created",
        description: `${name} has been added to your school.`,
      });
    } catch (e: any) {
      toast({ title: "Failed to create", description: e.message, variant: "destructive" });
    } finally {
      setCreatingLevel(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground font-serif tracking-tight">Grade Levels</h1>
        <p className="text-muted-foreground mt-1">Manage the grade levels active in your school.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {gradeLevels?.map(gl => (
          <Card key={gl.id} className="border-primary/20 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
            <CardHeader className="pb-2">
              <CardTitle className="text-xl flex items-center justify-between">
                {gl.name}
                <Badge variant="outline" className="font-normal text-xs">Active</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center"><Users className="w-4 h-4 mr-2" /> Teachers</span>
                <span className="font-medium">{gl.teachersCount}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center"><BookOpen className="w-4 h-4 mr-2" /> Learners</span>
                <span className="font-medium">{gl.learnersCount}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-12">
        <h2 className="text-xl font-semibold mb-4 border-b pb-2">Available to Add</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-3">
          {AVAILABLE_GRADE_LEVELS.map(level => {
            const isExisting = existingLevelNames.includes(level);
            const isCreating = creatingLevel === level;
            
            return (
              <Tooltip key={level}>
                <TooltipTrigger asChild>
                  <div className="w-full">
                    <Button
                      variant={isExisting ? "secondary" : "outline"}
                      className={`w-full justify-between h-auto py-3 ${isExisting ? "opacity-50 cursor-default" : ""}`}
                      disabled={isExisting || isCreating || (!isProfileComplete && !isExisting)}
                      onClick={() => !isExisting && handleCreate(level)}
                    >
                      <span>{level}</span>
                      {!isExisting && !isCreating && <Plus className="w-4 h-4 opacity-50" />}
                      {isCreating && <span className="w-4 h-4 animate-spin rounded-full border-2 border-primary border-r-transparent" />}
                    </Button>
                  </div>
                </TooltipTrigger>
                {isExisting ? (
                  <TooltipContent>Already active in your school</TooltipContent>
                ) : !isProfileComplete ? (
                  <TooltipContent>Complete your profile first</TooltipContent>
                ) : (
                  <TooltipContent>Click to add {level}</TooltipContent>
                )}
              </Tooltip>
            );
          })}
        </div>
      </div>
    </div>
  );
}
