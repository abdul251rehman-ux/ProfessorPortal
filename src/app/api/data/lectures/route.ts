import { NextRequest } from "next/server";
import { withAuth, forbidden, notFound } from "@/lib/authorize";

export async function POST(req: NextRequest) {
  return withAuth(async (professorId, admin) => {
    const body = await req.json();
    const { data: subject } = await admin
      .from("subjects")
      .select("id, class_id, classes(professor_id)")
      .eq("id", body.subject_id)
      .single();
    if (!subject) notFound();
    const prof = (subject.classes as unknown as { professor_id: string } | null)?.professor_id;
    if (prof !== professorId) forbidden();

    const { data: lecture, error: lecErr } = await admin
      .from("lectures")
      .insert({ professor_id: professorId, subject_id: body.subject_id, date: body.date, topic: body.topic ?? null })
      .select()
      .single();
    if (lecErr || !lecture) throw new Error(lecErr?.message ?? "Failed to create lecture");

    // Auto-create absent attendance rows for all students in the class
    const { data: students } = await admin
      .from("students")
      .select("id")
      .eq("class_id", subject.class_id);

    if (students && students.length > 0) {
      const attRecords = students.map((s) => ({
        lecture_id: lecture.id,
        student_id: s.id,
        present: false,
      }));
      const { data: att, error: attErr } = await admin
        .from("attendance")
        .insert(attRecords)
        .select();
      if (attErr) throw new Error(attErr.message);
      return { lecture, attendance: att ?? [] };
    }

    return { lecture, attendance: [] };
  });
}
