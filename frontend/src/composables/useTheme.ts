import { usePreferredDark } from "@vueuse/core";
import { computed, ref, watch } from "vue";

type ThemeMode = "light" | "dark" | "system";
const STORAGE_KEY = "arservercontroller-theme";

export const useTheme = () => {
    const prefersDarkMode = usePreferredDark();
    const storedTheme = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
    const mode = ref<ThemeMode>(storedTheme || "system");

    const isDark = computed(() => {
        if (mode.value === "dark") {
            return true;
        }

        if (mode.value === "light") {
            return false;
        }

        return prefersDarkMode.value;
    });

    function applyTheme() {
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        isDark.value
            ? document.documentElement.classList.add("dark")
            : document.documentElement.classList.remove("dark");
    }

    function setTheme(newMode: ThemeMode) {
        mode.value = newMode;
    }

    function toggleTheme() {
        switch (mode.value) {
            case "system":
                setTheme(prefersDarkMode.value ? "light" : "dark");
                break;

            case "light":
                setTheme("dark");
                break;

            case "dark":
                setTheme("light");
                break;

            default:
                setTheme("system");
                break;
        }
    }

    function resetToSystem() {
        setTheme("system");
    }

    watch(
        mode,
        (newMode) => {
            localStorage.setItem(STORAGE_KEY, newMode);
            applyTheme();
        },
        { immediate: true },
    );

    // also react to system preference change (when mode === "system")
    watch(prefersDarkMode, () => {
        if (mode.value === "system") {
            applyTheme();
        }
    });

    return {
        mode,
        isDark,
        prefersDarkMode,
        setTheme,
        toggleTheme,
        resetToSystem,
    };
};
