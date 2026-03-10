import { useState, type FC, type PropsWithChildren } from "react";
import type { UserRole, AuthSession, User, AuthContextType } from "@/types";
import { AuthContext } from "./context";
import { signIn } from "@/services/auth/authService";
import { getLogger } from "@/services/logging";

const logger = getLogger("Auth");

export const AuthProvider: FC<PropsWithChildren> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [userRole, setUserRole] = useState<UserRole | null>(null);
    const [session, setSession] = useState<AuthSession | null>(null);
    const [loading, setLoading] = useState<boolean>(false);

    const signInHandler = async (email: string, password: string) => {
        setLoading(true);
        try {
            const authResult = await signIn(email, password);
            setUser(authResult.user);
            setUserRole(authResult.user.userRole);
            setSession(authResult.session);
        }
        catch (error) {
            logger.error("Error while signing in: ", error);
            setUser(null);
            setUserRole(null);
            setSession(null);
        }
        finally {
            setLoading(false);
        }
    };

    const signOutHandler = async () => {
        setUser(null);
        setUserRole(null);
        setSession(null);
    }

    const signUpHandler = async () => {
        return Promise.resolve();
    }
    
    const value: AuthContextType = {
        user,
        userRole,
        session,
        loading,
        signIn: signInHandler,
        signUp: signUpHandler,
        signOut: signOutHandler,
    };
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};