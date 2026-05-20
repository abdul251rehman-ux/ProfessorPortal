import { NextRequest } from "next/server";
import { withAuth, forbidden, notFound } from "@/lib/authorize";

export async function POST(req: NextRequest) {
  return withAuth(async (professorId, admin) => {
    const body = await req.json();
    // body: { component_id, records: [{ student_id, marks_obtained }] }
    const { data: component } = await admin
      .from("mark_components")
      .select("id, subjects(classes(professor_id))")
      .eq("id", body.component_id)
      .single();
    if (!component) notFound();
    const subjects = component.subjects as unknown as { classes: { professor_id: string } } | null;
    const prof = subjects?.classes?.professor_id;
    if (prof !== professorId) forbidden();

    const upserts = (body.records as { student_id: string; marks_obtained: number | null }[]).map((r) => ({
      component_id: body.component_id,
      student_id: r.student_id,
      marks_obtained: r.marks_obtained,
    }));
    const { data, error } = await admin
      .from("student_marks")
      .upsert(upserts, { onConflict: "component_id,student_id" })
      .select();
    if (error) throw new Error(error.message);
    return data;
  });
}
