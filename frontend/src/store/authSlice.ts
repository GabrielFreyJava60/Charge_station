import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { User } from "@/types";
import { signIn as cognitoSignIn, getTokensFromRefreshToken } from "@/services/auth/authService";
import { tokenStorage } from "@/services/tokenStorage";
import { getLogger } from "@/services/logging";

const logger = getLogger("authSlice");

export type AuthStatus = 'idle' | 'restoring' | 'authenticated' | 'unauthenticated';

interface AuthState {
    user: User | null;
    status: AuthStatus;
}

const initialState: AuthState = {
    user: null,
    status: tokenStorage.getRefreshToken() ? 'restoring' : 'unauthenticated',
};

export const restoreSession = createAsyncThunk<User>(
    'auth/restoreSession',
    async () => {
        const refreshToken = tokenStorage.getRefreshToken();
        if (!refreshToken) {
            throw new Error("No refresh token available");
        }
        const result = await getTokensFromRefreshToken(refreshToken);
        tokenStorage.setAccessToken(result.session.accessToken);
        if (result.session.refreshToken !== refreshToken) {
            tokenStorage.setRefreshToken(result.session.refreshToken);
        }
        logger.debug("Session restored successfully");
        return result.user;
    },
);

export const login = createAsyncThunk<User, { email: string; password: string }>(
    'auth/login',
    async ({ email, password }) => {
        const result = await cognitoSignIn(email, password);
        tokenStorage.setAccessToken(result.session.accessToken);
        tokenStorage.setRefreshToken(result.session.refreshToken);
        logger.debug("Login successful");
        return result.user;
    },
);

export const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        logout(state) {
            state.user = null;
            state.status = 'unauthenticated';
            tokenStorage.clear();
            logger.debug("Logout completed");
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(restoreSession.fulfilled, (state, action) => {
                state.user = action.payload;
                state.status = 'authenticated';
            })
            .addCase(restoreSession.rejected, (state) => {
                state.user = null;
                state.status = 'unauthenticated';
                tokenStorage.clear();
                logger.debug("Session restore failed");
            })
            .addCase(login.fulfilled, (state, action) => {
                state.user = action.payload;
                state.status = 'authenticated';
            })
            .addCase(login.rejected, (state) => {
                state.user = null;
                state.status = 'unauthenticated';
            });
    },
});

export const { logout } = authSlice.actions;

export default authSlice.reducer;
