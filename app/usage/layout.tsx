"use client";

import { useUser, UserButton } from '@clerk/nextjs';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  MessageSquare, 
  Activity, 
  CreditCard, 
  Crown,
  BarChart3,
  Menu,
  Play,
  Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/utils';
import Image from 'next/image';
import blackLogo from '@/BRANDING/LOGO/[SF] LOGO BLACK.png';

const navigation = [
  { 
    name: 'Overview', 
    href: '/dashboard', 
    icon: LayoutDashboard,
    description: 'Dashboard home'
  },
  { 
    name: 'Interview', 
    href: '/interview/setup', 
    icon: Play,
    description: 'Start new session'
  },
  { 
    name: 'Sessions', 
    href: '/sessions', 
    icon: MessageSquare,
    description: 'Past interviews'
  },
  { 
    name: 'Usage', 
    href: '/usage', 
    icon: Activity,
    description: 'Track limits'
  },
  { 
    name: 'Analytics', 
    href: '/premium-analytics', 
    icon: BarChart3,
    description: 'Performance insights'
  },
  { 
    name: 'Billing', 
    href: '/pricing', 
    icon: CreditCard,
    description: 'Manage plan'
  },
];

function Sidebar({ className }: { className?: string }) {
  const pathname = usePathname();
  const { user } = useUser();

  return (
    <div className={cn("flex h-full flex-col bg-card", className)}>
      {/* Logo */}
      <div className="flex h-14 items-center px-6 border-b">
        <div className="flex items-center gap-2">
          <Image src={blackLogo} alt="Logo" width={120} height={24} style={{ height: 24, width: 'auto' }} />
          <span className="font-semibold text-lg">skillflo</span>
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== '/dashboard' && pathname.startsWith(item.href));
          
          return (
            <Button
              key={item.name}
              variant={isActive ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start h-auto p-3 font-normal",
                isActive && "bg-secondary shadow-sm"
              )}
              onClick={() => window.location.href = item.href}
            >
              <item.icon className="mr-3 h-4 w-4 shrink-0" />
              <div className="flex flex-col items-start">
                <span className="text-sm font-medium">{item.name}</span>
                <span className="text-xs text-muted-foreground">{item.description}</span>
              </div>
            </Button>
          );
        })}
      </nav>
      
      <Separator />
      
      {/* User Profile */}
      <div className="p-4">
        <div className="flex items-center gap-3">
          <UserButton afterSignOutUrl="/" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {user?.primaryEmailAddress?.emailAddress}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function UsageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <div className="flex h-screen">
        {/* Desktop Sidebar */}
        <div className="hidden lg:flex lg:w-72 lg:flex-col lg:border-r">
          <Sidebar />
        </div>
        
        {/* Mobile Navigation */}
        <div className="lg:hidden">
          <div className="flex h-14 items-center justify-between px-4 border-b bg-card">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0">
                <Sidebar />
              </SheetContent>
            </Sheet>
            
            <div className="flex items-center gap-2">
              <Image src={blackLogo} alt="Logo" width={100} height={20} style={{ height: 20, width: 'auto' }} />
              <span className="font-semibold">skillflo</span>
            </div>
            
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <main className="flex-1 overflow-y-auto">
            <div className="container mx-auto p-6 lg:p-8 max-w-7xl">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
