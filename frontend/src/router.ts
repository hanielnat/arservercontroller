import { createRouter, createWebHistory, RouteRecordRaw } from "vue-router"
import DashboardHome from "./components/DashboardHome.vue"
import AboutPage from "./views/AboutPage.vue"
import AddServerPage from "./views/AddServerPage.vue"
import ListServerPage from "./views/ListServerPage.vue"
import LoginPage from "./views/LoginPage.vue"
import RegisterPage from "./views/RegisterPage.vue"
import RemoveServerPage from "./views/RemoveServerPage.vue"

const routes: RouteRecordRaw[] = [
    {
        path: "/server/add",
        name: "Add server",
        component: AddServerPage
    },
    {
        path: "/server/remove",
        name: "Remove server",
        component: RemoveServerPage
    },
    {
        path: "/server/list",
        name: "List servers",
        component: ListServerPage
    },
    {
        path: "/login",
        name: "Login",
        component: LoginPage
    },
    {
        path: "/register",
        name: "Register",
        component: RegisterPage
    },
    {
        path: "/",
        name: "Home",
        component: DashboardHome
    },
    {
        path: "/about",
        name: "About",
        component: AboutPage
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

export default router
