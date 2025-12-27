import { createRouter, createWebHistory, RouteRecordRaw } from "vue-router"
import HomePage from "./views/HomePage.vue"
import AboutPage from "./views/AboutPage.vue"
import LoginPage from "./views/LoginPage.vue"
import RegisterPage from "./views/RegisterPage.vue"

const routes: RouteRecordRaw[] = [
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
        component: HomePage
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
