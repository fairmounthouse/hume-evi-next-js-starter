"use client";

import { Button } from "./ui/button";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { usePathname } from "next/navigation";
import Link from "next/link";

export const Nav = () => {
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();

  // Don't show nav on landing page since it has its own navigation
  if (pathname === "/") {
    return null;
  }

  return (
    <div className="fixed top-0 right-0 px-4 py-2 flex items-center h-14 z-50">
      <div className="ml-auto flex items-center gap-1">
        <Link href="/">
          <Button
            variant="ghost"
            className="ml-auto flex items-center gap-1.5 rounded-full"
          >
            <span>← Home</span>
          </Button>
        </Link>
        <Button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          variant="ghost"
          className="ml-auto flex items-center gap-1.5 rounded-full"
        >
          <span>
            {theme === "dark" ? (
              <Sun className="size-4" />
            ) : (
              <Moon className="size-4" />
            )}
          </span>
          <span>{theme === 'dark' ? "Light" : "Dark"} Mode</span>
        </Button>
      </div>
    </div>
  );
};
