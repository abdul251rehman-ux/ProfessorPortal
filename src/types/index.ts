export interface Profile {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  password: string | null;
  university_name: string | null;
  university_logo_url: string | null;
  created_at: string;
}

export interface Class {
  id: string;
  professor_id: string;
  name: string;
  section: string | null;
  semester: string | null;
  year: string | null;
  roll_number_prefix: string | null;
  created_at: string;
}

export interface Subject {
  id: string;
  professor_id: string;
  class_id: string;
  name: string;
  code: string | null;
  created_at: string;
}

export interface Student {
  id: string;
  professor_id: string;
  class_id: string;
  roll_number: string;
  name: string;
  created_at: string;
}

export interface Lecture {
  id: string;
  professor_id: string;
  subject_id: string;
  date: string;
  topic: string | null;
  created_at: string;
}

export interface Attendance {
  id: string;
  lecture_id: string;
  student_id: string;
  present: boolean;
}

export interface MarkComponent {
  id: string;
  professor_id: string;
  subject_id: string;
  name: string;
  max_marks: number;
  created_at: string;
}

export interface StudentMark {
  id: string;
  component_id: string;
  student_id: string;
  marks_obtained: number | null;
}
