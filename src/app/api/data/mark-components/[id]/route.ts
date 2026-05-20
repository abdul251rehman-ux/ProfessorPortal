import { NextRequest } from "next/server";
import { withAuth, forbidden, notFound } from "@/lib/authorize";

async function getOwnedComponent(admin: ReturnType<typeof import("@/lib/supabase/admin").createAdminClient>, id: string, professorId: string) {
  const { data } = await admin
    .from("mark_components")
    .select("id, subject_id, subjects(classes(professor_id))")
    .eq("id", id)
    .single();
  if (!data) notFound();
  const subjects = data.subjects as unknown as { classes: { professor_id: string } } | null;
  const prof = subjects?.classes?.professor_id;
  if (prof !== professorId) forbidden();
  return data;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(async (professorId, admin) => {
    const { id } = await params;
    await getOwnedComponent(admin, id, professorId);
    const body = await req.json();
    const { data, error } = await admin
      .from("mark_components")
      .update({ name: body.name, max_marks: body.max_marks })
      .eq("id", id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(async (professorId, admin) => {
    const { id } = await params;
    await getOwnedComponent(admin, id, professorId);
    const { error } = await admin.from("mark_components").delete().eq("id", id);
    if (error) throw new Error(error.message);
    return { success: true };
  });
}
