import { createApp } from "vue"
import { createPinia } from "pinia"
import "./style.css"
import App from "./App.vue"
import PrimeVue from "primevue/config"
import Aura from "@primevue/themes/aura"
import "primeicons/primeicons.css"
import router from "./router"
import ToastService from "primevue/toastservice";


const app = createApp(App)

const pinia = createPinia()
app.use(pinia)

app.use(router)
app.use(PrimeVue, {
    theme: {
        preset: Aura,
        options: {
            darkModeSelector: ".dark",
            cssLayer: false,
        },
    },
})
app.use(ToastService)
app.mount("#app")
