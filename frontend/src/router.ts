import { useAuthStore } from "@/stores/useAuthStore";
import { createRouter, createWebHistory, RouteRecordRaw } from "vue-router";

const routes: RouteRecordRaw[] = [
    // private
    {
        path: "/",
        component: import("@/views/DashboardLayout.vue"),
        meta: { requiresAuth: true },
        children: [
            {
                path: "",
                name: "dashboard-home",
                component: import("@/components/DashboardHome.vue"),
            },
            {
                path: "/server/add",
                name: "add-server",
                component: import("@/views/AddServerPage.vue"),
            },
            {
                path: "/server/remove",
                name: "remove-server",
                component: import("@/views/RemoveServerPage.vue"),
            },
            {
                path: "/servers/",
                name: "servers",
                component: import("@/views/ListServerPage.vue"),
            },
        ],
    },

    // public
    {
        path: "/login",
        name: "login",
        component: import("@/views/LoginPage.vue"),
        meta: { requiresGuest: true },
    },
    {
        path: "/register",
        name: "register",
        component: import("@/views/RegisterPage.vue"),
        meta: { requiresGuest: true },
    },
    {
        path: "/about",
        name: "about",
        component: import("@/views/AboutPage.vue"),
        meta: { requiresGuest: true },
    },
    // on 404
    {
        path: "/:pathMatch(.*)*",
        redirect: "/",
    },
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

router.beforeEach((to, _, next) => {
    const auth = useAuthStore();

    if (to.meta.requiresAuth && !auth.isAuthenticated) {
        next({ name: "login", query: { redirect: to.fullPath } });
        return;
    }

    if (to.meta.requiresGuest && auth.isAuthenticated) {
        const redirect = (to.query.redirect as string) || "/";
        next(redirect);
        return;
    }

    next();
});

export default router;
