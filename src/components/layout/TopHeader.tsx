"use client";

import { LogOut, User as UserIcon, ChevronDown, Menu, X, LayoutDashboard, FileText } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/useToast';

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, exact: true },
  { label: 'Documents', href: '/dashboard/documents', icon: FileText, exact: false },
];

function getInitials(name: string) {
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
}

export function TopHeader() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    logout();
    toast({ title: 'Signed out successfully' });
    router.replace('/auth/login');
  };

  return (
    <header className="h-14 border-b border-border flex items-center justify-between px-4 md:px-6 bg-card shrink-0">
      <div className="flex items-center gap-2">
        {/* Mobile Hamburger Menu Drawer */}
        <Dialog.Root open={open} onOpenChange={setOpen}>
          <Dialog.Trigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden mr-1.5 h-9 w-9 text-muted-foreground hover:text-foreground"
              aria-label="Open navigation menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 transition-opacity animate-in fade-in duration-200" />
            <Dialog.Content 
              className="fixed inset-y-0 left-0 z-50 h-full w-[280px] bg-card border-r border-border p-6 shadow-lg flex flex-col justify-between transition-transform duration-300 ease-in-out data-[state=closed]:slide-out-to-left-full data-[state=open]:slide-in-from-left-full animate-in slide-in-from-left duration-200 focus:outline-none"
            >
              <div className="space-y-6">
                {/* Brand Header */}
                <div className="flex items-center justify-between pb-4 border-b">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-primary rounded-md flex items-center justify-center shrink-0">
                      <FileText className="h-4 w-4 text-primary-foreground" />
                    </div>
                    <span className="font-semibold text-sm">Docflow</span>
                  </div>
                  <Dialog.Close asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Close menu">
                      <X className="h-4 w-4" />
                    </Button>
                  </Dialog.Close>
                </div>

                {/* Mobile Navigation Links */}
                <nav className="space-y-1.5" aria-label="Mobile navigation">
                  {navItems.map(item => {
                    const isActive = pathname
                      ? (item.exact ? pathname === item.href : pathname.startsWith(item.href))
                      : false;
                    return (
                      <Link
                        key={item.label}
                        href={item.href}
                        onClick={() => setOpen(false)}
                        aria-current={isActive ? 'page' : undefined}
                        className={cn(
                          "flex items-center gap-2.5 px-3 py-2.5 rounded-md text-sm transition-colors",
                          isActive
                            ? "bg-secondary text-foreground font-medium"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted"
                        )}
                      >
                        <item.icon className="h-4 w-4 shrink-0" />
                        {item.label}
                      </Link>
                    );
                  })}
                </nav>
              </div>

              {/* Mobile Profile & Logout Footer */}
              <div className="border-t pt-4 space-y-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="text-sm bg-primary text-primary-foreground font-medium">
                      {user ? getInitials(user.name) : '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col min-w-0">
                    <span className="font-semibold text-sm truncate">{user?.name}</span>
                    <span className="text-xs text-muted-foreground truncate">{user?.email}</span>
                  </div>
                </div>
                
                <Button
                  variant="destructive"
                  className="w-full justify-start gap-2 h-10 text-sm font-medium"
                  onClick={() => {
                    setOpen(false);
                    handleLogout();
                  }}
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </Button>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>

        {/* Breadcrumb placeholder */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Workspace</span>
        </div>
      </div>

      {/* User menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            id="user-menu-trigger"
            variant="ghost"
            className="flex items-center gap-2 h-9 px-2 rounded-md"
            aria-label="User menu"
          >
            <Avatar className="h-7 w-7">
              <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                {user ? getInitials(user.name) : '?'}
              </AvatarFallback>
            </Avatar>
            <span className="hidden sm:inline text-sm font-medium">{user?.name}</span>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuLabel>
            <div className="flex flex-col">
              <span className="font-medium">{user?.name}</span>
              <span className="text-xs text-muted-foreground font-normal truncate">{user?.email}</span>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="gap-2 text-muted-foreground" disabled>
            <UserIcon className="h-4 w-4" />
            Profile
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem id="logout-btn" onClick={handleLogout} className="gap-2 text-destructive focus:text-destructive">
            <LogOut className="h-4 w-4" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
