import { useGetAralDashboard, useGetAralAdditionalProfile, useSaveAralAdditionalProfile, getGetAralAdditionalProfileQueryKey } from "@workspace/api-client-react";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Users, BookOpen, Clock, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

const INTERVENTIONS = [
  "Remedial Reading",
  "Peer Tutoring",
  "One-on-one Instruction",
  "Parent Consultation",
  "Reading Drills",
  "Phonics Activities",
  "Comprehension Exercises",
  "Referral to Guidance Counselor",
];

const READING_LEVELS_OPTS = [
  "Non-reader", "Letter reader", "Word reader", "Phrase reader",
  "Sentence reader", "Paragraph reader", "Frustration", "Instructional", "Independent",
];

function ProfileModal({
  learnerId,
  learnerName,
  open,
  onClose,
}: {
  learnerId: string;
  learnerName: string;
  open: boolean;
  onClose: () => void;
}) {
  const { data: profile, isLoading } = useGetAralAdditionalProfile(learnerId, { query: { queryKey: getGetAralAdditionalProfileQueryKey(learnerId), enabled: open } });
  const saveProfile = useSaveAralAdditionalProfile();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [freq, setFreq] = useState("");
  const [interventions, setInterventions] = useState<string[]>([]);
  const [recommended, setRecommended] = useState("");
  const [observations, setObservations] = useState("");
  const [initialized, setInitialized] = useState(false);

  if (profile && !initialized) {
    setFreq(profile.frequencyOfAbsenteeism ?? "");
    setInterventions(profile.interventions ?? []);
    setRecommended(profile.recommendedAssessment ?? "");
    setObservations(profile.otherObservations ?? "");
    setInitialized(true);
  }

  const toggle = (item: string) =>
    setInterventions(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]);

  const handleSave = async () => {
    try {
      await saveProfile.mutateAsync({
        learnerId,
        data: {
          frequencyOfAbsenteeism: freq || undefined,
          interventions,
          recommendedAssessment: recommended || undefined,
          otherObservations: observations || undefined,
        },
      });
      toast({ title: "Profile saved", description: `ARAL profile for ${learnerName} has been updated.` });
      onClose();
      setInitialized(false);
    } catch (e: any) {
      toast({ title: "Failed to save", description: e.message, variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { onClose(); setInitialized(false); } }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>ARAL Profile — {learnerName}</DialogTitle>
          <DialogDescription>Document intervention details and observations for this learner.</DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <div className="py-8 text-center text-muted-foreground">Loading profile...</div>
        ) : (
          <div className="space-y-6 pt-2">
            <div>
              <Label className="mb-2 block">Frequency of Absenteeism</Label>
              <Select value={freq} onValueChange={setFreq}>
                <SelectTrigger><SelectValue placeholder="Select frequency" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="rarely">Rarely (1-2 times)</SelectItem>
                  <SelectItem value="sometimes">Sometimes (3-5 times)</SelectItem>
                  <SelectItem value="often">Often (6-10 times)</SelectItem>
                  <SelectItem value="frequently">Frequently (11+ times)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="mb-3 block">Interventions Applied</Label>
              <div className="grid grid-cols-2 gap-3">
                {INTERVENTIONS.map(item => (
                  <div key={item} className="flex items-center space-x-2">
                    <Checkbox
                      id={item}
                      checked={interventions.includes(item)}
                      onCheckedChange={() => toggle(item)}
                    />
                    <label htmlFor={item} className="text-sm cursor-pointer">{item}</label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label className="mb-2 block">Recommended Assessment</Label>
              <Select value={recommended} onValueChange={setRecommended}>
                <SelectTrigger><SelectValue placeholder="Select assessment" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Phil-IRI">Phil-IRI Assessment</SelectItem>
                  <SelectItem value="EGRA">Early Grade Reading Assessment (EGRA)</SelectItem>
                  <SelectItem value="ORCA">Oral Reading and Comprehension Assessment</SelectItem>
                  <SelectItem value="Other">Other Formal Assessment</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="mb-2 block">Other Observations</Label>
              <Textarea
                value={observations}
                onChange={e => setObservations(e.target.value)}
                placeholder="Add any relevant notes about the learner's progress or behavior..."
                rows={4}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => { onClose(); setInitialized(false); }}>Cancel</Button>
              <Button onClick={handleSave} disabled={saveProfile.isPending}>
                {saveProfile.isPending ? "Saving..." : "Save Profile"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function TeacherAralDashboard() {
  const { data: dashboard, isLoading } = useGetAralDashboard({});
  const [selectedLearner, setSelectedLearner] = useState<{ id: string; name: string } | null>(null);

  if (isLoading) {
    return <div className="p-8 flex items-center justify-center min-h-[50vh]">Loading ARAL dashboard...</div>;
  }

  if (!dashboard) {
    return <div className="p-8 text-muted-foreground">No ARAL data available. Flag learners from the Learners page first.</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground font-serif tracking-tight">ARAL Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Grade Level: <strong>{dashboard.gradeLevelName}</strong> — Tracking learners who need reading intervention.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-destructive shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Total ARAL Learners</CardTitle>
            <AlertTriangle className="w-4 h-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{dashboard.totalAralLearners}</div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Profiles Complete</CardTitle>
            <CheckCircle2 className="w-4 h-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {dashboard.learners.filter(l => l.additionalProfileComplete).length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">of {dashboard.totalAralLearners} learners</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Needs Attention</CardTitle>
            <Clock className="w-4 h-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-500">
              {dashboard.learners.filter(l => l.consecutiveAbsences >= 5).length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">with 5+ absences</p>
          </CardContent>
        </Card>
      </div>

      {dashboard.learners.length === 0 ? (
        <Card className="py-16">
          <CardContent className="text-center text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p>No ARAL learners in this grade level yet.</p>
            <p className="text-sm mt-1">Flag learners as ARAL from the Learners page to begin tracking.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {dashboard.learners.map(learner => (
            <Card key={learner.id} className="hover:shadow-md transition-shadow">
              <CardContent className="py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-destructive" />
                  </div>
                  <div>
                    <p className="font-semibold">{learner.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">{learner.lrn}</p>
                  </div>
                </div>

                <div className="flex items-center gap-6 text-sm">
                  <div className="text-center">
                    <p className="text-muted-foreground text-xs">Reading Level</p>
                    <p className="font-medium">{learner.currentReadingLevel ?? "Not assessed"}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-muted-foreground text-xs">Absences</p>
                    <p className={`font-medium ${learner.consecutiveAbsences >= 5 ? "text-destructive" : ""}`}>
                      {learner.consecutiveAbsences}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-muted-foreground text-xs">Profile</p>
                    {learner.additionalProfileComplete ? (
                      <Badge variant="secondary" className="text-xs bg-green-50 text-green-700 border-green-200">
                        Complete
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">
                        Incomplete
                      </Badge>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant={learner.additionalProfileComplete ? "outline" : "default"}
                    onClick={() => setSelectedLearner({ id: learner.id, name: learner.name })}
                  >
                    {learner.additionalProfileComplete ? "Edit Profile" : "Fill Profile"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selectedLearner && (
        <ProfileModal
          learnerId={selectedLearner.id}
          learnerName={selectedLearner.name}
          open={!!selectedLearner}
          onClose={() => setSelectedLearner(null)}
        />
      )}
    </div>
  );
}
