import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

export function DarkModeToggle() {
  const { theme, setTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const currentTheme = theme === 'system' ? systemTheme : theme;

  const handleThemeToggle = () => {
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    console.log('Switching theme from', currentTheme, 'to', newTheme);
    setTheme(newTheme);
    // Force a re-render by dispatching a custom event
    setTimeout(() => {
      document.documentElement.classList.toggle('dark', newTheme === 'dark');
    }, 0);
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleThemeToggle}
      className="w-9 h-9 p-0"
    >
      <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}