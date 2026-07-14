"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  FileText, LayoutDashboard, Settings, ChevronLeft, ChevronRight,
  Star, Pin, Trash2, Tag as TagIcon, ChevronDown, Plus
} from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { documentService } from '@/services/documents';
import type { Document, Tag } from '@/types';
import { toast } from '@/hooks/useToast';
import { useWorkspace } from '@/hooks/useWorkspace';

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, exact: true },
  { label: 'Documents', href: '/dashboard/documents', icon: FileText, exact: false },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [favorites, setFavorites] = useState<Document[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  
  // Section toggle states
  const [favOpen, setFavOpen] = useState(true);
  const [tagsOpen, setTagsOpen] = useState(false);

  const loadSidebarData = useCallback(async () => {
    try {
      const [favs, allTags] = await Promise.all([
        documentService.getFavorites(),
        documentService.getTags()
      ]);
      setFavorites(favs);
      setTags(allTags);
    } catch (err) {
      console.error('Failed to load sidebar metadata', err);
    }
  }, []);

  useEffect(() => {
    loadSidebarData();
    // No setInterval — real-time updates come via socket events below
  }, [loadSidebarData]);

  // ── Real-time workspace event subscriptions ────────────────────────────────
  useWorkspace({
    onDocumentCreated: ({ document }) => {
      // New docs don't automatically become favorites — no sidebar change needed
    },
    onDocumentDeleted: ({ documentId }) => {
      // Remove from favorites if it was there
      setFavorites(prev => prev.filter(d => d.id !== documentId));
    },
    onDocumentPermanentlyDeleted: ({ documentId }) => {
      setFavorites(prev => prev.filter(d => d.id !== documentId));
    },
    onDocumentRestored: ({ document }) => {
      // If it was previously favorited, it will show up again on next explicit load
      // (no optimistic add here since we don't know if it was favorited before trash)
    },
    onDocumentFavorited: ({ documentId, isFavorite }) => {
      if (isFavorite) {
        // Fetch the full doc to add to sidebar favorites list
        documentService.get(documentId).then(doc => {
          setFavorites(prev => {
            if (prev.some(d => d.id === documentId)) return prev;
            return [...prev, doc];
          });
        }).catch(() => {});
      } else {
        setFavorites(prev => prev.filter(d => d.id !== documentId));
      }
    },
    onDocumentUpdated: ({ documentId, changes }) => {
      if (changes.title) {
        setFavorites(prev => prev.map(d => d.id === documentId ? { ...d, title: changes.title! } : d));
      }
    },
    onDocumentTagAdded: ({ tag }) => {
      setTags(prev => {
        if (prev.some(t => t.id === tag.id)) return prev;
        return [...prev, tag];
      });
    },
  });

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col border-r border-border bg-card/60 backdrop-blur-md transition-all duration-200 shrink-0",
        collapsed ? "w-14" : "w-60"
      )}
      aria-label="Sidebar navigation"
    >
      {/* Brand */}
      <div className={cn("flex items-center h-14 border-b border-border px-4", collapsed && "justify-center")}>
        <div className="w-7 h-7 bg-primary rounded-md flex items-center justify-center shrink-0 shadow-sm">
          <FileText className="h-4 w-4 text-primary-foreground" />
        </div>
        {!collapsed && <span className="ml-2.5 font-bold text-sm tracking-tight bg-gradient-to-r from-foreground to-foreground/75 bg-clip-text">Docflow</span>}
      </div>

      {/* Main Nav */}
      <nav className="flex-1 py-4 px-2 space-y-4 overflow-y-auto custom-scrollbar" aria-label="Main navigation">
        <div className="space-y-1">
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
                  "flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-sm transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                  collapsed && "justify-center px-2"
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </div>

        {/* Section divider & headers */}
        {!collapsed && (
          <div className="space-y-4 pt-2">

            {/* Favorites Section */}
            <div className="space-y-1">
              <button
                onClick={() => setFavOpen(v => !v)}
                className="flex items-center justify-between w-full px-2 py-1 text-xs font-semibold text-muted-foreground/80 hover:text-foreground transition-colors"
              >
                <span className="flex items-center gap-1.5 uppercase tracking-wider">
                  <Star className="h-3 w-3" /> Favorites
                </span>
                {favOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              </button>
              {favOpen && (
                <div className="space-y-0.5 pl-2 animate-in fade-in slide-in-from-top-1 duration-150">
                  {favorites.length === 0 ? (
                    <p className="text-[11px] text-muted-foreground/60 px-2 py-1 italic">No favorites</p>
                  ) : (
                    favorites.map(doc => (
                      <Link
                        key={doc.id}
                        href={`/dashboard/documents/${doc.id}`}
                        className={cn(
                          "flex items-center gap-2 px-2 py-1 rounded text-xs text-muted-foreground hover:text-foreground hover:bg-muted/40 truncate w-full",
                          pathname === `/dashboard/documents/${doc.id}` && "bg-muted text-foreground font-medium"
                        )}
                      >
                        <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
                        <span className="truncate">{doc.title}</span>
                      </Link>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Tags Section */}
            <div className="space-y-1">
              <button
                onClick={() => setTagsOpen(v => !v)}
                className="flex items-center justify-between w-full px-2 py-1 text-xs font-semibold text-muted-foreground/80 hover:text-foreground transition-colors"
              >
                <span className="flex items-center gap-1.5 uppercase tracking-wider">
                  <TagIcon className="h-3 w-3" /> Tags
                </span>
                {tagsOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              </button>
              {tagsOpen && (
                <div className="space-y-0.5 pl-2 animate-in fade-in slide-in-from-top-1 duration-150">
                  {tags.length === 0 ? (
                    <p className="text-[11px] text-muted-foreground/60 px-2 py-1 italic">No tags created</p>
                  ) : (
                    <div className="flex flex-wrap gap-1 p-1">
                      {tags.map(tag => (
                        <span
                          key={tag.id}
                          className="inline-flex items-center text-[10px] px-1.5 py-0.5 rounded-full bg-secondary border border-border text-secondary-foreground"
                        >
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Trash Folder Nav Link */}
            <div className="pt-2">
              <Link
                href="/dashboard/trash"
                className={cn(
                  "flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-sm transition-colors text-muted-foreground hover:text-foreground hover:bg-muted/50",
                  pathname === '/dashboard/trash' && "bg-destructive/10 text-destructive font-medium hover:bg-destructive/15"
                )}
              >
                <Trash2 className="h-4 w-4 shrink-0" />
                <span>Trash Bin</span>
              </Link>
            </div>
          </div>
        )}
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
