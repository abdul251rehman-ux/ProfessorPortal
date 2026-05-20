import { NextRequest } from "next/server";
import { withAuth, forbidden, notFound } from "@/lib/authorize";

export async function POST(req: NextRequest) {
  return withAuth(async (professorId, admin) => {
    const body = await req.json();
    const { data: subject } = await admin
      .from("subjects")
      .select("id, classes(professor_id)")
      .eq("id", body.subject_id)
      .single();
    if (!subject) notFound();
    const prof = (subject.classes as unknown as { professor_id: string } | null)?.professor_id;
    if (prof !== professorId) forbidden();
    const { data, error } = await admin
      .from("mark_components")
      .insert({ professor_id: professorId, subject_id: body.subject_id, name: body.name, max_marks: body.max_marks })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  });
}
