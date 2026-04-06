import { useApi } from "@/composables/useApi";
import { useFetch } from "@vueuse/core";
import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { Router } from "vue-router";

interface User
{
    id: number
    name: string
    email: string
    role: "admin" | "moderator" | "user"
}

interface LoginCredentials
{
    username: string
    password: string
}

interface RegisterCredentials
{
    name: string
    email: string
    password: string
}

interface AuthResponse
{
    access_token: string
    token_type: string
}

export const useAuthStore = defineStore("auth", () =>
{
    const user = ref<User | null>(null)
    const token = ref<string | null>(null)
    const isLoading = ref(false)
    const error = ref<string | null>(null)

    const isAuthenticated = computed(() => !!token.value && !!user.value)
    const isAdmin = computed(() => user.value?.role === "admin")
    const isModerator = computed(() =>
        ["admin", "moderator"].includes(user.value?.role ?? ""),
    )

    const { apiUrl } = useApi()

    function setAuth(data: AuthResponse)
    {
        token.value = data.access_token

        localStorage.setItem("arserver_token", data.access_token)
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

        if (storedToken)
        {
            token.value = storedToken
        }

        if (storedUser)
        {
            try
            {
                user.value = JSON.parse(storedUser)
            }
            catch (err)
            {
                console.warn("Invalid stored user data, clearing")
                localStorage.removeItem("arserver_user")
            }
        }
    }

    async function login(credentials: LoginCredentials)
    {
        isLoading.value = true
        error.value = null

        const formData = new URLSearchParams()
        formData.append("username", credentials.username)
        formData.append("password", credentials.password)

        const response = useFetch(apiUrl("/users/login"), {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
        })
            .post(formData.toString())
            .json<AuthResponse>()

        try
        {
            await response.execute()

            if (!response.response.value?.ok)
            {
                error.value = response.error.value?.message || "Login failed"
                return false
            }
            
            if (response.data.value)
            {
                setAuth(response.data.value)
                await fetchCurrentUser()

                if (!user.value)
                {
                    error.value = "Failed to load user profile"
                    return false
                }

                return true
            }

            return false
        }
        catch (err: any)
        {
            error.value = err.message || "Login failed"
            return false
        }
        finally
        {
            isLoading.value = false
        }
    }

    async function register(credentials: RegisterCredentials)
    {
        isLoading.value = true
        error.value = null

        const response = useFetch(apiUrl("/users/register"))
            .post(credentials)
            .json<User>()

        try
        {
            await response.execute()

            if (!response.response.value?.ok)
            {
                error.value =
                    response.error.value?.message || "Registration failed"
                return false
            }
            
            if (response.data.value)
            {
                return true
            }

            return false
        }
        catch (err: any)
        {
            error.value = err.message || "Registration failed"
            return false
        }
        finally
        {
            isLoading.value = false
        }
    }

    async function logout(router: Router)
    {
        clearAuth()
        await router.push("/login")
    }

    async function fetchCurrentUser()
    {
        if (!token.value) return

        const response = useFetch<User>(apiUrl("/users/me"), {
            headers: { Authorization: `Bearer ${token.value}` },
        })

        try
        {
            await response.execute()

            if (response.error.value || !response.response.value?.ok)
            {
                console.warn("Failed to refresh user, logging out")
                // await logout(useRouter())
                // throw response.error.value
                return
            }

            user.value = response.data.value
            localStorage.setItem(
                "arserver_user",
                JSON.stringify(response.data.value),
            )
        }
        catch (err)
        {
            console.error("Failed to fetch current user:", err)
        }
    }

    loadStoredAuth()

    // Auto-refresh user data when token exists but user is missing
    if (token.value && !user.value)
    {
        try
        {
            fetchCurrentUser()
        }
        catch
        {
            // Ignore errors during init
        }
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
    }
})
