import { NextRequest } from "next/server";
import { withAuth, forbidden, notFound } from "@/lib/authorize";

async function getOwnedClass(admin: ReturnType<typeof import("@/lib/supabase/admin").createAdminClient>, id: string, professorId: string) {
  const { data } = await admin.from("classes").select("id, professor_id").eq("id", id).single();
  if (!data) notFound();
  if (data.professor_id !== professorId) forbidden();
  return data;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(async (professorId, admin) => {
    const { id } = await params;
    await getOwnedClass(admin, id, professorId);
    const body = await req.json();
    const { data, error } = await admin
      .from("classes")
      .update({
        name: body.name,
        section: body.section ?? null,
        semester: body.semester ?? null,
        year: body.year ?? null,
        roll_number_prefix: body.roll_number_prefix ?? null,
      })
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
    await getOwnedClass(admin, id, professorId);
    const { error } = await admin.from("classes").delete().eq("id", id);
    if (error) throw new Error(error.message);
    return { success: true };
  });
}
