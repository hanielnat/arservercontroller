import * as React from "react";

import { DEFAULT_DASHBOARD_SETTINGS } from "@/lib/consts";
import type { SettingsType } from "@/types/dashboard";

const DASHBOARD_SETTINGS_KEY = "arservercontroller-settings";

interface SettingsProviderState {
  settings: SettingsType;
  setSettings: React.Dispatch<React.SetStateAction<SettingsType>>;
}

const SettingsContext = React.createContext<SettingsProviderState | undefined>(undefined);

function readStoredSettings(): SettingsType {
  const stored = localStorage.getItem(DASHBOARD_SETTINGS_KEY);

  if (!stored) {
    return DEFAULT_DASHBOARD_SETTINGS;
  }

  try {
    const parsed = JSON.parse(stored) as Partial<SettingsType>;

    return {
      interface: {
        ...DEFAULT_DASHBOARD_SETTINGS.interface,
        ...parsed.interface,
      },
      queries: {
        ...DEFAULT_DASHBOARD_SETTINGS.queries,
        ...parsed.queries,
      },
    };
  } catch {
    return DEFAULT_DASHBOARD_SETTINGS;
  }
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = React.useState<SettingsType>(readStoredSettings);

  React.useEffect(() => {
    localStorage.setItem(DASHBOARD_SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  React.useEffect(() => {
    const syncFromStorage = (event: StorageEvent) => {
      if (event.key === DASHBOARD_SETTINGS_KEY) {
        setSettings(readStoredSettings());
      }
    };

    window.addEventListener("storage", syncFromStorage);
    return () => window.removeEventListener("storage", syncFromStorage);
  }, []);

  const value = React.useMemo(
    () => ({
      settings,
      setSettings,
    }),
    [settings],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const context = React.useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }

  return context;
}
