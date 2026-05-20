"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/useToast";
import Pagination from "@/components/ui/Pagination";
import { Plus, BookOpen, Pencil, Trash2, ArrowRight, X, Search } from "lucide-react";
import type { Class } from "@/types";

const PAGE_SIZE = 9;

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.05, duration: 0.25 } }),
};

interface ClassForm { name: string; section: string; semester: string; year: string; roll_number_prefix: string }
const empty: ClassForm = { name: "", section: "", semester: "", year: "", roll_number_prefix: "" };

export default function ClassesClient({ initialClasses }: { initialClasses: Class[] }) {
  const [classes, setClasses] = useState<Class[]>(initialClasses);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Class | null>(null);
  const [form, setForm] = useState<ClassForm>(empty);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { toast } = useToast();

  const openAdd = () => { setEditing(null); setForm(empty); setShowModal(true); };
  const openEdit = (cls: Class) => {
    setEditing(cls);
    setForm({ name: cls.name, section: cls.section || "", semester: cls.semester || "", year: cls.year || "", roll_number_prefix: cls.roll_number_prefix || "" });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      section: form.section.trim() || null,
      semester: form.semester.trim() || null,
      year: form.year.trim() || null,
      roll_number_prefix: form.roll_number_prefix.trim() || null,
    };
    try {
      if (editing) {
        const res = await fetch(`/api/data/classes/${editing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error((await res.json()).error);
        const data: Class = await res.json();
        setClasses(prev => prev.map(c => c.id === data.id ? data : c));
        toast("Class updated", "success");
      } else {
        const res = await fetch("/api/data/classes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error((await res.json()).error);
        const data: Class = await res.json();
        setClasses(prev => [data, ...prev]);
        toast("Class added", "success");
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
      const res = await fetch(`/api/data/classes/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error);
      setClasses(prev => prev.filter(c => c.id !== id));
      setDeleteId(null);
      toast("Class deleted", "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to delete", "error");
      setDeleteId(null);
    }
  };

  const filtered = classes.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.section || "").toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const handleSearch = (v: string) => { setSearch(v); setPage(1); };

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Classes</h1>
          <p className="text-slate-500 text-sm mt-0.5">Manage your classes and their details.</p>
        </div>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={openAdd}
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold px-4 py-2.5 rounded-xl text-sm shadow-lg shadow-primary-600/20 transition">
          <Plus className="w-4 h-4" /> Add Class
        </motion.button>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="relative mb-6">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input type="text" value={search} onChange={e => handleSearch(e.target.value)} placeholder="Search classes…"
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 transition" />
      </motion.div>

      {paginated.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">{search ? "No classes match your search." : "No classes yet."}</p>
          {!search && (
            <button onClick={openAdd} className="mt-4 inline-flex items-center gap-2 text-primary-600 font-medium text-sm hover:text-primary-700">
              <Plus className="w-4 h-4" /> Add your first class
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginated.map((cls, i) => (
              <motion.div key={cls.id} custom={i} variants={fadeUp} initial="hidden" animate="show"
                className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-primary-200 transition-all group relative">
                <Link href={`/classes/${cls.id}`} className="block p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-primary-600" />
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-primary-500 group-hover:translate-x-0.5 transition-all" />
                  </div>
                  <p className="font-semibold text-slate-800 group-hover:text-primary-600 transition-colors text-base">{cls.name}</p>
                  <div className="flex gap-1.5 mt-2 flex-wrap">
                    {cls.section && <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-lg">Sec {cls.section}</span>}
                    {cls.semester && <span className="text-xs bg-primary-50 text-primary-600 px-2 py-0.5 rounded-lg">{cls.semester}</span>}
                    {cls.year && <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-lg">{cls.year}</span>}
                  </div>
                </Link>
                <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(cls)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setDeleteId(cls.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
          <Pagination page={safePage} totalPages={totalPages} onPage={setPage} />
        </>
      )}

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowModal(false)} />
            <motion.div initial={{ scale: 0.94, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.94, opacity: 0 }}
              className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 z-10">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-slate-800">{editing ? "Edit Class" : "Add Class"}</h2>
                <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Class Name *</label>
                  <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. BS Computer Science"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 text-sm text-slate-800 placeholder:text-slate-400 transition" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {(["section", "semester", "year"] as const).map((field, idx) => (
                    <div key={field}>
                      <label className="block text-xs font-medium text-slate-600 mb-1.5 capitalize">{field}</label>
                      <input value={form[field]} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                        placeholder={idx === 0 ? "A" : idx === 1 ? "5th" : "2024"}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 text-sm text-slate-800 placeholder:text-slate-400 transition" />
                    </div>
                  ))}
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Roll No. Prefix</label>
                  <input value={form.roll_number_prefix} onChange={e => setForm(f => ({ ...f, roll_number_prefix: e.target.value }))}
                    placeholder="e.g. Compf23BSS"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 text-sm text-slate-800 placeholder:text-slate-400 transition font-mono" />
                  <p className="text-xs text-slate-400 mt-1">Students will be numbered: Compf23BSS01, Compf23BSS02…</p>
                </div>
                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => setShowModal(false)}
                    className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition">Cancel</button>
                  <button type="submit" disabled={saving}
                    className="flex-1 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold transition disabled:opacity-60 flex items-center justify-center gap-2">
                    {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : (editing ? "Save Changes" : "Add Class")}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDeleteId(null)} />
            <motion.div initial={{ scale: 0.94, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.94, opacity: 0 }}
              className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 z-10 text-center">
              <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6 text-red-500" />
              </div>
              <h2 className="text-lg font-bold text-slate-800 mb-1">Delete Class?</h2>
              <p className="text-slate-500 text-sm mb-6">This will permanently delete the class and all its data.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition">Cancel</button>
                <button onClick={() => handleDelete(deleteId)} className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition">Delete</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
