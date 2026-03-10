import type { FC, PropsWithChildren } from "react";
import type { UserRole, AuthSession, User, AuthContextType } from "@/types";
import { AuthContext } from "./context";

export const AuthProvider: FC<PropsWithChildren> = ({ children }) => {
    
    const value: AuthContextType = {
        user: null,
        userRole: null,
        session: null,
        loading: false,
        signOut: async () => { return; },
    };
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};