<script lang="ts" setup>
import { Form, FormField, FormSubmitEvent } from "@primevue/forms";
import { zodResolver } from "@primevue/forms/resolvers/zod";
import {
    Button,
    Card,
    Checkbox,
    InputText,
    // Toast,
    Message,
    Password,
    useToast,
} from "primevue";
import { ref } from "vue";
import { useRouter } from "vue-router";
import z from "zod";
import ThemeToggler from "./ThemeToggler.vue";

// const { isLoading, isAuthenticated, login, user } = useAuthStore()

const router = useRouter()

const toast = useToast()

const rememberUser = ref(false)

const resolver = ref(
    zodResolver(
        z.object({
            username: z.string()
                .nonempty({ error: "Username required" }),
            password: z.string()
                .nonempty({ error: "Password must not be empty" })
                .min(8, { error: "Password must have at least 8 characters" })
        })
    )
)

const onFormSubmit = (event: FormSubmitEvent) =>
{
    if (event.valid)
    {
        // login(event.values, router)
    }
}
</script>

<template>
    <div class="min-h-screen flex items-center justify-center">
        <Card class="p-2 w-90">
            <template #header>
            </template>

            <template #title>
                <div class="flex justify-between">

                    <h1 class="text-primary">Login</h1>
                    <ThemeToggler />

                </div>
            </template>

            <template #content>
                <Form v-slot="$form" :resolver="resolver" class="grid gap-4" @submit="onFormSubmit">

                    <FormField v-slot="$field" name="username">
                        <InputText name="username" placeholder="Username" fluid />
                        <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">
                            {{ $field.error?.message }}
                        </Message>
                    </FormField>

                    <FormField v-slot="$field" name="password">
                        <Password name="password" placeholder="Password" :feedback="false" toggleMask fluid />
                        <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">
                            {{ $field.error?.message }}
                        </Message>
                    </FormField>

                    <Button type="submit" label="Submit" size="small" :severity="$form?.valid ? 'primary' : 'secondary'"
                        :icon="$form?.valid ? 'pi pi-check' : 'pi pi-times'" :disabled="$form?.valid ? false : true"
                        fluid />

                </Form>

                <Button label="Register" size="small" severity="secondary" fluid @click="router.push('/register')"
                    class="mt-2"
                />
            </template>

            <template #footer>
                <div class="flex items-center justify-between pb-4 pt-2">

                    <div class="flex gap-2">
                        <Checkbox v-model="rememberUser" input-id="remember" value="Remember me" binary />
                        <label for="remember" class="text-muted-color text-sm">Remember me</label>
                    </div>

                    <!-- <Button @click="$router.push('/')" label="Go back" icon="pi pi-chevron" severity="secondary" variant="text" /> -->
                </div>
            </template>
        </Card>
    </div>
</template>