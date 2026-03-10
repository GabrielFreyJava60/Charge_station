import { useContext } from "react";
import type { AuthContextType } from "@/types";
import { AuthContext } from "@/auth/context";

export function useAuth(): AuthContextType {
    const authContext = useContext(AuthContext);
    if (!authContext) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return authContext;
}