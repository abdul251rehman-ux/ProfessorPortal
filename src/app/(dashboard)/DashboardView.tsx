"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { BookOpen, Users, Layers, CalendarCheck, ArrowRight } from "lucide-react";
import type { Class } from "@/types";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.35 },
  }),
};

interface Props {
  professorName: string;
  stats: { classes: number; students: number; subjects: number; lectures: number };
  recentClasses: Class[];
}

export default function DashboardView({ professorName, stats, recentClasses }: Props) {
  const statCards = [
    { label: "Classes", value: stats.classes, icon: BookOpen, color: "bg-primary-50 text-primary-600", iconBg: "bg-primary-100" },
    { label: "Students", value: stats.students, icon: Users, color: "bg-cyan-50 text-cyan-600", iconBg: "bg-cyan-100" },
    { label: "Subjects", value: stats.subjects, icon: Layers, color: "bg-violet-50 text-violet-600", iconBg: "bg-violet-100" },
    { label: "Lectures", value: stats.lectures, icon: CalendarCheck, color: "bg-emerald-50 text-emerald-600", iconBg: "bg-emerald-100" },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Welcome back, {professorName} 👋</h1>
        <p className="text-slate-500 mt-1 text-sm">Here&apos;s an overview of your classes.</p>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((card, i) => (
          <motion.div
            key={card.label}
            custom={i}
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className={`w-10 h-10 ${card.iconBg} rounded-xl flex items-center justify-center mb-3`}>
              <card.icon className={`w-5 h-5 ${card.color.split(" ")[1]}`} />
            </div>
            <p className="text-2xl font-bold text-slate-800">{card.value}</p>
            <p className="text-slate-500 text-sm mt-0.5">{card.label}</p>
          </motion.div>
        ))}
      </div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-800">Your Classes</h2>
          <Link href="/classes" className="text-primary-600 text-sm font-medium hover:text-primary-700 flex items-center gap-1">
            View all <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentClasses.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-10 text-center">
            <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No classes yet</p>
            <p className="text-slate-400 text-sm mt-1">Go to Classes to add your first class.</p>
            <Link href="/classes" className="mt-4 inline-flex items-center gap-2 bg-primary-600 text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-primary-700 transition">
              Add Class <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentClasses.map((cls, i) => (
              <motion.div key={cls.id} custom={i + 4} variants={fadeUp} initial="hidden" animate="show">
                <Link
                  href={`/classes/${cls.id}`}
                  className="block bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md hover:border-primary-200 transition-all group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-9 h-9 bg-primary-100 rounded-xl flex items-center justify-center">
                      <BookOpen className="w-4.5 h-4.5 text-primary-600" />
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-primary-500 group-hover:translate-x-0.5 transition-all" />
                  </div>
                  <p className="font-semibold text-slate-800 group-hover:text-primary-600 transition-colors">{cls.name}</p>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {cls.section && <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-lg">Section {cls.section}</span>}
                    {cls.semester && <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-lg">{cls.semester}</span>}
                    {cls.year && <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-lg">{cls.year}</span>}
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
