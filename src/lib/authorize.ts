import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createAdminClient } from "./supabase/admin";
import type { SupabaseClient } from "@supabase/supabase-js";

class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export function forbidden(): never {
  throw new HttpError(403, "Forbidden");
}

export function notFound(): never {
  throw new HttpError(404, "Not found");
}

export async function withAuth<T>(
  handler: (professorId: string, admin: SupabaseClient) => Promise<T>
): Promise<NextResponse> {
  try {
    const cookieStore = await cookies();
    const professorId = cookieStore.get("professor_session")?.value;
    if (!professorId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const admin = createAdminClient();
    const result = await handler(professorId, admin);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof HttpError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
