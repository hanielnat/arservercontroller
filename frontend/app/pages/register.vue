<script lang="ts" setup>
const form = reactive({
    username: "",
    password: ""
})
</script>

<template>
    <UPageBody class="flex place-items-center">
        <UForm
            schema="form"
            class="p4"
        >
            <UInput>
                <UFormField label="User name"></UFormField>
            </UInput>
            <UFormField label="Password"></UFormField>
        </UForm>
    </UPageBody>
</template>
