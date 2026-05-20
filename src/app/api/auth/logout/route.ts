import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete("professor_session");
  cookieStore.delete("professor_profile");
  return NextResponse.json({ ok: true });
}
