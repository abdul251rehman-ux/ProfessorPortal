import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import { ProfessorProvider } from "@/context/ProfessorContext";
import type { Profile } from "@/types";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const professorId = cookieStore.get("professor_session")?.value;

  if (!professorId) redirect("/login");

  const raw = cookieStore.get("professor_profile")?.value;
  const profile: Profile = raw
    ? JSON.parse(raw)
    : {
        id: professorId,
        name: null,
        email: null,
        password: null,
        phone: null,
        university_name: null,
        university_logo_url: null,
        created_at: "",
      };

  return (
    <ProfessorProvider id={professorId}>
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar profile={profile} />
        <main className="flex-1 lg:ml-60 pt-14 lg:pt-0 min-h-screen overflow-x-hidden">
          {children}
        </main>
      </div>
    </ProfessorProvider>
  );
}
