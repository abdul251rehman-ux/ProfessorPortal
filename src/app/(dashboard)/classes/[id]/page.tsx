"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, Users, Layers, CalendarCheck, BarChart3 } from "lucide-react";
import StudentsTab from "./StudentsTab";
import SubjectsTab from "./SubjectsTab";
import type { Class, Student, Subject } from "@/types";

type Tab = "students" | "subjects";

export default function ClassDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = createClient();

  const [cls, setCls] = useState<Class | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [tab, setTab] = useState<Tab>("students");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [clsRes, studRes, subRes] = await Promise.all([
        supabase.from("classes").select("*").eq("id", id).single(),
        supabase.from("students").select("*").eq("class_id", id).order("roll_number"),
        supabase.from("subjects").select("*").eq("class_id", id).order("name"),
      ]);
      if (!clsRes.data) { router.push("/classes"); return; }
      setCls(clsRes.data);
      setStudents(studRes.data || []);
      setSubjects(subRes.data || []);
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <Link href="/classes" className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-700 text-sm mb-4 transition">
          <ArrowLeft className="w-4 h-4" /> Back to Classes
        </Link>
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{cls?.name}</h1>
            <div className="flex gap-2 mt-1.5 flex-wrap">
              {cls?.section && <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-lg">Section {cls.section}</span>}
              {cls?.semester && <span className="text-xs bg-primary-50 text-primary-600 px-2 py-0.5 rounded-lg">{cls.semester}</span>}
              {cls?.year && <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-lg">{cls.year}</span>}
            </div>
          </div>
          <div className="flex gap-2">
            <Link href={`/classes/${id}/attendance`}
              className="flex items-center gap-1.5 bg-accent-500 hover:bg-accent-600 text-white text-xs font-semibold px-3.5 py-2 rounded-xl transition shadow-md shadow-accent-500/20">
              <CalendarCheck className="w-3.5 h-3.5" /> Attendance
            </Link>
            <Link href={`/classes/${id}/marks`}
              className="flex items-center gap-1.5 bg-violet-500 hover:bg-violet-600 text-white text-xs font-semibold px-3.5 py-2 rounded-xl transition shadow-md shadow-violet-500/20">
              <BarChart3 className="w-3.5 h-3.5" /> Marks
            </Link>
          </div>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
        className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit mb-6">
        {(["students", "subjects"] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${tab === t ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
            {t === "students"
              ? <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> Students ({students.length})</span>
              : <span className="flex items-center gap-1.5"><Layers className="w-3.5 h-3.5" /> Subjects ({subjects.length})</span>}
          </button>
        ))}
      </motion.div>

      <AnimatePresence mode="wait">
        {tab === "students" && cls && (
          <motion.div key="students" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            <StudentsTab classId={id} cls={cls} initialStudents={students} />
          </motion.div>
        )}
        {tab === "subjects" && (
          <motion.div key="subjects" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            <SubjectsTab classId={id} initialSubjects={subjects} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
