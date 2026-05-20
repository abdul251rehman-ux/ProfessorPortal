"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  page: number;
  totalPages: number;
  onPage: (p: number) => void;
}

export default function Pagination({ page, totalPages, onPage }: Props) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-2 pt-4">
      <button
        onClick={() => onPage(page - 1)}
        disabled={page === 1}
        className={cn(
          "p-1.5 rounded-lg border transition",
          page === 1
            ? "border-slate-100 text-slate-300 cursor-not-allowed"
            : "border-slate-200 text-slate-600 hover:bg-slate-50"
        )}
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      <span className="text-sm text-slate-500 px-1">
        {page} / {totalPages}
      </span>
      <button
        onClick={() => onPage(page + 1)}
        disabled={page === totalPages}
        className={cn(
          "p-1.5 rounded-lg border transition",
          page === totalPages
            ? "border-slate-100 text-slate-300 cursor-not-allowed"
            : "border-slate-200 text-slate-600 hover:bg-slate-50"
        )}
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
