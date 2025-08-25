"use client";

import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { 
  Moon, 
  Sun, 
  History, 
  CreditCard, 
  Crown, 
  BarChart3, 
  Activity,
  Home,
  Menu,
  X
} from "lucide-react";
import { useTheme } from "next-themes";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "./ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "./ui/dropdown-menu";

import Link from "next/link";

const navigationItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/sessions", label: "My Sessions", icon: History },
  { href: "/usage", label: "Usage", icon: Activity, badge: "Track" },
  { href: "/premium", label: "Features", icon: Crown, badge: "All Included" },
  { href: "/premium-analytics", label: "Analytics", icon: BarChart3, badge: "All Included" },
  { href: "/pricing", label: "Pricing", icon: CreditCard },
];

export const Nav = () => {
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Don't show nav on landing page since it has its own navigation
  if (pathname === "/") {
    return null;
  }

  return (
    <>
      {/* Desktop Navigation */}
      <div className="hidden md:flex fixed top-0 right-0 px-4 py-2 items-center h-14 z-50 bg-background/80 backdrop-blur-sm border-b">
        <div className="ml-auto flex items-center gap-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  size="sm"
                  className="flex items-center gap-2 rounded-full"
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                  {item.badge && (
                    <Badge variant="secondary" className="ml-1 text-xs">
                      {item.badge}
                    </Badge>
                  )}
                </Button>
              </Link>
            );
          })}
          
          <Separator orientation="vertical" className="h-6 mx-2" />
          
          {/* Theme Toggle */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="rounded-full">
                <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTheme("light")}>
                <Sun className="mr-2 h-4 w-4" />
                Light
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("dark")}>
                <Moon className="mr-2 h-4 w-4" />
                Dark
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("system")}>
                System
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* Auth Section */}
          <SignedOut>
            <SignInButton>
              <Button size="sm" className="rounded-full">
                Sign In
              </Button>
            </SignInButton>
          </SignedOut>
          
          <SignedIn>
            <UserButton 
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox: "h-8 w-8"
                }
              }}
            />
          </SignedIn>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden fixed top-0 right-0 px-4 py-2 flex items-center h-14 z-50 bg-background/80 backdrop-blur-sm border-b w-full">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <Link href="/" className="font-semibold">
              Interview AI
            </Link>
          </div>
          
          <div className="flex items-center gap-2">
            <SignedOut>
              <SignInButton>
                <Button size="sm" variant="outline">
                  Sign In
                </Button>
              </SignInButton>
            </SignedOut>
            
            <SignedIn>
              <UserButton 
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    avatarBox: "h-8 w-8"
                  }
                }}
              />
            </SignedIn>
            
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <SheetHeader>
                  <SheetTitle>Navigation</SheetTitle>
                </SheetHeader>
                
                <div className="mt-6 space-y-2">
                  {navigationItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    
                    return (
                      <Link 
                        key={item.href} 
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Button
                          variant={isActive ? "secondary" : "ghost"}
                          className="w-full justify-start gap-3"
                        >
                          <Icon className="h-4 w-4" />
                          <span>{item.label}</span>
                          {item.badge && (
                            <Badge variant="secondary" className="ml-auto text-xs">
                              {item.badge}
                            </Badge>
                          )}
                        </Button>
                      </Link>
                    );
                  })}
                  
                  <Separator className="my-4" />
                  
                  {/* Theme Toggle for Mobile */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground px-3">Theme</p>
                    <div className="grid grid-cols-3 gap-2">
                      <Button
                        variant={theme === "light" ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => setTheme("light")}
                        className="flex flex-col gap-1 h-auto py-3"
                      >
                        <Sun className="h-4 w-4" />
                        <span className="text-xs">Light</span>
                      </Button>
                      <Button
                        variant={theme === "dark" ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => setTheme("dark")}
                        className="flex flex-col gap-1 h-auto py-3"
                      >
                        <Moon className="h-4 w-4" />
                        <span className="text-xs">Dark</span>
                      </Button>
                      <Button
                        variant={theme === "system" ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => setTheme("system")}
                        className="flex flex-col gap-1 h-auto py-3"
                      >
                        <span className="text-xs">System</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </>
  );
};