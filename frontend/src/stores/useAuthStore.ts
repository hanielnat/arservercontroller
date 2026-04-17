import { useApiFetch } from "@/composables/useApiFetch";
import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { Router } from "vue-router";

interface User {
    id: number;
    name: string;
    email: string;
    role: "admin" | "moderator" | "user";
}

interface LoginCredentials {
    username: string;
    password: string;
}

interface RegisterCredentials {
    name: string;
    email: string;
    password: string;
}

interface AuthResponse {
    accessToken: string;
    tokenType: string;
}

export const useAuthStore = defineStore("auth", () => {
    const user = ref<User | null>(null);
    const token = ref<string | null>(null);
    const isLoading = ref(false);
    const error = ref<string | null>(null);

    const isAuthenticated = computed(() => !!token.value && !!user.value);
    const isAdmin = computed(() => user.value?.role === "admin");
    const isModerator = computed(() =>
        ["admin", "moderator"].includes(user.value?.role ?? ""),
    );

    const { apiFetch } = useApiFetch();

    function setAuth(data: AuthResponse) {
        token.value = data.accessToken;
        localStorage.setItem("arserver_token", data.accessToken);
    }

    function clearAuth() {
        token.value = null;
        user.value = null;
        localStorage.removeItem("arserver_token");
        localStorage.removeItem("arserver_user");
    }

    function loadStoredAuth() {
        const storedToken = localStorage.getItem("arserver_token");
        const storedUser = localStorage.getItem("arserver_user");

        if (storedToken) {
            token.value = storedToken;
        }

        if (storedUser) {
            try {
                user.value = JSON.parse(storedUser);
            } catch {
                console.warn("Invalid stored user data, clearing");
                localStorage.removeItem("arserver_user");
            }
        }
    }

    async function login(credentials: LoginCredentials) {
        isLoading.value = true;
        error.value = null;

        const formData = new URLSearchParams();
        formData.append("username", credentials.username);
        formData.append("password", credentials.password);

        try {
            const data = await apiFetch<AuthResponse>("/users/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: formData.toString(),
            });

            if (data) {
                setAuth(data);
                await fetchCurrentUser();

                if (!user.value) {
                    error.value = "Failed to load user profile";
                    return false;
                }

                return true;
            }

            return false;
        } catch (err) {
            if (err instanceof Error) {
                console.error("Login exception:", err);
                error.value = err.message || "Login failed";
            }

            return false;
        } finally {
            isLoading.value = false;
        }
    }

    async function register(credentials: RegisterCredentials) {
        isLoading.value = true;
        error.value = null;

        try {
            const data = await apiFetch<User>("/users/register", {
                method: "POST",
                body: JSON.stringify(credentials),
            });

            if (data) {
                return true;
            }

            return false;
        } catch (err) {
            if (err instanceof Error) {
                console.error("Registration exception:", err);
                error.value = err.message || "Registration failed";
            }

            return false;
        } finally {
            isLoading.value = false;
        }
    }

    async function logout(router: Router) {
        clearAuth();
        await router.push("/login");
    }

    async function fetchCurrentUser() {
        const fromRef = token.value;
        const fromStorage = localStorage.getItem("arserver_token");
        const currentToken = fromRef || fromStorage;

        if (!currentToken) {
            console.warn("fetchCurrentUser: No token available");
            return;
        }

        try {
            const data = await apiFetch<User>(
                "/users/me",
                { method: "GET" },
                currentToken,
            );

            if (data) {
                user.value = data;
                localStorage.setItem("arserver_user", JSON.stringify(data));
            }
        } catch (err) {
            console.error("Failed to fetch current user:", err);
        }
    }

    loadStoredAuth();

    if (token.value && !user.value) {
        try {
            fetchCurrentUser();
        } catch {
            // ignore errors during init
        }
    }

    if ((import.meta.env.DEV ?? false) && !token.value) {
        login({
            username: "Admin",
            password: "rootroot",
        });
    }

    return {
        // state
        user,
        token,
        isLoading,
        error,

        // getters
        isAuthenticated,
        isAdmin,
        isModerator,

        // actions
        login,
        register,
        logout,
        fetchCurrentUser,
    };
});
