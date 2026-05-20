"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/useToast";
import Pagination from "@/components/ui/Pagination";
import { Plus, Users, Pencil, Trash2, X } from "lucide-react";
import type { Class, Student } from "@/types";

const PAGE_SIZE = 20;

interface Props {
  classId: string;
  cls: Class;
  initialStudents: Student[];
}

export default function StudentsTab({ classId, cls, initialStudents }: Props) {
  const [students, setStudents] = useState<Student[]>(initialStudents);
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editStudent, setEditStudent] = useState<Student | null>(null);
  const [rollPrefix, setRollPrefix] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const [studentName, setStudentName] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { toast } = useToast();

  const totalPages = Math.max(1, Math.ceil(students.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = students.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const openAdd = () => {
    setEditStudent(null);
    const prefix = cls.roll_number_prefix || "";
    const nextNum = String(students.length + 1).padStart(2, "0");
    setRollPrefix(prefix);
    setRollNumber(prefix ? nextNum : "");
    setStudentName("");
    setShowModal(true);
  };

  const openEdit = (s: Student) => {
    setEditStudent(s);
    const prefix = cls.roll_number_prefix || "";
    if (prefix && s.roll_number.startsWith(prefix)) {
      setRollPrefix(prefix);
      setRollNumber(s.roll_number.slice(prefix.length));
    } else {
      setRollPrefix("");
      setRollNumber(s.roll_number);
    }
    setStudentName(s.name);
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const full_roll = (rollPrefix + rollNumber).trim();
    try {
      if (editStudent) {
        const res = await fetch(`/api/data/students/${editStudent.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: studentName.trim(), roll_number: full_roll }),
        });
        if (!res.ok) throw new Error((await res.json()).error);
        const data: Student = await res.json();
        setStudents(prev => prev.map(s => s.id === data.id ? data : s));
        toast("Student updated", "success");
      } else {
        const res = await fetch("/api/data/students", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ class_id: classId, name: studentName.trim(), roll_number: full_roll }),
        });
        if (!res.ok) throw new Error((await res.json()).error);
        const data: Student = await res.json();
        setStudents(prev => [...prev, data]);
        toast("Student added", "success");
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
      const res = await fetch(`/api/data/students/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error);
      setStudents(prev => prev.filter(s => s.id !== id));
      setDeleteId(null);
      toast("Student removed", "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to delete", "error");
      setDeleteId(null);
    }
  };

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-slate-500">{students.length} student{students.length !== 1 ? "s" : ""} enrolled</p>
        <button onClick={openAdd}
          className="flex items-center gap-1.5 bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold px-3.5 py-2 rounded-xl transition shadow-lg shadow-primary-600/20">
          <Plus className="w-3.5 h-3.5" /> Add Student
        </button>
      </div>

      {students.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-10 text-center">
          <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No students yet</p>
          <button onClick={openAdd} className="mt-3 text-primary-600 text-sm font-medium hover:text-primary-700 flex items-center gap-1 mx-auto">
            <Plus className="w-3.5 h-3.5" /> Add first student
          </button>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide w-20">Roll #</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Name</th>
                    <th className="px-4 py-3 w-20"></th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((s, i) => (
                    <motion.tr key={s.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                      className="border-b border-slate-50 hover:bg-slate-50 transition group">
                      <td className="px-4 py-3 font-mono text-slate-600 font-medium">{s.roll_number}</td>
                      <td className="px-4 py-3 text-slate-800 font-medium">{s.name}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition">
                          <button onClick={() => openEdit(s)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => setDeleteId(s.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <Pagination page={safePage} totalPages={totalPages} onPage={setPage} />
        </>
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
                <h2 className="text-lg font-bold text-slate-800">{editStudent ? "Edit Student" : "Add Student"}</h2>
                <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Roll Number *</label>
                  {rollPrefix ? (
                    <div className="flex rounded-xl border border-slate-200 bg-slate-50 focus-within:bg-white focus-within:ring-2 focus-within:ring-primary-500/30 focus-within:border-primary-400 transition overflow-hidden">
                      <span className="px-3.5 py-2.5 text-sm font-mono text-slate-400 bg-slate-100 border-r border-slate-200 select-none whitespace-nowrap">
                        {rollPrefix}
                      </span>
                      <input required autoFocus value={rollNumber} onChange={e => setRollNumber(e.target.value)}
                        placeholder="01"
                        className="flex-1 px-3 py-2.5 bg-transparent text-sm font-mono text-slate-800 placeholder:text-slate-400 focus:outline-none" />
                    </div>
                  ) : (
                    <input required value={rollNumber} onChange={e => setRollNumber(e.target.value)}
                      placeholder="e.g. CS-21-001"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 text-sm text-slate-800 placeholder:text-slate-400 transition" />
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Full Name *</label>
                  <input required value={studentName} onChange={e => setStudentName(e.target.value)}
                    placeholder="e.g. Ali Hassan"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 text-sm text-slate-800 placeholder:text-slate-400 transition" />
                </div>
                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition">Cancel</button>
                  <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold transition disabled:opacity-60 flex items-center justify-center gap-2">
                    {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : (editStudent ? "Save" : "Add Student")}
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
              <h2 className="text-lg font-bold text-slate-800 mb-1">Remove Student?</h2>
              <p className="text-slate-500 text-sm mb-6">This will delete the student and all their attendance and marks records.</p>
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
