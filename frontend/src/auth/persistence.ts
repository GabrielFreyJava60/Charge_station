import type { User } from "@/types";

const USER_STORAGE_KEY = "user_storage_key";
const TOKEN_STORAGE_KEY = "token_storage_key";

export function saveUser(user: User) {
    sessionStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
}

export function restoreUser(): User | null {
    const payload = sessionStorage.getItem(USER_STORAGE_KEY);
    if (payload) {
        const user: User = JSON.parse(payload);
        return user;
    }
    return null;
}

export function saveToken(token: string) {
    sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
}

export function restoreToken(): string | null {
    return sessionStorage.getItem(TOKEN_STORAGE_KEY);
}

export function clearSessionStorage() {
    sessionStorage.removeItem(USER_STORAGE_KEY);
    sessionStorage.removeItem(TOKEN_STORAGE_KEY);
}