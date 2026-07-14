"use client";

import { useEffect, useState, useCallback } from 'react';
import { Plus, FileText, Search, MoreHorizontal, Trash2, Edit3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { documentService } from '@/services/documents';
import { toast } from '@/hooks/useToast';
import { useAuth } from '@/contexts/AuthContext';
import type { Document } from '@/types';
import { CreateDocumentModal } from '@/components/documents/CreateDocumentModal';

function formatDate(dateStr: string) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(dateStr));
}

function DocumentSkeleton() {
  return (
    <div className="animate-pulse flex items-center gap-4 p-4 rounded-lg border bg-card">
      <div className="w-9 h-9 bg-muted rounded-md shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-muted rounded w-1/3" />
        <div className="h-3 bg-muted rounded w-1/5" />
      </div>
    </div>
  );
}

export default function DocumentsPage() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Debounce search to prevent continuous layout shifts during typing
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 200);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const loadDocuments = useCallback(async () => {
    try {
      setIsLoading(true);
      const docs = await documentService.list();
      
      // Sort: Latest Updated First
      const sorted = [...docs].sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
      
      setDocuments(sorted);
    } catch {
      toast({ title: 'Failed to load documents', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadDocuments(); }, [loadDocuments]);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    try {
      await documentService.delete(id);
      setDocuments(prev => prev.filter(d => d.id !== id));
      toast({ title: 'Document deleted', variant: 'default' });
    } catch {
      toast({ title: 'Failed to delete document', variant: 'destructive' });
    }
  };

  const filtered = documents.filter(d =>
    d.title.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
  );

  return (
    <>
      <div className="max-w-4xl mx-auto">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Documents</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Manage your document library ({documents.length} files)
            </p>
          </div>
          <Button id="create-document-btn" size="sm" onClick={() => setIsCreateOpen(true)} className="gap-1.5">
            <Plus className="h-4 w-4" />
            New Document
          </Button>
        </div>

        {/* Search */}
        {documents.length > 0 && (
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="document-search"
              placeholder="Search documents by title…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9"
              aria-label="Search documents"
            />
          </div>
        )}

        {/* Document List */}
        <div className="space-y-2">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => <DocumentSkeleton key={i} />)
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center mx-auto mb-4">
                <FileText className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="font-medium text-foreground mb-1">
                {searchQuery ? 'No results found' : 'No documents yet'}
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                {searchQuery ? 'Try a different search term.' : 'Create your first document to get started.'}
              </p>
              {!searchQuery && (
                <Button id="empty-create-btn" size="sm" onClick={() => setIsCreateOpen(true)} className="gap-1.5">
                  <Plus className="h-4 w-4" />
                  New Document
                </Button>
              )}
            </div>
          ) : (
            filtered.map(doc => (
              <Card
                key={doc.id}
                className="group flex items-center gap-4 p-4 hover:shadow-sm transition-shadow cursor-pointer"
                onClick={() => window.location.href = `/dashboard/documents/${doc.id}`}
                role="button"
                tabIndex={0}
                aria-label={`Open document: ${doc.title}`}
                onKeyDown={e => e.key === 'Enter' && (window.location.href = `/dashboard/documents/${doc.id}`)}
              >
                <div className="w-9 h-9 bg-secondary rounded-md flex items-center justify-center shrink-0">
                  <FileText className="h-4 w-4 text-secondary-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-foreground truncate">{doc.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Updated {formatDate(doc.updatedAt)}
                  </p>
                </div>
                {doc.role && (
                  <Badge variant={doc.role === 'OWNER' ? 'default' : 'secondary'} className="hidden sm:inline-flex text-xs shrink-0">
                    {doc.role}
                  </Badge>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                    <Button
                      id={`doc-menu-${doc.id}`}
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                      aria-label="Document options"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={e => { e.stopPropagation(); window.location.href = `/dashboard/documents/${doc.id}`; }}
                      className="gap-2"
                    >
                      <Edit3 className="h-4 w-4" />
                      Open
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={e => { e.stopPropagation(); handleDelete(doc.id, doc.title); }}
                      className="gap-2 text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </Card>
            ))
          )}
        </div>
      </div>

      <CreateDocumentModal
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={(doc) => {
          setDocuments(prev => [doc, ...prev]);
          setIsCreateOpen(false);
          window.location.href = `/dashboard/documents/${doc.id}`;
        }}
      />
    </>
  );
}
