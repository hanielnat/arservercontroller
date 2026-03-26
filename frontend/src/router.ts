import { createRouter, createWebHistory, RouteRecordRaw } from "vue-router"
import DashboardHome from "./components/DashboardHome.vue"
import { useAuthStore } from "./stores/useAuthStore"
import AboutPage from "./views/AboutPage.vue"
import AddServerPage from "./views/AddServerPage.vue"
import DashboardLayout from "./views/DashboardLayout.vue"
import ListServerPage from "./views/ListServerPage.vue"
import LoginPage from "./views/LoginPage.vue"
import RegisterPage from "./views/RegisterPage.vue"
import RemoveServerPage from "./views/RemoveServerPage.vue"

const routes: RouteRecordRaw[] = [
    // private
    {
        path: "/",
        component: DashboardLayout,
        meta: { requiresAuth: true },
        children: [
            {
                path: "",
                name: "dashboard-home",
                component: DashboardHome
            },
            {
                path: "/server/add",
                name: "add-server",
                component: AddServerPage
            },
            {
                path: "/server/remove",
                name: "remove-server",
                component: RemoveServerPage
            },
            {
                path: "/servers/",
                name: "servers",
                component: ListServerPage
            },
        ]
    },

    // public
    {
        path: "/login",
        name: "login",
        component: LoginPage,
        meta: { requiresGuest: true }
    },
    {
        path: "/register",
        name: "register",
        component: RegisterPage,
        meta: { requiresGuest: true }
    },
    {
        path: "/about",
        name: "about",
        component: AboutPage,
        meta: { requiresGuest: true }
    },
    // on 404
    {
        path: '/:pathMatch(.*)*',
        redirect: '/'
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

router.beforeEach((to, from, next) => {
    const auth = useAuthStore()

    if (to.meta.requiresAuth && !auth.isAuthenticated) {
        next({ name: 'login', query: { redirect: to.fullPath } })
        return
    }

    if (to.meta.requiresGuest && auth.isAuthenticated) {
        const redirect = to.query.redirect as string || '/'
        next(redirect)
        return
    }

    next()
})

export default router
