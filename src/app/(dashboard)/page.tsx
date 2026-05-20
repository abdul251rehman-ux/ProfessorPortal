import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import DashboardView from "./DashboardView";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const professorId = cookieStore.get("professor_session")?.value;
  if (!professorId) return null;

  const raw = cookieStore.get("professor_profile")?.value;
  const profileCache = raw ? JSON.parse(raw) : null;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [classesRes, studentsRes, subjectsRes, lecturesRes] = await Promise.all([
    supabase.from("classes").select("*").eq("professor_id", professorId).order("created_at", { ascending: false }),
    supabase.from("students").select("id", { count: "exact", head: true }).eq("professor_id", professorId),
    supabase.from("subjects").select("id", { count: "exact", head: true }).eq("professor_id", professorId),
    supabase.from("lectures").select("id", { count: "exact", head: true }).eq("professor_id", professorId),
  ]);

  return (
    <DashboardView
      professorName={profileCache?.name || "Professor"}
      stats={{
        classes: classesRes.data?.length || 0,
        students: studentsRes.count || 0,
        subjects: subjectsRes.count || 0,
        lectures: lecturesRes.count || 0,
      }}
      recentClasses={(classesRes.data || []).slice(0, 6)}
    />
  );
}
