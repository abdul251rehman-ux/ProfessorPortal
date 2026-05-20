import { NextRequest } from "next/server";
import { withAuth, forbidden, notFound } from "@/lib/authorize";

export async function PATCH(req: NextRequest) {
  return withAuth(async (professorId, admin) => {
    const body = await req.json();
    // body: { lecture_id, records: [{ student_id, present }] }
    const { data: lecture } = await admin
      .from("lectures")
      .select("id, subjects(classes(professor_id))")
      .eq("id", body.lecture_id)
      .single();
    if (!lecture) notFound();
    const subjects = lecture.subjects as unknown as { classes: { professor_id: string } } | null;
    const prof = subjects?.classes?.professor_id;
    if (prof !== professorId) forbidden();

    const upserts = (body.records as { student_id: string; present: boolean }[]).map((r) => ({
      lecture_id: body.lecture_id,
      student_id: r.student_id,
      present: r.present,
    }));
    const { error } = await admin.from("attendance").upsert(upserts, { onConflict: "lecture_id,student_id" });
    if (error) throw new Error(error.message);
    return { success: true };
  });
}
