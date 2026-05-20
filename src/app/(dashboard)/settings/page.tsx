"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { useProfessor } from "@/context/ProfessorContext";
import { useToast } from "@/hooks/useToast";
import { Save, GraduationCap, User, Building2, ImageIcon, CheckCircle, Phone, Upload, X, Loader2 } from "lucide-react";

export default function SettingsPage() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [universityName, setUniversityName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [logoPreview, setLogoPreview] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  const professorId = useProfessor();
  const supabase = createClient();
  const { toast } = useToast();

  useEffect(() => {
    if (!professorId) return;
    async function load() {
      const { data } = await supabase.from("profiles").select("*").eq("id", professorId).single();
      if (data) {
        setName(data.name || "");
        setPhone(data.phone || "");
        setUniversityName(data.university_name || "");
        setLogoUrl(data.university_logo_url || "");
        setLogoPreview(data.university_logo_url || "");
      }
      setLoading(false);
    }
    load();
  }, [professorId]);

  const handleLogoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Show local preview immediately
    const reader = new FileReader();
    reader.onload = () => setLogoPreview(reader.result as string);
    reader.readAsDataURL(file);
    // Upload to storage
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload/logo", { method: "POST", body: fd });
      if (!res.ok) throw new Error((await res.json()).error);
      const { url } = await res.json();
      setLogoUrl(url);
      toast("Logo uploaded", "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Upload failed", "error");
      setLogoPreview(logoUrl);
    } finally {
      setUploading(false);
    }
  };

  const removeLogo = () => { setLogoUrl(""); setLogoPreview(""); };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (uploading) { toast("Please wait for logo upload to finish", "info"); return; }
    setSaving(true);
    try {
      const { error } = await supabase.from("profiles").update({
        name: name.trim() || null,
        phone: phone.trim() || null,
        university_name: universityName.trim() || null,
        university_logo_url: logoUrl || null,
      }).eq("id", professorId);
      if (error) throw new Error(error.message);
      await fetch("/api/auth/refresh-profile", { method: "POST" });
      setSaved(true);
      toast("Settings saved", "success");
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Save failed", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-2xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Settings</h1>
        <p className="text-slate-500 mt-1 text-sm">Update your profile and university information.</p>
      </motion.div>

      <motion.form
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        onSubmit={handleSave}
        className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
              <User className="w-4 h-4 text-slate-400" />
              Full Name
            </label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)}
              placeholder="Dr. Ahmed Khan"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 text-slate-800 placeholder:text-slate-400 transition-all text-sm" />
          </div>
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
              <Phone className="w-4 h-4 text-slate-400" />
              Phone Number
            </label>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
              placeholder="+92 300 1234567"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 text-slate-800 placeholder:text-slate-400 transition-all text-sm" />
          </div>
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
            <Building2 className="w-4 h-4 text-slate-400" />
            University Name
          </label>
          <input type="text" value={universityName} onChange={(e) => setUniversityName(e.target.value)}
            placeholder="University of Engineering & Technology"
            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 text-slate-800 placeholder:text-slate-400 transition-all text-sm" />
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
            <ImageIcon className="w-4 h-4 text-slate-400" />
            University Logo
          </label>

          {logoPreview ? (
            <div className="flex items-center gap-4 p-3 rounded-xl border border-slate-200 bg-slate-50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={logoPreview} alt="Logo" className="w-14 h-14 rounded-xl object-contain bg-white border border-slate-200 p-1" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-700 font-medium flex items-center gap-2">
                  {uploading ? (
                    <><Loader2 className="w-3.5 h-3.5 animate-spin text-primary-500" /> Uploading…</>
                  ) : "Logo uploaded"}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">Will appear in the sidebar</p>
              </div>
              {!uploading && (
                <button type="button" onClick={removeLogo}
                  className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition flex-shrink-0">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center gap-2 w-full py-8 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-primary-400 transition cursor-pointer">
              <Upload className="w-6 h-6 text-slate-400" />
              <span className="text-sm text-slate-500 font-medium">Click to upload logo</span>
              <span className="text-xs text-slate-400">PNG, JPG, SVG, ICO supported</span>
              <input type="file" accept="image/*,.ico" onChange={handleLogoFile} className="hidden" />
            </label>
          )}
        </div>

        {(logoPreview || universityName || name) && (
          <div className="rounded-xl border border-slate-100 bg-slate-950 p-4 flex items-center gap-3">
            {logoPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoPreview} alt="Logo preview"
                className="w-10 h-10 rounded-xl object-contain bg-white/10 p-1"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
            ) : (
              <div className="w-10 h-10 bg-primary-600/30 rounded-xl flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-primary-300" />
              </div>
            )}
            <div className="min-w-0">
              <p className="text-white text-sm font-semibold truncate">{universityName || "Professor Portal"}</p>
              <p className="text-primary-400 text-xs truncate">{name || "Professor"}</p>
              {phone && <p className="text-slate-500 text-xs truncate">{phone}</p>}
            </div>
            <span className="ml-auto text-xs text-slate-600 flex-shrink-0">Preview</span>
          </div>
        )}

        <div className="pt-2">
          <motion.button
            type="submit"
            disabled={saving || uploading}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-6 rounded-xl transition-all disabled:opacity-60 shadow-lg shadow-primary-600/20 text-sm"
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : saved ? (
              <CheckCircle className="w-4 h-4" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saved ? "Saved!" : saving ? "Saving…" : "Save Changes"}
          </motion.button>
        </div>
      </motion.form>
    </div>
  );
}
