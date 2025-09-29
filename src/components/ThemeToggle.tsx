import { Moon, Sun } from "lucide-react";
import { useTheme } from "../utils/useTheme";
import { Button } from "./ui/button";

interface ThemeToggleProps {
  variant?: "default" | "icon" | "minimal";
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function ThemeToggle({ 
  variant = "default", 
  size = "md",
  className = "" 
}: ThemeToggleProps) {
  const { theme, toggleTheme, isDark } = useTheme();

  if (variant === "icon") {
    return (
      <Button
        variant="ghost"
        size={size === "sm" ? "sm" : size === "lg" ? "lg" : "default"}
        onClick={toggleTheme}
        className={`relative p-2 ${className}`}
        aria-label={`Cambiar a modo ${isDark ? 'claro' : 'oscuro'}`}
      >
        <Sun className={`h-5 w-5 transition-all ${isDark ? 'rotate-90 scale-0' : 'rotate-0 scale-100'}`} />
        <Moon className={`absolute h-5 w-5 transition-all ${isDark ? 'rotate-0 scale-100' : '-rotate-90 scale-0'}`} />
      </Button>
    );
  }

  if (variant === "minimal") {
    return (
      <button
        onClick={toggleTheme}
        className={`inline-flex items-center justify-center rounded-lg p-2 text-foreground hover:bg-muted transition-colors ${className}`}
        aria-label={`Cambiar a modo ${isDark ? 'claro' : 'oscuro'}`}
      >
        {isDark ? (
          <Sun className="h-5 w-5" />
        ) : (
          <Moon className="h-5 w-5" />
        )}
      </button>
    );
  }

  return (
    <Button
      variant="outline"
      size={size === "sm" ? "sm" : size === "lg" ? "lg" : "default"}
      onClick={toggleTheme}
      className={`inline-flex items-center gap-2 ${className}`}
    >
      {isDark ? (
        <>
          <Sun className="h-4 w-4" />
          <span>Modo Claro</span>
        </>
      ) : (
        <>
          <Moon className="h-4 w-4" />
          <span>Modo Oscuro</span>
        </>
      )}
    </Button>
  );
}

// Componente alternativo usando switch (más moderno)
export function ThemeSwitch({ className = "" }: { className?: string }) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <Sun className={`h-4 w-4 transition-opacity ${isDark ? 'opacity-50' : 'opacity-100'}`} />
      
      <button
        onClick={toggleTheme}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-primary focus:ring-offset-2 ${
          isDark ? 'bg-purple-primary' : 'bg-gray-300'
        }`}
        aria-label={`Cambiar a modo ${isDark ? 'claro' : 'oscuro'}`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            isDark ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
      
      <Moon className={`h-4 w-4 transition-opacity ${isDark ? 'opacity-100' : 'opacity-50'}`} />
    </div>
  );
}