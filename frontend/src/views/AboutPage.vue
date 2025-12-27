<script setup lang="ts">
import { Button } from "primevue";
</script>

<template>
    <div class="min-h-screen flex items-center justify-center">
        <div class="max-w-md mx-auto dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border">
            <div class="p-8">
                <h1 class="block mt-1 text-lg leading-tight font-medium">About Page</h1>
                <p class="mt-2 text-muted-foreground">
                    This is the About page of AR Server Controller.
                </p>
                <div class="mt-6">
                    <Button label="Back to Home" class="p-button-secondary" @click="$router.push('/')" />
                </div>
            </div>
        </div>
    </div>
</template>