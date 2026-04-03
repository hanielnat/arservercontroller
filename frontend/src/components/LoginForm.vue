<script lang="ts" setup>
import { Form, FormField, FormSubmitEvent } from "@primevue/forms"
import { zodResolver } from "@primevue/forms/resolvers/zod"
import {
    Button,
    Card,
    Checkbox,
    InputText,
    // Toast,
    Message,
    Password,
    useToast,
} from "primevue"
import { onMounted, ref } from "vue"
import { useRouter } from "vue-router"
import z from "zod"
import { useAuthStore } from "../stores/useAuthStore"
import ThemeToggler from "./ThemeToggler.vue"

const authStore = useAuthStore()
const { login } = authStore

const router = useRouter()

const toast = useToast()

const rememberUser = ref(false)
const initialUsername = ref("")

onMounted(() =>
{
    const rememberedName = localStorage.getItem("arserver_remembered_name")
    if (rememberedName)
    {
        initialUsername.value = rememberedName
        rememberUser.value = true
    }
})

const resolver = ref(
    zodResolver(
        z.object({
            username: z.string().nonempty({ error: "Username required" }),
            password: z
                .string()
                .nonempty({ error: "Password must not be empty" })
                .min(8, { error: "Password must have at least 8 characters" }),
        }),
    ),
)

const onFormSubmit = async (event: FormSubmitEvent) =>
{
    if (event.valid)
    {
        const { username } = event.values

        if (rememberUser.value)
        {
            localStorage.setItem("arserver_remembered_name", username)
        }
        else
        {
            localStorage.removeItem("arserver_remembered_name")
        }

        const success = await login(event.values as any)
        if (success)
        {
            toast.add({
                severity: "success",
                summary: "Login successful",
                detail: `Welcome back, ${authStore.user?.name}`,
                life: 4000,
            })
            await router.push("/")
        }
        else
        {
            toast.add({
                severity: "error",
                summary: "Login error",
                detail: authStore.error ?? "Failed to login",
                life: 6000,
            })
        }
    }
}
</script>

<template>
    <div class="min-h-screen flex items-center justify-center">
        <Card class="p-2 w-90">
            <template #header> </template>

            <template #title>
                <div class="flex justify-between">
                    <h1 class="text-primary">Login</h1>
                    <ThemeToggler />
                </div>
            </template>

            <template #content>
                <Form
                    v-slot="$form"
                    :resolver="resolver"
                    :initial-values="{ username: initialUsername }"
                    class="grid gap-4"
                    @submit="onFormSubmit"
                >
                    <FormField v-slot="$field" name="username">
                        <InputText
                            name="username"
                            placeholder="Username"
                            fluid
                        />
                        <Message
                            v-if="$field?.invalid"
                            severity="error"
                            size="small"
                            variant="simple"
                        >
                            {{ $field.error?.message }}
                        </Message>
                    </FormField>

                    <FormField v-slot="$field" name="password">
                        <Password
                            name="password"
                            placeholder="Password"
                            :feedback="false"
                            toggleMask
                            fluid
                        />
                        <Message
                            v-if="$field?.invalid"
                            severity="error"
                            size="small"
                            variant="simple"
                        >
                            {{ $field.error?.message }}
                        </Message>
                    </FormField>

                    <Button
                        type="submit"
                        label="Submit"
                        size="small"
                        :severity="$form?.valid ? 'primary' : 'secondary'"
                        :icon="$form?.valid ? 'pi pi-check' : 'pi pi-times'"
                        :disabled="$form?.valid ? false : true"
                        fluid
                    />
                </Form>

                <Button
                    label="Register"
                    size="small"
                    severity="secondary"
                    fluid
                    @click="router.push('/register')"
                    class="mt-2"
                />
            </template>

            <template #footer>
                <div class="flex items-center justify-between pb-4 pt-2">
                    <div class="flex gap-2">
                        <Checkbox
                            v-model="rememberUser"
                            input-id="remember"
                            value="Remember me"
                            binary
                        />
                        <label for="remember" class="text-muted-color text-sm"
                            >Remember me</label
                        >
                    </div>
                </div>
            </template>
        </Card>
    </div>
</template>
