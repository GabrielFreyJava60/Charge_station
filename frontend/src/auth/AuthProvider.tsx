import { useState, type FC, type PropsWithChildren } from "react";
import type { UserRole, AuthSession, User, AuthContextType } from "@/types";
import { AuthContext } from "./context";
import { signIn } from "@/services/auth/authService";

export const AuthProvider: FC<PropsWithChildren> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [userRole, setUserRole] = useState<UserRole | null>(null);
    const [session, setSession] = useState<AuthSession | null>(null);
    const [loading, setLoading] = useState<boolean>(false);

    const signInHandler = async (email: string, password: string) => {
        try {
            const authenticationResult = signIn(email, password);
        }
    };

    const signOut = async () => {
        setUser(null);
        setUserRole(null);
        setSession(null);
    }
    
    const value: AuthContextType = {
        user,
        userRole,
        session,
        loading,
        signOut,
    };
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};