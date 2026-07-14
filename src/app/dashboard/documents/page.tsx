"use client";

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus, FileText, Search, MoreHorizontal, Trash2, Edit3,
  Star, Pin, Copy, Tag as TagIcon, ArrowUpDown, SlidersHorizontal,
  Loader2, List, LayoutGrid
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import * as Dialog from '@radix-ui/react-dialog';
import { documentService } from '@/services/documents';
import { toast } from '@/hooks/useToast';
import { useAuth } from '@/contexts/AuthContext';
import type { Document, Tag } from '@/types';
import { CreateDocumentModal } from '@/components/documents/CreateDocumentModal';
import Link from 'next/link';
import { useWorkspace } from '@/hooks/useWorkspace';

function formatDate(dateStr: string) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(dateStr));
}

function DocumentSkeleton() {
  return (
    <div className="animate-pulse flex items-center gap-4 p-4 rounded-xl border bg-card">
      <div className="w-9 h-9 bg-muted rounded-lg shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-muted rounded w-1/3" />
        <div className="h-3 bg-muted rounded w-1/5" />
      </div>
    </div>
  );
}

export default function DocumentsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedMode = localStorage.getItem('doc-view-mode') as 'list' | 'grid';
      if (savedMode === 'list' || savedMode === 'grid') {
        setViewMode(savedMode);
      }
    }
  }, []);

  const handleSetViewMode = (mode: 'list' | 'grid') => {
    setViewMode(mode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('doc-view-mode', mode);
    }
  };

  // Search and filters
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'favorites' | 'owned'>('all');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Tag manager list
  const [globalTags, setGlobalTags] = useState<Tag[]>([]);

  // Modals / dialogs
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [dupOpen, setDupOpen] = useState(false);
  const [selectedDocForDup, setSelectedDocForDup] = useState<Document | null>(null);
  const [copyCollabs, setCopyCollabs] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);

  // Floating Context Menu state
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    document: Document;
  } | null>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 200);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const loadDocuments = useCallback(async () => {
    try {
      setIsLoading(true);
      const [docs, tags] = await Promise.all([
        documentService.list(),
        documentService.getTags()
      ]);

      // Sort pinned first, then by updatedAt DESC
      const sorted = [...docs].sort((a, b) => {
        const aPinned = a.isPinned ? 1 : 0;
        const bPinned = b.isPinned ? 1 : 0;
        if (aPinned !== bPinned) {
          return bPinned - aPinned;
        }
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
      setDocuments(sorted);
      setGlobalTags(tags);
    } catch {
      toast({ title: 'Failed to load document index', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  // ── Real-time workspace event subscriptions ──────────────────────────────
  useWorkspace({
    onDocumentCreated: ({ document }) => {
      setDocuments(prev => {
        if (prev.some(d => d.id === document.id)) return prev;
        // Insert new doc and re-sort: pinned first, then by date DESC
        const updated = [document, ...prev];
        return updated.sort((a, b) => {
          const ap = a.isPinned ? 1 : 0;
          const bp = b.isPinned ? 1 : 0;
          if (ap !== bp) return bp - ap;
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        });
      });
    },
    onDocumentDeleted: ({ documentId }) => {
      setDocuments(prev => prev.filter(d => d.id !== documentId));
    },
    onDocumentPermanentlyDeleted: ({ documentId }) => {
      setDocuments(prev => prev.filter(d => d.id !== documentId));
    },
    onDocumentRestored: ({ document }) => {
      setDocuments(prev => {
        if (prev.some(d => d.id === document.id)) return prev;
        return [document, ...prev].sort((a, b) => {
          const ap = a.isPinned ? 1 : 0;
          const bp = b.isPinned ? 1 : 0;
          if (ap !== bp) return bp - ap;
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        });
      });
    },
    onDocumentUpdated: ({ documentId, changes }) => {
      setDocuments(prev => prev.map(d => d.id === documentId ? { ...d, ...changes } : d));
    },
    onDocumentFavorited: ({ documentId, isFavorite }) => {
      setDocuments(prev => prev.map(d => d.id === documentId ? { ...d, isFavorite } : d));
    },
    onDocumentPinned: ({ documentId, isPinned }) => {
      setDocuments(prev => {
        const updated = prev.map(d => d.id === documentId ? { ...d, isPinned } : d);
        return updated.sort((a, b) => {
          const ap = a.isPinned ? 1 : 0;
          const bp = b.isPinned ? 1 : 0;
          if (ap !== bp) return bp - ap;
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        });
      });
    },
    onDocumentTagAdded: ({ documentId, tag }) => {
      setDocuments(prev => prev.map(d =>
        d.id === documentId
          ? { ...d, tags: d.tags ? (d.tags.some(t => t.id === tag.id) ? d.tags : [...d.tags, tag]) : [tag] }
          : d
      ));
      setGlobalTags(prev => prev.some(t => t.id === tag.id) ? prev : [...prev, tag]);
    },
    onDocumentTagRemoved: ({ documentId, tagId }) => {
      setDocuments(prev => prev.map(d =>
        d.id === documentId
          ? { ...d, tags: d.tags ? d.tags.filter(t => t.id !== tagId) : [] }
          : d
      ));
    },
  });

  // Context Menu handlers
  const handleContextMenu = (e: React.MouseEvent, doc: Document) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      document: doc
    });
  };

  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  useEffect(() => {
    if (contextMenu) {
      window.addEventListener('click', closeContextMenu);
      return () => window.removeEventListener('click', closeContextMenu);
    }
  }, [contextMenu, closeContextMenu]);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Move "${title}" to the trash?`)) return;
    try {
      setDocuments(prev => prev.filter(d => d.id !== id));
      await documentService.delete(id);
      toast({ title: 'Moved to trash' });
    } catch {
      toast({ title: 'Failed to delete document', variant: 'destructive' });
      loadDocuments();
    }
  };

  const handleFavoriteToggle = async (docToFav: Document) => {
    try {
      const targetState = !docToFav.isFavorite;
      setDocuments(prev => prev.map(d => d.id === docToFav.id ? { ...d, isFavorite: targetState } : d));
      if (targetState) {
        await documentService.favorite(docToFav.id);
        toast({ title: 'Added to favorites' });
      } else {
        await documentService.unfavorite(docToFav.id);
        toast({ title: 'Removed from favorites' });
      }
    } catch {
      loadDocuments();
      toast({ title: 'Failed to update favorite status', variant: 'destructive' });
    }
  };

  const handlePinToggle = async (docToPin: Document) => {
    try {
      const targetState = !docToPin.isPinned;
      setDocuments(prev => prev.map(d => d.id === docToPin.id ? { ...d, isPinned: targetState } : d));
      if (targetState) {
        await documentService.pin(docToPin.id);
        toast({ title: 'Document pinned' });
      } else {
        await documentService.unpin(docToPin.id);
        toast({ title: 'Document unpinned' });
      }
    } catch {
      loadDocuments();
      toast({ title: 'Failed to pin document', variant: 'destructive' });
    }
  };

  const handleOpenDuplicate = (docToDup: Document) => {
    setSelectedDocForDup(docToDup);
    setDupOpen(true);
  };

  const handleDuplicate = async () => {
    if (!selectedDocForDup) return;
    try {
      setIsDuplicating(true);
      const copyDoc = await documentService.duplicate(selectedDocForDup.id, copyCollabs);
      toast({ title: 'Document duplicated' });
      setDupOpen(false);
      setDocuments(prev => {
        const updated = [copyDoc, ...prev];
        // Re-sort to keep pinned items at top
        return updated.sort((a, b) => {
          const aPinned = a.isPinned ? 1 : 0;
          const bPinned = b.isPinned ? 1 : 0;
          if (aPinned !== bPinned) return bPinned - aPinned;
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        });
      });
    } catch {
      toast({ title: 'Failed to duplicate document', variant: 'destructive' });
    } finally {
      setIsDuplicating(false);
    }
  };

  // Filter application
  const filtered = documents.filter(doc => {
    // 1. Text Search query
    const matchesSearch = doc.title.toLowerCase().includes(debouncedSearch.toLowerCase());

    // 2. Tab selection
    let matchesTab = true;
    if (filterTab === 'favorites') matchesTab = !!doc.isFavorite;
    else if (filterTab === 'owned') matchesTab = doc.createdBy === user?.id;

    // 3. Tag filtering
    let matchesTag = true;
    if (selectedTag) {
      matchesTag = doc.tags?.some(t => t.id === selectedTag) || false;
    }

    return matchesSearch && matchesTab && matchesTag;
  });

  return (
    <>
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header Block */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
          <div>
            <h1 className="text-xl font-bold text-foreground">Workspace Canvas</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Browse and coordinate your shared files ({documents.length} items total)
            </p>
          </div>
          <Button id="create-document-btn" size="sm" onClick={() => setIsCreateOpen(true)} className="gap-1.5 font-semibold shrink-0 shadow-sm self-start sm:self-auto">
            <Plus className="h-4 w-4" />
            New Document
          </Button>
        </div>

        {/* Tab Filters & Search Panel */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="document-search"
                placeholder="Search documents by title…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              {/* Tab selection badges */}
              <div className="flex bg-muted/40 p-1 rounded-lg border border-border/80 gap-0.5">
                <Button
                  variant={filterTab === 'all' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-7 text-xs px-2.5 font-semibold"
                  onClick={() => setFilterTab('all')}
                >
                  All
                </Button>
                <Button
                  variant={filterTab === 'favorites' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-7 text-xs px-2.5 font-semibold"
                  onClick={() => setFilterTab('favorites')}
                >
                  Favorites
                </Button>
                <Button
                  variant={filterTab === 'owned' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-7 text-xs px-2.5 font-semibold"
                  onClick={() => setFilterTab('owned')}
                >
                  My Docs
                </Button>
              </div>

              {/* View Mode Toggle Button Group */}
              <div className="flex bg-muted/40 p-1 rounded-lg border border-border/80 gap-0.5">
                <Button
                  variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-7 w-7 p-0 flex items-center justify-center rounded"
                  onClick={() => handleSetViewMode('list')}
                  title="List View"
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-7 w-7 p-0 flex items-center justify-center rounded"
                  onClick={() => handleSetViewMode('grid')}
                  title="Grid View"
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Tag Filter row */}
          {globalTags.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider flex items-center gap-1">
                <SlidersHorizontal className="h-3 w-3" /> Filter Tag:
              </span>
              <Button
                variant={selectedTag === null ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedTag(null)}
                className="text-[10px] px-2 py-0.5 h-5 rounded-full"
              >
                All
              </Button>
              {globalTags.map(tag => (
                <Button
                  key={tag.id}
                  variant={selectedTag === tag.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedTag(tag.id)}
                  className="text-[10px] px-2 py-0.5 h-5 rounded-full"
                >
                  #{tag.name}
                </Button>
              ))}
            </div>
          )}
        </div>

        {/* List/Grid Layout Container */}
        <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4" : "space-y-2"}>
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => <DocumentSkeleton key={i} />)
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 border border-dashed rounded-xl p-8 bg-card/10">
              <FileText className="h-8 w-8 text-muted-foreground/35 mx-auto mb-3" />
              <h3 className="font-semibold text-sm">No documents found</h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                {searchQuery || selectedTag || filterTab !== 'all'
                  ? 'No documents match your active filters.'
                  : 'Start by creating a collaborative document.'}
              </p>
            </div>
          ) : (
            filtered.map(doc => {
              const dropdownMenuContent = (
                <DropdownMenuContent align="end" className="w-44 p-1 bg-white dark:bg-zinc-950 border border-border/80 shadow-md rounded-lg opacity-100" onClick={e => e.stopPropagation()}>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      handleFavoriteToggle(doc);
                    }}
                    className="gap-2 text-xs"
                  >
                    <Star className="h-4.5 w-4.5" />
                    {doc.isFavorite ? 'Unfavorite' : 'Favorite'}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePinToggle(doc);
                    }}
                    className="gap-2 text-xs"
                  >
                    <Pin className="h-4.5 w-4.5 rotate-45" />
                    {doc.isPinned ? 'Unpin' : 'Pin'}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenDuplicate(doc);
                    }}
                    className="gap-2 text-xs"
                  >
                    <Copy className="h-4.5 w-4.5" />
                    Duplicate
                  </DropdownMenuItem>
                  {(doc.createdBy === user?.id || doc.role === 'OWNER') && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(doc.id, doc.title);
                        }}
                        className="gap-2 text-destructive focus:text-destructive text-xs"
                      >
                        <Trash2 className="h-4.5 w-4.5" />
                        Delete
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              );

              if (viewMode === 'grid') {
                return (
                  <Card
                    key={doc.id}
                    onContextMenu={(e) => handleContextMenu(e, doc)}
                    className="group flex flex-col justify-between p-5 h-44 hover:shadow-md transition-all cursor-pointer bg-card/45 hover:bg-card border-border/80 relative rounded-xl"
                    onClick={() => router.push(`/dashboard/documents/${doc.id}`)}
                  >
                    {/* Top Row: File icon and actions dropdown */}
                    <div className="flex items-center justify-between w-full">
                      <div className="w-9 h-9 bg-primary/10 text-primary rounded-lg flex items-center justify-center shrink-0">
                        <FileText className="h-4.5 w-4.5" />
                      </div>
                      
                      {/* Direct Dropdown trigger menu */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        {dropdownMenuContent}
                      </DropdownMenu>
                    </div>

                    {/* Middle Section: Title & Pinned/Favorite Icons */}
                    <div className="flex-1 mt-3 w-full min-w-0">
                      <div className="flex items-start gap-1.5 flex-wrap">
                        <h3 className="font-semibold text-sm text-foreground line-clamp-2 w-full">{doc.title}</h3>
                        <div className="flex gap-1.5 items-center mt-1 flex-wrap">
                          {doc.isPinned && (
                            <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 text-[9px] gap-0.5 px-1 py-0.2 font-semibold">
                              <Pin className="h-2 w-2 rotate-45 fill-primary" />
                              Pinned
                            </Badge>
                          )}
                          {doc.isFavorite && <Star className="h-3 w-3 text-amber-500 fill-amber-500" />}
                        </div>
                      </div>
                    </div>

                    {/* Bottom Row: Metadata & Tags */}
                    <div className="mt-2 w-full flex items-center justify-between border-t border-border/30 pt-2 text-[10px] text-muted-foreground">
                      <span>Updated {formatDate(doc.updatedAt)}</span>
                      
                      {doc.tags && doc.tags.length > 0 && (
                        <div className="flex items-center gap-1">
                          {doc.tags.slice(0, 1).map(tag => (
                            <span key={tag.id} className="text-[8px] bg-secondary/80 px-1 py-0.2 rounded-full truncate max-w-[60px]">
                              #{tag.name}
                            </span>
                          ))}
                          {doc.tags.length > 1 && (
                            <span>+{doc.tags.length - 1}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </Card>
                );
              }

              // List view mode (default)
              return (
                <Card
                  key={doc.id}
                  onContextMenu={(e) => handleContextMenu(e, doc)}
                  className="group flex items-center gap-4 p-4 hover:shadow-md transition-all cursor-pointer bg-card/45 hover:bg-card border-border/80 relative"
                  onClick={() => router.push(`/dashboard/documents/${doc.id}`)}
                >
                  {/* File Icon */}
                  <div className="w-9 h-9 bg-primary/10 text-primary rounded-lg flex items-center justify-center shrink-0">
                    <FileText className="h-4 w-4" />
                  </div>

                  {/* Title & Metadata */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-foreground truncate block">{doc.title}</span>
                      {doc.isPinned && (
                        <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 text-[10px] gap-1 px-1.5 py-0.5 font-semibold shrink-0">
                          <Pin className="h-2.5 w-2.5 rotate-45 fill-primary" />
                          Pinned
                        </Badge>
                      )}
                      {doc.isFavorite && <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500 shrink-0" />}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">Updated {formatDate(doc.updatedAt)}</p>
                  </div>

                  {/* Display Tags */}
                  {doc.tags && doc.tags.length > 0 && (
                    <div className="hidden md:flex items-center gap-1">
                      {doc.tags.slice(0, 2).map(tag => (
                        <span key={tag.id} className="text-[9px] bg-secondary/85 text-secondary-foreground border border-border/70 px-1.5 py-0.5 rounded-full">
                          #{tag.name}
                        </span>
                      ))}
                      {doc.tags.length > 2 && (
                        <span className="text-[9px] text-muted-foreground">+{doc.tags.length - 2}</span>
                      )}
                    </div>
                  )}

                  {/* Direct Dropdown trigger menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 opacity-100 group-hover:opacity-100 transition-opacity">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    {dropdownMenuContent}
                  </DropdownMenu>
                </Card>
              );
            })
          )}
        </div>
      </div>

      {/* Floating Context Menu */}
      {contextMenu && (
        <div
          className="fixed z-50 bg-white dark:bg-zinc-950 border border-border/80 shadow-lg rounded-lg w-48 p-1 animate-in fade-in zoom-in-95 duration-100 opacity-100"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-2 py-1.5 text-[9px] uppercase tracking-wider text-muted-foreground/80 font-bold border-b border-border/40 mb-1">
            {contextMenu.document.title}
          </div>
          <button
            onClick={() => router.push(`/dashboard/documents/${contextMenu.document.id}`)}
            className="flex items-center w-full gap-2 px-2 py-1.5 text-xs text-left rounded hover:bg-muted/80 text-foreground transition-colors"
          >
            <Edit3 className="h-3.5 w-3.5 text-muted-foreground" /> Open Workspace
          </button>
          <button
            onClick={() => handleFavoriteToggle(contextMenu.document)}
            className="flex items-center w-full gap-2 px-2 py-1.5 text-xs text-left rounded hover:bg-muted/80 text-foreground transition-colors"
          >
            <Star className="h-3.5 w-3.5 text-muted-foreground" />
            {contextMenu.document.isFavorite ? 'Unfavorite' : 'Mark Favorite'}
          </button>
          <button
            onClick={() => handlePinToggle(contextMenu.document)}
            className="flex items-center w-full gap-2 px-2 py-1.5 text-xs text-left rounded hover:bg-muted/80 text-foreground transition-colors"
          >
            <Pin className="h-3.5 w-3.5 text-muted-foreground rotate-45" />
            {contextMenu.document.isPinned ? 'Unpin' : 'Pin Workspace'}
          </button>
          <button
            onClick={() => handleOpenDuplicate(contextMenu.document)}
            className="flex items-center w-full gap-2 px-2 py-1.5 text-xs text-left rounded hover:bg-muted/80 text-foreground transition-colors"
          >
            <Copy className="h-3.5 w-3.5 text-muted-foreground" /> Duplicate
          </button>
          {(contextMenu.document.createdBy === user?.id || contextMenu.document.role === 'OWNER') && (
            <>
              <div className="border-t my-1 border-border/40" />
              <button
                onClick={() => handleDelete(contextMenu.document.id, contextMenu.document.title)}
                className="flex items-center w-full gap-2 px-2 py-1.5 text-xs text-left rounded hover:bg-destructive/10 text-destructive transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" /> Move to Trash
              </button>
            </>
          )}
        </div>
      )}

      {/* Duplicate Dialog Modal */}
      {selectedDocForDup && (
        <Dialog.Root open={dupOpen} onOpenChange={setDupOpen}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 animate-fade-in" />
            <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-card border border-border/80 rounded-xl p-5 w-full max-w-sm shadow-xl z-50 animate-in fade-in zoom-in-95 duration-150">
              <h2 className="text-sm font-bold text-foreground">Duplicate Document</h2>
              <p className="text-xs text-muted-foreground mt-1">
                Create a copy of &quot;{selectedDocForDup.title}&quot; with its current tags and content.
              </p>

              <div className="flex items-center gap-2 mt-4">
                <input
                  type="checkbox"
                  id="copy-collabs-index"
                  checked={copyCollabs}
                  onChange={(e) => setCopyCollabs(e.target.checked)}
                  className="rounded border-border text-primary focus:ring-primary h-3.5 w-3.5 cursor-pointer"
                />
                <label htmlFor="copy-collabs-index" className="text-xs font-medium text-muted-foreground cursor-pointer select-none">
                  Inherit collaborators (readers/editors)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 mt-6">
                <Dialog.Close asChild>
                  <Button variant="ghost" size="sm" className="text-xs">Cancel</Button>
                </Dialog.Close>
                <Button
                  size="sm"
                  onClick={handleDuplicate}
                  disabled={isDuplicating}
                  className="text-xs font-semibold gap-1.5"
                >
                  {isDuplicating && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Duplicate Document
                </Button>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      )}

      <CreateDocumentModal
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={(doc) => {
          setDocuments(prev => [doc, ...prev]);
          setIsCreateOpen(false);
          router.push(`/dashboard/documents/${doc.id}`);
        }}
      />
    </>
  );
}
