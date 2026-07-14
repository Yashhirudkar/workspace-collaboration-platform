"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FileText, LayoutDashboard, Settings, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, exact: true },
  { label: 'Documents', href: '/dashboard/documents', icon: FileText, exact: false },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col border-r border-border bg-card transition-all duration-200",
        collapsed ? "w-14" : "w-56"
      )}
      aria-label="Sidebar navigation"
    >
      {/* Brand */}
      <div className={cn("flex items-center h-14 border-b border-border px-4", collapsed && "justify-center")}>
        <div className="w-7 h-7 bg-primary rounded-md flex items-center justify-center shrink-0">
          <FileText className="h-4 w-4 text-primary-foreground" />
        </div>
        {!collapsed && <span className="ml-2.5 font-semibold text-sm">Docflow</span>}
      </div>

      {/* Nav */}
      <nav className="flex-1 p-2 space-y-1" aria-label="Main navigation">
        {navItems.map(item => {
          const isActive = pathname
            ? (item.exact ? pathname === item.href : pathname.startsWith(item.href))
            : false;
          return (
            <Link
              key={item.label}
              href={item.href}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                "flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm transition-colors",
                isActive
                  ? "bg-secondary text-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted",
                collapsed && "justify-center px-2"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {!collapsed && item.label}
            </Link>
          );
        })}
      </nav>

      {/* Collapse Toggle */}
      <div className="p-2 border-t border-border">
        <button
          id="sidebar-toggle"
          onClick={() => setCollapsed(v => !v)}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={cn(
            "flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors w-full",
            collapsed && "justify-center px-2"
          )}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );
}
