<script lang="ts">
import { Button } from "primevue";
import { useTheme } from "../composables/useTheme";

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