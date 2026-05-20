"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/useToast";
import { exportToPDF, exportToExcel } from "@/lib/export";
import {
  ArrowLeft, Plus, X, BarChart3, Pencil, Trash2,
  Download, FileSpreadsheet, Save
} from "lucide-react";
import MarksChart from "@/components/charts/MarksChart";
import type { Subject, Student, MarkComponent, StudentMark } from "@/types";

export default function MarksPage() {
  const { id: classId } = useParams<{ id: string }>();
  const supabase = createClient();
  const { toast } = useToast();

  const [className, setClassName] = useState("");
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
  const [components, setComponents] = useState<MarkComponent[]>([]);
  const [selectedComponentId, setSelectedComponentId] = useState<string>("");
  const [marks, setMarks] = useState<StudentMark[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [marksInput, setMarksInput] = useState<Record<string, string>>({});

  const [showComponentModal, setShowComponentModal] = useState(false);
  const [editComponent, setEditComponent] = useState<MarkComponent | null>(null);
  const [componentForm, setComponentForm] = useState({ name: "", max_marks: "100" });
  const [savingComponent, setSavingComponent] = useState(false);
  const [deleteComponentId, setDeleteComponentId] = useState<string | null>(null);

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

  const loadComponents = useCallback(async (subjectId: string) => {
    if (!subjectId) return;
    const { data: compData } = await supabase
      .from("mark_components").select("*").eq("subject_id", subjectId).order("created_at");
    const comps = compData || [];
    setComponents(comps);
    setSelectedComponentId(comps.length > 0 ? comps[0].id : "");
    if (comps.length > 0) {
      const { data: marksData } = await supabase
        .from("student_marks").select("*").in("component_id", comps.map(c => c.id));
      setMarks(marksData || []);
    } else {
      setMarks([]);
    }
  }, [supabase]);

  useEffect(() => {
    if (selectedSubjectId) loadComponents(selectedSubjectId);
  }, [selectedSubjectId, loadComponents]);

  useEffect(() => {
    if (!selectedComponentId) return;
    const input: Record<string, string> = {};
    students.forEach(s => {
      const existing = marks.find(m => m.component_id === selectedComponentId && m.student_id === s.id);
      input[s.id] = existing?.marks_obtained !== null && existing?.marks_obtained !== undefined
        ? String(existing.marks_obtained) : "";
    });
    setMarksInput(input);
  }, [selectedComponentId, marks, students]);

  const saveMarks = async () => {
    if (!selectedComponentId) return;
    setSaving(true);
    try {
      const records = students.map(s => ({
        student_id: s.id,
        marks_obtained: marksInput[s.id] !== "" && marksInput[s.id] !== undefined
          ? parseFloat(marksInput[s.id]) : null,
      }));
      const res = await fetch("/api/data/marks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ component_id: selectedComponentId, records }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      const saved: StudentMark[] = await res.json();
      setMarks(prev => {
        const filtered = prev.filter(m => m.component_id !== selectedComponentId);
        return [...filtered, ...saved];
      });
      toast("Marks saved", "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to save marks", "error");
    } finally {
      setSaving(false);
    }
  };

  const openAddComponent = () => { setEditComponent(null); setComponentForm({ name: "", max_marks: "100" }); setShowComponentModal(true); };
  const openEditComponent = (c: MarkComponent) => { setEditComponent(c); setComponentForm({ name: c.name, max_marks: String(c.max_marks) }); setShowComponentModal(true); };

  const saveComponent = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingComponent(true);
    try {
      if (editComponent) {
        const res = await fetch(`/api/data/mark-components/${editComponent.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: componentForm.name.trim(), max_marks: parseFloat(componentForm.max_marks) || 100 }),
        });
        if (!res.ok) throw new Error((await res.json()).error);
        const data: MarkComponent = await res.json();
        setComponents(prev => prev.map(c => c.id === data.id ? data : c));
        toast("Component updated", "success");
      } else {
        const res = await fetch("/api/data/mark-components", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subject_id: selectedSubjectId, name: componentForm.name.trim(), max_marks: parseFloat(componentForm.max_marks) || 100 }),
        });
        if (!res.ok) throw new Error((await res.json()).error);
        const data: MarkComponent = await res.json();
        setComponents(prev => [...prev, data]);
        setSelectedComponentId(data.id);
        toast("Component added", "success");
      }
      setShowComponentModal(false);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Something went wrong", "error");
    } finally {
      setSavingComponent(false);
    }
  };

  const deleteComponent = async (id: string) => {
    try {
      const res = await fetch(`/api/data/mark-components/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error);
      setComponents(prev => prev.filter(c => c.id !== id));
      if (selectedComponentId === id) setSelectedComponentId("");
      setDeleteComponentId(null);
      toast("Component deleted", "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to delete", "error");
      setDeleteComponentId(null);
    }
  };

  const selectedComp = components.find(c => c.id === selectedComponentId);

  const chartData = components.map(comp => {
    const compMarks = marks.filter(m => m.component_id === comp.id && m.marks_obtained !== null);
    const avg = compMarks.length > 0
      ? compMarks.reduce((s, m) => s + (m.marks_obtained || 0), 0) / compMarks.length : 0;
    return { name: comp.name, avg: Math.round(avg * 10) / 10, max: comp.max_marks };
  });

  const handleExportPDF = () => exportToPDF("marks-export", `Marks_${className}`);
  const handleExportExcel = () => {
    if (!selectedComp) return;
    const data = students.map(s => {
      const m = marks.find(x => x.component_id === selectedComponentId && x.student_id === s.id);
      return { "Roll #": s.roll_number, Name: s.name, [selectedComp.name]: m?.marks_obtained ?? "", [`Max (${selectedComp.max_marks})`]: selectedComp.max_marks };
    });
    exportToExcel(data, `Marks_${className}_${selectedComp.name}`);
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
            <BarChart3 className="w-6 h-6 text-violet-500" /> Marks
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
              <button key={sub.id} onClick={() => setSelectedSubjectId(sub.id)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  selectedSubjectId === sub.id
                    ? "bg-violet-500 text-white shadow-lg shadow-violet-500/20"
                    : "bg-white text-slate-600 border border-slate-200 hover:border-violet-300 hover:text-violet-600"
                }`}>
                {sub.name} {sub.code && <span className="opacity-70 text-xs">({sub.code})</span>}
              </button>
            ))}
          </div>
        )}
      </motion.div>

      {selectedSubjectId && (
        <div id="marks-export" className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-700">Components</span>
                <button onClick={openAddComponent}
                  className="flex items-center gap-1 text-xs font-semibold text-white bg-violet-500 hover:bg-violet-600 px-2.5 py-1.5 rounded-lg transition">
                  <Plus className="w-3.5 h-3.5" /> Add
                </button>
              </div>
              <div className="p-3 space-y-1.5">
                {components.length === 0 ? (
                  <div className="py-6 text-center text-slate-400 text-sm">
                    No components yet.<br />
                    <button onClick={openAddComponent} className="text-violet-500 font-medium mt-1 hover:text-violet-600 text-xs">
                      Add Midterm, Final, etc.
                    </button>
                  </div>
                ) : (
                  components.map(comp => (
                    <div key={comp.id}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all group ${
                        selectedComponentId === comp.id
                          ? "bg-violet-50 border border-violet-200"
                          : "hover:bg-slate-50 border border-transparent"
                      }`}
                      onClick={() => setSelectedComponentId(comp.id)}>
                      <div>
                        <p className={`text-sm font-medium ${selectedComponentId === comp.id ? "text-violet-700" : "text-slate-700"}`}>{comp.name}</p>
                        <p className="text-xs text-slate-400">Max: {comp.max_marks}</p>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                        <button onClick={e => { e.stopPropagation(); openEditComponent(comp); }}
                          className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition">
                          <Pencil className="w-3 h-3" />
                        </button>
                        <button onClick={e => { e.stopPropagation(); setDeleteComponentId(comp.id); }}
                          className="p-1 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
              {chartData.length > 0 && (
                <div className="p-4 border-t border-slate-100">
                  <p className="text-xs font-semibold text-slate-500 mb-3 uppercase tracking-wide">Class Average</p>
                  <MarksChart data={chartData} />
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-2">
            {!selectedComponentId ? (
              <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center h-full flex flex-col items-center justify-center">
                <BarChart3 className="w-12 h-12 text-slate-300 mb-3" />
                <p className="text-slate-500 font-medium">Select a component to enter marks</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-700">{selectedComp?.name}</p>
                    <p className="text-xs text-slate-400">Max marks: {selectedComp?.max_marks}</p>
                  </div>
                  <motion.button onClick={saveMarks} disabled={saving}
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    className="flex items-center gap-1.5 text-xs font-semibold text-white bg-violet-500 hover:bg-violet-600 px-3.5 py-2 rounded-xl transition disabled:opacity-60">
                    {saving ? <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    Save All
                  </motion.button>
                </div>
                <div className="overflow-x-auto max-h-[500px] overflow-y-auto scrollbar-thin">
                  {students.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-sm">No students in this class.</div>
                  ) : (
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 bg-white border-b border-slate-100">
                        <tr>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide w-20">Roll #</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Name</th>
                          <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide text-right w-36">
                            Marks <span className="text-slate-300 font-normal">/ {selectedComp?.max_marks}</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {students.map((s, i) => (
                          <motion.tr key={s.id} initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                            className="border-b border-slate-50 hover:bg-slate-50 transition">
                            <td className="px-4 py-2.5 font-mono text-xs text-slate-500">{s.roll_number}</td>
                            <td className="px-4 py-2.5 text-slate-800 font-medium">{s.name}</td>
                            <td className="px-4 py-2.5 text-right">
                              <input type="number" min="0" max={selectedComp?.max_marks} step="0.5"
                                value={marksInput[s.id] ?? ""}
                                onChange={e => setMarksInput(prev => ({ ...prev, [s.id]: e.target.value }))}
                                placeholder="—"
                                className="w-24 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 text-sm text-slate-800 text-right placeholder:text-slate-300 transition" />
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <AnimatePresence>
        {showComponentModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowComponentModal(false)} />
            <motion.div initial={{ scale: 0.94, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.94, opacity: 0 }}
              className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 z-10">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-slate-800">{editComponent ? "Edit Component" : "Add Component"}</h2>
                <button onClick={() => setShowComponentModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={saveComponent} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Component Name *</label>
                  <input required value={componentForm.name} onChange={e => setComponentForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Midterm, Final, Quiz 1"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 text-sm text-slate-800 placeholder:text-slate-400 transition" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Max Marks *</label>
                  <input required type="number" min="1" step="0.5" value={componentForm.max_marks}
                    onChange={e => setComponentForm(f => ({ ...f, max_marks: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 text-sm text-slate-800 transition" />
                </div>
                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => setShowComponentModal(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition">Cancel</button>
                  <button type="submit" disabled={savingComponent}
                    className="flex-1 py-2.5 rounded-xl bg-violet-500 hover:bg-violet-600 text-white text-sm font-semibold transition disabled:opacity-60 flex items-center justify-center gap-2">
                    {savingComponent ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : (editComponent ? "Save" : "Add")}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteComponentId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDeleteComponentId(null)} />
            <motion.div initial={{ scale: 0.94, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.94, opacity: 0 }} className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 z-10 text-center">
              <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4"><Trash2 className="w-6 h-6 text-red-500" /></div>
              <h2 className="text-lg font-bold text-slate-800 mb-1">Delete Component?</h2>
              <p className="text-slate-500 text-sm mb-6">All marks for this component will be permanently deleted.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteComponentId(null)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition">Cancel</button>
                <button onClick={() => deleteComponent(deleteComponentId)} className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition">Delete</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
