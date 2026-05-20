"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/useToast";
import { Plus, Layers, Pencil, Trash2, X, BookOpen } from "lucide-react";
import type { Subject } from "@/types";

interface Props {
  classId: string;
  initialSubjects: Subject[];
}

export default function SubjectsTab({ classId, initialSubjects }: Props) {
  const [subjects, setSubjects] = useState<Subject[]>(initialSubjects);
  const [showModal, setShowModal] = useState(false);
  const [editSubject, setEditSubject] = useState<Subject | null>(null);
  const [form, setForm] = useState({ name: "", code: "" });
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { toast } = useToast();

  const openAdd = () => { setEditSubject(null); setForm({ name: "", code: "" }); setShowModal(true); };
  const openEdit = (s: Subject) => { setEditSubject(s); setForm({ name: s.name, code: s.code || "" }); setShowModal(true); };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editSubject) {
        const res = await fetch(`/api/data/subjects/${editSubject.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: form.name.trim(), code: form.code.trim() || null }),
        });
        if (!res.ok) throw new Error((await res.json()).error);
        const data: Subject = await res.json();
        setSubjects(prev => prev.map(s => s.id === data.id ? data : s));
        toast("Subject updated", "success");
      } else {
        const res = await fetch("/api/data/subjects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ class_id: classId, name: form.name.trim(), code: form.code.trim() || null }),
        });
        if (!res.ok) throw new Error((await res.json()).error);
        const data: Subject = await res.json();
        setSubjects(prev => [...prev, data]);
        toast("Subject added", "success");
      }
      setShowModal(false);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Something went wrong", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/data/subjects/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error);
      setSubjects(prev => prev.filter(s => s.id !== id));
      setDeleteId(null);
      toast("Subject deleted", "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to delete", "error");
      setDeleteId(null);
    }
  };

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-slate-500">{subjects.length} subject{subjects.length !== 1 ? "s" : ""}</p>
        <button onClick={openAdd}
          className="flex items-center gap-1.5 bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold px-3.5 py-2 rounded-xl transition shadow-lg shadow-primary-600/20">
          <Plus className="w-3.5 h-3.5" /> Add Subject
        </button>
      </div>

      {subjects.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-10 text-center">
          <Layers className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No subjects yet</p>
          <button onClick={openAdd} className="mt-3 text-primary-600 text-sm font-medium hover:text-primary-700 flex items-center gap-1 mx-auto">
            <Plus className="w-3.5 h-3.5" /> Add first subject
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjects.map((s, i) => (
            <motion.div key={s.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 group relative hover:border-primary-200 hover:shadow-md transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="w-9 h-9 bg-violet-100 rounded-xl flex items-center justify-center">
                  <BookOpen className="w-4 h-4 text-violet-600" />
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                  <button onClick={() => openEdit(s)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition">
                    <Pencil className="w-3 h-3" />
                  </button>
                  <button onClick={() => setDeleteId(s.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
              <p className="font-semibold text-slate-800">{s.name}</p>
              {s.code && <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-lg mt-1 inline-block">{s.code}</span>}
              <div className="flex gap-2 mt-4">
                <Link href={`/classes/${classId}/attendance`}
                  className="flex-1 text-center text-xs font-medium text-accent-600 bg-accent-50 hover:bg-accent-100 rounded-lg py-1.5 transition">
                  Attendance
                </Link>
                <Link href={`/classes/${classId}/marks`}
                  className="flex-1 text-center text-xs font-medium text-violet-600 bg-violet-50 hover:bg-violet-100 rounded-lg py-1.5 transition">
                  Marks
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowModal(false)} />
            <motion.div initial={{ scale: 0.94, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.94, opacity: 0 }}
              className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 z-10">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-slate-800">{editSubject ? "Edit Subject" : "Add Subject"}</h2>
                <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Subject Name *</label>
                  <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Data Structures"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 text-sm text-slate-800 placeholder:text-slate-400 transition" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Subject Code</label>
                  <input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))}
                    placeholder="e.g. CS-301"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 text-sm text-slate-800 placeholder:text-slate-400 transition" />
                </div>
                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition">Cancel</button>
                  <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold transition disabled:opacity-60 flex items-center justify-center gap-2">
                    {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : (editSubject ? "Save" : "Add Subject")}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirm */}
      <AnimatePresence>
        {deleteId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDeleteId(null)} />
            <motion.div initial={{ scale: 0.94, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.94, opacity: 0 }} className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 z-10 text-center">
              <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4"><Trash2 className="w-6 h-6 text-red-500" /></div>
              <h2 className="text-lg font-bold text-slate-800 mb-1">Delete Subject?</h2>
              <p className="text-slate-500 text-sm mb-6">This will delete the subject and all its lectures and marks.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition">Cancel</button>
                <button onClick={() => handleDelete(deleteId)} className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition">Delete</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
