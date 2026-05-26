import { useState } from "react";
import { useGetLearners, useGetAttendance, useSaveAttendance } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Label } from "@/components/ui/label";
import { CalendarDays, Check, X, Clock } from "lucide-react";

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday"] as const;
type Day = typeof DAYS[number];
type AttStatus = "present" | "absent" | "late" | "excused";

const STATUS_CONFIG: Record<AttStatus, { label: string; class: string; icon: any }> = {
  present: { label: "P", class: "bg-green-100 text-green-700 border-green-300", icon: Check },
  absent: { label: "A", class: "bg-red-100 text-red-700 border-red-300", icon: X },
  late: { label: "L", class: "bg-amber-100 text-amber-700 border-amber-300", icon: Clock },
  excused: { label: "E", class: "bg-blue-100 text-blue-700 border-blue-300", icon: CalendarDays },
};

function getWeekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split("T")[0];
}

function getPreviousWeeks(count = 5): Array<{ value: string; label: string }> {
  const weeks = [];
  const now = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i * 7);
    const weekStart = getWeekStart(d);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 4);
    weeks.push({
      value: weekStart,
      label: `Week of ${new Date(weekStart).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}`,
    });
  }
  return weeks;
}

export default function TeacherAttendance() {
  const weeks = getPreviousWeeks(6);
  const [selectedWeek, setSelectedWeek] = useState(weeks[0].value);
  const { toast } = useToast();

  const { data: learners, isLoading: learnersLoading } = useGetLearners();
  const saveAttendance = useSaveAttendance();

  const [attendance, setAttendance] = useState<Record<string, Record<Day, AttStatus>>>({});

  const setStatus = (learnerId: string, day: Day, status: AttStatus) => {
    setAttendance(prev => ({
      ...prev,
      [learnerId]: { ...prev[learnerId], [day]: status },
    }));
  };

  const cycleStatus = (learnerId: string, day: Day) => {
    const statuses: AttStatus[] = ["present", "absent", "late", "excused"];
    const current = attendance[learnerId]?.[day] ?? "present";
    const next = statuses[(statuses.indexOf(current) + 1) % statuses.length];
    setStatus(learnerId, day, next);
  };

  const handleSave = async () => {
    if (!learners?.length) return;
    let saved = 0;
    for (const learner of learners) {
      const record = attendance[learner.id];
      if (!record) continue;
      try {
        await saveAttendance.mutateAsync({
          data: {
            learnerId: learner.id,
            weekStartDate: selectedWeek,
            monday: (record.monday ?? "present") as any,
            tuesday: (record.tuesday ?? "present") as any,
            wednesday: (record.wednesday ?? "present") as any,
            thursday: (record.thursday ?? "present") as any,
            friday: (record.friday ?? "present") as any,
          },
        });
        saved++;
      } catch {}
    }
    toast({ title: "Attendance saved", description: `Saved records for ${saved} learner(s).` });
  };

  const initializeWeek = () => {
    if (!learners?.length) return;
    const init: Record<string, Record<Day, AttStatus>> = {};
    for (const l of learners) {
      init[l.id] = {
        monday: "present",
        tuesday: "present",
        wednesday: "present",
        thursday: "present",
        friday: "present",
      };
    }
    setAttendance(init);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-foreground font-serif tracking-tight">Attendance</h1>
          <p className="text-muted-foreground mt-1">Track weekly attendance for your learners.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={initializeWeek}>Initialize All Present</Button>
          <Button onClick={handleSave} disabled={saveAttendance.isPending}>
            {saveAttendance.isPending ? "Saving..." : "Save Attendance"}
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Label>Week:</Label>
        <SearchableSelect
          value={selectedWeek}
          onValueChange={setSelectedWeek}
          className="w-64"
          searchPlaceholder="Search weeks..."
          options={weeks.map((week) => ({
            value: week.value,
            label: week.label,
          }))}
        />
      </div>

      <div className="flex gap-3 text-xs">
        {Object.entries(STATUS_CONFIG).map(([key, config]) => (
          <span key={key} className={`inline-flex items-center gap-1 px-2 py-1 border rounded ${config.class}`}>
            <span className="font-bold">{config.label}</span> = {key}
          </span>
        ))}
        <span className="text-muted-foreground italic">Click a cell to cycle through statuses</span>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {weeks.find(w => w.value === selectedWeek)?.label}
          </CardTitle>
          <CardDescription>Click each cell to toggle attendance status.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 pr-4 font-medium text-muted-foreground w-48">Learner</th>
                {DAYS.map(day => (
                  <th key={day} className="text-center py-3 px-2 font-medium text-muted-foreground capitalize w-20">{day.slice(0, 3)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {learnersLoading ? (
                <tr><td colSpan={6} className="py-8 text-center text-muted-foreground">Loading learners...</td></tr>
              ) : !learners?.length ? (
                <tr><td colSpan={6} className="py-12 text-center text-muted-foreground">No learners found.</td></tr>
              ) : learners.map(learner => (
                <tr key={learner.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="py-3 pr-4 font-medium">
                    {learner.lastName}, {learner.firstName}
                  </td>
                  {DAYS.map(day => {
                    const status = attendance[learner.id]?.[day] ?? null;
                    return (
                      <td key={day} className="text-center py-2 px-2">
                        <button
                          onClick={() => cycleStatus(learner.id, day)}
                          className={`w-10 h-10 rounded-md border font-bold text-sm transition-all hover:scale-110 ${
                            status ? STATUS_CONFIG[status].class : "bg-muted/50 text-muted-foreground border-muted"
                          }`}
                        >
                          {status ? STATUS_CONFIG[status].label : "—"}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
