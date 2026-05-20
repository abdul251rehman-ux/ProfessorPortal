import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import ClassesClient from "./ClassesClient";

export default async function ClassesPage() {
  const cookieStore = await cookies();
  const professorId = cookieStore.get("professor_session")?.value;
  if (!professorId) return null;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: classes } = await supabase
    .from("classes")
    .select("*")
    .eq("professor_id", professorId)
    .order("created_at", { ascending: false });

  return <ClassesClient initialClasses={classes || []} />;
}
