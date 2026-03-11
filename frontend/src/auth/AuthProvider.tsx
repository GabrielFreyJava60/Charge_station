import { useState, type FC, type PropsWithChildren } from "react";
import type { UserRole, AuthSession, User, AuthContextType } from "@/types";
import { AuthContext } from "./context";
import { signIn, signUp } from "@/services/auth/authService";
import { getLogger } from "@/services/logging";

const logger = getLogger("Auth");

export const AuthProvider: FC<PropsWithChildren> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [userRole, setUserRole] = useState<UserRole | null>(null);
    const [session, setSession] = useState<AuthSession | null>(null);
    const [loading, setLoading] = useState<boolean>(false);

    
    const signInHandler = async (email: string, password: string): Promise<User> => {
        setLoading(true);
        try {
            const authResult = await signIn(email, password);
            setUser(authResult.user);
            setUserRole(authResult.user.userRole);
            setSession(authResult.session);
            logger.debug("SIGN IN SUCCESSFUL");

            return authResult.user;
        }
        catch (error) {
            logger.error("Error while signing in: ", error);
            setUser(null);
            setUserRole(null);
            setSession(null);

            throw error;
        }
        finally {
            setLoading(false);
        }
    };

    const signOutHandler = async () => {
        setUser(null);
        setUserRole(null);
        setSession(null);
        logger.debug("SIGN OUT DONE");
    }

    const signUpHandler = async (email: string, password: string) => {
        await signUp(email, password);
        logger.debug("SIGN UP COMPLETE");
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