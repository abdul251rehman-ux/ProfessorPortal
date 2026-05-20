import { NextRequest } from "next/server";
import { withAuth, forbidden, notFound } from "@/lib/authorize";

export async function POST(req: NextRequest) {
  return withAuth(async (professorId, admin) => {
    const body = await req.json();
    const { data: cls } = await admin.from("classes").select("id, professor_id").eq("id", body.class_id).single();
    if (!cls) notFound();
    if (cls.professor_id !== professorId) forbidden();
    const { data, error } = await admin
      .from("students")
      .insert({ professor_id: professorId, class_id: body.class_id, name: body.name, roll_number: body.roll_number ?? null })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  });
}
