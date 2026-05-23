// =========================================================================
// Persona view layer (§4 phase 2).
// Same data — different surfaces. Role lives in a cookie so SSR can read it.
// =========================================================================

import { cookies } from "next/headers";
import type { Role } from "./smartos-types";

const ROLE_COOKIE = "ig_role";
export const DEFAULT_ROLE: Role = "operator";

export async function getCurrentRole(): Promise<Role> {
  const c = await cookies();
  const v = c.get(ROLE_COOKIE)?.value;
  if (v === "operator" || v === "manager" || v === "executive") return v;
  return DEFAULT_ROLE;
}

export async function setCurrentRole(r: Role): Promise<void> {
  const c = await cookies();
  c.set(ROLE_COOKIE, r, {
    httpOnly: false,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}
