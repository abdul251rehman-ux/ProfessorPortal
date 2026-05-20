"use client";

import { createContext, useContext } from "react";

const ProfessorContext = createContext<string>("");

export function ProfessorProvider({ id, children }: { id: string; children: React.ReactNode }) {
  return <ProfessorContext.Provider value={id}>{children}</ProfessorContext.Provider>;
}

export function useProfessor(): string {
  return useContext(ProfessorContext);
}
