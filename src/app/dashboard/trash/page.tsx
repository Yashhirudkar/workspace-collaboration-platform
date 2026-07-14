"use client";

import { useEffect, useState, useCallback } from 'react';
import { Trash2, FileText, RefreshCw, AlertTriangle, ArrowLeft, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { documentService } from '@/services/documents';
import { toast } from '@/hooks/useToast';
import type { Document } from '@/types';
import Link from 'next/link';

function formatDate(dateStr: string) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(dateStr));
}

export default function TrashPage() {
  const [trash, setTrash] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadTrash = useCallback(async () => {
    try {
      setIsLoading(true);
      const docs = await documentService.getTrash();
      setTrash(docs);
    } catch {
      toast({ title: 'Failed to load trash bin', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTrash();
  }, [loadTrash]);

  const handleRestore = async (id: string, title: string) => {
    try {
      setTrash(prev => prev.filter(d => d.id !== id));
      await documentService.restore(id);
      toast({ title: `"${title}" has been restored to your documents.` });
    } catch {
      toast({ title: 'Failed to restore document', variant: 'destructive' });
      loadTrash();
    }
  };

  const handlePermanentDelete = async (id: string, title: string) => {
    if (!confirm(`Are you absolutely sure you want to permanently delete "${title}"? This cannot be undone.`)) return;
    try {
      setTrash(prev => prev.filter(d => d.id !== id));
      await documentService.permanentDelete(id);
      toast({ title: `"${title}" permanently deleted.` });
    } catch {
      toast({ title: 'Failed to permanently delete document', variant: 'destructive' });
      loadTrash();
    }
  };

  const handleEmptyTrash = async () => {
    if (trash.length === 0) return;
    if (!confirm("Permanently delete ALL items in your trash? This operation is irreversible.")) return;
    
    try {
      setIsLoading(true);
      await Promise.all(trash.map(doc => documentService.permanentDelete(doc.id)));
      setTrash([]);
      toast({ title: 'Trash bin emptied' });
    } catch {
      toast({ title: 'Failed to empty trash completely', variant: 'destructive' });
      loadTrash();
    }
  };

  const filtered = trash.filter(doc =>
    doc.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" passHref>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
              Trash Bin <Trash2 className="h-5 w-5 text-destructive" />
            </h1>
            <p className="text-xs text-muted-foreground">Recover or permanently destroy deleted files</p>
          </div>
        </div>

        {trash.length > 0 && (
          <Button variant="destructive" size="sm" onClick={handleEmptyTrash} className="gap-1.5 self-start sm:self-auto shrink-0 shadow-sm">
            <AlertTriangle className="h-4 w-4" />
            Empty Trash
          </Button>
        )}
      </div>

      {/* Search Bar */}
      {trash.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search deleted documents by title…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      )}

      {/* Trash Contents */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse h-16 bg-muted rounded-xl border border-border" />
          ))}
        </div>
      ) : trash.length === 0 ? (
        <Card className="p-12 text-center flex flex-col items-center justify-center border-dashed border-2">
          <Trash2 className="h-8 w-8 text-muted-foreground/35 mb-3" />
          <h3 className="font-semibold text-sm">Trash bin is empty</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm">
            Documents you soft-delete will appear here for 30 days before being automatically pruned.
          </p>
        </Card>
      ) : filtered.length === 0 ? (
        <div className="text-center py-10 text-xs text-muted-foreground">
          No matches found for &quot;{search}&quot;.
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(doc => (
            <div
              key={doc.id}
              className="flex items-center justify-between p-4 rounded-xl border border-border bg-card/30 hover:bg-card transition-colors hover:shadow-xs"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 bg-destructive/10 text-destructive rounded-lg flex items-center justify-center shrink-0">
                  <FileText className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <span className="font-semibold text-sm text-foreground block truncate">{doc.title}</span>
                  <span className="text-[10px] text-muted-foreground/80 mt-0.5">Deleted {formatDate(doc.deletedAt || doc.updatedAt)}</span>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-full"
                  onClick={() => handleRestore(doc.id, doc.title)}
                  title="Restore document"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:bg-destructive/10 rounded-full"
                  onClick={() => handlePermanentDelete(doc.id, doc.title)}
                  title="Permanently delete"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
