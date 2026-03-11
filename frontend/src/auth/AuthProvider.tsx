import { useEffect, useState, type FC, type PropsWithChildren } from "react";
import type { UserRole, AuthSession, User, AuthContextType } from "@/types";
import { AuthContext } from "./context";
import { signIn, signUp } from "@/services/auth/authService";
import { getLogger } from "@/services/logging";
import { saveUser, restoreUser, saveToken, restoreToken, clearSessionStorage } from "./persistence";

const logger = getLogger("Auth");

export const AuthProvider: FC<PropsWithChildren> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [userRole, setUserRole] = useState<UserRole | null>(null);
    const [session, setSession] = useState<AuthSession | null>(null);
    const [loading, setLoading] = useState<boolean>(false);

    useEffect(() => {
        const user = restoreUser();
        if (user) {
            setUser(user);
            setUserRole(user.userRole);
        }
        const token = restoreToken();
        if (token) {
            setSession({ accessToken: token });
        }
    }, []);

    
    const signInHandler = async (email: string, password: string): Promise<User> => {
        setLoading(true);
        try {
            const authResult = await signIn(email, password);
            setUser(authResult.user);
            setUserRole(authResult.user.userRole);
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
        setUserRole(null);
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
        userRole,
        session,
        loading,
        signIn: signInHandler,
        signUp: signUpHandler,
        signOut: signOutHandler,
    };
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};