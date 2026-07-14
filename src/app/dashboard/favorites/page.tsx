"use client";

import { useEffect, useState, useCallback } from 'react';
import { Star, FileText, ArrowLeft, Trash2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { documentService } from '@/services/documents';
import { toast } from '@/hooks/useToast';
import type { Document } from '@/types';
import Link from 'next/link';
import { useWorkspace } from '@/hooks/useWorkspace';

function formatDate(dateStr: string) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(dateStr));
}

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadFavorites = useCallback(async () => {
    try {
      setIsLoading(true);
      const docs = await documentService.getFavorites();
      setFavorites(docs);
    } catch {
      toast({ title: 'Failed to load favorite documents', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  // ── Real-time workspace event subscriptions ──────────────────────────────
  useWorkspace({
    onDocumentFavorited: ({ documentId, isFavorite }) => {
      if (isFavorite) {
        documentService.get(documentId).then(doc => {
          setFavorites(prev => prev.some(d => d.id === documentId) ? prev : [doc, ...prev]);
        }).catch(() => {});
      } else {
        setFavorites(prev => prev.filter(d => d.id !== documentId));
      }
    },
    onDocumentDeleted: ({ documentId }) => {
      setFavorites(prev => prev.filter(d => d.id !== documentId));
    },
    onDocumentPermanentlyDeleted: ({ documentId }) => {
      setFavorites(prev => prev.filter(d => d.id !== documentId));
    },
    onDocumentUpdated: ({ documentId, changes }) => {
      setFavorites(prev => prev.map(d => d.id === documentId ? { ...d, ...changes } : d));
    },
  });

  const handleUnfavorite = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      // Optimistic UI update
      setFavorites(prev => prev.filter(d => d.id !== id));
      await documentService.unfavorite(id);
      toast({ title: 'Removed from favorites' });
    } catch {
      toast({ title: 'Failed to unfavorite document', variant: 'destructive' });
      loadFavorites(); // Revert
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard" passHref>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            Favorites <Star className="h-5 w-5 text-amber-500 fill-amber-500 animate-pulse" />
          </h1>
          <p className="text-xs text-muted-foreground">Quick access to bookmarked files</p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse h-28 bg-muted rounded-xl border border-border" />
          ))}
        </div>
      ) : favorites.length === 0 ? (
        <Card className="p-12 text-center flex flex-col items-center justify-center border-dashed border-2">
          <Star className="h-8 w-8 text-muted-foreground/40 mb-3" />
          <h3 className="font-semibold text-sm">No favorites bookmarked</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm">
            Star documents inside the editor toolbar to pin them here for rapid access.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {favorites.map(doc => (
            <Link key={doc.id} href={`/dashboard/documents/${doc.id}`} passHref>
              <Card className="group p-4 hover:shadow-md transition-shadow relative flex flex-col justify-between h-28 cursor-pointer bg-card/45 hover:bg-card">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 bg-amber-500/10 text-amber-500 rounded-lg flex items-center justify-center shrink-0">
                      <FileText className="h-4 w-4" />
                    </div>
                    <span className="font-semibold text-sm text-foreground truncate">{doc.title}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-amber-500 hover:text-muted-foreground shrink-0 rounded-full"
                    onClick={(e) => handleUnfavorite(doc.id, e)}
                  >
                    <Star className="h-4 w-4 fill-amber-500" />
                  </Button>
                </div>
                
                <div className="flex items-center justify-between text-[11px] text-muted-foreground mt-2 border-t pt-2 border-border/40">
                  <span>Updated {formatDate(doc.updatedAt)}</span>
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-primary">
                    Open <ExternalLink className="h-3 w-3" />
                  </span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
