import { useState, type FC, type PropsWithChildren } from "react";
import type { AuthSession, User, AuthContextType } from "@/types";
import { AuthContext } from "./context";
import { signIn, signUp } from "@/services/auth/authService";
import { getLogger } from "@/services/logging";
import { saveUser, restoreUser, saveToken, restoreToken, clearSessionStorage } from "./persistence";

const logger = getLogger("Auth");

export const AuthProvider: FC<PropsWithChildren> = ({ children }) => {
    const [user, setUser] = useState<User | null>(() => restoreUser());
    const [session, setSession] = useState<AuthSession | null>(() => {
        const token = restoreToken();
        return token ? { accessToken: token } : null;
    });
    const [loading, setLoading] = useState<boolean>(false);
    
    
    const signInHandler = async (email: string, password: string): Promise<User> => {
        setLoading(true);
        try {
            const authResult = await signIn(email, password);
            setUser(authResult.user);
            setSession(authResult.session);
            saveUser(authResult.user);
            saveToken(authResult.session.accessToken);
            logger.debug("SIGN IN SUCCESSFUL");

            return authResult.user;
        }
        catch (error) {
            logger.error("Error while signing in: ", error);
            throw error;
        }
        finally {
            setLoading(false);
        }
    };

    const signOutHandler = async () => {
        setUser(null);
        setSession(null);
        clearSessionStorage();
        logger.debug("SIGN OUT DONE");
    }

    const signUpHandler = async (email: string, password: string) => {
        await signUp(email, password);
        logger.debug("SIGN UP COMPLETE");
    }
    
    const value: AuthContextType = {
        user,
        userRole: user?.userRole ?? null,
        isAuthenticated: !!user,
        session,
        loading,
        signIn: signInHandler,
        signUp: signUpHandler,
        signOut: signOutHandler,
    };
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};