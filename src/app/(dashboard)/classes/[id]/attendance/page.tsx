"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/useToast";
import { exportToPDF, exportToExcel } from "@/lib/export";
import { formatDate, attendanceBg } from "@/lib/utils";
import {
  ArrowLeft, Plus, X, CalendarCheck, CheckCircle2,
  XCircle, BarChart3, Download, FileSpreadsheet
} from "lucide-react";
import AttendanceChart from "@/components/charts/AttendanceChart";
import type { Subject, Student, Lecture, Attendance } from "@/types";

type ViewMode = "mark" | "summary";

export default function AttendancePage() {
  const { id: classId } = useParams<{ id: string }>();
  const supabase = createClient();
  const { toast } = useToast();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [selectedLectureId, setSelectedLectureId] = useState<string>("");
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("mark");
  const [loading, setLoading] = useState(true);
  const [lecturesLoading, setLecturesLoading] = useState(false);

  const [showAddLecture, setShowAddLecture] = useState(false);
  const [lectureForm, setLectureForm] = useState({ date: new Date().toISOString().split("T")[0], topic: "" });
  const [savingLecture, setSavingLecture] = useState(false);

  const [className, setClassName] = useState("");

  useEffect(() => {
    async function init() {
      const [clsRes, studRes, subRes] = await Promise.all([
        supabase.from("classes").select("name").eq("id", classId).single(),
        supabase.from("students").select("*").eq("class_id", classId).order("roll_number"),
        supabase.from("subjects").select("*").eq("class_id", classId).order("name"),
      ]);
      setClassName(clsRes.data?.name || "");
      setStudents(studRes.data || []);
      setSubjects(subRes.data || []);
      if (subRes.data && subRes.data.length > 0) setSelectedSubjectId(subRes.data[0].id);
      setLoading(false);
    }
    init();
  }, [classId]);

  const loadLectures = useCallback(async (subjectId: string) => {
    if (!subjectId) return;
    setLecturesLoading(true);
    const { data: lectureData } = await supabase
      .from("lectures").select("*").eq("subject_id", subjectId).order("date", { ascending: false });
    const lecs = lectureData || [];
    setLectures(lecs);
    setSelectedLectureId(lecs.length > 0 ? lecs[0].id : "");
    if (lecs.length > 0) {
      const { data: attData } = await supabase
        .from("attendance").select("*").in("lecture_id", lecs.map(l => l.id));
      setAttendance(attData || []);
    } else {
      setAttendance([]);
    }
    setLecturesLoading(false);
  }, [supabase]);

  useEffect(() => {
    if (selectedSubjectId) loadLectures(selectedSubjectId);
  }, [selectedSubjectId, loadLectures]);

  const toggleAttendance = async (studentId: string) => {
    if (!selectedLectureId) return;
    const existing = attendance.find(a => a.student_id === studentId && a.lecture_id === selectedLectureId);
    if (!existing) return;
    const newPresent = !existing.present;
    // Optimistic update
    setAttendance(prev => prev.map(a => a.id === existing.id ? { ...a, present: newPresent } : a));
    try {
      const res = await fetch("/api/data/attendance", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lecture_id: selectedLectureId, records: [{ student_id: studentId, present: newPresent }] }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
    } catch (err) {
      // Revert on error
      setAttendance(prev => prev.map(a => a.id === existing.id ? { ...a, present: existing.present } : a));
      toast(err instanceof Error ? err.message : "Failed to update attendance", "error");
    }
  };

  const markAll = async (present: boolean) => {
    if (!selectedLectureId) return;
    const lectureStudents = attendance.filter(a => a.lecture_id === selectedLectureId);
    // Optimistic update
    setAttendance(prev => prev.map(a => a.lecture_id === selectedLectureId ? { ...a, present } : a));
    try {
      const res = await fetch("/api/data/attendance", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lecture_id: selectedLectureId,
          records: lectureStudents.map(a => ({ student_id: a.student_id, present })),
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to update attendance", "error");
      loadLectures(selectedSubjectId); // Revert by reloading
    }
  };

  const handleAddLecture = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubjectId) return;
    setSavingLecture(true);
    try {
      const res = await fetch("/api/data/lectures", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject_id: selectedSubjectId, date: lectureForm.date, topic: lectureForm.topic.trim() || null }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      const { lecture, attendance: newAtt } = await res.json();
      setLectures(prev => [lecture, ...prev]);
      setSelectedLectureId(lecture.id);
      setAttendance(prev => [...prev, ...newAtt]);
      setShowAddLecture(false);
      setLectureForm({ date: new Date().toISOString().split("T")[0], topic: "" });
      toast("Lecture added", "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to add lecture", "error");
    } finally {
      setSavingLecture(false);
    }
  };

  const summaryData = students.map(s => {
    const total = lectures.length;
    const present = attendance.filter(a => a.student_id === s.id && a.present).length;
    const pct = total > 0 ? Math.round((present / total) * 100) : 0;
    return { ...s, total, present, pct };
  });

  const selectedLecturePresent = attendance.filter(a => a.lecture_id === selectedLectureId && a.present).length;
  const currentLectureAttendance = attendance.filter(a => a.lecture_id === selectedLectureId);

  const handleExportPDF = () => exportToPDF("attendance-export", `Attendance_${className}`);
  const handleExportExcel = () => {
    if (viewMode === "summary") {
      exportToExcel(
        summaryData.map(s => ({
          "Roll #": s.roll_number, Name: s.name,
          "Present": s.present, "Total Lectures": s.total, "Attendance %": `${s.pct}%`
        })),
        `Attendance_${className}`
      );
    } else {
      const selectedLecture = lectures.find(l => l.id === selectedLectureId);
      exportToExcel(
        students.map(s => ({
          "Roll #": s.roll_number, Name: s.name,
          "Date": selectedLecture ? formatDate(selectedLecture.date) : "",
          "Status": attendance.find(a => a.student_id === s.id && a.lecture_id === selectedLectureId)?.present ? "Present" : "Absent"
        })),
        `Attendance_${className}_${selectedLecture?.date || ""}`
      );
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <Link href={`/classes/${classId}`} className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-700 text-sm mb-3 transition">
          <ArrowLeft className="w-4 h-4" /> {className}
        </Link>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <CalendarCheck className="w-6 h-6 text-accent-500" /> Attendance
          </h1>
          <div className="flex gap-2">
            <button onClick={handleExportPDF}
              className="flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl transition">
              <Download className="w-3.5 h-3.5" /> PDF
            </button>
            <button onClick={handleExportExcel}
              className="flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl transition">
              <FileSpreadsheet className="w-3.5 h-3.5" /> Excel
            </button>
          </div>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="mb-5">
        {subjects.length === 0 ? (
          <div className="bg-amber-50 text-amber-700 rounded-xl px-4 py-3 text-sm border border-amber-200">
            No subjects found. <Link href={`/classes/${classId}`} className="underline font-medium">Add subjects first.</Link>
          </div>
        ) : (
          <div className="flex gap-2 flex-wrap">
            {subjects.map(sub => (
              <button key={sub.id} onClick={() => { setSelectedSubjectId(sub.id); setViewMode("mark"); }}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  selectedSubjectId === sub.id
                    ? "bg-accent-500 text-white shadow-lg shadow-accent-500/20"
                    : "bg-white text-slate-600 border border-slate-200 hover:border-accent-300 hover:text-accent-600"
                }`}>
                {sub.name} {sub.code && <span className="opacity-70 text-xs">({sub.code})</span>}
              </button>
            ))}
          </div>
        )}
      </motion.div>

      {selectedSubjectId && (
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit mb-5">
          <button onClick={() => setViewMode("mark")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === "mark" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
            Mark Attendance
          </button>
          <button onClick={() => setViewMode("summary")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${viewMode === "summary" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
            <BarChart3 className="w-3.5 h-3.5" /> Summary
          </button>
        </div>
      )}

      {lecturesLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-7 h-7 border-2 border-accent-200 border-t-accent-500 rounded-full animate-spin" />
        </div>
      ) : (
        <div id="attendance-export">
          <AnimatePresence mode="wait">
            {viewMode === "mark" && (
              <motion.div key="mark" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <div className="lg:col-span-1">
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-700">Lectures ({lectures.length})</span>
                      <button onClick={() => setShowAddLecture(true)}
                        className="flex items-center gap-1 text-xs font-semibold text-white bg-accent-500 hover:bg-accent-600 px-2.5 py-1.5 rounded-lg transition">
                        <Plus className="w-3.5 h-3.5" /> Add
                      </button>
                    </div>
                    <div className="max-h-80 overflow-y-auto scrollbar-thin">
                      {lectures.length === 0 ? (
                        <div className="p-6 text-center text-slate-400 text-sm">
                          No lectures yet.<br />
                          <button onClick={() => setShowAddLecture(true)} className="text-accent-500 font-medium mt-1 hover:text-accent-600">Add one now</button>
                        </div>
                      ) : (
                        lectures.map(lec => {
                          const presentCount = attendance.filter(a => a.lecture_id === lec.id && a.present).length;
                          const isSelected = selectedLectureId === lec.id;
                          return (
                            <button key={lec.id} onClick={() => setSelectedLectureId(lec.id)}
                              className={`w-full text-left px-4 py-3 border-b border-slate-50 transition hover:bg-slate-50 ${isSelected ? "bg-accent-50 border-l-2 border-l-accent-400" : ""}`}>
                              <p className={`text-sm font-medium ${isSelected ? "text-accent-700" : "text-slate-700"}`}>{formatDate(lec.date)}</p>
                              {lec.topic && <p className="text-xs text-slate-400 truncate mt-0.5">{lec.topic}</p>}
                              <p className="text-xs text-slate-400 mt-0.5">{presentCount}/{students.length} present</p>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-2">
                  {!selectedLectureId ? (
                    <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center h-full flex flex-col items-center justify-center">
                      <CalendarCheck className="w-12 h-12 text-slate-300 mb-3" />
                      <p className="text-slate-500 font-medium">Select a lecture to mark attendance</p>
                    </div>
                  ) : (
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                      <div className="p-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
                        <div>
                          <p className="text-sm font-semibold text-slate-700">
                            {formatDate(lectures.find(l => l.id === selectedLectureId)?.date || "")}
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5">{selectedLecturePresent}/{students.length} present</p>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => markAll(true)}
                            className="flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition">
                            <CheckCircle2 className="w-3.5 h-3.5" /> All Present
                          </button>
                          <button onClick={() => markAll(false)}
                            className="flex items-center gap-1 text-xs font-medium text-red-500 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition">
                            <XCircle className="w-3.5 h-3.5" /> All Absent
                          </button>
                        </div>
                      </div>
                      <div className="overflow-x-auto max-h-96 overflow-y-auto scrollbar-thin">
                        {students.length === 0 ? (
                          <div className="p-8 text-center text-slate-400 text-sm">No students in this class.</div>
                        ) : (
                          <table className="w-full text-sm">
                            <thead className="sticky top-0 bg-white border-b border-slate-100">
                              <tr>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide w-20">Roll #</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Name</th>
                                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide text-right">Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {students.map((s, i) => {
                                const att = currentLectureAttendance.find(a => a.student_id === s.id);
                                const isPresent = att?.present ?? false;
                                return (
                                  <motion.tr key={s.id} initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                                    className="border-b border-slate-50 hover:bg-slate-50 transition">
                                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{s.roll_number}</td>
                                    <td className="px-4 py-3 text-slate-800 font-medium">{s.name}</td>
                                    <td className="px-4 py-3 text-right">
                                      <button onClick={() => toggleAttendance(s.id)}
                                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                          isPresent ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" : "bg-red-100 text-red-600 hover:bg-red-200"
                                        }`}>
                                        {isPresent ? "P" : "A"}
                                      </button>
                                    </td>
                                  </motion.tr>
                                );
                              })}
                            </tbody>
                          </table>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {viewMode === "summary" && (
              <motion.div key="summary" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                {lectures.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center">
                    <CalendarCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500">No lectures recorded yet.</p>
                  </div>
                ) : (
                  <div className="space-y-5">
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                      <h3 className="text-sm font-semibold text-slate-700 mb-4">Attendance Overview</h3>
                      <AttendanceChart data={summaryData.map(s => ({ name: s.roll_number, pct: s.pct, fullName: s.name }))} />
                    </div>
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-slate-100">
                              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Roll #</th>
                              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Name</th>
                              <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Present</th>
                              <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Total</th>
                              <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Attendance %</th>
                            </tr>
                          </thead>
                          <tbody>
                            {summaryData.map((s, i) => (
                              <motion.tr key={s.id} initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                                className="border-b border-slate-50 hover:bg-slate-50">
                                <td className="px-4 py-3 font-mono text-xs text-slate-500">{s.roll_number}</td>
                                <td className="px-4 py-3 text-slate-800 font-medium">{s.name}</td>
                                <td className="px-4 py-3 text-center text-slate-600">{s.present}</td>
                                <td className="px-4 py-3 text-center text-slate-500">{s.total}</td>
                                <td className="px-4 py-3 text-right">
                                  <span className={`inline-block px-2.5 py-0.5 rounded-lg text-xs font-bold border ${attendanceBg(s.pct)}`}>
                                    {s.pct}%
                                  </span>
                                </td>
                              </motion.tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      <AnimatePresence>
        {showAddLecture && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowAddLecture(false)} />
            <motion.div initial={{ scale: 0.94, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.94, opacity: 0 }}
              className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 z-10">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-slate-800">Add Lecture</h2>
                <button onClick={() => setShowAddLecture(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleAddLecture} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Date *</label>
                  <input type="date" required value={lectureForm.date}
                    onChange={e => setLectureForm(f => ({ ...f, date: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-accent-500/30 focus:border-accent-400 text-sm text-slate-800 transition" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Topic (optional)</label>
                  <input type="text" value={lectureForm.topic}
                    onChange={e => setLectureForm(f => ({ ...f, topic: e.target.value }))}
                    placeholder="e.g. Introduction to Arrays"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-accent-500/30 focus:border-accent-400 text-sm text-slate-800 placeholder:text-slate-400 transition" />
                </div>
                <p className="text-xs text-slate-400">All {students.length} student{students.length !== 1 ? "s" : ""} will be marked absent by default.</p>
                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => setShowAddLecture(false)}
                    className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition">Cancel</button>
                  <button type="submit" disabled={savingLecture}
                    className="flex-1 py-2.5 rounded-xl bg-accent-500 hover:bg-accent-600 text-white text-sm font-semibold transition disabled:opacity-60 flex items-center justify-center gap-2">
                    {savingLecture ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Add Lecture"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
