import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import type { AppRole } from "@/lib/users";

const LOGIN_PATH: Record<AppRole, string> = {
  voter: "/",
  judge: "/juri/login",
  admin: "/admin/login",
};

export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

/** Kembalikan session jika user login DAN punya role yang diminta; selain itu null. */
export async function getSessionFor(role: AppRole) {
  const session = await getSession();
  return session?.user.role === role ? session : null;
}

export async function requireRole(role: AppRole) {
  const session = await getSessionFor(role);
  if (!session) redirect(LOGIN_PATH[role]);
  return session;
}

export async function signOutCurrent() {
  await auth.api.signOut({ headers: await headers() });
}
