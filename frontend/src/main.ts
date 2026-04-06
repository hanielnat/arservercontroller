import App from "@/App.vue"
import router from "@/router.ts"
import "@/style.css"
import Aura from "@primevue/themes/aura"
import { createPinia } from "pinia"
import "primeicons/primeicons.css"
import { ConfirmationService, DialogService } from "primevue"
import PrimeVue from "primevue/config"
import ToastService from "primevue/toastservice"
import { createApp } from "vue"

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
app.use(DialogService)
app.use(ConfirmationService)

app.mount("#app")
