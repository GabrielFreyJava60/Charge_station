import { login, logout } from "@/store/authSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { signUp } from "@/services/auth/authService";
import type { User } from "@/types";

export function useAuth() {
    const dispatch = useAppDispatch();
    const { user, status } = useAppSelector((s) => s.auth);

    return {
        user,
        userRole: user?.userRole ?? null,
        isAuthenticated: status === 'authenticated',
        loading: status === 'restoring',
        signIn: (email: string, password: string): Promise<User> =>
            dispatch(login({ email, password })).unwrap(),
        signUp,
        signOut: async () => { dispatch(logout()); },
    };
}
