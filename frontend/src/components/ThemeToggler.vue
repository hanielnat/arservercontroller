<script lang="ts">
import { Button } from 'primevue';
import { useTheme } from '../stores/useTheme';

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