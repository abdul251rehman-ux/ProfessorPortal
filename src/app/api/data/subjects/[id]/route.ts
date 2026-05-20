import { NextRequest } from "next/server";
import { withAuth, forbidden, notFound } from "@/lib/authorize";

async function getOwnedSubject(admin: ReturnType<typeof import("@/lib/supabase/admin").createAdminClient>, id: string, professorId: string) {
  const { data } = await admin
    .from("subjects")
    .select("id, class_id, classes(professor_id)")
    .eq("id", id)
    .single();
  if (!data) notFound();
  const prof = (data.classes as unknown as { professor_id: string } | null)?.professor_id;
  if (prof !== professorId) forbidden();
  return data;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(async (professorId, admin) => {
    const { id } = await params;
    await getOwnedSubject(admin, id, professorId);
    const body = await req.json();
    const { data, error } = await admin
      .from("subjects")
      .update({ name: body.name, code: body.code ?? null })
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
    await getOwnedSubject(admin, id, professorId);
    const { error } = await admin.from("subjects").delete().eq("id", id);
    if (error) throw new Error(error.message);
    return { success: true };
  });
}
