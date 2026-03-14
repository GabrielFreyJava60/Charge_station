import type { AuthPayload } from "@/types";

export function parseJwt(token: string): AuthPayload {
  const parts = token.split(".");
  if (parts.length !== 3 || !parts[1]) {
      throw new Error("Invalid JWT format");
  }
  const base64Url = parts[1];
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
       atob(base64)
      .split("")
      .map((c) => `%${(`00${c.charCodeAt(0).toString(16)}`).slice(-2)}`)
      .join(""),
  );
  return JSON.parse(jsonPayload);
}

