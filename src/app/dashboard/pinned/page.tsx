"use client";

import { useEffect, useState, useCallback } from 'react';
import { Pin, FileText, ArrowLeft, Move, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { documentService } from '@/services/documents';
import { toast } from '@/hooks/useToast';
import type { Document } from '@/types';
import Link from 'next/link';

function formatDate(dateStr: string) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(dateStr));
}

export default function PinnedPage() {
  const [pinned, setPinned] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadPinned = useCallback(async () => {
    try {
      setIsLoading(true);
      const docs = await documentService.getPinned();
      setPinned(docs);
    } catch {
      toast({ title: 'Failed to load pinned documents', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPinned();
  }, [loadPinned]);

  const handleUnpin = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      setPinned(prev => prev.filter(d => d.id !== id));
      await documentService.unpin(id);
      toast({ title: 'Document unpinned' });
    } catch {
      toast({ title: 'Failed to unpin document', variant: 'destructive' });
      loadPinned();
    }
  };

  // Drag and Drop simulation to reorder locally
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

  const handleDragStart = (idx: number) => {
    setDraggedIdx(idx);
  };

  const handleDragOver = (idx: number, e: React.DragEvent) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === idx) return;

    const copy = [...pinned];
    const draggedItem = copy[draggedIdx];
    copy.splice(draggedIdx, 1);
    copy.splice(idx, 0, draggedItem);
    
    setDraggedIdx(idx);
    setPinned(copy);
  };

  const handleDragEnd = () => {
    setDraggedIdx(null);
    toast({ title: 'Pinned layout reordered' });
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
            Pinned <Pin className="h-5 w-5 text-primary rotate-45" />
          </h1>
          <p className="text-xs text-muted-foreground">Workspace pinboards (drag cards to reorder)</p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse h-16 bg-muted rounded-xl border border-border" />
          ))}
        </div>
      ) : pinned.length === 0 ? (
        <Card className="p-12 text-center flex flex-col items-center justify-center border-dashed border-2">
          <Pin className="h-8 w-8 text-muted-foreground/40 mb-3 rotate-45" />
          <h3 className="font-semibold text-sm">No pinned workspaces</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm">
            Mark documents as pinned in the header toolbar to place them at the top of your workspace sidebar.
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {pinned.map((doc, idx) => (
            <div
              key={doc.id}
              draggable
              onDragStart={() => handleDragStart(idx)}
              onDragOver={(e) => handleDragOver(idx, e)}
              onDragEnd={handleDragEnd}
              className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card/45 hover:bg-card cursor-grab active:cursor-grabbing hover:shadow-xs transition-shadow"
            >
              <div className="text-muted-foreground/40 hover:text-muted-foreground/75 transition-colors">
                <Move className="h-4 w-4" />
              </div>
              <div className="w-8 h-8 bg-primary/10 text-primary rounded-lg flex items-center justify-center shrink-0">
                <FileText className="h-4 w-4" />
              </div>
              
              <div className="flex-1 min-w-0">
                <Link href={`/dashboard/documents/${doc.id}`} className="font-semibold text-sm hover:underline block truncate">
                  {doc.title}
                </Link>
                <p className="text-[11px] text-muted-foreground/70 mt-0.5">Updated {formatDate(doc.updatedAt)}</p>
              </div>

              <div className="flex items-center gap-2">
                <Link href={`/dashboard/documents/${doc.id}`} passHref>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary rounded-full">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-primary hover:text-muted-foreground rounded-full"
                  onClick={(e) => handleUnpin(doc.id, e)}
                >
                  <Pin className="h-4 w-4 fill-primary rotate-45" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
