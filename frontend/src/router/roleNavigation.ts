import type { UserRole } from "@/types";

const ROLE_HOME: Record<UserRole, string> = {
  USER: "/user",
  ADMIN: "/admin",
  SUPPORT: "/support",
};

export function getHomePath(role: UserRole): string {
  return ROLE_HOME[role];
}