export const designationOptions = [
  { value: "Teacher", label: "Teacher" },
  { value: "Master Teacher", label: "Master Teacher" },
  { value: "School Head", label: "School Head" },
  { value: "Others", label: "Others" },
];

export const normalizeDesignationValue = (value?: string | null) => {
  const legacyValues: Record<string, string> = {
    teacher: "Teacher",
    master_teacher: "Master Teacher",
    school_head: "School Head",
    others: "Others",
  };

  return value ? legacyValues[value] ?? value : "";
};

export const teacherPositionOptions = [
  "Teacher I",
  "Teacher II",
  "Teacher III",
  "Teacher IV",
  "Teacher V",
  "Teacher VI",
  "Teacher VII",
  "Master Teacher I",
  "Master Teacher II",
  "Master Teacher III",
  "Master Teacher IV",
].map((label) => ({ value: label, label }));

export const schoolHeadPositionOptions = [
  "Teacher I (TIC)",
  "Teacher II (TIC)",
  "Teacher III (TIC)",
  "Teacher IV (TIC)",
  "Teacher V (TIC)",
  "Head Teacher I",
  "Head Teacher II",
  "Head Teacher III",
  "Head Teacher IV",
  "Head Teacher V",
  "Head Teacher VI",
  "Head Teacher VII",
  "Principal I",
  "Principal II",
  "Principal III",
  "Principal IV",
  "TECHVOC Ad",
].map((label) => ({ value: label, label }));

export const educationalAttainmentOptions = [
  "Bachelor's Degree",
  "With Master's Units",
  "Master's Degree",
  "With Doctoral Units",
  "Doctoral Degree",
].map((label) => ({ value: label, label }));

export const specializationOptions = [
  "General Education",
  "English",
  "Math",
  "Science",
  "Filipino",
  "TLE/EPP",
  "ARALPAN",
  "MAPEH",
  "TechVoc",
  "Values Ed",
  "Others",
].map((label) => ({ value: label, label }));

export const yearsInServiceOptions = [
  "0-3 years",
  "4-10 years",
  "11-20 years",
  "21 years and above",
].map((label) => ({ value: label, label }));

export const gradeAssignmentOptions = [
  "Kinder",
  "Grade 1",
  "Grade 2",
  "Grade 3",
  "Grade 4",
  "Grade 5",
  "Grade 6",
  "Grade 7",
  "Grade 8",
  "Grade 9",
  "Grade 10",
  "Grade 11",
  "Grade 12",
].map((label) => ({ value: label, label }));

export const subjectOptions = [
  "English",
  "Math",
  "Science",
  "Filipino",
  "TLE/EPP",
  "ARALPAN",
  "MAPEH",
  "TechVoc",
  "Values Ed",
  "ABM",
].map((label) => ({ value: label, label }));

export const yesNoOptions = [
  { value: "Yes", label: "Yes" },
  { value: "No", label: "No" },
];

export const normalizeYesNoValue = (value?: string | null) => {
  const legacyValues: Record<string, string> = {
    yes: "Yes",
    no: "No",
  };

  return value ? legacyValues[value] ?? value : "";
};

export const readingTrainingOptions = [
  "ARAL",
  "Teaching Reading",
  "ELLN",
  "TEACEP",
  "None at all",
];

export const englishTrainingOptions = [
  "Matatag Training",
  "Upskilling of English Competence",
  "None at all",
];

export const trainingLevelOptions = [
  "International",
  "National",
  "Region",
  "Division",
  "District",
  "School",
  "N/A",
].map((label) => ({ value: label, label }));
