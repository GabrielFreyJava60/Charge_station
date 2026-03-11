import { useState, type FC, type PropsWithChildren } from "react";
import type { UserRole, AuthSession, User, AuthContextType } from "@/types";
import { AuthContext } from "./context";
import { signIn, signUp } from "@/services/auth/authService";
import { getLogger } from "@/services/logging";

const logger = getLogger("Auth");

function buildErrorMessage(error: unknown, prefix: string): string {
    if (error instanceof Error) {
        return prefix + error.message;
    }
    return prefix + "Unknown error";
}

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

            throw new Error(buildErrorMessage("Sign in failed. Error: ", (error as Error).message));
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

    const signUpHandler = async (email: string, password: string) => {
        try {
            await signUp(email, password);
            logger.debug("SIGN UP DONE");
        }
        catch (error) {
            logger.error("Error while signing up: ", error);
        }
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