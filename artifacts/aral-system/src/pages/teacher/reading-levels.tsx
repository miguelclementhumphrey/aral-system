import { useState } from "react";
import { useGetLearners, useGetReadingLevels, useSaveReadingLevel } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { BookOpen, Activity, TrendingUp } from "lucide-react";

const READING_LEVELS = [
  "Non-reader",
  "Letter reader",
  "Word reader",
  "Phrase reader",
  "Sentence reader",
  "Paragraph reader",
  "Frustration",
  "Instructional",
  "Independent",
];

const LEVEL_COLORS: Record<string, string> = {
  "Non-reader": "bg-red-100 text-red-800 border-red-200",
  "Letter reader": "bg-red-50 text-red-700 border-red-100",
  "Word reader": "bg-orange-100 text-orange-800 border-orange-200",
  "Phrase reader": "bg-amber-100 text-amber-800 border-amber-200",
  "Sentence reader": "bg-yellow-100 text-yellow-800 border-yellow-200",
  "Paragraph reader": "bg-lime-100 text-lime-800 border-lime-200",
  "Frustration": "bg-orange-100 text-orange-700 border-orange-200",
  "Instructional": "bg-blue-100 text-blue-800 border-blue-200",
  "Independent": "bg-green-100 text-green-800 border-green-200",
};

const currentMonth = new Date().getMonth() + 1;
const currentYear = new Date().getFullYear();

export default function TeacherReadingLevels() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: learners, isLoading: learnersLoading } = useGetLearners();
  const saveReadingLevel = useSaveReadingLevel();

  const [selectedLearner, setSelectedLearner] = useState<{ id: string; name: string } | null>(null);
  const [level, setLevel] = useState("");
  const [month, setMonth] = useState(currentMonth.toString());
  const [year, setYear] = useState(currentYear.toString());
  const [notes, setNotes] = useState("");

  const openModal = (learner: { id: string; name: string }) => {
    setSelectedLearner(learner);
    setLevel("");
    setNotes("");
    setMonth(currentMonth.toString());
    setYear(currentYear.toString());
  };

  const handleSave = async () => {
    if (!selectedLearner || !level) {
      toast({ title: "Missing information", description: "Please select a reading level.", variant: "destructive" });
      return;
    }
    try {
      await saveReadingLevel.mutateAsync({
        data: {
          learnerId: selectedLearner.id,
          readingLevel: level,
          month: parseInt(month),
          year: parseInt(year),
          notes: notes || undefined,
        },
      });
      toast({ title: "Reading level saved", description: `Record for ${selectedLearner.name} has been saved.` });
      setSelectedLearner(null);
    } catch (e: any) {
      toast({ title: "Failed to save", description: e.message, variant: "destructive" });
    }
  };

  const months = [
    { value: "1", label: "January" }, { value: "2", label: "February" },
    { value: "3", label: "March" }, { value: "4", label: "April" },
    { value: "5", label: "May" }, { value: "6", label: "June" },
    { value: "7", label: "July" }, { value: "8", label: "August" },
    { value: "9", label: "September" }, { value: "10", label: "October" },
    { value: "11", label: "November" }, { value: "12", label: "December" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground font-serif tracking-tight">Reading Levels</h1>
        <p className="text-muted-foreground mt-1">Record and track reading proficiency assessments for your learners.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 text-xs">
        {READING_LEVELS.map(level => (
          <div key={level} className={`px-3 py-2 rounded border font-medium ${LEVEL_COLORS[level] ?? "bg-muted"}`}>
            {level}
          </div>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Learner Assessment Records</CardTitle>
          <CardDescription>Click "Record" to add or update a learner's reading level assessment.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {learnersLoading ? (
              <div className="py-8 text-center text-muted-foreground">Loading learners...</div>
            ) : !learners?.length ? (
              <div className="py-12 text-center text-muted-foreground">
                <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-20" />
                <p>No learners found. Add learners first.</p>
              </div>
            ) : learners.map(learner => (
              <div
                key={learner.id}
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                    <BookOpen className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{learner.lastName}, {learner.firstName}</p>
                    <p className="text-xs text-muted-foreground font-mono">{learner.lrn}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {learner.isAral && (
                    <Badge variant="destructive" className="text-xs">ARAL</Badge>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openModal({ id: learner.id, name: `${learner.firstName} ${learner.lastName}` })}
                  >
                    <Activity className="w-3 h-3 mr-1" /> Record Level
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedLearner} onOpenChange={(v) => !v && setSelectedLearner(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Reading Level</DialogTitle>
            <DialogDescription>
              {selectedLearner?.name} — Enter the assessed reading level for the selected period.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="mb-2 block">Month</Label>
                <Select value={month} onValueChange={setMonth}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {months.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-2 block">Year</Label>
                <Input
                  type="number"
                  value={year}
                  onChange={e => setYear(e.target.value)}
                  min={2020}
                  max={currentYear + 1}
                />
              </div>
            </div>

            <div>
              <Label className="mb-2 block">Reading Level</Label>
              <Select value={level} onValueChange={setLevel}>
                <SelectTrigger>
                  <SelectValue placeholder="Select reading level" />
                </SelectTrigger>
                <SelectContent>
                  {READING_LEVELS.map(l => (
                    <SelectItem key={l} value={l}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {level && (
              <div className={`px-3 py-2 rounded border text-sm font-medium ${LEVEL_COLORS[level] ?? "bg-muted"}`}>
                Selected: <strong>{level}</strong>
              </div>
            )}

            <div>
              <Label className="mb-2 block">Notes (Optional)</Label>
              <Input
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Any additional observations..."
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setSelectedLearner(null)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saveReadingLevel.isPending || !level}>
                {saveReadingLevel.isPending ? "Saving..." : "Save Record"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
