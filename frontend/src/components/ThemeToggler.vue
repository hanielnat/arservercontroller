<script setup lang="ts">
import { useTheme } from "@/composables/useTheme";
import { Button } from "primevue";

const { isDark, toggleTheme } = useTheme()
</script>

<template>
    <div>
        <Button
            :icon="isDark ? 'pi pi-sun' : 'pi pi-moon'"
            @click="toggleTheme"
        />
    </div>
</template>