"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Star, Pin, Copy, Tag as TagIcon, Download, Trash2, 
  Clock, Share2, Loader2, Wifi, WifiOff, Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import * as Dialog from '@radix-ui/react-dialog';
import { documentService } from '@/services/documents';
import { toast } from '@/hooks/useToast';
import type { Document, Tag } from '@/types';
import api from '@/services/api';
import { cn } from '@/lib/utils';

interface DocumentToolbarProps {
  document: Document;
  onUpdate?: (doc: Document) => void;
  saveStatus: string;
  isSyncingQueue: boolean;
  connectionState: string;
  latency: number | null;
  onHistoryOpen: () => void;
  lastSynced: string | null;
}

export function DocumentToolbar({
  document: doc,
  onUpdate,
  saveStatus,
  isSyncingQueue,
  connectionState,
  latency,
  onHistoryOpen,
  lastSynced
}: DocumentToolbarProps) {
  const [isFavorite, setIsFavorite] = useState(doc.isFavorite || false);
  const [isPinned, setIsPinned] = useState(doc.isPinned || false);
  const [docTags, setDocTags] = useState<Tag[]>(doc.tags || []);
  
  // Tag manager states
  const [globalTags, setGlobalTags] = useState<Tag[]>([]);
  const [newTagName, setNewTagName] = useState('');
  const [isTagsLoading, setIsTagsLoading] = useState(false);

  // Duplicate states
  const [dupOpen, setDupOpen] = useState(false);
  const [copyCollabs, setCopyCollabs] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);

  // Export state
  const [isExporting, setIsExporting] = useState<string | null>(null);

  // Update states if document changes
  useEffect(() => {
    setIsFavorite(doc.isFavorite || false);
    setIsPinned(doc.isPinned || false);
    setDocTags(doc.tags || []);
  }, [doc]);

  // Load global tags
  const loadGlobalTags = useCallback(async () => {
    try {
      setIsTagsLoading(true);
      const tags = await documentService.getTags();
      setGlobalTags(tags);
    } catch {
      toast({ title: 'Failed to load tags', variant: 'destructive' });
    } finally {
      setIsTagsLoading(false);
    }
  }, []);

  const handleFavoriteToggle = async () => {
    try {
      // Optimistic state update
      const targetState = !isFavorite;
      setIsFavorite(targetState);
      if (targetState) {
        await documentService.favorite(doc.id);
        toast({ title: 'Added to favorites' });
      } else {
        await documentService.unfavorite(doc.id);
        toast({ title: 'Removed from favorites' });
      }
      if (onUpdate) onUpdate({ ...doc, isFavorite: targetState });
    } catch {
      setIsFavorite(isFavorite); // revert
      toast({ title: 'Failed to update favorite state', variant: 'destructive' });
    }
  };

  const handlePinToggle = async () => {
    try {
      const targetState = !isPinned;
      setIsPinned(targetState);
      if (targetState) {
        await documentService.pin(doc.id);
        toast({ title: 'Document pinned' });
      } else {
        await documentService.unpin(doc.id);
        toast({ title: 'Document unpinned' });
      }
      if (onUpdate) onUpdate({ ...doc, isPinned: targetState });
    } catch {
      setIsPinned(isPinned); // revert
      toast({ title: 'Failed to update pin state', variant: 'destructive' });
    }
  };

  const handleTagToggle = async (tag: Tag) => {
    const isAttached = docTags.some(t => t.id === tag.id);
    try {
      if (isAttached) {
        setDocTags(prev => prev.filter(t => t.id !== tag.id));
        await documentService.removeTag(doc.id, tag.id);
        toast({ title: `Removed tag #${tag.name}` });
      } else {
        setDocTags(prev => [...prev, tag]);
        await documentService.addTag(doc.id, tag.id);
        toast({ title: `Added tag #${tag.name}` });
      }
    } catch {
      setDocTags(docTags); // revert
      toast({ title: 'Failed to update tag mapping', variant: 'destructive' });
    }
  };

  const handleCreateTag = async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newTagName.trim() !== '') {
      const name = newTagName.trim();
      try {
        setNewTagName('');
        const createdTag = await documentService.createTag(name);
        
        // Append to local doc tags
        setDocTags(prev => [...prev, createdTag]);
        await documentService.addTag(doc.id, createdTag.id);
        
        // Refresh global tags dropdown
        setGlobalTags(prev => [...prev, createdTag]);
        toast({ title: `Created and added tag #${name}` });
      } catch {
        toast({ title: 'Failed to create tag', variant: 'destructive' });
      }
    }
  };

  const handleDuplicate = async () => {
    try {
      setIsDuplicating(true);
      const copyDoc = await documentService.duplicate(doc.id, copyCollabs);
      toast({ title: 'Document duplicated successfully' });
      setDupOpen(false);
      // Navigate to the duplicate document
      window.location.href = `/dashboard/documents/${copyDoc.id}`;
    } catch {
      toast({ title: 'Failed to duplicate document', variant: 'destructive' });
    } finally {
      setIsDuplicating(false);
    }
  };

  const handleExport = async (format: 'html' | 'markdown' | 'pdf') => {
    try {
      setIsExporting(format);
      
      // Request file download from server using standard raw axios to retrieve the stream/blob
      const response = await api.get(`/documents/${doc.id}/export/${format}`, { 
        responseType: 'blob' 
      });
      
      const blob = new Blob([response.data], { 
        type: (response.headers['content-type'] as string) || 'application/octet-stream' 
      });
      const url = window.URL.createObjectURL(blob);
      
      const contentDisposition = (response.headers['content-disposition'] as string) || '';
      const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
      const filename = filenameMatch ? filenameMatch[1] : `export-${doc.id}.${format === 'markdown' ? 'md' : format}`;
      
      const link = window.document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      window.document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast({ title: `Exported successfully as ${format.toUpperCase()}` });
    } catch (err) {
      console.error(err);
      toast({ title: 'Export generation failed', variant: 'destructive' });
    } finally {
      setIsExporting(null);
    }
  };

  const handleMoveToTrash = async () => {
    if (!confirm('Move this document to the trash bin? Owners can restore it later.')) return;
    try {
      await documentService.delete(doc.id);
      toast({ title: 'Moved to trash bin' });
      window.location.href = '/dashboard';
    } catch {
      toast({ title: 'Failed to move document to trash', variant: 'destructive' });
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 py-2 px-3 border border-border/80 rounded-xl bg-card/60 backdrop-blur-xs select-none">
      
      {/* ─── LEFT PANEL ACTIONS ─── */}
      <div className="flex flex-wrap items-center gap-1.5">
        {/* Favorite Star Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleFavoriteToggle}
          className="h-8 w-8 text-muted-foreground hover:text-amber-500 rounded-lg transition-transform hover:scale-105 active:scale-95"
          title="Toggle Favorite"
        >
          <Star className={cn("h-4.5 w-4.5", isFavorite ? "text-amber-500 fill-amber-500" : "")} />
        </Button>

        {/* Pin Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handlePinToggle}
          className="h-8 w-8 text-muted-foreground hover:text-primary rounded-lg transition-transform hover:scale-105 active:scale-95"
          title="Toggle Pin"
        >
          <Pin className={cn("h-4.5 w-4.5 rotate-45", isPinned ? "text-primary fill-primary" : "")} />
        </Button>

        {/* Tags Popover Trigger */}
        <DropdownMenu onOpenChange={(open) => open && loadGlobalTags()}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1 px-2 sm:px-3 text-muted-foreground hover:text-foreground text-xs rounded-lg"
            >
              <TagIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Tags</span>
              {docTags.length > 0 && (
                <Badge variant="secondary" className="px-1.5 py-0 h-4 min-w-4 flex items-center justify-center text-[9px] rounded-full ml-0.5">
                  {docTags.length}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56 p-1">
            <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">Document Tags</DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            <div className="max-h-48 overflow-y-auto p-1 space-y-0.5">
              {isTagsLoading ? (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              ) : globalTags.length === 0 ? (
                <p className="text-[11px] text-muted-foreground/60 p-2 italic text-center">No tags found</p>
              ) : (
                globalTags.map(tag => {
                  const isChecked = docTags.some(t => t.id === tag.id);
                  return (
                    <DropdownMenuItem
                      key={tag.id}
                      onClick={(e) => { e.preventDefault(); handleTagToggle(tag); }}
                      className="flex items-center justify-between text-xs cursor-pointer"
                    >
                      <span>#{tag.name}</span>
                      {isChecked && <Star className="h-3 w-3 fill-amber-500 text-amber-500" />}
                    </DropdownMenuItem>
                  );
                })
              )}
            </div>

            <DropdownMenuSeparator />
            <div className="p-2">
              <Input
                placeholder="Create tag... [Enter]"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                onKeyDown={handleCreateTag}
                className="h-7 text-xs"
              />
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Duplicate Dialog Action */}
        <Dialog.Root open={dupOpen} onOpenChange={setDupOpen}>
          <Dialog.Trigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1 px-2 sm:px-3 text-muted-foreground hover:text-foreground text-xs rounded-lg"
            >
              <Copy className="h-4 w-4" />
              <span className="hidden sm:inline">Duplicate</span>
            </Button>
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 animate-fade-in" />
            <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-card border border-border/80 rounded-xl p-5 w-full max-w-sm shadow-xl z-50 animate-in fade-in zoom-in-95 duration-150">
              <h2 className="text-sm font-bold text-foreground">Duplicate Document</h2>
              <p className="text-xs text-muted-foreground mt-1">This will create a copy of this document with its content and tags.</p>
              
              <div className="flex items-center gap-2 mt-4">
                <input
                  type="checkbox"
                  id="copy-collabs"
                  checked={copyCollabs}
                  onChange={(e) => setCopyCollabs(e.target.checked)}
                  className="rounded border-border text-primary focus:ring-primary h-3.5 w-3.5 cursor-pointer"
                />
                <label htmlFor="copy-collabs" className="text-xs font-medium text-muted-foreground cursor-pointer select-none">
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

        {/* Export Dropdown Trigger */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1 px-2 sm:px-3 text-muted-foreground hover:text-foreground text-xs rounded-lg"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Export</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-40 p-1">
            <DropdownMenuItem
              onClick={() => handleExport('pdf')}
              disabled={isExporting !== null}
              className="flex items-center justify-between text-xs cursor-pointer"
            >
              <span>Export as PDF</span>
              {isExporting === 'pdf' ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <span className="text-[9px] bg-muted px-1 py-0.5 rounded text-muted-foreground">PDF</span>
              )}
            </DropdownMenuItem>
            
            <DropdownMenuItem
              onClick={() => handleExport('markdown')}
              disabled={isExporting !== null}
              className="flex items-center justify-between text-xs cursor-pointer"
            >
              <span>Export as Markdown</span>
              {isExporting === 'markdown' ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <span className="text-[9px] bg-muted px-1 py-0.5 rounded text-muted-foreground">MD</span>
              )}
            </DropdownMenuItem>
            
            <DropdownMenuItem
              onClick={() => handleExport('html')}
              disabled={isExporting !== null}
              className="flex items-center justify-between text-xs cursor-pointer"
            >
              <span>Export as HTML</span>
              {isExporting === 'html' ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <span className="text-[9px] bg-muted px-1 py-0.5 rounded text-muted-foreground">HTML</span>
              )}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Move to Trash Button */}
        {doc.role === 'OWNER' && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMoveToTrash}
            className="h-8 gap-1 px-2 sm:px-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10 text-xs rounded-lg"
          >
            <Trash2 className="h-4 w-4" />
            <span className="hidden sm:inline">Trash</span>
          </Button>
        )}
      </div>

      {/* ─── RIGHT PANEL SYNC STATUS ─── */}
      <div className="flex items-center gap-3 text-xs select-none">
        
        {/* Autosave sync info message */}
        <span className="text-muted-foreground font-medium flex items-center gap-1.5">
          {saveStatus === 'saving' && (
            <>
              <Loader2 className="h-3 w-3 animate-spin text-primary" />
              Saving...
            </>
          )}
          {saveStatus === 'saved' && 'Saved'}
          {saveStatus === 'offline' && 'Offline Changes Cached'}
          {isSyncingQueue && 'Synced'}
        </span>

        {lastSynced && (
          <span className="text-muted-foreground/60 hidden sm:inline">
            Sync: {new Date(lastSynced).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}

        <div className="h-3 w-[1px] bg-border" />

        {/* Real-time WebSockets connection latency badge */}
        <div className="flex items-center gap-1.5 pl-1.5">
          {connectionState === 'connected' ? (
            <span className="flex items-center gap-1 text-green-600 font-medium" title="WebSocket connected">
              <Wifi className="h-3.5 w-3.5" />
              Connected {latency !== null && `(${latency}ms)`}
            </span>
          ) : connectionState === 'reconnecting' ? (
            <span className="flex items-center gap-1 text-yellow-600 font-medium animate-pulse">
              <Wifi className="h-3.5 w-3.5" />
              Connecting...
            </span>
          ) : (
            <span className="flex items-center gap-1 text-amber-600 font-medium">
              <WifiOff className="h-3.5 w-3.5" />
              Offline Mode
            </span>
          )}
        </div>

        {/* History drawer trigger */}
        <Button
          variant="outline"
          size="sm"
          onClick={onHistoryOpen}
          className="h-7 text-[10px] gap-1 px-2 shrink-0 border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100 hover:text-amber-800 rounded-lg"
        >
          <Clock className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">History</span>
        </Button>
      </div>

    </div>
  );
}
