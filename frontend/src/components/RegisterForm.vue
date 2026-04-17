<script lang="ts" setup>
import { Form, FormField, FormSubmitEvent } from "@primevue/forms";
import { zodResolver } from "@primevue/forms/resolvers/zod";
import {
    Button,
    Card,
    InputText,
    Message,
    Password,
    Toast,
    useToast,
} from "primevue";
import { ref } from "vue";
import { useRouter } from "vue-router";
import z from "zod";
import { useAuthStore } from "@/stores/useAuthStore";
import ThemeToggler from "@/components/ThemeToggler.vue";

const toast = useToast();
const authStore = useAuthStore();
const { register } = authStore;

const router = useRouter();
const resolver = ref(
    zodResolver(
        z
            .object({
                name: z.string().nonempty({ message: "Username required." }),
                email: z
                    .email({ message: "Invalid email address." })
                    .nonempty({ message: "Email required." }),
                password: z
                    .string()
                    .nonempty({ message: "Password must not be empty" })
                    .min(8, {
                        message: "Password must have at least 8 characters.",
                    }),
                passwordRepeat: z
                    .string()
                    .nonempty({ message: "Password must not be empty" })
                    .min(8, {
                        message: "Password must have at least 8 characters.",
                    }),
            })
            .refine((data) => data.password === data.passwordRepeat, {
                message: "Passwords don't match",
                path: ["passwordRepeat"],
            }),
    ),
);

const onFormSubmit = async (event: FormSubmitEvent) => {
    if (event.valid) {
        const { name, email, password } = event.values;
        const success = await register({ name, email, password });
        if (success) {
            toast.add({
                severity: "success",
                summary: "Registration successful",
                detail: "You can now log in with your credentials",
                life: 4000,
            });
            await router.push("/login");
        } else {
            toast.add({
                severity: "error",
                summary: "Registration error",
                detail: authStore.error ?? "Failed to register",
                life: 6000,
            });
        }
    }
};
</script>

<template>
    <div class="min-h-screen flex items-center justify-center">
        <Toast />
        <Card class="p-2 w-90">
            <template #header> </template>

            <template #title>
                <div class="flex justify-between">
                    <h1 class="text-primary">Register</h1>
                    <ThemeToggler />
                </div>
            </template>

            <template #content>
                <Form
                    v-slot="$form"
                    :resolver="resolver"
                    class="grid gap-4"
                    @submit="onFormSubmit"
                >
                    <FormField v-slot="$field" name="name">
                        <InputText name="name" placeholder="Username" fluid />
                        <Message
                            v-if="$field?.invalid"
                            severity="error"
                            size="small"
                            variant="simple"
                        >
                            {{ $field.error?.message }}
                        </Message>
                    </FormField>

                    <FormField v-slot="$field" name="email">
                        <InputText name="email" placeholder="Email" fluid />
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

                    <FormField v-slot="$field" name="passwordRepeat">
                        <Password
                            name="passwordRepeat"
                            placeholder="Repeat password"
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
            </template>

            <template #footer>
                <div class="flex items-center justify-end pb-4 pt-2">
                    <Button
                        @click="$router.push('/')"
                        label="Go back"
                        icon="pi pi-chevron"
                        severity="secondary"
                        variant="text"
                    />
                </div>
            </template>
        </Card>
    </div>
</template>
