import { useTheme } from "./ThemeProvider";
import { Sun, Moon } from "lucide-react";
import { Button } from "./ui/button";

export const ThemeToggle = () => {
  const { theme, toggle } = useTheme();
  return (
    <Button variant="ghost" size="icon" onClick={toggle} className="relative">
      {theme === "dark" ? (
        <Sun className="h-5 w-5 text-neon-yellow" />
      ) : (
        <Moon className="h-5 w-5 text-neon-blue" />
      )}
    </Button>
  );
};
