import axios from "axios"
import { defineStore } from "pinia"
import { useToast } from "primevue/usetoast"
import { computed, ref } from "vue"
import { Router, useRouter } from "vue-router"

interface User {
    id: number
    username: string
    email?: string
    name?: string
    role: "admin" | "moderator" | "user"
}

interface LoginCredentials {
    username: string
    password: string
}

interface AuthResponse {
    access_token: string
    token_type: string
    expires_in: number
    user: User
}

export const useAuthStore = defineStore("auth", () =>
{
    const toast = useToast()

    const user = ref<User | null>(null)
    const token = ref<string | null>(null)
    const isLoading = ref(false)
    const error = ref<string | null>(null)

    // const isAuthenticated = computed(() => !!token.value && !!user.value)
    const isAuthenticated = false
    const isAdmin = computed(() => user.value?.role === "admin")
    const isModerator = computed(() => ["admin", "moderator"].includes(user.value?.role ?? ""))

    function setAuth(data: AuthResponse)
    {
        token.value = data.access_token
        user.value = data.user

        localStorage.setItem("arserver_token", data.access_token)
        localStorage.setItem("arserver_user", JSON.stringify(data.user))
    }

    function clearAuth()
    {
        token.value = null
        user.value = null
        localStorage.removeItem("arserver_token")
        localStorage.removeItem("arserver_user")
    }

    function loadStoredAuth()
    {
        const storedToken = localStorage.getItem("arserver_token")
        const storedUser = localStorage.getItem("arserver_user")

        if (storedToken && storedUser)
        {
            try
            {
                token.value = storedToken
                user.value = JSON.parse(storedUser)
            }
            catch (err)
            {
                console.warn("Invalid stored auth data → clearing")
                clearAuth()
            }
        }
    }

    async function login(credentials: LoginCredentials, router: Router)
    {
        isLoading.value = true
        error.value = null

        try
        {
            const res = await axios.post<AuthResponse>(
                "/api/v1/login",
                credentials
            )

            setAuth(res.data)

            toast.add({
                severity: "success",
                summary: "Login successful",
                detail: `Welcome back, ${user.value?.username}`,
                life: 4000
            })

            await router.push("/")
        }
        catch (err: any)
        {
            error.value = err.response?.data?.detail ?? "Login failed"
            toast.add({
                severity: "error",
                summary: "Login error",
                detail: error.value,
                life: 6000
            })

            throw err
        }
        finally
        {
            isLoading.value = false
        }
    }

    async function logout(router: Router)
    {
        try
        {
            // Optional: call logout endpoint if your backend invalidates tokens
            // await axios.post("/api/v1/auth/logout")
        }
        catch
        {
        }

        clearAuth()

        toast.add({
            severity: "info",
            summary: "Logged out",
            detail: "See you soon!",
            life: 4000
        })

        await router.push("/login")
    }

    async function fetchCurrentUser()
    {
        if (!token.value)
            return

        try
        {
            const res = await axios.get<User>("/api/v1/users/me", {
                headers: { Authorization: `Bearer ${token.value}` }
            })

            user.value = res.data
            localStorage.setItem("arserver_user", JSON.stringify(res.data))
        }
        catch (err)
        {
            console.warn("Failed to refresh user → logging out")
            await logout(useRouter())
        }
    }

    loadStoredAuth()

    // Auto-refresh user data when token exists but user is missing
    if (token.value && !user.value)
    {
        fetchCurrentUser()
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
        logout,
        fetchCurrentUser,
    }
})