import { Monitor, Moon, Sun } from "lucide-react";

import { type Theme, useTheme } from "./theme-provider";

import { Button } from "./ui/button";

const themeDetails = {
  system: { icon: Monitor, label: "System" },
  light: { icon: Sun, label: "Light" },
  dark: { icon: Moon, label: "Dark" },
} satisfies Record<Theme, { icon: typeof Monitor; label: string }>;

const themes: Theme[] = ["system", "light", "dark"];

function getNextTheme(theme: Theme): Theme {
  return themes[(themes.indexOf(theme) + 1) % themes.length];
}

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const details = themeDetails[theme];
  const Icon = details.icon;
  const nextTheme = getNextTheme(theme);

  return (
    <Button
      aria-label={`${details.label} theme. Switch to ${themeDetails[nextTheme].label.toLowerCase()} theme.`}
      onClick={() => setTheme(nextTheme)}
      size="sm"
      title={`Theme: ${details.label}`}
      variant="outline"
    >
      <Icon aria-hidden="true" />
      <span className="hidden sm:inline">{details.label}</span>
    </Button>
  );
}
