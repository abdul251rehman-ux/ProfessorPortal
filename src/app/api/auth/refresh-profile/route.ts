import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export async function POST() {
  const cookieStore = await cookies();
  const professorId = cookieStore.get("professor_session")?.value;
  if (!professorId) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data } = await supabase
    .from("profiles")
    .select("id, name, phone, university_name, university_logo_url")
    .eq("id", professorId)
    .single();

  if (data) {
    cookieStore.set("professor_profile", JSON.stringify(data), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
  }

  return NextResponse.json({ ok: true });
}
