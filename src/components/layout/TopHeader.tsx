"use client";

import { LogOut, User as UserIcon, ChevronDown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/useToast';

function getInitials(name: string) {
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
}

export function TopHeader() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    toast({ title: 'Signed out successfully' });
    router.replace('/auth/login');
  };

  return (
    <header className="h-14 border-b border-border flex items-center justify-between px-4 md:px-6 bg-card shrink-0">
      {/* Breadcrumb placeholder — populated per page in later phases */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>Workspace</span>
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
