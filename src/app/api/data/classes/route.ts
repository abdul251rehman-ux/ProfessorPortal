import { NextRequest } from "next/server";
import { withAuth } from "@/lib/authorize";

export async function POST(req: NextRequest) {
  return withAuth(async (professorId, admin) => {
    const body = await req.json();
    const { data, error } = await admin
      .from("classes")
      .insert({
        professor_id: professorId,
        name: body.name,
        section: body.section ?? null,
        semester: body.semester ?? null,
        year: body.year ?? null,
        roll_number_prefix: body.roll_number_prefix ?? null,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  });
}
