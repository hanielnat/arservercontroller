<script setup lang="ts">
import Button from "primevue/button"
</script>

<template>
    <div class="flex items-center justify-center min-h-screen">
        <div class="max-w-md mx-auto dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border">
            <div class="p-8">
                <h1 class="block mt-1 text-lg leading-tight font-medium">Home Page</h1>
                <p class="mt-2 text-muted-foreground">
                    Welcome to the AR Server Controller Home Page!
                </p>
                <div class="flex flex-col gap-4 mt-6">
                    <Button label="Login" variant="outlined" @click="$router.push('/login')" />
                    <Button label="Register" variant="outlined" @click="$router.push('/register')" />
                    <Button label="Go to About" variant="outlined" @click="$router.push('/about')" />
                </div>
            </div>
        </div>
    </div>
</template>